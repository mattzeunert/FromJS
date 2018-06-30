import * as OperationTypes from "./OperationTypes";
import {
  createOperation,
  ignoredArrayExpression,
  ignoredStringLiteral,
  getLastOperationTrackingResultCall,
  ignoredNumericLiteral,
  isInIdOfVariableDeclarator,
  isInLeftPartOfAssignmentExpression,
  trackingIdentifierIfExists,
  ignoredCallExpression,
  ignoreNode,
  createSetMemoValue,
  createGetMemoValue,
  createGetMemoTrackingValue,
  ignoredIdentifier,
  ignoredObjectExpression,
  skipPath,
  initForBabel as initForBabelPH,
  getTrackingIdentifier
} from "./babelPluginHelpers";
import OperationLog from "./helperFunctions/OperationLog";
import { ExecContext } from "./helperFunctions/ExecContext";

import CallExpression from "./operations/CallExpression";
import ObjectExpression from "./operations/ObjectExpression";
import AssignmentExpression from "./operations/AssignmentExpression";
import traverseStringConcat from "./traverseStringConcat";
import * as MemoValueNames from "./MemoValueNames";

function identifyTraverseFunction(operationLog, charIndex) {
  return {
    operationLog: operationLog.args.value,
    charIndex
  };
}

let t;
// This file is also imported into helperFunctions, i.e. FE code that can't load
// Babel dependencies
export function initForBabel(babelTypes) {
  t = babelTypes;
  initForBabelPH(babelTypes);
}

interface TraversalStep {
  charIndex: number;
  operationLog: any;
}

function createNode(args, astArgs = null) {}

interface Shorthand {
  getExec: any;
  fnName: any;
  visitor: any;
}

interface Operations {
  [key: string]: {
    argNames?: string[] | ((log: any) => string[]);
    argIsArray?: boolean[] | ((log: any) => boolean[]);
    createNode?: (args?: any, astArgs?: any, loc?: any) => any;
    visitor?: any;
    exec?: any;
    // Sometimes (e.g. for string literals) we know the op result
    // at compile time and can look it up for analysis later
    canInferResult?: boolean;
    getArgumentsArray?: any;
    shorthand?: Shorthand;
    traverse?: (
      operationLog: any,
      charIndex: number
    ) => TraversalStep | undefined;
    t?: any; // babel types
  };
}

