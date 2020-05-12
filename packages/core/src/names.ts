import { SHORT_NAMES } from "./config";

function makeNameShortingFunctions(longNameToShortName) {
  if (!SHORT_NAMES) {
    longNameToShortName = {};
  }
  const shortNameToLongName = {};
  Object.keys(longNameToShortName).forEach(longName => {
    shortNameToLongName[longNameToShortName[longName]] = longName;
  });
  return {
    getShortName(longName) {
      let shortName = longNameToShortName[longName];
      return shortName || longName;
    },
    getLongName(shortName) {
      return shortNameToLongName[shortName] || shortName;
    }
  };
}

const {
  getShortName: getShortOperationName,
  getLongName: getLongOperationName
} = makeNameShortingFunctions({
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
});

export { getShortOperationName, getLongOperationName };

const {
  getShortName: getShortExtraArgName,
  getLongName: getLongExtraArgName
} = makeNameShortingFunctions({
  returnValue: "r",
  propertyValue: "p",
  expression0: "e0",
  expression1: "e1",
  replacement0: "r0",
  replacement1: "r1"
});

export { getShortExtraArgName, getLongExtraArgName };

const {
  getShortName: getShortArgName,
  getLongName: getLongArgName
} = makeNameShortingFunctions({
  returnValue: "r",
  propertyValue: "p",
  expression0: "e0",
  expression1: "e1",
  replacement0: "r0",
  replacement1: "r1"
});

export { getShortArgName, getLongArgName };
