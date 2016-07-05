var stringContains = require("string-contains");

export default function fileIsDynamicCode(filename){
    return stringContains(filename, "DynamicFunction")
}
