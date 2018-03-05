import * as babel from "@babel/core";
import plugin from "./babelPlugin";
import * as FunctionNames from "./FunctionNames";
import * as operationTypes from './OperationTypes'
import * fs from "fs";

let helperCode = fs.readFileSync(__dirname + "/helperFunctions.ts").toString();
helperCode = helperCode.replace("__FUNCTION_NAMES__", JSON.stringify(FunctionNames));
helperCode = helperCode.replace("__OPERATION_TYPES__", JSON.stringify(operationTypes));

export default function transform(code) {
  return new Promise((resolve, reject) => {
    babel.transform(
      code,
      {
        plugins: [plugin]
      },
      function(err, result) {
        if (err) {
          reject(err);
        } else {
          result.code = helperCode + ";" + result.code;

          resolve(result);
        }
      }
    );
  });
};
