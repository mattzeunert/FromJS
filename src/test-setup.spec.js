import "./tracing/tracing"
import {addBabelFunctionsToGlobalObject} from "./tracing/babelFunctions"
addBabelFunctionsToGlobalObject();

window.__loadScriptTag = function(script, callback, container){
    if (nativeInnerHTMLDescriptor.get.call(script) === ""){
        // nothing in tests
    } else {
        originalAppendChildPropertyDescriptor.value.apply(container, [script])
        callback();
    }
}
