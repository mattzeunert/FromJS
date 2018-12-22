import {
  getLastOperationTrackingResultCall,
  ignoreNode,
  ignoredIdentifier,
  ignoredArrayExpression,
  ignoredCallExpression,
  ignoredArrayExpressionIfArray,
  skipPath,
  ignoredNumericLiteral
} from "../babelPluginHelpers";
import HtmlToOperationLogMapping from "../helperFunctions/HtmlToOperationLogMapping";
import * as OperationTypes from "../OperationTypes";
import { ExecContext } from "../helperFunctions/ExecContext";

import { VERIFY } from "../config";
import { doOperation, getLastMemberExpressionObject } from "../FunctionNames";
import OperationLog from "../helperFunctions/OperationLog";

import {
  consoleLog,
  consoleError,
  consoleWarn
} from "../helperFunctions/logging";

import {
  specialValuesForPostprocessing,
  specialCases,
  SpecialCaseArgs
} from "./CallExpressionSpecialCases";

function getFullUrl(url) {
  var a = document.createElement("a");
  a.href = url;
  return a.href;
}

class ValueMapV2 {
  parts: any[] = [];
  originalString = "";

  // TODO: clean up mapping, maybe merge with other mapping one used
  // for thml
  // also: originalString is confusing (maybe?)
  constructor(originalString: string) {
    this.originalString = originalString;
  }

  push(
    fromIndexInOriginal,
    toIndexInOriginal,
    operationLog,
    resultString,
    isPartOfSubject = false
  ) {
    this.parts.push({
      fromIndexInOriginal,
      toIndexInOriginal,
      operationLog,
      resultString,
      isPartOfSubject
    });
  }

  getAtResultIndex(
    indexInResult,
    /* hacky arg for encodeuricompoennt */ dontAddBackBasedOnLocationInResultValue = false
  ) {
    let resultString = "";
    let part: any | null = null;
    for (var i = 0; i < this.parts.length; i++) {
      part = this.parts[i];
      resultString += part.resultString;
      if (resultString.length > indexInResult) {
        break;
      }
    }

    const resultIndexBeforePart =
      resultString.length - part.resultString.length;
    let charIndex =
      (part.isPartOfSubject ? part.fromIndexInOriginal : 0) +
      (dontAddBackBasedOnLocationInResultValue
        ? 0
        : indexInResult - resultIndexBeforePart);

    if (charIndex > part.operationLog.result.primitive.length) {
      charIndex = part.operationLog.result.primitive.length - 1;
    }

    let operationLog = part.operationLog;
    if (operationLog.operation === OperationTypes.stringReplacement) {
      operationLog = operationLog.args.value;
    }
    return {
      charIndex,
      operationLog: operationLog
    };
  }

  __debugPrint() {
    let originalString = "";
    let newString = "";
    this.parts.forEach(part => {
      newString += part.resultString;
      originalString += this.originalString.slice(
        part.fromIndexInOriginal,
        part.toIndexInOriginal
      );
    });
    consoleLog({ originalString, newString });
  }
}

