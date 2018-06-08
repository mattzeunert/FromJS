import * as FunctionNames from "./FunctionNames";
import * as t from "@babel/types";
import { identifier } from "./OperationTypes";
import { getCurrentBabelFilePath } from "./getBabelOptions";

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
  // node.__debugIgnore = Error().stack
  return node;
}

export function ignoredArrayExpression(items) {
  return ignoreNode(t.arrayExpression(items));
}

export function ignoredStringLiteral(str) {
  return ignoreNode(t.stringLiteral(str));
}

export function ignoredIdentifier(name) {
  return ignoreNode(t.identifier(name));
}

export function ignoredCallExpression(identifier, args) {
  return ignoreNode(t.callExpression(ignoredIdentifier(identifier), args));
}

export function ignoredNumericLiteral(number) {
  return ignoreNode(t.numericLiteral(number));
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
  loc.url = getCurrentBabelFilePath();

  // Using JSON.parse instead of creating object directly because
  // it speeds up overall Babel compile time by a third, and reduces file size
  // by 30%
  return ignoreNode(
    t.callExpression(
      ignoreNode(
        t.memberExpression(
          ignoredIdentifier("JSON"),
          ignoredIdentifier("parse")
        )
      ),
      [ignoredStringLiteral(JSON.stringify(loc))]
    )
  );

  // function getASTNode(location) {
  //   return ignoredObjectExpression({
  //     line: ignoredNumericLiteral(location.line),
  //     column: ignoredNumericLiteral(location.column)
  //   });
  // }
  // return ignoredObjectExpression({
  //   start: getASTNode(loc.start),
  //   end: getASTNode(loc.end)
  // });
}

let noLocCount = 0;
export function createOperation(opType, opArgs, astArgs = null, loc = null) {
  const argsAreArray = opArgs.length !== undefined;

  if (!loc) {
    noLocCount++;
    console.log("no loc for", opType, noLocCount);
  }

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

export function getTrackingVarName(identifierName) {
  return identifierName + "___tv";
}

export function trackingIdentifierIfExists(identifierName) {
  var trackingIdentifierName = getTrackingVarName(identifierName);
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
