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
  const properties = Object.keys(props).map(propKey => {
    return ignoreNode(
      t.objectProperty(
        ignoredStringLiteral(propKey),
        props[propKey].length !== undefined
          ? ignoredArrayExpression(props[propKey])
          : props[propKey]
      )
    );
  });

  return ignoreNode(t.objectExpression(properties));
}

function getLocObjectASTNode(loc) {
  function getASTNode(location) {
    return ignoredObjectExpression({
      line: ignoredNumericLiteral(location.line),
      column: ignoredNumericLiteral(location.column)
    });
  }
  return ignoredObjectExpression({
    start: getASTNode(loc.start),
    end: getASTNode(loc.end)
  });
}

export function createOperation(opType, opArgs, astArgs = null, loc = null) {
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
      ignoredObjectExpression(opArgs),
      astArgs !== null ? ignoredObjectExpression(astArgs) : t.nullLiteral(),
      loc ? getLocObjectASTNode(loc) : t.nullLiteral()
    ]);
  }

  if (loc) {
    call.loc = loc;
  }
  return call;
}

export const getLastOperationTrackingResultCall = ignoredCallExpression(
  FunctionNames.getLastOperationTrackingResult,
  []
);

export function isInLeftPartOfAssignmentExpression(path) {
  return isInNodeType("AssignmentExpression", path, function(path, prevPath) {
    return path.node.left === prevPath.node;
  });
}

export function isInIdOfVariableDeclarator(path) {
  return isInNodeType("VariableDeclarator", path, function(path, prevPath) {
    return path.node.id === prevPath.node;
  });
}

export function trackingIdentifierIfExists(identifierName) {
  var trackingIdentifierName = identifierName + "_t";
  return runIfIdentifierExists(
    trackingIdentifierName,
    ignoredIdentifier(trackingIdentifierName)
  );
}

export function isInNodeType(
  type,
  path,
  extraCondition: any = null,
  prevPath: any = null
): boolean {
  if (prevPath === null) {
    isInNodeType(type, path.parentPath, extraCondition, path);
  }
  if (path.node.type === "Program") {
    return false;
  }
  if (path.node.type === type) {
    if (!extraCondition || extraCondition!(path, prevPath)) {
      return true;
    }
  }
  if (path.parentPath) {
    return isInNodeType(type, path.parentPath, extraCondition, path);
  }
  throw Error("unreachable");
}

export function runIfIdentifierExists(identifierName, thenNode) {
  const iN = ignoreNode;
  return iN(
    t.logicalExpression(
      "&&",
      iN(
        t.binaryExpression(
          "!==",
          iN(t.unaryExpression("typeof", ignoredIdentifier(identifierName))),
          ignoredStringLiteral("undefined")
        )
      ),
      thenNode
    )
  );
}

export function createSetMemoValue(key, value, trackingValue) {
  return ignoredCallExpression("__setMemoValue", [
    ignoredStringLiteral(key),
    value,
    trackingValue
  ]);
}

export function createGetMemoArray(key) {
  return ignoredCallExpression("__getMemoArray", [ignoredStringLiteral(key)]);
}

export function createGetMemoValue(key) {
  return ignoredCallExpression("__getMemoValue", [ignoredStringLiteral(key)]);
}

export function createGetMemoTrackingValue(key) {
  return ignoredCallExpression("__getMemoTrackingValue", [
    ignoredStringLiteral(key)
  ]);
}

export const getLastOpValue = ignoredCallExpression(
  FunctionNames.getLastOperationValueResult,
  []
);