const CallExpression = <any>{
  argNames: ["function", "context", "arg", "evalFn"],
  argIsArray: [false, false, true, false],
  exec: (args, astArgs, ctx: ExecContext, logData: any) => {
    let [fnArg, context, argList, evalFn] = args;
    // console.log({ x: 9, astArgs, argList });

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

      // if (arg[1] && typeof arg[1] !== "number") {
      //   debugger;
      // }
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

        if (fnKnownValue === "Response.prototype.json") {
          fn = function(this: Response) {
            const response: Response = this;
            let then = ctx.knownValues.getValue("Promise.prototype.then");
            const p = ctx.knownValues
              .getValue("Response.prototype.text")
              .apply(response);
            return then.call(p, function(text) {
              if (text === '{"ok":true}') {
                return Promise.resolve(JSON.parse(text));
              }

              const t = ctx.createOperationLog({
                operation: ctx.operationTypes.fetchResponse,
                args: {
                  value: [text],
                  fetchCall: [
                    "(FetchCall)",
                    ctx.global["__fetches"][response.url]
                  ]
                },
                astArgs: {},
                result: text,
                runtimeArgs: {
                  url: response.url
                },
                loc: logData.loc
              });

              const obj = ctx.global[doOperation](
                "callExpression",
                [[JSON.parse], [JSON], [[text, t]]],
                {}
              );
              return Promise.resolve(obj);
            });
          };
        }

        let fnArgValuesForApply = fnArgValues;

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

        if (fnKnownValue === "Array.prototype.map") {
          extraState.mapResultTrackingValues = [];
          fnArgValuesForApply = fnArgValues.slice();
          const originalMappingFunction = getFnArgForApply(0);
          setFnArgForApply(0, function(this: any, item, index, array) {
            const itemTrackingInfo = ctx.getObjectPropertyTrackingValue(
              array,
              index.toString()
            );
            if (fnArgValues.length > 1) {
              context = [fnArgValues[1], fnArgs[1]];
            } else {
              context = [this, null];
            }
            const ret = ctx.global[doOperation](
              "callExpression",
              [
                [originalMappingFunction, null],
                [this, null],
                [[item, itemTrackingInfo, null], [index, null], [array, null]]
              ],
              {},
              logData.loc
            );
            extraState.mapResultTrackingValues.push(ctx.lastOpTrackingResult);

            return ret;
          });
        }

        if (fnKnownValue === "Array.prototype.reduce") {
          if (fnArgs.length > 1) {
            extraState.reduceResultTrackingValue = fnArgs[1];
          } else {
            // "If no initial value is supplied, the first element in the array will be used."
            // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/reduce
            extraState.reduceResultTrackingValue = ctx.getObjectPropertyTrackingValue(
              object,
              0
            );
          }

          const originalReduceFunction = getFnArgForApply(0);

          setFnArgForApply(0, function(
            this: any,
            previousRet,
            param,
            currentIndex,
            array
          ) {
            let paramTrackingValue = ctx.getObjectPropertyTrackingValue(
              array,
              currentIndex.toString()
            );

            const ret = ctx.global[doOperation](
              "callExpression",
              [
                [originalReduceFunction, null],
                [this, null],
                [
                  [previousRet, extraState.reduceResultTrackingValue],
                  [param, paramTrackingValue],
                  [currentIndex, null],
                  [array, null]
                ]
              ],
              {},
              logData.loc
            );
            extraState.reduceResultTrackingValue = ctx.lastOpTrackingResult;

            return ret;
          });
        }

        if (fnKnownValue === "Array.prototype.filter") {
          extraState.filterResults = [];

          const originalFilterFunction = getFnArgForApply(0);

          setFnArgForApply(0, function(this: any, element, index, array) {
            const ret = ctx.global[doOperation](
              "callExpression",
              [
                [originalFilterFunction, null],
                [this, null],
                [
                  [element, ctx.getObjectPropertyTrackingValue(array, index)],
                  [index, null],
                  [array, null]
                ]
              ],
              {},
              logData.loc
            );

            extraState.filterResults.push(ret);

            return ret;
          });
        }

        if (fnKnownValue === "Array.prototype.pop") {
          extraState.poppedValueTrackingValue = null;
          if (object && object.length > 0) {
            extraState.poppedValueTrackingValue = ctx.getObjectPropertyTrackingValue(
              object,
              object.length - 1
            );
          }
        }
        if (fnKnownValue === "Array.prototype.shift") {
          extraState.shiftedTrackingValue = null;
          if (object && object.length > 0) {
            extraState.shiftedTrackingValue = ctx.getObjectPropertyTrackingValue(
              object,
              0
            );
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
      switch (knownFunction) {
        case "String.prototype.toString":
          return {
            operationLog: operationLog.args.context,
            charIndex
          };
        case "String.prototype.slice":
          return {
            operationLog: operationLog.args.context,
            charIndex: charIndex + operationLog.args.arg0.result.primitive
          };
        case "String.prototype.substr":
          const { context, arg0: start, arg1: length } = operationLog.args;
          let startValue = parseFloat(start.result.primitive);

          if (startValue < 0) {
            startValue = context.result.length + startValue;
          }

          return {
            operationLog: context,
            charIndex: charIndex + startValue
          };
        case "String.prototype.substring":
          const parentStr = operationLog.args.context;
          let startIndex = parseFloat(operationLog.args.arg0.result.primitive);
          let endIndex;
          if (operationLog.args.arg1) {
            endIndex = parseFloat(operationLog.args.arg1.result.primitive);
          } else {
            endIndex = parentStr.result.primitive.length;
          }

          if (startIndex > endIndex) {
            let tmp = endIndex;
            endIndex = startIndex;
            startIndex = tmp;
          }

          return {
            operationLog: parentStr,
            charIndex: charIndex + startIndex
          };
        case "encodeURIComponent":
          var unencodedString: string = operationLog.args.arg0.result.primitive.toString();
          var encodedString: string = operationLog.result.primitive!.toString();

          const map = new ValueMapV2(unencodedString);

          for (var i = 0; i < unencodedString.length; i++) {
            var unencodedChar = unencodedString[i];
            var encodedChar = encodeURIComponent(unencodedChar);
            map.push(i, i + 1, operationLog.args.arg0, encodedChar, true);
          }
          return map.getAtResultIndex(charIndex, true);
        case "decodeURIComponent":
          var encodedString: string = operationLog.args.arg0.result.primitive.toString();
          var unencodedString: string = operationLog.result.primitive!.toString();

          const m = new ValueMapV2(encodedString);

          let extraCharsTotal = 0;
          for (var i = 0; i < unencodedString.length; i++) {
            const unencodedChar = unencodedString[i];
            const encodedChar = encodeURIComponent(unencodedChar);
            const extraCharsHere = encodedChar.length - 1;
            m.push(
              i + extraCharsTotal,
              i + extraCharsTotal + extraCharsHere,
              operationLog.args.arg0,
              unencodedChar,
              true
            );
            extraCharsTotal += extraCharsHere;
          }
          return m.getAtResultIndex(charIndex, true);

        case "String.prototype.trim":
          let str = operationLog.args.context.result.primitive;
          let whitespaceAtStart = str.match(/^\s*/)[0].length;
          return {
            operationLog: operationLog.args.context,
            charIndex: charIndex + whitespaceAtStart
          };
        case "Array.prototype.pop":
          return {
            operationLog: operationLog.extraArgs.returnValue,
            charIndex
          };
        case "Array.prototype.shift":
          return {
            operationLog: operationLog.extraArgs.returnValue,
            charIndex
          };
        case "Array.prototype.reduce":
          return {
            operationLog: operationLog.extraArgs.returnValue,
            charIndex: charIndex
          };
        case "Array.prototype.join":
          const parts: any[] = [];
          let partIndex = 0;
          let arrayValue;
          while (
            ((arrayValue = operationLog.extraArgs["arrayValue" + partIndex]),
            arrayValue !== undefined)
          ) {
            let joinParameter = arrayValue.result.primitive + "";
            if ([null, undefined].includes(arrayValue.result.primitive)) {
              joinParameter = "";
            }
            parts.push([joinParameter, arrayValue]);
            parts.push([
              operationLog.extraArgs.separator.result.primitive + "",
              operationLog.extraArgs.separator
            ]);
            partIndex++;
          }
          parts.pop(); // take off last separator

          const mapping = new HtmlToOperationLogMapping(parts);
          const match = mapping.getOriginAtCharacterIndex(charIndex);
          return {
            charIndex: match.charIndex,
            operationLog: match.origin
          };

        case "String.prototype.replace":
          // I'm not 100% confident about this code, but it works for now

          let matchingReplacement = null;
          let totalCharCountDeltaBeforeMatch = 0;

          const replacements: any[] = [];
          eachReplacement(operationLog.extraArgs, replacement => {
            replacements.push(replacement);
          });

          const subjectOperationLog = operationLog.args.context;

          if (replacements.length === 0) {
            return {
              operationLog: subjectOperationLog,
              charIndex: charIndex
            };
          }

          const valueMap = new ValueMapV2(subjectOperationLog.result.primitive);

          let currentIndexInSubjectString = 0;
          replacements.forEach(replacement => {
            const { start, end } = replacement.runtimeArgs;
            let from = currentIndexInSubjectString;
            let to = start;
            valueMap.push(
              from,
              to,
              subjectOperationLog,
              subjectOperationLog.result.primitive.slice(from, to),
              true
            );

            valueMap.push(
              start,
              end,
              replacement,
              replacement.result.primitive
            );
            currentIndexInSubjectString = end;
          });
          valueMap.push(
            currentIndexInSubjectString,
            subjectOperationLog.result.primitive.length,
            subjectOperationLog,
            subjectOperationLog.result.primitive.slice(
              currentIndexInSubjectString
            ),
            true
          );

          // valueMap.__debugPrint()

          return valueMap.getAtResultIndex(charIndex);

          function eachReplacement(extraArgs, callback) {
            var index = 0;
            while (extraArgs["replacement" + index]) {
              callback(extraArgs["replacement" + index]);
              index++;
            }
          }

        case "JSON.stringify":
          const { jsonIndexToTrackingValue } = operationLog.runtimeArgs;
          // not efficient, but it works
          let closestLoc: any = null;
          Object.entries(jsonIndexToTrackingValue).forEach(
            ([index, tv]: any) => {
              index = parseFloat(index);

              if (
                charIndex - index >= 0 &&
                (!closestLoc || closestLoc.index - index < charIndex - index)
              ) {
                closestLoc = { index, tv };
              }
            }
          );

          if (!closestLoc) {
            return null;
          }

          return {
            operationLog: closestLoc.tv,
            charIndex: charIndex - closestLoc.index
          };
        default:
          return {
            operationLog: operationLog.extraArgs.returnValue,
            charIndex: charIndex
          };
      }
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
