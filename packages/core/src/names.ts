import { SHORT_NAMES } from "./config";

let opLongNameToShortName = {};

if (SHORT_NAMES) {
  opLongNameToShortName = {
    identifier: "i",
    callExpression: "c",
    binaryExpression: "b",
    stringLiteral: "s",
    numericLiteral: "n",
    returnStatement: "r",
    memberExpression: "m",
    objectExpression: "o",
    objectProperty: "op",
    conditionalExpression: "cond",
    assignmentExpression: "a",
    arrayExpression: "arr",
    thisExpression: "t",
    logicalExpression: "l",
    arrayIndex: "arrI",
    unaryExpression: "u"
  };
}
const opShortNameToLongName = {};
Object.keys(opLongNameToShortName).forEach(longName => {
  opShortNameToLongName[opLongNameToShortName[longName]] = longName;
});

export function getShortOperationName(operationName) {
  let shortName = opLongNameToShortName[operationName];
  return shortName || operationName;
}

export function getLongOperationName(operationName) {
  return opShortNameToLongName[operationName] || operationName;
}
