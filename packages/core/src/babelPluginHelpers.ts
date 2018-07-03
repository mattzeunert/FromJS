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
  return skipPath(t.stringLiteral(str));
}

export function ignoredIdentifier(name) {
  return skipPath(t.identifier(name));
}

export function ignoredCallExpression(identifier, args) {
  return ignoreNode(t.callExpression(ignoredIdentifier(identifier), args));
}

export function ignoredNumericLiteral(number) {
  return skipPath(t.numericLiteral(number));
}

const canBeIdentifierRegExp = /^[a-z0-9A-Z]+$/;
const objectIdCache = {};
function getObjectId(name) {
  // Cache here for improved compilation performance
  // Not caching at the ignoredIdentifier/IgnoredStringLiteral level because
  // sometimes the result is modified to add a .loc (which isn't needed right
  // now I think but if we have sourcemaps in the future it will be needed)
  if (!objectIdCache[name]) {
    if (canBeIdentifierRegExp.test(name)) {
      objectIdCache[name] = ignoredIdentifier(name);
    } else {
      objectIdCache[name] = ignoredStringLiteral(name);
    }
  }
  return objectIdCache[name];
}

export function ignoredArrayExpressionIfArray(p) {
  return p.length !== undefined ? ignoredArrayExpression(p) : p;
}

export function ignoredObjectExpression(props) {
  const properties = Object.keys(props).map(propKey => {
    return ignoreNode(
      t.objectProperty(
        getObjectId(propKey),
        ignoredArrayExpressionIfArray(props[propKey])
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
}

export function getBabelTypes() {
  return t;
}

let noLocCount = 0;
export function createOperation(
  opType,
  opArgs,
  astArgs = null,
  locArg = null,
  shorthand: any = null
) {
  if (!locArg && VERIFY) {
    noLocCount++;
    console.log("no loc for", opType, noLocCount);
  }
  const loc: any = locArg || {};

  if ("type" in opArgs) {
    throw Error("should not put node into createOp, use array or obj");
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
    Array.isArray(opArgs)
      ? ignoredArrayExpression(
          opArgs.map(a => {
            return Array.isArray(a) ? ignoredArrayExpression(a) : a;
          })
        )
      : ignoredObjectExpression(opArgs),
    astArgs !== null
      ? skipPath(ignoredObjectExpression(astArgs))
      : t.nullLiteral()
  ];
  if (loc && !SKIP_TRACKING) {
    args.push(locAstNode);
  }
  var call = ignoredCallExpression("__" + opType, args);
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

export function getTrackingIdentifier(identifierName) {
  return ignoredIdentifier(getTrackingVarName(identifierName));
}

export function trackingIdentifierIfExists(identifierName) {
  var trackingIdentifierName = getTrackingVarName(identifierName);
  return skipPath(
    runIfIdentifierExists(
      trackingIdentifierName,
      getTrackingIdentifier(identifierName)
    )
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
  return ignoredCallExpression(FunctionNames.setMemoValue, [
    ignoredStringLiteral(key),
    value,
    trackingValue
  ]);
}

export function createGetMemoArray(key) {
  return skipPath(
    ignoredCallExpression(FunctionNames.getMemoArray, [
      ignoredStringLiteral(key)
    ])
  );
}

export function createGetMemoValue(key) {
  return skipPath(
    ignoredCallExpression(FunctionNames.getMemoValue, [
      ignoredStringLiteral(key)
    ])
  );
}

export function createGetMemoTrackingValue(key) {
  return skipPath(
    ignoredCallExpression(FunctionNames.getMemoTrackingValue, [
      ignoredStringLiteral(key)
    ])
  );
}

export const getLastOpValueCall = () =>
  ignoredCallExpression(FunctionNames.getLastOperationValueResult, []);

export const safelyGetVariableTrackingValue = (identifierName, scope) => {
  const binding = scope.getBinding(identifierName);
  if (binding && ["var", "let", "const", "param"].includes(binding.kind)) {
    return getTrackingIdentifier(identifierName);
  } else {
    // If the value has been declared as a var then we know the
    // tracking var also exists,
    // otherwise we have to confirm it exists at runtime before
    // trying to access it
    return trackingIdentifierIfExists(identifierName);
  }
};
