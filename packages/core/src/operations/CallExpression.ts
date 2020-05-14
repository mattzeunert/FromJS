import {
  getLastOperationTrackingResultCall,
  ignoreNode,
  ignoredIdentifier,
  ignoredArrayExpression,
  ignoredCallExpression,
  skipPath,
  ignoredNumericLiteral
} from "../babelPluginHelpers";

import { ExecContext } from "../helperFunctions/ExecContext";
import { VERIFY } from "../config";
import {
  doOperation,
  getLastMemberExpressionObject,
  getFunctionArgTrackingInfo
} from "../FunctionNames";
import OperationLog from "../helperFunctions/OperationLog";

import { consoleLog, consoleError } from "../helperFunctions/logging";
import {
  specialValuesForPostprocessing,
  specialCasesWhereWeDontCallTheOriginalFunction,
  SpecialCaseArgs,
  traverseKnownFunction,
  knownFnProcessors,
  FnProcessorArgs,
  newExpressionPostProcessors
} from "./CallExpressionSpecialCases";
import { ValueTrackingValuePair } from "../types";
import KnownValues from "../helperFunctions/KnownValues";
import { countObjectKeys } from "../util";
import { getShortExtraArgName, getShortKnownValueName } from "../names";

const returnValueExtraArgName = getShortExtraArgName("returnValue");

