import babelPlugin from "./babelPlugin";
import handleEvalScript from "./handleEvalScript";
import getBabelOptions from "./getBabelOptions";

window["__fromJSEval"] = function(code) {
  function compile(code, url, done) {
    done(
      window["Babel"].transform(code, getBabelOptions(babelPlugin, {}, url))
    );
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
