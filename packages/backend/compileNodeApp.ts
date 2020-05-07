import * as pMap from "p-map";
import * as fs from "fs";
import { RequestHandler } from "./RequestHandler";
import * as path from "path";

export async function compileNodeApp({
  directory,
  requestHandler,
  outdir,
}: {
  directory: string;
  requestHandler: RequestHandler;
  outdir: string;
}) {
  let files = getNodeFiles(directory, "");

  await pMap(
    files,
    async (file, i) => {
      const outFilePath = path.resolve(outdir, file.subdirectory, file.name);
      if (
        fs.existsSync(outFilePath) &&
        (file.subdirectory !== "" || file.name !== "test.js") &&
        !file.name.includes("driver.js") &&
        !file.name.includes("page-functions.js")
        // !file.name.includes("compiler")
      ) {
        return;
      }

      console.log("## " + file.relativePath, `${i}/${files.length}`);

      let fileContent = fs.readFileSync(
        path.resolve(directory, file.relativePath),
        "utf-8"
      );
      require("mkdirp").sync(path.resolve(outdir, file.subdirectory));

      if (
        file.name.endsWith(".js") &&
        !file.subdirectory.includes("locale-data") &&
        !file.subdirectory.includes("jsdoc")
      ) {
        try {
          const r = (await requestHandler.instrumentForEval(fileContent, {
            type: "node_",
            name: file.relativePath.replace(/[^a-zA-Z0-9\-]/g, "_"),
            nodePath: file.subdirectory + file.name,
          })) as any;
          fs.writeFileSync(
            outFilePath,
            `'use strict';// babel already adds use strict, but i'm prepending stuff so it won't count
            ;
            var global = Function("return this")();
            global.fromJSNodeSourcePath = "${directory}"
            global.fromJSNodeOutPath = "${outdir}";
            ;global.self = global; global.fromJSIsNode = true;\n` +
              r.instrumentedCode
          );
        } catch (err) {
          console.log(
            "Comopile code failed, will write normal",
            file.relativePath,
            err.message
          );
          fs.writeFileSync(outFilePath, fileContent);
        }
      } else {
        fs.writeFileSync(outFilePath, fileContent);
      }
    },
    { concurrency: 4 }
  );

  //   let helperFunctions = fs.readFileSync(
  //     "./packages/core/helperFunctions.js",
  //     "utf-8"
  //   );
}

function getNodeFiles(baseDirectory, subdirectory) {
  let resolvedDir = path.resolve(baseDirectory + "/" + subdirectory);

  let nodeFiles: {
    relativePath: string;
    subdirectory: string;
    name: string;
  }[] = [];

  const files = fs.readdirSync(resolvedDir);
  for (const file of files) {
    let filePath = path.resolve(resolvedDir, file);
    if (fs.lstatSync(filePath).isDirectory()) {
      nodeFiles = [
        ...nodeFiles,
        ...getNodeFiles(baseDirectory, subdirectory + file + "/"),
      ];
    } else {
      nodeFiles.push({
        relativePath: subdirectory + file,
        subdirectory,
        name: file,
      });
    }
  }

  return nodeFiles;
}