const CallExpression = <any>{
  argNames: ["function", "context", "arg", "evalFn"],
  argIsArray: [false, false, true, false],
  // I tried this once and it broke the Backbone e2e test
  // I think the issue is that sometimes there is a return value
  // but it's not the most recent one, e.g. because a native function
  // was involved
  // canInferResult: (args, extraArgs, astArgs, runtimeArgs) => {
  //   return (
  //     extraArgs &&
  //     extraArgs[returnValueExtraArgName] &&
  //     extraArgs[returnValueExtraArgName][1]
  //   );
  // },
  exec: function callExpressionExec(
    args: [any, ValueTrackingValuePair, any, any],
    astArgs,
    ctx: ExecContext,
    logData: any
  ) {
    let [fnArg, context, argList, evalFn] = args;

    var object = context[0];

    var fn = fnArg[0];
    var fnArgTrackingValues: any[] = [];
    var fnArgValues: any[] = [];

    for (var i = 0; i < argList.length; i++) {
      const arg = argList[i];
      if (
        astArgs.spreadArgumentIndices &&
        astArgs.spreadArgumentIndices.includes(i)
      ) {
        const argumentArray = arg[0];
        for (
          var spreadArrayArgumentIndex = 0;
          spreadArrayArgumentIndex < argumentArray.length;
          spreadArrayArgumentIndex++
        ) {
          const argument = argumentArray[spreadArrayArgumentIndex];
          fnArgValues.push(argument);
          fnArgTrackingValues.push(
            ctx.getEmptyTrackingInfo("spreadArgument", logData.loc)
          );
        }
      } else {
        fnArgValues.push(arg[0]);
        fnArgTrackingValues.push(arg[1]);
      }
    }

    const functionIsCall = fn === Function.prototype.call;
    const functionIsApply = fn === Function.prototype.apply;
    const functionIsCallOrApply = functionIsCall || functionIsApply;

    // There are basically two sets of arguments:
    // 1) The args passed into callExpression.exec
    // 2) The args passed into .apply/argTrackingValues, and used for special case handlers
    let fnAtInvocation = functionIsCallOrApply ? context[0] : fn;
    let fnArgTrackingValuesAtInvocation = fnArgTrackingValues;
    let fnArgValuesAtInvocation = fnArgValues;
    let fnContextAtInvocation: ValueTrackingValuePair = context;

    if (functionIsCallOrApply) {
      fnContextAtInvocation = [fnArgValues[0], fnArgTrackingValues[0]];
    }
    if (functionIsCall) {
      fnArgTrackingValuesAtInvocation = fnArgTrackingValues.slice(1);
      fnArgValuesAtInvocation = fnArgValues.slice(1);
    } else if (functionIsApply) {
      ({
        fnArgTrackingValuesAtInvocation,
        fnArgValuesAtInvocation
      } = getInvocationArgsForApply(
        fnArgValues,
        fnArgTrackingValuesAtInvocation,
        fnArgValuesAtInvocation,
        ctx
      ));
    }

    ctx.argTrackingInfo = fnArgTrackingValuesAtInvocation;
    ctx.functionContextTrackingValue = fnContextAtInvocation[1];

    let extraTrackingValues: any = {};
    let runtimeArgs: any;
    let extraState: any;

    const fnKnownValue = ctx.knownValues.getName(fnAtInvocation);
    if (fnKnownValue) {
      runtimeArgs = {};
      extraState = {};
    }
    var ret;
    let retT: any = null;

    let fnArgValuesForApply = fnArgValues;

    if (astArgs.isNewExpression) {
      ({ ret, retT } = handleNewExpression(getSpecialCaseArgs()));
    } else if (
      fnKnownValue &&
      specialCasesWhereWeDontCallTheOriginalFunction[fnKnownValue] &&
      (fnKnownValue !== "String.prototype.replace" ||
        ["string", "number"].includes(typeof fnArgValues[1]))
    ) {
      [ret, retT] = specialCasesWhereWeDontCallTheOriginalFunction[
        fnKnownValue
      ](getSpecialCaseArgs());
    } else {
      if (VERIFY && fnKnownValue === "String.prototype.replace") {
        consoleLog("unhandled string replace call");
      }
      const fnIsEval = fn === eval;
      if (fnIsEval) {
        if (ctx.hasInstrumentationFunction) {
          if (evalFn) {
            ctx.global["__fromJSEvalSetEvalFn"](evalFn[0]);
          }
          fn = ctx.global["__fromJSEval"];
        } else {
          if (!ctx.global.__forTestsDontShowCantEvalLog) {
            consoleLog("Calling eval but can't instrument code");
          }
        }
      }

      if (fnKnownValue) {
        const knownFnProcessor = knownFnProcessors[fnKnownValue];
        if (knownFnProcessor) {
          knownFnProcessor(getFnProcessorArgs());
        }
      }

      const lastReturnStatementResultBeforeCall =
        ctx.lastReturnStatementResult && ctx.lastReturnStatementResult[1];

      ret = fn.apply(object, fnArgValuesForApply);
      ctx.argTrackingInfo = null;
      const lastReturnStatementResultAfterCall =
        ctx.lastReturnStatementResult && ctx.lastReturnStatementResult[1];
      // Don't pretend to have a tracked return value if an uninstrumented function was called
      // (not 100% reliable e.g. if the uninstrumented fn calls an instrumented fn)
      if (fnIsEval && ctx.hasInstrumentationFunction) {
        ctx.registerEvalScript({
          ...ret.evalScript,
          details: {
            sourceOperationLog: fnArgTrackingValues[0],
            sourceOffset: 0
          }
        });
        ret = ret.returnValue;
        retT = ctx.lastOpTrackingResultWithoutResetting;
      } else if (fnKnownValue && specialValuesForPostprocessing[fnKnownValue]) {
        try {
          retT = specialValuesForPostprocessing[fnKnownValue](
            getSpecialCaseArgs()
          );
        } catch (err) {
          consoleError("post procressing error", fnKnownValue, err);
          debugger;
        }
      } else {
        if (
          ctx.lastOperationType === "returnStatement" &&
          lastReturnStatementResultAfterCall !==
            lastReturnStatementResultBeforeCall
        ) {
          if (ctx.lastReturnStatementResult) {
            retT = ctx.lastReturnStatementResult[1];
            // if there's a return statement that's not returning a promise
            // but a function returns a promise then that's an async function
            if (
              ret instanceof Promise &&
              !(ctx.lastReturnStatementResult[0] instanceof Promise)
            ) {
              console.log("setting restv", retT);
              ctx.trackPromiseResolutionValue(ret, retT);
            }
          }
        }
      }

      if (functionIsCallOrApply && fnKnownValue) {
        let callOrApplyInvocationArgs = {};
        fnArgValuesAtInvocation.forEach((arg, i) => {
          callOrApplyInvocationArgs["arg" + i] = [
            null,
            fnArgTrackingValuesAtInvocation[i]
          ];
        });

        extraTrackingValues.call = [
          null,
          ctx.createOperationLog({
            operation: ctx.operationTypes.callExpression,
            args: callOrApplyInvocationArgs,
            result: ret,
            loc: logData.loc
          })
        ];
      }
    }

    extraTrackingValues[returnValueExtraArgName] = [ret, retT]; // pick up value from returnStatement

    if (runtimeArgs && countObjectKeys(runtimeArgs) > 0) {
      logData.runtimeArgs = runtimeArgs;
    }
    logData.extraArgs = extraTrackingValues;

    return ret;

    function getSpecialCaseArgs(): SpecialCaseArgs {
      const specialCaseArgs: SpecialCaseArgs = {
        fn,
        ctx,
        object,
        fnArgTrackingValues: fnArgTrackingValuesAtInvocation,
        fnArgValues: fnArgValuesAtInvocation,
        args,
        extraTrackingValues,
        logData,
        context,
        ret,
        retT,
        extraState,
        runtimeArgs,
        fnKnownValue
      };
      if (functionIsCallOrApply) {
        specialCaseArgs.fn = object;
        specialCaseArgs.object = fnArgValues[0];
        specialCaseArgs.context = [fnArgValues[0], fnArgTrackingValues[0]];
      }

      return specialCaseArgs;
    }

    function getFnProcessorArgs() {
      function setFnArgForApply(argIndex, argValue) {
        if (functionIsApply) {
          const argList = fnArgValuesForApply[1].slice();
          argList[argIndex] = argValue;
        } else if (functionIsCall) {
          fnArgValuesForApply[argIndex + 1] = argValue;
        } else {
          fnArgValuesForApply[argIndex] = argValue;
        }
      }
      function getFnArgForApply(argIndex) {
        if (functionIsApply) {
          const argList = fnArgValuesForApply[1];
          return argList[argIndex];
        } else if (functionIsCall) {
          return fnArgValuesForApply[argIndex + 1];
        } else {
          return fnArgValuesForApply[argIndex];
        }
      }

      function setContext(c) {
        context = c;
      }
      function setArgValuesForApply(vals) {
        fnArgValuesForApply = vals;
      }
      function setFunction(f) {
        fn = f;
      }
      const fnProcessorArgs: FnProcessorArgs = {
        extraState,
        setArgValuesForApply,
        fnArgValues,
        getFnArgForApply,
        setFnArgForApply,
        ctx,
        setContext,
        context,
        fnArgTrackingValues,
        logData,
        object,
        setFunction,
        fnArgValuesAtInvocation,
        fnArgTrackingValuesAtInvocation,
        setFnArgTrackingValue: (index, val) => {
          fnArgTrackingValues[index] = val;
        }
      };

      return fnProcessorArgs;
    }
  },
  traverse(operationLog: OperationLog, charIndex) {
    var knownFunction =
      operationLog.args.function &&
      operationLog.args.function.result.knownValue;

    if (
      (knownFunction === "Function.prototype.call" ||
        knownFunction === "Function.prototype.apply") &&
      operationLog.extraArgs.call
    ) {
      const args = operationLog.extraArgs.call.args;
      args.function = operationLog.args.context;
      args.context = operationLog.args.arg0;
      return this.traverse(
        new OperationLog(<any>{
          ...operationLog,
          args
        }),
        charIndex
      );
    }

    if (knownFunction) {
      return traverseKnownFunction({ operationLog, charIndex, knownFunction });
    } else {
      return {
        operationLog: operationLog.extraArgs.returnValue,
        charIndex: charIndex
      };
    }
  },
  visitor(path, isNewExpression = false) {
    const { callee } = path.node;

    var isMemberExpressionCall = callee.type === "MemberExpression";

    const astArgs: any = {};

    var args: any[] = [];
    path.node.arguments.forEach((arg, i) => {
      if (arg.type === "SpreadElement") {
        if (!astArgs.spreadArgumentIndices) {
          astArgs.spreadArgumentIndices = [];
        }
        astArgs.spreadArgumentIndices.push(ignoredNumericLiteral(i));
        arg = arg.argument;
      }
      args.push(
        ignoredArrayExpression([arg, getLastOperationTrackingResultCall()])
      );
    });

    let contextArg;
    let evalFn;
    const calleeType = path.node.callee.type;
    if (calleeType === "Super") {
      // Prevent syntax error: super' keyword unexpected here
      return;
    }
    if (calleeType === "Identifier") {
      const functionIdentifier = path.node.callee.name;
      if (functionIdentifier === "eval") {
        // Eval function that can be embedded in code, so that local variables are accessible in eval'd code
        const evalFnAst = this.babylon.parse(
          `sth = function(){return eval(arguments[0])}`
        ).program.body[0].expression.right;

        evalFn = ignoredArrayExpression([
          skipPath(evalFnAst),
          this.t.nullLiteral()
        ]);
      }
    }

    if (isMemberExpressionCall) {
      if (callee.object.type === "Super") {
        // super is not transformed by member expression visitor,
        // so get last member expression object is not updated
        contextArg = ignoredArrayExpression([this.t.thisExpression()]);
      } else {
        contextArg = ignoredCallExpression(getLastMemberExpressionObject, []);
      }
    } else {
      contextArg = [
        ignoredIdentifier("undefined"),
        ignoreNode(this.t.nullLiteral())
      ];
    }

    const fn = [
      path.node.callee,
      isMemberExpressionCall
        ? getLastOperationTrackingResultCall()
        : getLastOperationTrackingResultCall()
    ];

    var fnArgs = [fn, contextArg, args];

    if (evalFn) {
      fnArgs.push(evalFn);
    }

    if (isNewExpression) {
      astArgs["isNewExpression"] = ignoreNode(this.t.booleanLiteral(true));
    }

    var call = this.createNode!(fnArgs, astArgs, path.node.callee.loc);

    // todo: would it be better for perf if I updated existing call
    // instead of using replaceWith?
    return call;
  }
};