const operations: Operations = {
  memberExpression: {
    argNames: ["object", "propName"],
    shorthand: {
      fnName: "__mEx",
      getExec: doOperation => {
        return (object, propName, loc) => {
          return doOperation([object, propName], undefined, loc);
        };
      },
      visitor: (opArgs, astArgs, locAstNode) => {
        return ignoredCallExpression("__mEx", [
          ignoredArrayExpression(opArgs[0]),
          ignoredArrayExpression(opArgs[1]),
          locAstNode
        ]);
      }
    },
    exec: (args, astArgs, ctx: ExecContext, logData: any) => {
      var ret;
      const [objectArg, propNameArg] = args;
      var object = objectArg[0];
      var objectT = objectArg[1];
      var propertyName = propNameArg[0];
      ret = object[propertyName];

      let trackingValue = ctx.getObjectPropertyTrackingValue(
        object,
        propertyName
      );

      logData.extraArgs = {
        propertyValue: [ret, trackingValue]
      };

      ctx.lastMemberExpressionResult = [object, objectT];

      return ret;
    },
    traverse(operationLog, charIndex) {
      const propNameAsNumber = parseFloat(
        operationLog.args.propName.result.primitive
      );
      if (
        operationLog.args.object &&
        operationLog.args.object.result.type === "string" &&
        !isNaN(propNameAsNumber)
      ) {
        return {
          operationLog: operationLog.args.object,
          charIndex: charIndex + propNameAsNumber
        };
      }
      return {
        operationLog: operationLog.extraArgs.propertyValue,
        charIndex: charIndex
      };
    },
    visitor(path) {
      if (isInLeftPartOfAssignmentExpression(path)) {
        return;
      }
      if (path.parent.type === "UpdateExpression") {
        return;
      }

      // todo: dedupe this code
      var property;
      if (path.node.computed === true) {
        property = path.node.property;
      } else {
        if (path.node.property.type === "Identifier") {
          property = t.stringLiteral(path.node.property.name);
          property.loc = path.node.property.loc;
        }
      }

      const op = this.createNode!(
        [
          [path.node.object, getLastOperationTrackingResultCall()],
          [property, getLastOperationTrackingResultCall()]
        ],
        {},
        path.node.loc
      );

      return op;
    }
  },
  binaryExpression: {
    visitor(path) {
      if (!["+", "-", "/", "*"].includes(path.node.operator)) {
        return;
      }
      return this.createNode!(
        {
          left: [path.node.left, getLastOperationTrackingResultCall()],
          right: [path.node.right, getLastOperationTrackingResultCall()]
        },
        { operator: ignoredStringLiteral(path.node.operator) },
        path.node.loc
      );
    },
    traverse(operationLog, charIndex) {
      const { operator } = operationLog.astArgs;
      const { left, right } = operationLog.args;
      if (operator == "+") {
        if (
          typeof left.result.type === "string" &&
          typeof right.result.type === "string"
        ) {
          return traverseStringConcat(left, right, charIndex);
        } else {
          console.log("todo");
        }
      } else {
        console.log("todo binexp operator");
      }
      throw "aaa";
    },
    exec: (args, astArgs, ctx: ExecContext) => {
      var { left, right } = args;
      var ret;
      left = left[0];
      right = right[0];

      var { operator } = astArgs;
      if (operator === "+") {
        ret = left + right;
      } else if (operator === "-") {
        ret = left - right;
      } else if (operator === "*") {
        ret = left * right;
      } else if (operator === "/") {
        ret = left / right;
      } else {
        throw Error("unknown bin exp operator: " + operator);
      }

      return ret;
    }
  },
  conditionalExpression: {
    exec: (args, astArgs, ctx: ExecContext) => {
      return args.result[0];
    },
    traverse(operationLog, charIndex) {
      return {
        operationLog: operationLog.args.result,
        charIndex
      };
    },
    visitor(path) {
      var saveTestValue = createSetMemoValue(
        MemoValueNames.lastConditionalExpressionTest,
        path.node.test,
        getLastOperationTrackingResultCall()
      );
      var saveConsequentValue = createSetMemoValue(
        MemoValueNames.lastConditionalExpressionResult,
        path.node.consequent,
        getLastOperationTrackingResultCall()
      );
      var saveAlernativeValue = createSetMemoValue(
        MemoValueNames.lastConditionalExpressionResult,
        path.node.alternate,
        getLastOperationTrackingResultCall()
      );
      var operation = this.createNode!(
        {
          test: [
            createGetMemoValue(MemoValueNames.lastConditionalExpressionTest),
            createGetMemoTrackingValue(
              MemoValueNames.lastConditionalExpressionTest
            )
          ],
          result: [
            ignoreNode(
              t.conditionalExpression(
                createGetMemoValue(
                  MemoValueNames.lastConditionalExpressionTest
                ),
                saveConsequentValue,
                saveAlernativeValue
              )
            ),
            createGetMemoTrackingValue(
              MemoValueNames.lastConditionalExpressionResult
            )
          ]
        },
        {},
        path.node.loc
      );
      path.replaceWith(t.sequenceExpression([saveTestValue, operation]));
    }
  },
  stringReplacement: {},
  callExpression: CallExpression,
  newExpression: {
    visitor(path) {
      return operations.callExpression.visitor(path, true);
    }
  },
  objectProperty: {
    traverse(operationLog, charIndex) {
      return {
        operationLog: operationLog.args.propertyValue,
        charIndex: charIndex
      };
    }
  },
  objectExpression: ObjectExpression,
  stringLiteral: {
    canInferResult: true,
    shorthand: {
      fnName: "__str",
      getExec: doOperation => {
        return (value, loc) => {
          return doOperation([value], undefined, loc);
        };
      },
      visitor: (opArgs, astArgs, locAstNode) => {
        const valueArg = opArgs[0];
        return ignoredCallExpression("__str", [
          ignoredArrayExpression(valueArg),
          locAstNode
        ]);
      }
    },
    argNames: ["value"],
    visitor(path) {
      if (path.parent.type === "ObjectProperty") {
        return;
      }
      const value = path.node.value;
      // Store on loc so it can be looked up later
      path.node.loc.value = value;
      return skipPath(
        this.createNode!([[ignoredStringLiteral(value)]], {}, path.node.loc)
      );
    },
    exec: (args, astArgs, ctx: ExecContext) => {
      return args[0][0];
    }
  },
  numericLiteral: {
    shorthand: {
      fnName: "__num",
      getExec: doOperation => {
        return (value, loc) => {
          return doOperation([value], undefined, loc);
        };
      },
      visitor: (opArgs, astArgs, locAstNode) => {
        const valueArg = opArgs[0];
        return ignoredCallExpression("__num", [
          ignoredArrayExpression(valueArg),
          locAstNode
        ]);
      }
    },
    argNames: ["value"],
    visitor(path) {
      if (path.parent.type === "ObjectProperty") {
        return;
      }
      const value = path.node.value;
      return skipPath(
        this.createNode!([[ignoredNumericLiteral(value)]], null, path.node.loc)
      );
    },
    exec: (args, astArgs, ctx: ExecContext) => {
      return args[0][0];
    }
  },
  unaryExpression: {
    exec: (args, astArgs, ctx: ExecContext) => {
      if (astArgs.operator === "-") {
        return -args.argument[0];
      } else {
        throw Error("unknown unary expression operator");
      }
    },
    visitor(path) {
      if (path.node.operator === "-") {
        return this.createNode!(
          {
            argument: [path.node.argument, getLastOperationTrackingResultCall()]
          },
          {
            operator: ignoredStringLiteral(path.node.operator)
          },
          path.node.loc
        );
      }
    }
  },
  arrayExpression: {
    argNames: ["element"],
    argIsArray: [true],
    exec: (args, astArgs, ctx: ExecContext, logData: any) => {
      const [elementsArg] = args;
      let arr: any[] = [];
      elementsArg.forEach((el, i) => {
        const [value, trackingValue] = el;
        arr.push(value);
        const nameTrackingValue = ctx.createOperationLog({
          operation: ctx.operationTypes.arrayIndex,
          result: i,
          loc: logData.loc
        });
        ctx.trackObjectPropertyAssignment(
          arr,
          i.toString(),
          trackingValue,
          nameTrackingValue
        );
      });
      return arr;
    },
    visitor(path) {
      return this.createNode!(
        [
          path.node.elements.map(el =>
            ignoredArrayExpression([el, getLastOperationTrackingResultCall()])
          )
        ],
        null,
        path.node.loc
      );
    }
  },
  returnStatement: {
    argNames: ["returnValue"],
    exec: (args, astArgs, ctx: ExecContext, logData) => {
      const [returnValueArg] = args;
      ctx.lastReturnStatementResult = [returnValueArg[0], logData.index];
      return returnValueArg[0];
    },
    traverse(operationLog, charIndex) {
      return {
        operationLog: operationLog.args.returnValue,
        charIndex: charIndex
      };
    },
    visitor(path) {
      path.node.argument = this.createNode!(
        [[path.node.argument, getLastOperationTrackingResultCall()]],
        {},
        path.node.loc
      );
    }
  },
  identifier: {
    argNames: ["value"],
    shorthand: {
      fnName: "__ident",
      getExec: doOperation => {
        return (value, loc) => {
          return doOperation([value], undefined, loc);
        };
      },
      visitor: (opArgs, astArgs, locAstNode) => {
        if (astArgs && astArgs["isArguments"]) {
          // __ident shorthand doesn't support astArgs
          return null;
        }
        return ignoredCallExpression("__ident", [
          ignoredArrayExpression(opArgs[0]),
          locAstNode
        ]);
      }
    },
    exec: (args, astArgs, ctx: ExecContext, logData) => {
      const [valueArg, allFnArgTrackingValuesArg] = args;
      if (
        astArgs &&
        astArgs.isArguments &&
        !ctx.objectHasPropertyTrackingData(valueArg[0])
      ) {
        if (allFnArgTrackingValuesArg[0]) {
          allFnArgTrackingValuesArg[0].forEach((trackingValue, i) => {
            ctx.trackObjectPropertyAssignment(
              valueArg[0],
              i,
              trackingValue,
              ctx.createOperationLog({
                operation: ctx.operationTypes.arrayIndex,
                result: i,
                loc: logData.loc
              })
            );
          });
        } else {
          console.log("no tracking values for arguments object");
        }
      }
      return valueArg[0];
    },
    traverse: identifyTraverseFunction,
    visitor(path) {
      if (shouldSkipIdentifier(path)) {
        return;
      }

      path.node.ignore = true;

      let node = path.node;

      let trackingIdentiferLookup;
      const binding = path.scope.getBinding(path.node.name);
      if (binding && ["var", "let", "const", "param"].includes(binding.kind)) {
        trackingIdentiferLookup = getTrackingIdentifier(path.node.name);
      } else {
        // If the value has been declared as a var then we know the
        // tracking var also exists,
        // otherwise we have to confirm it exists at runtime before
        // trying to access it
        trackingIdentiferLookup = trackingIdentifierIfExists(path.node.name);
      }

      let astArgs: any = null;
      const args: any = [[node, trackingIdentiferLookup]];

      if (node.name === "arguments") {
        astArgs = { isArguments: ignoreNode(t.booleanLiteral(true)) };
        args.push([ignoredIdentifier("__allArgTV")]);
      }

      return skipPath(this.createNode!(args, astArgs, path.node.loc));
    }
  },
  memexpAsLeftAssExp: {
    traverse(operationLog: OperationLog, charIndex: number) {
      return {
        operationLog: operationLog.extraArgs.propertyValue,
        charIndex
      };
    }
  },
  splitResult: {
    traverse(operationLog: OperationLog, charIndex) {
      const originalString = operationLog.args.string.result.primitive;
      const separator = operationLog.args.separator.result.primitive || "";

      console.log(
        "TODO: actually capture the indices where the string came from at runtime"
      );

      return {
        operationLog: operationLog.args.string,
        charIndex:
          originalString.indexOf(operationLog.result.primitive) + charIndex
      };
    }
  },
  matchResult: {
    traverse(operationLog: OperationLog, charIndex) {
      return {
        operationLog: operationLog.args.input,
        charIndex: operationLog.runtimeArgs.matchIndex + charIndex
      };
    }
  },
  jsonParseResult: {
    traverse(operationLog, charIndex) {
      // This traversal method is inaccurate but still useful
      // Ideally we should probably have a JSON parser
      const valueReadFromJson = operationLog.result.primitive;
      charIndex += operationLog.args.json.result.primitive.indexOf(
        valueReadFromJson
      );
      return {
        operationLog: operationLog.args.json,
        charIndex
      };
    }
  },
  assignmentExpression: AssignmentExpression,
  objectAssign: {
    traverse: identifyTraverseFunction
  },
  arraySlice: { traverse: identifyTraverseFunction },
  arrayConcat: {
    traverse: identifyTraverseFunction
  }
};

