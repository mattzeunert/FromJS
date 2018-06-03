import * as babel from "@babel/core";
import plugin from "./babelPlugin";
import * as prettier from "prettier";
import getBabelOptions from "./getBabelOptions";

export default function transform(code, extraBabelOptions = {}) {
  return new Promise((resolve, reject) => {
    let result;
    try {
      result = syncCompile(code, extraBabelOptions);
    } catch (err) {
      reject(err);
    }
    // prettify code is helpful for debugging, but it's slow
    // result.code = prettier.format(result.code, { parser: "babylon" });

    resolve(result);
  });
}

export function syncCompile(code, extraBabelOptions = {}) {
  return babel.transform(code, getBabelOptions(plugin, extraBabelOptions));
}
