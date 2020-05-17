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
  getTrackingVarName,
  createGetMemoArray
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
import traverseConcat from "./traverseConcat";
import * as MemoValueNames from "./MemoValueNames";
import { traverseDomOrigin } from "./traverseDomOrigin";
import { VERIFY } from "./config";
import { getElAttributeValueOrigin } from "./operations/domHelpers/addElOrigin";
import { safelyReadProperty, nullOnError } from "./util";
import * as FunctionNames from "./FunctionNames";
import * as sortBy from "lodash.sortby";
import { getShortExtraArgName, getShortArgName } from "./names";

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
      charIndex: number,
      options?: { optimistic: boolean; events?: any[] }
    ) => TraversalStep | undefined;
    t?: any; // babel types
  };
}

const leftArgName = getShortArgName("left");
const rightArgName = getShortArgName("right");

const operations: Operations = {
  memberExpression: MemberExpression,
  binaryExpression: {
    canInferResult: function(args) {
      const left = args[leftArgName];
      const right = args[rightArgName];
      if (!left[1] || !right[1]) {
        return false;
      }
      if (typeof left[0] !== "string" || typeof right[0] !== "string") {
        return false;
      }
      return true;
    },
    visitor(path) {
      if (!["+", "-", "/", "*"].includes(path.node.operator)) {
        return;
      }
      return this.createNode!(
        {
          [leftArgName]: [path.node.left, getLastOperationTrackingResultCall()],
          [rightArgName]: [
            path.node.right,
            getLastOperationTrackingResultCall()
          ]
        },
        { operator: ignoredStringLiteral(path.node.operator) },
        path.node.loc
      );
    },
    traverse(operationLog, charIndex, options?) {
      const { operator } = operationLog.astArgs;
      const { left, right } = operationLog.args;

      const leftIsNumericLiteral = left.operation === "numericLiteral";
      const rightIsNumericLiteral = right.operation === "numericLiteral";
      const numericLiteralCount =
        (leftIsNumericLiteral ? 1 : 0) + (rightIsNumericLiteral ? 1 : 0);
      if (options && options.optimistic && numericLiteralCount === 1) {
        // We can't be quite sure, but probably the user cares about the
        // more complex value, not the simple hard coded value
        const complexOperation = leftIsNumericLiteral ? right : left;
        return {
          isOptimistic: true,
          charIndex,
          operationLog: complexOperation
        };
      }

      if (operator == "+") {
        return traverseConcat(left, right, charIndex);
      } else {
        console.log("todo binexp operator " + operator);
      }

      throw "aaa";
    },
    exec: function binaryExpressionExec(args, astArgs, ctx: ExecContext) {
      const [left] = args[leftArgName];
      const [right] = args[rightArgName];
      var ret;

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
  logicalExpression: {
    visitor(path) {
      if (path.node.operator === "||") {
        return this.createNode!(
          {
            // always execute the left side
            [leftArgName]: ignoreNode(
              t.sequenceExpression([
                createSetMemoValue(
                  MemoValueNames.lastOrLogicalExpressionResult,
                  path.node.left,
                  getLastOperationTrackingResultCall()
                ),
                createGetMemoArray(MemoValueNames.lastOrLogicalExpressionResult)
              ])
            ),
            // only execute the right side if left side is falsy
            [rightArgName]: ignoreNode(
              t.logicalExpression(
                "&&",
                ignoreNode(
                  t.unaryExpression(
                    "!",
                    createGetMemoValue(
                      MemoValueNames.lastOrLogicalExpressionResult
                    )
                  )
                ),
                ignoredArrayExpression([
                  path.node.right,
                  getLastOperationTrackingResultCall()
                ])
              )
            )
          },
          { operator: ignoredStringLiteral(path.node.operator) },
          path.node.loc
        );
      }
    },
    traverse(operationLog, charIndex, options?) {
      const { operator } = operationLog.astArgs;
      const { left, right } = operationLog.args;

      if (operator === "||") {
        if (left.result.isTruthy()) {
          return {
            operationLog: left,
            charIndex
          };
        } else {
          return {
            operationLog: right,
            charIndex
          };
        }
      }
    },
    exec: (args, astArgs, ctx: ExecContext) => {
      const l = args[leftArgName];
      const r = args[rightArgName];

      // destructure here instead of using [l] = ... above,
      // because false[0] is valid, but can't destructure false
      const left = l[0];
      const right = r[0];

      var ret;

      var { operator } = astArgs;
      if (operator === "||") {
        ret = left || right;
      } else {
        throw Error("unknown logical exp operator: " + operator);
      }

      return ret;
    }
  },
  thisExpression: {
    exec(args, astArgs, ctx: ExecContext) {
      return args.value[0];
    },
    traverse: identifyTraverseFunction,
    visitor(path) {
      return this.createNode!(
        {
          value: [
            ignoreNode(path.node),
            ignoredCallExpression(
              FunctionNames.getFunctionContextTrackingValue,
              []
            )
          ]
        },
        {},
        path.node.loc
      );
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
  genericOperation: {
    traverse(operationLog, charIndex) {
      if (!operationLog.runtimeArgs.next) {
        return {
          operationLog: null,
          charIndex
        };
      }

      return {
        operationLog: operationLog.runtimeArgs.next,
        charIndex: charIndex + (operationLog.runtimeArgs.adjustCharIndex || 0)
      };
    }
  },
  stringReplacement: {},
  callExpression: CallExpression,
  fn: {
    exec: (args, astArgs, ctx) => {
      return args[0];
    }
  },
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
    exec: function stringLiteralExec(args, astArgs, ctx: ExecContext) {
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
  templateLiteral: {
    exec: (args, astArgs, ctx: ExecContext, logData) => {
      logData.extraArgs = {};
      logData.runtimeArgs = {};
      const expressionValues = ctx.getCurrentTemplateLiteralTrackingValues();
      expressionValues.forEach((expressionValue, i) => {
        logData.extraArgs[getShortExtraArgName("expression" + i)] = [
          null,
          expressionValue.trackingValue
        ];
        logData.runtimeArgs["expression" + i + "Length"] =
          expressionValue.valueLength;
      });

      return args.literal[0];
    },
    visitor(path) {
      if (path.parentPath.node.type === "TaggedTemplateExpression") {
        return;
      }
      let literalParts = [...path.node.expressions, ...path.node.quasis];
      literalParts = sortBy(literalParts, p => {
        const start = p.loc.start;
        return start.line * 10000 + start.column;
      });
      const structure: any[] = literalParts.map(part => {
        if (part.type === "TemplateElement") {
          return ignoredObjectExpression({
            type: ignoredStringLiteral("quasi"),
            // cooked e.g. has escape sequences resolved
            length: ignoredNumericLiteral(part.value.cooked.length)
          });
        } else {
          return ignoredObjectExpression({
            type: ignoredStringLiteral("expression")
          });
        }
      });
      const astArgs = {
        structureParts: ignoredArrayExpression(structure)
      };

      path.node.expressions = path.node.expressions.map(expression => {
        return ignoredCallExpression(
          FunctionNames.saveTemplateLiteralExpressionTrackingValue,
          [expression]
        );
      });

      const args = {
        // not sure why i need ignored array exp here?
        literal: ignoredArrayExpression([ignoreNode(path.node), null])
      };

      return t.sequenceExpression([
        ignoredCallExpression(FunctionNames.enterTemplateLiteral, []),
        this.createNode!(args, astArgs, path.node.loc)
      ]);
    },
    traverse(operationLog, charIndex) {
      const structureParts = operationLog.astArgs.structureParts;
      let indexInString = 0;
      let expressionIndex = 0;
      for (var partIndex = 0; partIndex < structureParts.length; partIndex++) {
        const structurePart = structureParts[partIndex];
        let indexInStringAfter = indexInString;
        if (structurePart.type === "quasi") {
          indexInStringAfter += structurePart.length;
          if (indexInStringAfter > charIndex) {
            return {
              charIndex: charIndex,
              operationLog: null
            };
          }
        } else {
          const expressionTrackingValue =
            operationLog.extraArgs["expression" + expressionIndex];
          const expressionValueLength =
            operationLog.runtimeArgs["expression" + expressionIndex + "Length"];
          expressionIndex++;
          indexInStringAfter += expressionValueLength;

          if (indexInStringAfter > charIndex) {
            return {
              operationLog: expressionTrackingValue,
              charIndex: charIndex - indexInString
            };
          }
        }

        indexInString = indexInStringAfter;
      }

      return {
        operationLog: null,
        charIndex
      };
    }
  },
  awaitExpression: {
    visitor(path) {
      const args = {
        promise: [
          createSetMemoValue(
            "promiseForAwait",
            path.node.argument,
            getLastOperationTrackingResultCall()
          ),
          createGetMemoTrackingValue("promiseForAwait")
        ],
        result: [
          ignoreNode(
            this.t.awaitExpression(createGetMemoValue("promiseForAwait"))
          )
        ]
      };

      return ignoreNode(this.createNode!(args, {}, path.node.loc));
    },
    exec(args, astArgs, ctx: ExecContext, logData) {
      args.result[1] = ctx.getPromiseResolutionTrackingValue(args.promise[0]);
      return args.result[0];
    },
    traverse(operationLog, charIndex) {
      return {
        operationLog: operationLog.args.result,
        charIndex
      };
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
    exec: function arrayExpressionExec(
      args,
      astArgs,
      ctx: ExecContext,
      logData: any
    ) {
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
      return !!args[0][1];
    },
    exec: function returnStatementExec(
      args,
      astArgs,
      ctx: ExecContext,
      logData
    ) {
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
      return !!args[0][1];
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
    exec: function identifierExec(args, astArgs, ctx: ExecContext, logData) {
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
    canInferResult: true,
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
  execResult: {
    traverse(operationLog: OperationLog, charIndex) {
      return {
        operationLog: operationLog.args.string,
        charIndex: charIndex + operationLog.runtimeArgs.matchIndex
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
      if (operationLog.runtimeArgs.isPrimitive) {
        return {
          operationLog: operationLog.args.json,
          charIndex: charIndex + operationLog.runtimeArgs.charIndexAdjustment
        };
      }

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
  readFileSyncResult: {
    traverse(operationLog, charIndex, options) {
      let absPath = operationLog.runtimeArgs.absPath;
      let writeEvent = (options!.events || []).find(
        e => e.type === "fileWrite" && e.absPath === absPath
      );
      if (!writeEvent) {
        return {
          operationLog: null,
          charIndex
        };
      }
      return {
        operationLog: writeEvent.logIndex,
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
  objectAssignResult: {
    traverse: identifyTraverseFunction
  },
  arraySlice: { traverse: identifyTraverseFunction },
  arraySplice: { traverse: identifyTraverseFunction },
  arrayConcat: {
    traverse: identifyTraverseFunction
  },
  styleAssignment: {
    traverse: (operationLog, charIndex) => {
      const styleName = operationLog.args.styleName.result.primitive;
      const styleNamePrefix = '="';
      const styleNameText = styleNamePrefix + styleName + ": ";
      if (charIndex < styleNameText.length) {
        return {
          operationLog: operationLog.args.styleName,
          charIndex: Math.min(
            Math.max(charIndex - styleNamePrefix.length, 0),
            styleName.length
          )
        };
      } else {
        return {
          operationLog: operationLog.args.styleValue,
          charIndex: charIndex - styleNameText.length
        };
      }
    }
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

export function eachArgumentInObject(args, operationName, fn) {
  if (!args) {
    return;
  }
  const operation = operations[operationName];
  const isObjectExpression = operationName === OperationTypes.objectExpression;

  if (isObjectExpression) {
    // todo: this is an objexpression property not an obj expression itself, should be clarified
    ["value", "key"].forEach(key => {
      fn(
        args.value,
        key,
        newValue => {
          args[key] = newValue;
        },
        newKey => {
          if (newKey === key) {
            return;
          }
          args[newKey] = args[key];
          delete args.key;
        }
      );
    });
  } else {
    Object.keys(args).forEach(key => {
      fn(
        args[key],
        key,
        newValue => (args[key] = newValue),
        newKey => {
          if (key === newKey) {
            return;
          }
          args[newKey] = args[key];
          delete args[key];
        }
      );
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
