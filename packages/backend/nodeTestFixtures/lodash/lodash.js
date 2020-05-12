const kebabCase = require("lodash.kebabcase")
const isDeepEqual = require('lodash.isequal');

let out = ""

out += kebabCase("helloWorld")

const obj1 = { a: { b: 2 } }
const obj2 = { a: { b: 2 } }
if (isDeepEqual(obj1, obj2)) {
    out += "equal"
}

console.log("Inspect:" + __fromJSGetTrackingIndex(out))
__fromJSWaitForSendLogsAndExitNodeProcess()