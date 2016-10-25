var stringContains = require("string-contains");

export default function fileIsDynamicCode(filename){
    return dynamicCodeRegistry.fileIsDynamicCode(filename)
}
