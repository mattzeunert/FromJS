import * as FunctionNames from "./FunctionNames";
import * as t from "@babel/types";

declare module "@babel/types" {
  // Should just be interface Node, but somehow it only works if
  // I do it separately for each one...
  interface StringLiteral {
    ignore: boolean;
  }
  interface CallExpression {
    ignore: boolean;
  }
  interface NumericLiteral {
    ignore: boolean;
  }
  interface Identifier {
    ignore: boolean;
  }
}

export function ignoreNode(node) {
  node.ignore = true;
  return node;
}

export function ignoredArrayExpression(items) {
  return ignoreNode(t.arrayExpression(items));
}

export function ignoredStringLiteral(str) {
  var l = t.stringLiteral(str);
  l.ignore = true;
  return l;
}

export function ignoredIdentifier(name) {
  var id = t.identifier(name);
  id.ignore = true;
  return id;
}

export function ignoredCallExpression(identifier, args) {
  var call = t.callExpression(ignoredIdentifier(identifier), args);
  call.ignore = true;
  return call;
}

export function ignoredNumericLiteral(number) {
  var n = t.numericLiteral(number);
  n.ignore = true;
  return n;
}

export function ignoredObjectExpression(props) {
  const properties = [
    ignoreNode(
      t.objectProperty(
        ignoredStringLiteral("isUsingObjectSyntax"),
        ignoreNode(t.booleanLiteral(true))
      )
    ),
    ...Object.keys(props).map(propKey => {
      return ignoreNode(
        t.objectProperty(
          ignoredStringLiteral(propKey),
          ignoredArrayExpression(props[propKey])
        )
      );
    })
  ];
  return ignoreNode(t.objectExpression(properties));
}

export function createOperation(opType, opArgs) {
  const argsAreArray = opArgs.length !== undefined;

  if (argsAreArray) {
    // todo: remove this branch in the future, should always use obj
    var call = ignoredCallExpression(FunctionNames.doOperation, [
      ignoredStringLiteral(opType),
      ...opArgs
    ]);
  } else {
    // object
    var call = ignoredCallExpression(FunctionNames.doOperation, [
      ignoredStringLiteral(opType),
      ignoredObjectExpression(opArgs)
    ]);
  }

  return call;
}
