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
    unaryExpression: "u",
    newExpressionResult: "new",
    memexpAsLeftAssExp: "mae"
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

let extraArgLongNameToShortName = {};
if (SHORT_NAMES) {
  extraArgLongNameToShortName = {
    returnValue: "r",
    propertyValue: "p",
    expression0: "e0",
    expression1: "e1",
    replacement0: "r0",
    replacement1: "r1"
  };
}
const extraArgShortNameToLongName = {};
Object.keys(extraArgLongNameToShortName).forEach(longName => {
  extraArgShortNameToLongName[extraArgLongNameToShortName[longName]] = longName;
});

export function getShortExtraArgName(extraArgName) {
  let shortName = extraArgLongNameToShortName[extraArgName];
  return shortName || extraArgName;
}

export function getLongExtraArgName(extraArgName) {
  return extraArgShortNameToLongName[extraArgName] || extraArgName;
}
