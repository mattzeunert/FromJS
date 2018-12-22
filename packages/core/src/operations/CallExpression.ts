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
import { doOperation, getLastMemberExpressionObject } from "../FunctionNames";
import OperationLog from "../helperFunctions/OperationLog";

import { consoleLog, consoleError } from "../helperFunctions/logging";
import {
  specialValuesForPostprocessing,
  specialCases,
  SpecialCaseArgs,
  traverseKnownFunction,
  knownFnProcessors,
  FnProcessorArgs
} from "./CallExpressionSpecialCases";

function getFullUrl(url) {
  var a = document.createElement("a");
  a.href = url;
  return a.href;
}

const CallExpression = <any>{
  argNames: ["function", "context", "arg", "evalFn"],
  argIsArray: [false, false, true, false],
  exec: (args, astArgs, ctx: ExecContext, logData: any) => {
    let [fnArg, context, argList, evalFn] = args;

    var fnArgs: any[] = [];
    var fnArgValues: any[] = [];

    var fn = fnArg[0];

    for (var i = 0; i < argList.length; i++) {
      const arg = argList[i];
      if (
        astArgs.spreadArgumentIndices &&
        astArgs.spreadArgumentIndices.includes(i)
      ) {
        const argumentArray = arg[0];
        argumentArray.forEach(argument => {
          fnArgValues.push(argument);
          fnArgs.push(ctx.getEmptyTrackingInfo("spreadArgument", logData.loc));
        });
      } else {
        fnArgValues.push(arg[0]);
        fnArgs.push(arg[1]);
      }
    }

    var object = context[0];

    const functionIsCall = fn === Function.prototype.call;
    const functionIsApply = fn === Function.prototype.apply;
    const functionIsCallOrApply = functionIsCall || functionIsApply;

    // There are basically two sets of arguments:
    // 1) The args passed into callExpression.exec
    // 2) The args passed into .apply/argTrackingValues, and used for special case handlers
    let fnAtInvocation = functionIsCallOrApply ? context[0] : fn;
    let fnArgsAtInvocation = fnArgs;
    let fnArgValuesAtInvocation = fnArgValues;

    if (functionIsCall) {
      fnArgsAtInvocation = fnArgs.slice(1);
      fnArgValuesAtInvocation = fnArgValues.slice(1);
    } else if (functionIsApply) {
      const argArray = fnArgValues[1] || [];
      if (!("length" in argArray)) {
        // hmm can this even happen in a program that's not already broken?
        consoleLog("can this even happen?");
        fnArgsAtInvocation = [];
      } else {
        fnArgsAtInvocation = [];
        fnArgValuesAtInvocation = [];
        for (let i = 0; i < argArray.length; i++) {
          fnArgValuesAtInvocation.push(argArray[i]);
          fnArgsAtInvocation.push(
            ctx.getObjectPropertyTrackingValue(argArray, i)
          );
        }
      }
    }

    ctx.argTrackingInfo = fnArgsAtInvocation;

    const extraTrackingValues: any = {};
    const runtimeArgs: any = {};

    var ret;
    let retT: any = null;
    if (astArgs.isNewExpression) {
      const isNewFunctionCall = fn === Function;
      if (isNewFunctionCall && ctx.hasInstrumentationFunction) {
        let code = fnArgValues[fnArgValues.length - 1];
        let generatedFnArguments = fnArgValues.slice(0, -1);

        code =
          "(function(" + generatedFnArguments.join(",") + ") { " + code + " })";
        ret = ctx.global["__fromJSEval"](code);
        ctx.registerEvalScript(ret.evalScript);
        ret = ret.returnValue;
      } else {
        if (isNewFunctionCall) {
          consoleLog("can't instrument new Function() code");
        }
        let thisValue = null; // overwritten inside new()
        ret = new (Function.prototype.bind.apply(fnArg[0], [
          thisValue,
          ...fnArgValues
        ]))();
      }
      retT = ctx.createOperationLog({
        operation: ctx.operationTypes.newExpressionResult,
        args: {},
        result: ret,
        loc: logData.loc
      });
    } else {
      let extraState: any = {};

      const fnKnownValue = ctx.knownValues.getName(fnAtInvocation);
      let specialCaseArgs = getSpecialCaseArgs();

      function getSpecialCaseArgs(): SpecialCaseArgs | void {
        if (!fnKnownValue) {
          return;
        }

        if (
          !specialCases[fnKnownValue] &&
          !specialValuesForPostprocessing[fnKnownValue]
        ) {
          return;
        }

        const specialCaseArgs = {
          fn,
          ctx,
          object,
          fnArgs: fnArgsAtInvocation,
          fnArgValues: fnArgValuesAtInvocation,
          args,
          extraTrackingValues,
          logData,
          context,
          ret,
          retT,
          extraState,
          runtimeArgs
        };
        if (functionIsCallOrApply) {
          specialCaseArgs.fn = object;
          specialCaseArgs.object = fnArgValues[0];
          specialCaseArgs.context = [fnArgValues[0], fnArgs[0]];
        }

        return specialCaseArgs;
      }

      if (
        specialCases[fnKnownValue] &&
        (fnKnownValue !== "String.prototype.replace" ||
          ["string", "number"].includes(typeof fnArgValues[1]))
      ) {
        const r = specialCases[fnKnownValue](specialCaseArgs);
        ret = r[0];
        retT = r[1];
      } else {
        if (
          fn === ctx.knownValues.getValue("String.prototype.replace") &&
          VERIFY
        ) {
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

        if (fnKnownValue === "fetch") {
          // not super accurate but until there's a proper solution
          // let's pretend we can match the fetch call
          // to the response value via the url
          ctx.global["__fetches"] = ctx.global["__fetches"] || {};
          let url =
            typeof fnArgValues[0] === "string"
              ? fnArgValues[0]
              : fnArgValues[0].url;
          url = getFullUrl(url);
          ctx.global["__fetches"][url] = logData.index;
        }
        if (fnKnownValue === "XMLHttpRequest.prototype.open") {
          ctx.global["__xmlHttpRequests"] =
            ctx.global["__xmlHttpRequests"] || {};
          let url = fnArgValues[1];
          url = getFullUrl(url);
          ctx.global["__xmlHttpRequests"][url] = logData.index;
        }

        let fnArgValuesForApply = fnArgValues;

        const knownFnProcessor = knownFnProcessors[fnKnownValue];

        if (knownFnProcessor) {
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
            fnArgs,
            logData,
            object,
            setFunction
          };
          knownFnProcessor(fnProcessorArgs);
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
          ctx.registerEvalScript(ret.evalScript);
          ret = ret.returnValue;
          retT = ctx.lastOpTrackingResultWithoutResetting;
        } else if (specialValuesForPostprocessing[fnKnownValue]) {
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
            retT =
              ctx.lastReturnStatementResult && ctx.lastReturnStatementResult[1];
          }
        }

        if (functionIsCallOrApply && fnKnownValue) {
          let callOrApplyInvocationArgs;

          callOrApplyInvocationArgs = {};
          fnArgValuesAtInvocation.forEach((arg, i) => {
            callOrApplyInvocationArgs["arg" + i] = [
              null,
              fnArgsAtInvocation[i]
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
    }
    extraTrackingValues.returnValue = [ret, retT]; // pick up value from returnStatement

    if (Object.keys(runtimeArgs).length > 0) {
      logData.runtimeArgs = runtimeArgs;
    }
    logData.extraArgs = extraTrackingValues;

    return ret;
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
      contextArg = ignoredCallExpression(getLastMemberExpressionObject, []);
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
