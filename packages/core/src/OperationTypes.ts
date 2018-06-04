export const binaryExpression = "binaryExpression";
export const numericLiteral = "numericLiteral";
export const stringLiteral = "stringLiteral";
export const identifier = "identifier";
export const returnStatement = "returnStatement";
export const memberExpression = "memberExpression";
export const objectExpression = "objectExpression";
export const functionArgument = "functionArgument";
export const callExpression = "callExpression";
export const newExpression = "newExpression";
export const assignmentExpression = "assignmentExpression";
export const arrayExpression = "arrayExpression";
export const conditionalExpression = "conditionalExpression";
export const stringReplacement = "stringReplacement";
// Why is localStorageValue a type rather than just looking at the callExpression/memberExpression?
// Because we need to an operation type for the return value!
export const localStorageValue = "localStorageValue";
export const jsonParseResult = "jsonParseResult";
export const newExpressionResult = "newExpressionResult";
