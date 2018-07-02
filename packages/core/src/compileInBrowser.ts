import babelPlugin from "./babelPlugin";
import handleEvalScript from "./handleEvalScript";
import getBabelOptions, { getAndResetLocs } from "./getBabelOptions";

var Babel = window["Babel"];
delete window["__core-js_shared__"]; // Added by babel standalone, but breaks some lodash tests

window["__fromJSEval"] = function(code) {
  function compile(code, url, done) {
    const babelResult = Babel.transform(
      code,
      getBabelOptions(babelPlugin, {}, url)
    );
    babelResult.locs = getAndResetLocs();
    done(babelResult);
  }

  let returnValue;
  // handle eval script is sync because compile is sync!
  handleEvalScript(code, compile, evalScript => {
    returnValue = {
      evalScript,
      returnValue: eval(evalScript.instrumentedCode)
    };
  });

  return returnValue;
};
