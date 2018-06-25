import * as FunctionNames from "./FunctionNames";

import { identifier } from "./OperationTypes";
import { getCurrentBabelFilePath, createLoc } from "./getBabelOptions";
import { VERIFY, SKIP_TRACKING } from "./config";

let t;
// This file is also imported into helperFunctions, i.e. FE code that can't load
// Babel dependencies
export function initForBabel(babelTypes) {
  t = babelTypes;
}

// declare module "@babel/types" {
//   // Should just be interface Node, but somehow it only works if
//   // I do it separately for each one...
//   interface StringLiteral {
//     ignore: boolean;
//   }
//   interface CallExpression {
//     ignore: boolean;
//   }
//   interface NumericLiteral {
//     ignore: boolean;
//   }
//   interface Identifier {
//     ignore: boolean;
//   }
// }

export function addLoc(node, loc) {
  node.loc = loc;
  if (!loc) {
    debugger;
  }
  return node;
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

export function skipPath(node) {
  // skips the entire path, i.e. also all children!
  node.skipPath = true;
  return node;
}

function getLocObjectASTNode(loc) {
  const DISABLE_LOC_FOR_DEBUGGING = false || SKIP_TRACKING;
  if (DISABLE_LOC_FOR_DEBUGGING) {
    return ignoreNode(t.nullLiteral());
  }

  loc.url = getCurrentBabelFilePath();
  const locId = createLoc(loc);

  return ignoredStringLiteral(locId);

  // Using JSON.parse instead of creating object directly because
  // it speeds up overall Babel compile time by a third, and reduces file size
  // by 30%
  // return skipPath(
  //   t.callExpression(
  //     t.memberExpression(t.identifier("JSON"), t.identifier("parse")),
  //     [t.stringLiteral(JSON.stringify(loc))]
  //   )
  // );

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
export function createOperation(
  opType,
  opArgs,
  astArgs = null,
  loc = null,
  shorthand: any = null
) {
  if (!loc && VERIFY) {
    noLocCount++;
    console.log("no loc for", opType, noLocCount);
  }

  let locAstNode;
  if (!loc || SKIP_TRACKING) {
    locAstNode = t.nullLiteral();
  } else {
    locAstNode = getLocObjectASTNode(loc);
  }

  if (shorthand) {
    const call = shorthand!["visitor"](opArgs, astArgs, locAstNode);
    if (call) {
      return call;
    }
  }

  const args = [
    ignoredStringLiteral(opType),
    ignoredObjectExpression(opArgs),
    astArgs !== null
      ? skipPath(ignoredObjectExpression(astArgs))
      : t.nullLiteral()
  ];
  if (loc && !SKIP_TRACKING) {
    args.push(locAstNode);
  }
  var call = ignoredCallExpression(FunctionNames.doOperation, args);
  call.skipKeys = {
    callee: true
  };

  if (loc) {
    call.loc = loc;
  }
  return call;
}

export const getLastOperationTrackingResultCall = () =>
  skipPath(
    ignoredCallExpression(FunctionNames.getLastOperationTrackingResult, [])
  );

export const getLastOperationTrackingResultWithoutResettingCall = () =>
  skipPath(
    ignoredCallExpression(
      FunctionNames.getLastOperationTrackingResultWithoutResetting,
      []
    )
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
        skipPath(
          t.binaryExpression(
            "!==",
            iN(t.unaryExpression("typeof", ignoredIdentifier(identifierName))),
            ignoredStringLiteral("undefined")
          )
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
  return skipPath(
    ignoredCallExpression("__getMemoArray", [ignoredStringLiteral(key)])
  );
}

export function createGetMemoValue(key) {
  return skipPath(
    ignoredCallExpression("__getMemoValue", [ignoredStringLiteral(key)])
  );
}

export function createGetMemoTrackingValue(key) {
  return skipPath(
    ignoredCallExpression("__getMemoTrackingValue", [ignoredStringLiteral(key)])
  );
}

export const getLastOpValueCall = () =>
  ignoredCallExpression(FunctionNames.getLastOperationValueResult, []);