export default CallExpression;

function getInvocationArgsForApply(
  fnArgValues: any[],
  fnArgTrackingValuesAtInvocation: any[],
  fnArgValuesAtInvocation: any[],
  ctx: ExecContext
) {
  const argArray = fnArgValues[1] || [];
  if (!("length" in argArray)) {
    // hmm can this even happen in a program that's not already broken?
    consoleLog("can this even happen?");
    fnArgTrackingValuesAtInvocation = [];
  } else {
    fnArgTrackingValuesAtInvocation = [];
    fnArgValuesAtInvocation = [];
    for (let i = 0; i < argArray.length; i++) {
      fnArgValuesAtInvocation.push(argArray[i]);
      fnArgTrackingValuesAtInvocation.push(
        ctx.getObjectPropertyTrackingValue(argArray, i)
      );
    }
  }
  return { fnArgTrackingValuesAtInvocation, fnArgValuesAtInvocation };
}

function handleNewExpression({
  fn,
  ctx,
  fnArgValues,
  ret,
  retT,
  logData,
  args,
  fnArgTrackingValues,
  fnKnownValue
}: SpecialCaseArgs) {
  const isNewFunctionCall = fn === Function;
  if (isNewFunctionCall && ctx.hasInstrumentationFunction) {
    let code = fnArgValues[fnArgValues.length - 1];
    let generatedFnArguments = fnArgValues.slice(0, -1);
    const fnOpening = "(function(" + generatedFnArguments.join(",") + ") { ";
    code = fnOpening + code + " })";
    ret = ctx.global["__fromJSEval"](code);
    ctx.registerEvalScript({
      ...ret.evalScript,
      details: {
        sourceOffset: -fnOpening.length,
        sourceOperationLog: fnArgTrackingValues[fnArgTrackingValues.length - 1]
      }
    });
    ret = ret.returnValue;
  } else {
    if (isNewFunctionCall) {
      consoleLog(
        "can't instrument new Function() code because instrumentation function is missing in context"
      );
    }

    let doTrackPromiseResolutionValue;
    if (fn === Promise) {
      // new Promise((resolve, reject)= {})
      let executor = fnArgValues[0];
      fnArgValues = [
        function(resolve, reject) {
          const res = function(resolveValue) {
            let resolveValueTV = global[getFunctionArgTrackingInfo](0);
            doTrackPromiseResolutionValue = promise => {
              if (resolveValue instanceof Promise) {
                resolveValue.then(nextResolveValue => {
                  let tv = ctx.getPromiseResolutionTrackingValue(resolveValue);

                  ctx.trackPromiseResolutionValue(promise, tv);
                });
              } else {
                ctx.trackPromiseResolutionValue(promise, resolveValueTV);
              }
            };

            // ret is the promise
            // if ret is undefined that means the promis executor resolved synchronously
            // before the `new Promise()` call finished
            if (ret) {
              doTrackPromiseResolutionValue(ret);
              doTrackPromiseResolutionValue = null;
            }
            resolve(resolveValue);
          };
          //@ts-ignore
          return executor.apply(this, [res, reject]);
        },
        fnArgValues.slice(1)
      ];
    }

    let thisValue = null; // overwritten inside new()
    ret = new (Function.prototype.bind.apply(fn, [
      thisValue,
      ...fnArgValues
    ]))();

    if (doTrackPromiseResolutionValue) {
      doTrackPromiseResolutionValue(ret);
    }
  }

  const newArgs = {
    function: args[0]
  };
  // args[2] is the arg list
  args[2].forEach((arg, i) => {
    // not sure if this is needed...
    if (typeof arg[1] === "number") {
      newArgs["arg" + i] = arg;
    }
  });

  retT = ctx.createOperationLog({
    operation: ctx.operationTypes.newExpressionResult,
    args: newArgs,
    result: ret,
    loc: logData.loc
  });

  if (fnKnownValue) {
    let postProcessor = newExpressionPostProcessors[fnKnownValue];
    if (postProcessor) {
      postProcessor({
        fn,
        ctx,
        fnArgValues,
        ret,
        retT,
        logData,
        args,
        fnArgTrackingValues,
        fnKnownValue
      });
    }
  }

  return { ret, retT };
}
