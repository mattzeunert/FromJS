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
    arrayArguments?: string[];
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
          return doOperation("memberExpression", [object, propName], null, loc);
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
  objectExpression: {
    exec: (args, astArgs, ctx: ExecContext, logData: any) => {
      var obj = {};
      var methodProperties = {};

      for (var i = 0; i < args.properties.length; i++) {
        var property = args.properties[i];

        var propertyType = property.type[0];
        var propertyKey = property.key[0];

        if (propertyType === "ObjectProperty") {
          var propertyValue = property.value[0];
          var propertyValueT = property.value[1];

          obj[propertyKey] = propertyValue;

          ctx.trackObjectPropertyAssignment(
            obj,
            propertyKey,
            ctx.createOperationLog({
              operation: "objectProperty",
              args: { propertyValue: [propertyValue, propertyValueT] },
              result: propertyValue,
              astArgs: {},
              loc: logData.loc
            }),
            property.key[1]
          );
        } else if (propertyType === "ObjectMethod") {
          var propertyKind = property.kind[0];
          var fn = property.value[0];
          if (!methodProperties[propertyKey]) {
            methodProperties[propertyKey] = {
              enumerable: true,
              configurable: true
            };
          }
          if (propertyKind === "method") {
            obj[propertyKey] = fn;
          } else {
            methodProperties[propertyKey][propertyKind] = fn;
          }
        }
      }
      Object.defineProperties(obj, methodProperties);

      return obj;
    },
    traverse(operationLog, charIndex) {
      return {
        operationLog: operationLog.args.propertyValue,
        charIndex: charIndex
      };
    },
    visitor(path) {
      path.node.properties.forEach(function(prop) {
        if (prop.key.type === "Identifier") {
          const loc = prop.key.loc;
          prop.key = t.stringLiteral(prop.key.name);
          prop.key.loc = loc;
          if (!loc) {
            debugger;
          }
        }
      });

      var properties = path.node.properties.map(function(prop) {
        var type = ignoredStringLiteral(prop.type);
        if (prop.type === "ObjectMethod") {
          // getters/setters or something like this: obj = {fn(){}}
          var kind = ignoredStringLiteral(prop.kind);
          kind.ignore = true;
          return ignoredObjectExpression({
            type: [type],
            key: [prop.key],
            kind: [kind],
            value: [t.functionExpression(null, prop.params, prop.body)]
          });
        } else {
          return ignoredObjectExpression({
            type: [type],
            key: [prop.key, getLastOperationTrackingResultCall()],
            value: [prop.value, getLastOperationTrackingResultCall()]
          });
        }
      });

      var call = this.createNode!(
        {
          properties
        },
        null,
        path.node.loc
      );

      return call;
    }
  },
  stringLiteral: {
    shorthand: {
      fnName: "__strLit",
      getExec: doOperation => {
        return (value, loc) => {
          return doOperation(
            "stringLiteral",
            {
              value: [value]
            },
            null,
            loc
          );
        };
      },
      visitor: (opArgs, astArgs, locAstNode) => {
        return ignoredCallExpression("__strLit", [opArgs.value[0], locAstNode]);
      }
    },
    visitor(path) {
      if (path.parent.type === "ObjectProperty") {
        return;
      }
      return skipPath(
        this.createNode!(
          {
            value: [ignoredStringLiteral(path.node.value)]
          },
          {},
          path.node.loc
        )
      );
    },
    exec: (args, astArgs, ctx: ExecContext) => {
      return args.value[0];
    }
  },
  numericLiteral: {
    shorthand: {
      fnName: "__numLit",
      getExec: doOperation => {
        return (value, loc) => {
          return doOperation(
            "numericLiteral",
            {
              value: [value]
            },
            null,
            loc
          );
        };
      },
      visitor: (opArgs, astArgs, locAstNode) => {
        return ignoredCallExpression("__numLit", [opArgs.value[0], locAstNode]);
      }
    },
    visitor(path) {
      if (path.parent.type === "ObjectProperty") {
        return;
      }
      return skipPath(
        this.createNode!(
          {
            value: [ignoredNumericLiteral(path.node.value)]
          },
          null,
          path.node.loc
        )
      );
    },
    exec: (args, astArgs, ctx: ExecContext) => {
      return args.value[0];
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
    arrayArguments: ["elements"],
    exec: (args, astArgs, ctx: ExecContext, logData: any) => {
      let arr: any[] = [];
      args.elements.forEach((el, i) => {
        const [value, trackingValue] = el;
        arr.push(value);
        const nameTrackingValue = ctx.createOperationLog({
          operation: ctx.operationTypes.arrayIndex,
          args: {},
          result: i,
          astArgs: {},
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
        {
          elements: path.node.elements.map(el =>
            ignoredArrayExpression([el, getLastOperationTrackingResultCall()])
          )
        },
        null,
        path.node.loc
      );
    }
  },
  returnStatement: {
    exec: (args, astArgs, ctx: ExecContext, logData) => {
      ctx.lastReturnStatementResult = [args.returnValue[0], logData.index];
      return args.returnValue[0];
    },
    traverse(operationLog, charIndex) {
      return {
        operationLog: operationLog.args.returnValue,
        charIndex: charIndex
      };
    },
    visitor(path) {
      path.node.argument = this.createNode!(
        {
          returnValue: ignoredArrayExpression([
            path.node.argument,
            getLastOperationTrackingResultCall()
          ])
        },
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
          return doOperation("identifier", [value], null, loc);
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
                args: {},
                result: i,
                astArgs: {},
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
  const operation = operations[operationName];
  const isObjectExpression = operationName === OperationTypes.objectExpression;

  let arrayArguments: any[] = [];
  if (operation && operation.arrayArguments) {
    arrayArguments = operation.arrayArguments;
  }

  if (isObjectExpression) {
    // todo: this is an objexpression property not an obj expression itself, should be clarified
    fn(args.value, "value", newValue => {
      args.value = newValue;
    });
    fn(args.key, "key", newValue => (args.key = newValue));
  } else {
    Object.keys(args).forEach(key => {
      if (arrayArguments.includes(key)) {
        args[key].forEach((a, i) => {
          fn(a, "element" + i, newValue => (args[key][i] = newValue));
        });
      } else {
        fn(args[key], key, newValue => (args[key] = newValue));
      }
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
  if (!operation.arrayArguments) {
    operation.arrayArguments = [];
  }
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
