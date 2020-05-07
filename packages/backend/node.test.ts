import { compileNodeApp } from "./compileNodeApp";
import { RequestHandler } from "./RequestHandler";
import { initSessionDirectory } from "./initSession";
import Backend, { BackendOptions } from "./backend";
var rimraf = require("rimraf");
import * as path from "path";
import * as fs from "fs";
import { execSync } from "child_process";
import { traverse } from "./src/traverse";

const outdir = "node-test-out";
const backendPort = 1500;

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
  }, 10000);
  it("Can read uninstrumented contents of a js file", async () => {
    let testName = "readJSFile";

    await compileNodeApp({
      directory: "packages/backend/nodeTestFixtures/" + testName,
      requestHandler,
      outdir: outdir + "/" + testName,
    });
    const out = execSync(
      "node " + path.resolve(outdir, testName, testName + ".js")
    ).toString();
    console.log(out);
    let inspectIndex = parseFloat(
      out.match(/Inspect:\d+/)![0].replace("Inspect:", "")
    );
    await new Promise((resolve) => setTimeout(resolve, 2000));
    const steps = await traverse(
      {
        operationLog: inspectIndex as any,
        charIndex: 11,
      },
      [],
      logServer,
      { optimistic: true }
    );
    const lastStep = steps[steps.length - 1];
    expect(lastStep.operationLog.operation).toBe("readFileSyncResult");
    expect(lastStep.operationLog.result.primitive).toBe('const a = "Hello"\n');
    expect(lastStep.charIndex).toBe(11);
  }, 15000);
});
