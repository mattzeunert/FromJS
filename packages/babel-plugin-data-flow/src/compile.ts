import * as babel from "@babel/core";
import plugin from "./babelPlugin";

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
          resolve(result);
        }
      }
    );
  });
}
