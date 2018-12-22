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
  getTrackingIdentifier,
  safelyGetVariableTrackingValue,
  addLoc,
  getGetGlobalCall,
  getTrackingVarName
} from "./babelPluginHelpers";
import * as jsonToAst from "json-to-ast";
import { adjustColumnForEscapeSequences } from "./adjustColumnForEscapeSequences";

import OperationLog from "./helperFunctions/OperationLog";
import { ExecContext } from "./helperFunctions/ExecContext";
import { getJSONPathOffset } from "./getJSONPathOffset";
import CallExpression from "./operations/CallExpression";
import { MemberExpression } from "./operations/MemberExpression";
import ObjectExpression from "./operations/ObjectExpression";
import AssignmentExpression from "./operations/AssignmentExpression";
import traverseStringConcat from "./traverseStringConcat";
import * as MemoValueNames from "./MemoValueNames";
import { traverseDomOrigin } from "./traverseDomOrigin";
import { VERIFY } from "./config";
import { getElAttributeValueOrigin } from "./operations/domHelpers/addElOrigin";
import { safelyReadProperty, nullOnError } from "./util";
import * as FunctionNames from "./FunctionNames";

function identifyTraverseFunction(operationLog, charIndex) {
  return {
    operationLog: operationLog.args.value,
    charIndex
  };
}

let t, babylon;
// This file is also imported into helperFunctions, i.e. FE code that can't load
// Babel dependencies
export function initForBabel(babelTypes, _babylon) {
  t = babelTypes;
  babylon = _babylon;
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
    canInferResult?: boolean | ((args: any, extraArgs: any) => boolean);
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
  memberExpression: MemberExpression,
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
  classDeclaration: {
    visitor(path) {
      // doesn't seem to have binding.kind, so can't just ignore it in
      // safelyGetVariableTrackingValue -> make sure tracking var exists
      path.insertAfter(
        skipPath(
          t.variableDeclaration("var", [
            t.variableDeclarator(
              t.identifier(getTrackingVarName(path.node.id.name))
            )
          ])
        )
      );
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
      } else if (astArgs.operator === "delete") {
        const obj = args.object[0];
        const propName = args.propName[0];
        const ret = delete obj[propName];
        if (typeof obj === "object") {
          ctx.trackObjectPropertyAssignment(obj, propName, null, null);
        }
        return ret;
      } else {
        throw Error("unknown unary expression operator");
      }
    },
    visitor(path) {
      let args;
      if (path.node.operator === "-") {
        args = {
          argument: [path.node.argument, getLastOperationTrackingResultCall()]
        };
      } else if (path.node.operator === "delete") {
        let propName;
        const arg = path.node.argument;
        let object;
        if (arg.type === "MemberExpression") {
          object = arg.object;
          if (arg.computed === true) {
            propName = arg.property;
          } else {
            propName = addLoc(
              this.t.stringLiteral(arg.property.name),
              arg.property.loc
            );
          }
        } else if (arg.type === "Identifier") {
          // Deleting a global like this: delete someGlobal
          propName = addLoc(ignoredStringLiteral(arg.name), arg.loc);
          object = getGetGlobalCall();
        } else {
          console.log("unknown delete argument type: " + arg.type);
          return;
        }

        args = {
          object: [object, null],
          propName: [propName, null]
        };
      } else {
        return;
      }
      return this.createNode!(
        args,
        {
          operator: ignoredStringLiteral(path.node.operator)
        },
        path.node.loc
      );
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
        const nameTrackingValue = ctx.createArrayIndexOperationLog(
          i,
          logData.loc
        );
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
      const elements: any[] = [];
      path.node.elements.forEach(el => {
        if (
          el /* check for el because it can be null if array has empty elements like [1,,3] */ &&
          el.type === "SpreadElement"
        ) {
          elements.push(
            t.spreadElement(
              ignoredCallExpression(FunctionNames.expandArrayForSpreadElement, [
                el.argument
              ])
            )
          );
        } else {
          elements.push(
            ignoredArrayExpression([el, getLastOperationTrackingResultCall()])
          );
        }
      });
      return this.createNode!([elements], null, path.node.loc);
    }
  },
  returnStatement: {
    argNames: ["returnValue"],
    canInferResult: function(args) {
      // return statement will always return returned value
      return !!args[0];
    },
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
    canInferResult: function(args) {
      // identifier will always return same value as var value
      return !!args[0];
    },
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
              ctx.createArrayIndexOperationLog(i, logData.loc)
            );
          });
        } else {
          if (VERIFY) {
            console.log("no tracking values for arguments object");
          }
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

      let trackingIdentiferLookup = safelyGetVariableTrackingValue(
        path.node.name,
        path.scope
      );

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
      const { string, separator: separatorArg } = operationLog.args;
      const originalString = string.result.primitive;
      const separator = (separatorArg && separatorArg.result.primitive) || "";

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
      const json = operationLog.args.json.result.primitive;
      const keyPath = operationLog.runtimeArgs.keyPath;

      const ast = jsonToAst(json, { loc: true });

      const valueStart = getJSONPathOffset(
        json,
        ast,
        keyPath,
        operationLog.runtimeArgs.isKey
      );

      charIndex = adjustColumnForEscapeSequences(
        json.slice(valueStart),
        charIndex
      );
      charIndex += valueStart;

      return {
        operationLog: operationLog.args.json,
        charIndex
      };
    }
  },
  arrayPattern: {
    traverse(operationLog, charIndex) {
      return {
        operationLog: operationLog.args.value,
        charIndex
      };
    }
  },
  arrayIndex: {},
  assignmentExpression: AssignmentExpression,
  objectAssign: {
    traverse: identifyTraverseFunction
  },
  arraySlice: { traverse: identifyTraverseFunction },
  arraySplice: { traverse: identifyTraverseFunction },
  arrayConcat: {
    traverse: identifyTraverseFunction
  },
  htmlAdapter: {
    traverse: (operationLog, charIndex) => {
      return {
        operationLog: operationLog.args.html,
        charIndex: traverseDomOrigin(operationLog.runtimeArgs, charIndex)
      };
    }
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
  Object.defineProperty(operation, "babylon", {
    get() {
      return babylon;
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
      "ArrowFunctionExpression",
      "MemberExpression",
      "ObjectProperty",
      "CatchClause",
      "ForOfStatement",
      "ForInStatement",
      "IfStatement",
      "ForStatement",
      "FunctionExpression",
      "UpdateExpression",
      "LabeledStatement",
      "ContinueStatement",
      "BreakStatement",
      "ClassMethod",
      "ClassProperty",
      "ClassDeclaration",
      "ClassExpression",
      "AssignmentPattern",
      "ArrayPattern",
      "RestElement"
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