function eachArgumentInObject(args, operationName, fn) {
  if (!args) {
    return;
  }
  const operation = operations[operationName];
  const isObjectExpression = operationName === OperationTypes.objectExpression;

  if (isObjectExpression) {
    // todo: this is an objexpression property not an obj expression itself, should be clarified
    fn(args.value, "value", newValue => {
      args.value = newValue;
    });
    fn(args.key, "key", newValue => (args.key = newValue));
  } else {
    Object.keys(args).forEach(key => {
      fn(args[key], key, newValue => (args[key] = newValue));
    });
  }
}

export function eachArgument(operationLog, fn) {
  eachArgumentInObject(operationLog.args, operationLog.operation, fn);

  if (operationLog.extraArgs) {
    eachArgumentInObject(operationLog.extraArgs, operationLog.operation, fn);
  }
}

Object.keys(operations).forEach(opName => {
  const operation = operations[opName];
  if (!OperationTypes[opName]!) {
    throw Error("No op type: " + opName);
  }
  Object.defineProperty(operation, "t", {
    get() {
      return t;
    }
  });
  operation.createNode = function(args, astArgs, loc = null) {
    const operation = createOperation(
      OperationTypes[opName],
      args,
      astArgs,
      loc,
      operations[opName].shorthand || null
    );
    return operation;
  };
  operation.getArgumentsArray = function(operationLog) {
    var ret: any[] = [];
    eachArgument(operationLog, (arg, argName, updateValue) => {
      ret.push({ arg: arg, argName });
    });

    return ret;
  };
});

export default operations;

export function shouldSkipIdentifier(path) {
  if (
    [
      "FunctionDeclaration",
      "MemberExpression",
      "ObjectProperty",
      "CatchClause",
      "ForInStatement",
      "IfStatement",
      "ForStatement",
      "FunctionExpression",
      "UpdateExpression",
      "LabeledStatement",
      "ContinueStatement",
      "BreakStatement",
      "ClassMethod",
      "ClassProperty"
    ].includes(path.parent.type)
  ) {
    return true;
  }
  if (
    path.parent.type === "UnaryExpression" &&
    path.parent.operator === "typeof"
  ) {
    return true;
  }
  if (
    isInLeftPartOfAssignmentExpression(path) ||
    isInIdOfVariableDeclarator(path)
  ) {
    return true;
  }
  return false;
}
