import * as babel from "@babel/core";
import plugin from "./babelPlugin";
import * as prettier from "prettier";

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
          result.code = prettier.format(result.code);
          result.map = null;
          resolve(result);
        }
      }
    );
  });
}
