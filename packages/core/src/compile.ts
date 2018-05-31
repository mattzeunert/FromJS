import * as babel from "@babel/core";
import plugin from "./babelPlugin";
import * as prettier from "prettier";

export default function transform(code, extraBabelOptions = {}) {
  return new Promise((resolve, reject) => {
    const options = {
      plugins: [plugin],
      ...extraBabelOptions
    };

    babel.transform(code, options, function(err, result) {
      if (err) {
        reject(err);
      } else {
        // prettify code is helpful for debugging, but it's slow
        // result.code = prettier.format(result.code, { parser: "babylon" });
        if (!options["sourceMaps"]) {
          result.map = null;
        }
        resolve(result);
      }
    });
  });
}
