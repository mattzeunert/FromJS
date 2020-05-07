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
  let requestHandler, logServer;
  beforeAll(async () => {
    rimraf.sync(outdir);
    fs.mkdirSync(outdir);
    ({ requestHandler, logServer } = await new Promise((resolve) => {
      const beOptions = new BackendOptions({
        sessionDirectory,
        bePort: backendPort,
        onReady: resolve,
      } as any);
      const backend = new Backend(beOptions);
    }));
    console.log("Done create backend", backendPort);
  }, 10000);

  async function runTest(testName, { charIndex }) {
    console.log("will compile node app");
    await compileNodeApp({
      directory: "packages/backend/nodeTestFixtures/" + testName,
      requestHandler,
      outdir: outdir + "/" + testName,
    });
    console.log("file", path.resolve(outdir, testName, testName + ".js"));
    const { stdout } = await getCmdOutput(
      "node " + path.resolve(outdir, testName, testName + ".js")
    );

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
    return { step: lastStep };
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
        err += _err.toString();
      }
      if (_stdout) {
        stdout += _stdout.toString();
      }
      if (_stderr) {
        stderr += _stderr.toString();
      }
    }).on("exit", (code) => {
      // Wait to receive all output
      setTimeout(() => {
        resolve({ code, err, stdout, stderr });
      }, 5);
    });
  });
}
