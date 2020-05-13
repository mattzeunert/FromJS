import { compileNodeApp } from "./compileNodeApp";
import { RequestHandler } from "./RequestHandler";
import { initSessionDirectory } from "./initSession";
import Backend, { BackendOptions } from "./backend";
import { execSync, spawnSync, exec } from "child_process";
var rimraf = require("rimraf");
import * as path from "path";
import * as fs from "fs";
import { traverse } from "./src/traverse";
import * as getFolderSize from "get-folder-size";

const outdir = "node-test-out";
const backendPort = 1510;

describe("Node", () => {
  let sessionDirectory = outdir + "/session";
  let requestHandler, logServer, backend;
  beforeAll(async () => {
    rimraf.sync(outdir);
    fs.mkdirSync(outdir);
    ({ requestHandler, logServer } = await new Promise((resolve) => {
      const beOptions = new BackendOptions({
        sessionDirectory,
        bePort: backendPort,
        onReady: resolve,
      } as any);
      backend = new Backend(beOptions);
    }));
    console.log("Done create backend", backendPort);
  }, 10000);

  function getSessionSize(): Promise<number> {
    return new Promise((resolve) => {
      getFolderSize(sessionDirectory, (err, size) => {
        console.log(
          "Session size: ",
          (size / 1024 / 1024).toFixed(2) +
            " MB" +
            " (" +
            path.resolve(sessionDirectory) +
            ")"
        );
        resolve(size);
      });
    });
  }

  async function runTest(
    testName,
    {
      ignoreFilePattern = null as any,
      includeFilePattern = null as any,
      runNTimes = 1,
    }
  ) {
    let sessionSizeBefore = await getSessionSize();
    const compileStart = new Date();
    await compileNodeApp({
      directory: "packages/backend/nodeTestFixtures/" + testName,
      requestHandler,
      outdir: outdir + "/" + testName,
      ignoreFilePattern,
      includeFilePattern,
    });
    let compileDuration = new Date().valueOf() - compileStart.valueOf();

    // console.log("file", path.resolve(outdir, testName, testName + ".js"));

    let stdout, code;

    const execStart = new Date();
    for (var i = 0; i < runNTimes; i++) {
      ({ stdout, code } = await getCmdOutput(
        "node " + path.resolve(outdir, testName, testName + ".js")
      ));
    }
    let execDuration = new Date().valueOf() - execStart.valueOf();

    if (code !== 0) {
      throw Error("Node command exited with code " + code);
    }

    const processRequestQueueStart = new Date();
    await backend.processRequestQueue();
    let processRequestQueueDuration =
      new Date().valueOf() - processRequestQueueStart.valueOf();

    let sessionSizeAfter = await getSessionSize();
    let sessionSizeIncreaseInMB =
      Math.round(((sessionSizeAfter - sessionSizeBefore) / 1024 / 1024) * 10) /
      10;

    console.log({
      compileDuration,
      execDuration,
      processRequestQueueDuration,
      sessionSizeIncreaseInMB,
    });

    // console.log(stdout);
    let inspectIndex = parseFloat(
      stdout.match(/Inspect:\d+/)![0].replace("Inspect:", "")
    );
    console.log({ inspectIndex });
    return {
      execDuration,
      compileDuration,
      traverse: async (charIndex) => {
        const steps = await backend.handleTraverse(inspectIndex, charIndex);
        const lastStep = steps[steps.length - 1];
        return { step: lastStep };
      },
    };
  }

  it("Can read uninstrumented contents of a js file", async () => {
    let { traverse } = await runTest("readJSFile", {});

    const { step } = await traverse(11);
    expect(step.operationLog.operation).toBe("readFileSyncResult");
    expect(step.operationLog.result.primitive).toBe('const a = "Hello"\n');
    expect(step.charIndex).toBe(11);
  }, 15000);

  it("Can require json files", async () => {
    let { traverse } = await runTest("requireJson", {});
    const { step } = await traverse(0);
    expect(step.operationLog.operation).toBe("jsonParseResult");
  }, 15000);

  it("reactSsr", async () => {
    let { traverse, execDuration, compileDuration } = await runTest(
      "reactSsr",
      {
        ignoreFilePattern: /umd|profiling|production|unstable|test\-utils|scheduler\-tracing|envify|browser|\.min\.js|factoryWithTypeCheckers/,
        runNTimes: 1,
      }
    );

    const { step } = await traverse(0);
    // for now don't really care to much about the exact traversal
    expect(step.operationLog.operation).toBe("callExpression");
  }, 80000);

  it("can traverse file reads and writes – fileReadWrites", async () => {
    let { execDuration, compileDuration, traverse } = await runTest(
      "fileReadWrites",
      {}
    );

    let { step } = await traverse(0);
    expect(step.operationLog.operation).toBe("stringLiteral");
    expect(step.operationLog.result.primitive).toBe("Hello");

    ({ step } = await traverse("Hello".length));
    expect(step.operationLog.operation).toBe("stringLiteral");
    expect(step.operationLog.result.primitive).toBe("World");
    expect(step.charIndex).toBe(0);
  }, 100000);

  it("can load and use lodash", async () => {
    let { execDuration, compileDuration, traverse } = await runTest(
      "lodash",
      {}
    );

    let { step } = await traverse(0);
    console.log(JSON.stringify(step, null, 2));
    expect(step.operationLog.operation).toBe("stringLiteral");
    expect(step.operationLog.result.primitive).toBe("helloWorld");

    ({ step } = await traverse(12));
    expect(step.operationLog.operation).toBe("stringLiteral");
    expect(step.operationLog.result.primitive).toBe("equal");
  }, 120000);
});

export function getCmdOutput(
  cmd
): Promise<{
  code: number | null;
  err: string;
  stdout: string;
  stderr: string;
}> {
  return new Promise((resolve) => {
    let err = "";
    let stdout = "";
    let stderr = "";
    exec(cmd, (_err, _stdout, _stderr) => {
      if (_err) {
        console.log("[err]", _err.toString());
        err += _err.toString();
      }
      if (_stdout) {
        stdout += _stdout.toString();
        console.log("[std] ", _stdout.toString());
      }
      if (_stderr) {
        stderr += _stderr.toString();
        console.log("[err]", _stderr.toString());
      }
    }).on("exit", (code) => {
      // Wait to receive all output
      setTimeout(() => {
        resolve({ code, err, stdout, stderr });
      }, 5);
    });
  });
}
