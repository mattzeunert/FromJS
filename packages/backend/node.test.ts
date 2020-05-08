import { compileNodeApp } from "./compileNodeApp";
import { RequestHandler } from "./RequestHandler";
import { initSessionDirectory } from "./initSession";
import Backend, { BackendOptions } from "./backend";
import { execSync, spawnSync, exec } from "child_process";
var rimraf = require("rimraf");
import * as path from "path";
import * as fs from "fs";
import { traverse } from "./src/traverse";

const outdir = "node-test-out";
// random because there are zombies sending data sometimes... should probably fix that instead
const backendPort = 1510 + Math.floor(Math.random() * 80);

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

  async function runTest(
    testName,
    { charIndex, ignoreFilePattern = null as any, runNTimes = 1 }
  ) {
    console.log("will compile node app");
    const compileStart = new Date();
    await compileNodeApp({
      directory: "packages/backend/nodeTestFixtures/" + testName,
      requestHandler,
      outdir: outdir + "/" + testName,
      ignoreFilePattern,
    });
    let compileDuration = new Date().valueOf() - compileStart.valueOf();

    console.log("file", path.resolve(outdir, testName, testName + ".js"));

    let stdout;

    const execStart = new Date();
    for (var i = 0; i < runNTimes; i++) {
      ({ stdout } = await getCmdOutput(
        "node " + path.resolve(outdir, testName, testName + ".js")
      ));
    }
    let execDuration = new Date().valueOf() - execStart.valueOf();
    backend.processRequestQueue();

    console.log({ execDuration });

    console.log(stdout);
    let inspectIndex = parseFloat(
      stdout.match(/Inspect:\d+/)![0].replace("Inspect:", "")
    );
    await new Promise((resolve) => setTimeout(resolve, 500));
    const steps = await traverse(
      {
        operationLog: inspectIndex as any,
        charIndex: charIndex,
      },
      [],
      logServer,
      { optimistic: true }
    );
    const lastStep = steps[steps.length - 1];
    return { step: lastStep, execDuration, compileDuration };
  }

  it("Can read uninstrumented contents of a js file", async () => {
    let { step } = await runTest("readJSFile", { charIndex: 11 });

    expect(step.operationLog.operation).toBe("readFileSyncResult");
    expect(step.operationLog.result.primitive).toBe('const a = "Hello"\n');
    expect(step.charIndex).toBe(11);
  }, 15000);

  it("Can require json files", async () => {
    let { step } = await runTest("requireJson", { charIndex: 0 });

    expect(step.operationLog.operation).toBe("jsonParseResult");
  }, 15000);

  it("reactSsr", async () => {
    let { step, execDuration, compileDuration } = await runTest("reactSsr", {
      charIndex: 0,
      ignoreFilePattern: /umd|profiling|production|unstable|test\-utils|scheduler\-tracing|envify|browser|\.min\.js|factoryWithTypeCheckers/,
      runNTimes: 1,
    });
    console.log({ execDuration, compileDuration });

    // for now don't really care to much about the exact traversal
    expect(step.operationLog.operation).toBe("callExpression");
  }, 60000);
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
