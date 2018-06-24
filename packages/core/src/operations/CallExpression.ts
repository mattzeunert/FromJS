import {
  getLastOperationTrackingResultCall,
  ignoreNode,
  ignoredIdentifier,
  ignoredArrayExpression,
  ignoredCallExpression
} from "../babelPluginHelpers";
import HtmlToOperationLogMapping from "../helperFunctions/HtmlToOperationLogMapping";
import * as OperationTypes from "../OperationTypes";
import { ExecContext } from "../helperFunctions/ExecContext";
import addElOrigin, {
  addOriginInfoToCreatedElement
} from "./domHelpers/addElOrigin";
import mapInnerHTMLAssignment from "./domHelpers/mapInnerHTMLAssignment";
import { VERIFY } from "../config";
import { doOperation } from "../FunctionNames";
import OperationLog from "../helperFunctions/OperationLog";
import * as cloneRegExp from "clone-regexp";
import { callExpression } from "@babel/types";

function countGroupsInRegExp(re) {
  // http://stackoverflow.com/questions/16046620/regex-to-count-the-number-of-capturing-groups-in-a-regex
  return new RegExp(re.toString() + "|").exec("")!.length;
}

const specialCases = {
  "String.prototype.replace": ({
    fn,
    ctx,
    object,
    fnArgValues,
    args,
    extraTrackingValues,
    logData
  }) => {
    let index = 0;
    var ret = ctx.knownValues
      .getValue("String.prototype.replace")
      .call(object, fnArgValues[0], function() {
        var argumentsArray = Array.prototype.slice.apply(arguments, []);
        var match = argumentsArray[0];
        var submatches = argumentsArray.slice(1, argumentsArray.length - 2);
        var offset = argumentsArray[argumentsArray.length - 2];
        var string = argumentsArray[argumentsArray.length - 1];

        var newArgsArray = [match, ...submatches, offset, string];
        let replacement;
        let replacementParameter = fnArgValues[1];
        if (["string", "number"].includes(typeof replacementParameter)) {
          let replacementValue = replacementParameter.toString();
          replacementValue = replacementValue.replace(
            new RegExp(
              // I'm using fromCharCode because the string escaping for helperCode
              // doesn't work properly... if it's fixed we can just uses backtick directly
              "\\$([0-9]{1,2}|[$" +
              String.fromCharCode(96) /* backtick */ +
                "&'])",
              "g"
            ),
            function(dollarMatch, dollarSubmatch) {
              var submatchIndex = parseFloat(dollarSubmatch);
              if (!isNaN(submatchIndex)) {
                var submatch = submatches[submatchIndex - 1]; // $n is one-based, array is zero-based
                if (submatch === undefined) {
                  var maxSubmatchIndex = countGroupsInRegExp(args.arg0[0]);
                  var submatchIsDefinedInRegExp =
                    submatchIndex < maxSubmatchIndex;

                  if (submatchIsDefinedInRegExp) {
                    submatch = "";
                  } else {
                    submatch = "$" + dollarSubmatch;
                  }
                }
                return submatch;
              } else if (dollarSubmatch === "&") {
                return match;
              } else {
                throw "not handled!!";
              }
            }
          );
          replacement = replacementValue;
        } else {
          throw Error("unhandled replacement param type");
        }

        extraTrackingValues["replacement" + index] = [
          null,
          ctx.createOperationLog({
            operation: ctx.operationTypes.stringReplacement,
            args: {
              value: args.arg1
            },
            astArgs: {},
            result: replacement,
            loc: logData.loc,
            runtimeArgs: {
              start: offset,
              end: offset + match.length
            }
          })
        ];

        index++;
        return replacement;
      });
    var retT = null;
    return [ret, retT];
  },
  "JSON.parse": ({
    fn,
    ctx,
    object,
    fnArgValues,
    args,
    extraTrackingValues,
    logData
  }) => {
    const parsed = fn.call(JSON, fnArgValues[0]);
    var ret, retT;

    function traverseObject(obj, fn, keyPath: any[] = []) {
      if (obj === null) {
        return;
      }
      Object.entries(obj).forEach(([key, value]) => {
        fn([...keyPath, key].join("."), value, key, obj);
        if (typeof value === "object") {
          traverseObject(value, fn, [...keyPath, key]);
        }
      });
    }

    traverseObject(parsed, (keyPath, value, key, obj) => {
      const trackingValue = ctx.createOperationLog({
        operation: ctx.operationTypes.jsonParseResult,
        args: {
          json: args.arg0
        },
        result: value,
        runtimeArgs: {
          keyPath: keyPath
        },
        loc: logData.loc
      });
      const nameTrackingValue = ctx.createOperationLog({
        operation: ctx.operationTypes.jsonParseResult,
        args: {
          json: args.arg0
        },
        result: key,
        runtimeArgs: {
          keyPath: keyPath
        },
        loc: logData.loc
      });
      ctx.trackObjectPropertyAssignment(
        obj,
        key,
        trackingValue,
        nameTrackingValue
      );
    });

    retT = null; // could set something here, but what really matters is the properties

    ret = parsed;
    return [ret, retT];
  }
};

// add tracking values to returned objects
const specialValuesForPostprocessing = {
  "String.prototype.match": ({
    object,
    fnArgs,
    ctx,
    logData,
    fnArgValues,
    ret,
    retT,
    context,
    extraTrackingValues
  }) => {
    ctx = <ExecContext>ctx;
    if (!Array.isArray(ret)) {
      return;
    }
    let regExp = fnArgValues[0];
    if (!(regExp instanceof RegExp)) {
      console.log("non regexp match param, is this possible?");
      return;
    }

    // this will break if inspected code depends on state
    regExp = cloneRegExp(regExp);

    let matches: any[] = [];
    var match;
    while ((match = regExp.exec(object)) != null) {
      matches.push(match);
      if (!regExp.global) {
        // break because otherwise exec will start over at beginning of the string
        break;
      }
    }

    if (!regExp.global) {
      // non global regexp has group match results:
      // /(a)(b)/.exec("abc") => ["ab", "a", "b"], index 0
      let newMatches: any[] = [];

      let index = matches[0].index;
      let fullMatch = matches[0][0];
      let fullMatchRemaining = fullMatch;

      newMatches.push({
        index: index
      });

      let charsRemovedFromFullMatch = 0;

      for (var i = 1; i < matches[0].length; i++) {
        let matchString = matches[0][i];
        // This can be inaccurate but better than nothing
        let indexOffset = fullMatchRemaining.indexOf(matchString);
        if (indexOffset === -1) {
          debugger;
        }
        newMatches.push({
          index: index + indexOffset + charsRemovedFromFullMatch
        });

        // cut down match against which we do indexOf(), since we know
        // a single location can't get double matched
        // (maybe it could with nested regexp groups but let's not worry about that for now)
        let charsToRemove = indexOffset + matchString.length;
        charsRemovedFromFullMatch += charsToRemove;
        fullMatchRemaining = fullMatchRemaining.slice(charsToRemove);
      }
      matches = newMatches;
    }

    ret.forEach((item, i) => {
      if (!matches[i]) {
        debugger;
      }
      ctx.trackObjectPropertyAssignment(
        ret,
        i.toString(),
        ctx.createOperationLog({
          operation: ctx.operationTypes.matchResult,
          args: {
            input: context
          },
          result: item,
          astArgs: {},
          runtimeArgs: {
            matchIndex: matches[i].index
          },
          loc: logData.loc
        }),
        ctx.createOperationLog({
          operation: ctx.operationTypes.arrayIndex,
          args: {},
          result: i,
          astArgs: {},
          loc: logData.loc
        })
      );
    });
  },
  "String.prototype.split": ({
    object,
    fnArgs,
    ctx,
    logData,
    fnArgValues,
    ret,
    retT,
    context,
    extraTrackingValues
  }) => {
    ctx = <ExecContext>ctx;

    const str = object;
    const strT = context[1];

    const array = ret;

    if (!Array.isArray(ret)) {
      // can happen if separator is something like {[Symbol.split]: fn}
      return;
    }

    // TODO: properly track indices where string came from
    // I thought I could do that by just capturing the string
    // and the separator, but the separator can also be a regexp
    ret.forEach((item, i) => {
      ctx.trackObjectPropertyAssignment(
        array,
        i.toString(),
        ctx.createOperationLog({
          operation: ctx.operationTypes.splitResult,
          args: {
            string: [str, strT],
            separator: [fnArgValues[0], fnArgs[0]]
          },
          runtimeArgs: {
            splitResultIndex: i
          },
          result: item,
          astArgs: {},
          loc: logData.loc
        }),
        ctx.createOperationLog({
          operation: ctx.operationTypes.arrayIndex,
          args: {},
          result: i,
          astArgs: {},
          loc: logData.loc
        })
      );
    });
  },
  "Array.prototype.push": ({
    object,
    fnArgs,
    ctx,
    logData,
    fnArgValues,
    ret,
    retT,
    extraTrackingValues
  }) => {
    const arrayLengthBeforePush = object.length - fnArgs.length;
    fnArgs.forEach((arg, i) => {
      const arrayIndex = arrayLengthBeforePush + i;
      ctx.trackObjectPropertyAssignment(
        object,
        arrayIndex,
        arg,
        ctx.createOperationLog({
          operation: ctx.operationTypes.arrayIndex,
          args: {},
          result: arrayIndex,
          astArgs: {},
          loc: logData.loc
        })
      );
    });
    return fnArgs[fnArgs.length - 1];
  },
  "Object.keys": ({
    object,
    fnArgs,
    ctx,
    logData,
    fnArgValues,
    ret,
    retT,
    extraTrackingValues
  }) => {
    ret.forEach((key, i) => {
      const trackingValue = ctx.getObjectPropertyNameTrackingValue(
        fnArgValues[0],
        key
      );
      const nameTrackingValue = ctx.createOperationLog({
        operation: ctx.operationTypes.arrayIndex,
        args: {},
        result: i,
        astArgs: {},
        loc: logData.loc
      });
      ctx.trackObjectPropertyAssignment(
        ret,
        i,
        trackingValue,
        nameTrackingValue
      );
    });
    return retT;
  },
  "Object.assign": ({
    object,
    fnArgs,
    ctx,
    logData,
    fnArgValues,
    ret,
    retT,
    extraTrackingValues
  }) => {
    ctx = <ExecContext>ctx;
    const target = fnArgValues[0];
    const sources = fnArgValues.slice(1);
    sources.forEach(source => {
      if (!source || typeof source !== "object") {
        return;
      }
      Object.keys(source).forEach(key => {
        const valueTrackingValue = ctx.createOperationLog({
          operation: ctx.operationTypes.objectAssign,
          args: {
            value: [null, ctx.getObjectPropertyTrackingValue(source, key)],
            call: [null, logData.index]
          },
          result: source[key],
          astArgs: {},
          loc: logData.loc
        });
        const nameTrackingValue = ctx.createOperationLog({
          operation: ctx.operationTypes.objectAssign,
          args: {
            value: [null, ctx.getObjectPropertyNameTrackingValue(source, key)],
            call: [null, logData.index]
          },
          result: key,
          astArgs: {},
          loc: logData.loc
        });

        ctx.trackObjectPropertyAssignment(
          target,
          key,
          valueTrackingValue,
          nameTrackingValue
        );
      });
    });
  },
  "Array.prototype.shift": ({
    object,
    fnArgs,
    ctx,
    logData,
    fnArgValues,
    ret,
    retT,
    extraTrackingValues
  }) => {
    // Note: O(n) is not very efficient...
    const array = object;
    for (var i = 0; i < array.length; i++) {
      ctx.trackObjectPropertyAssignment(
        array,
        i.toString(),
        ctx.getObjectPropertyTrackingValue(array, i + 1),
        ctx.getObjectPropertyNameTrackingValue(array, i + 1)
      );
    }
  },
  "Array.prototype.slice": ({
    object,
    fnArgs,
    ctx,
    logData,
    fnArgValues,
    ret,
    retT,
    extraTrackingValues
  }) => {
    ctx = <ExecContext>ctx;
    const resultArray = ret;
    const inputArray = object;

    let startIndex, endIndex;

    if (fnArgValues.length === 0) {
      startIndex = 0;
      endIndex = resultArray.length;
    } else {
      startIndex = fnArgValues[0];
      if (startIndex < 0) {
        startIndex = inputArray.length + startIndex;
      }
      endIndex = fnArgValues[0];
      if (endIndex < 0) {
        endIndex = inputArray.length + endIndex;
      }
    }

    function makeTrackingValue(result, valueTv) {
      return ctx.createOperationLog({
        operation: ctx.operationTypes.arraySlice,
        args: {
          value: [null, valueTv],
          call: [null, logData.index]
        },
        result: result,
        astArgs: {},
        loc: logData.loc
      });
    }

    resultArray.forEach((item, i) => {
      // todo: create slice call action
      const originalIndex = i + startIndex;
      ctx.trackObjectPropertyAssignment(
        resultArray,
        i.toString(),
        makeTrackingValue(
          item,
          ctx.getObjectPropertyTrackingValue(
            inputArray,
            originalIndex.toString()
          )
        ),
        makeTrackingValue(
          i,
          ctx.getObjectPropertyNameTrackingValue(
            inputArray,
            originalIndex.toString()
          )
        )
      );
    });
  },
  "Array.prototype.join": ({
    object,
    fnArgs,
    ctx,
    logData,
    fnArgValues,
    ret,
    retT,
    extraTrackingValues
  }) => {
    object.forEach((item, i) => {
      let arrayValueTrackingValue = ctx.getObjectPropertyTrackingValue(
        object,
        i
      );
      if (!arrayValueTrackingValue) {
        arrayValueTrackingValue = ctx.createOperationLog({
          operation: ctx.operationTypes.untrackedValue,
          args: {},
          astArgs: {},
          runtimeArgs: {
            type: "Unknown Array Join Value"
          },
          result: object[i],
          loc: logData.loc
        });
      }
      extraTrackingValues["arrayValue" + i] = [
        null, // not needed, avoid object[i] lookup which may have side effects
        arrayValueTrackingValue
      ];
    });
    if (fnArgs[0]) {
      extraTrackingValues["separator"] = [null, fnArgs[0]];
    } else {
      extraTrackingValues["separator"] = [
        null,
        ctx.createOperationLog({
          operation: ctx.operationTypes.defaultArrayJoinSeparator,
          args: {},
          astArgs: {},
          result: ",",
          loc: logData.loc
        })
      ];
    }
    return retT;
  },
  "Array.prototype.concat": ({
    object,
    fnArgs,
    ctx,
    logData,
    fnArgValues,
    ret,
    retT,
    extraTrackingValues
  }) => {
    const concatValues = [object, ...fnArgValues];
    let i = 0;
    concatValues.forEach((concatValue, valueIndex) => {
      function trackProp(i, value, trackingValue) {
        ctx.trackObjectPropertyAssignment(
          ret,
          i.toString(),
          ctx.createOperationLog({
            operation: ctx.operationTypes.arrayConcat,
            args: {
              value: [null, trackingValue]
            },
            result: value,
            astArgs: {},
            loc: logData.loc
          }),
          ctx.createOperationLog({
            operation: ctx.operationTypes.arrayIndex,
            args: {},
            result: i,
            astArgs: {},
            loc: logData.loc
          })
        );
      }

      if (Array.isArray(concatValue)) {
        concatValue.forEach((arrayValue, indexInOriginalArray) => {
          trackProp(
            i,
            arrayValue,
            ctx.getObjectPropertyTrackingValue(
              concatValue,
              indexInOriginalArray.toString()
            )
          );
          i++;
        });
      } else {
        trackProp(i, concatValue, fnArgs[valueIndex - 1]);
        i++;
      }
    });
  },
  "document.createElement": ({
    object,
    fnArgs,
    ctx,
    logData,
    fnArgValues,
    ret,
    retT,
    extraTrackingValues
  }) => {
    addOriginInfoToCreatedElement(ret, fnArgs[0], "document.createElement");
  },
  "document.createTextNode": ({
    object,
    fnArgs,
    ctx,
    logData,
    fnArgValues,
    ret,
    retT,
    extraTrackingValues
  }) => {
    addElOrigin(ret, "textValue", {
      trackingValue: fnArgs[0]
    });
  },
  "document.createComment": ({
    object,
    fnArgs,
    ctx,
    logData,
    fnArgValues,
    ret,
    retT,
    extraTrackingValues
  }) => {
    addElOrigin(ret, "textValue", {
      trackingValue: fnArgs[0]
    });
  },
  "HTMLElement.prototype.setAttribute": ({
    object,
    fnArgs,
    ctx,
    logData,
    fnArgValues,
    ret,
    retT,
    extraTrackingValues
  }) => {
    const [attrNameArg, attrValueArg] = fnArgs;
    let attrName = fnArgValues[0];
    addElOrigin(object, "attribute_" + attrName + "_name", {
      trackingValue: attrNameArg
    });
    addElOrigin(object, "attribute_" + attrName + "_value", {
      trackingValue: attrValueArg
    });
  },
  "HTMLElement.prototype.insertAdjacentHTML": ({
    object,
    fnArgs,
    ctx,
    logData,
    fnArgValues,
    ret,
    retT,
    extraTrackingValues
  }) => {
    const position = fnArgValues[0].toLowerCase();
    if (position !== "afterbegin") {
      console.log("Not tracking insertAdjacentHTML at", position);
      return;
    }

    var el = object;

    const html = fnArgValues[1];

    const helperDiv = document.createElement("div");
    helperDiv.innerHTML = html;
    const nodeAddedCount = helperDiv.childNodes.length;
    var childNodesBefore = Array.from(el.childNodes).slice(nodeAddedCount);

    mapInnerHTMLAssignment(
      el,
      [html, fnArgs[1]],
      "insertAdjacentHTML",
      undefined,
      undefined,
      childNodesBefore
    );
  }
};

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
    console.log({ originalString, newString });
  }
}

const CallExpression = <any>{
  exec: (args, astArgs, ctx: ExecContext, logData: any) => {
    function makeFunctionArgument([value, trackingValue]) {
      return ctx.createOperationLog({
        operation: ctx.operationTypes.functionArgument,
        args: {
          value: [value, trackingValue]
        },
        loc: logData.loc,
        astArgs: {},
        result: value
      });
    }
    var i = 0;
    var arg;
    var fnArgs: any[] = [];
    var fnArgValues: any[] = [];

    let context = args.context;
    var fn = args.function[0];

    while (true) {
      var argKey = "arg" + i;
      if (!(argKey in args)) {
        break;
      }
      arg = args[argKey];
      fnArgValues.push(arg[0]);
      fnArgs.push(makeFunctionArgument(arg));
      i++;
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
        console.log("can this even happen?");
        fnArgsAtInvocation = [];
      } else {
        fnArgsAtInvocation = [];
        fnArgValuesAtInvocation = [];
        for (let i = 0; i < argArray.length; i++) {
          fnArgValuesAtInvocation.push(argArray[i]);
          fnArgsAtInvocation.push(
            makeFunctionArgument([
              argArray[i],
              ctx.getObjectPropertyTrackingValue(argArray, i)
            ])
          );
        }
      }
    }

    ctx.argTrackingInfo = fnArgsAtInvocation;

    const extraTrackingValues: any = {};

    const hasInstrumentationFunction =
      typeof ctx.global["__fromJSEval"] === "function";

    var ret;
    let retT: any = null;
    if (astArgs.isNewExpression) {
      const isNewFunctionCall = args.function[0] === Function;
      if (isNewFunctionCall && hasInstrumentationFunction) {
        let code = fnArgValues[fnArgValues.length - 1];
        let generatedFnArguments = fnArgValues.slice(0, -1);

        code =
          "(function(" + generatedFnArguments.join(",") + ") { " + code + " })";
        ret = ctx.global["__fromJSEval"](code);
        ctx.registerEvalScript(ret.evalScript);
        ret = ret.returnValue;
      } else {
        if (isNewFunctionCall) {
          console.log("can't instrument new Function() code");
        }
        let thisValue = null; // overwritten inside new()
        ret = new (Function.prototype.bind.apply(args.function[0], [
          thisValue,
          ...fnArgValues
        ]))();
      }
      retT = ctx.createOperationLog({
        operation: ctx.operationTypes.newExpressionResult,
        args: {},
        astArgs: {},
        result: {},
        loc: logData.loc
      });
    } else {
      const fnKnownValue = ctx.knownValues.getName(fnAtInvocation);
      let specialCaseArgs = getSpecialCaseArgs();

      function getSpecialCaseArgs() {
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
          retT
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
          console.log("unhandled string replace call");
        }
        const fnIsEval = fn === eval;
        if (fnIsEval) {
          if (hasInstrumentationFunction) {
            fn = ctx.global["__fromJSEval"];
          } else {
            if (!ctx.global.__forTestsDontShowCantEvalLog) {
              console.log("Calling eval but can't instrument code");
            }
          }
        }

        if (fnKnownValue === "fetch") {
          // not super accurate but until there's a proper solution
          // let's pretend we can match the fetch call
          // to the response value via the url
          ctx.global["__fetches"] = ctx.global["__fetches"] || {};
          const url =
            typeof fnArgValues[0] === "string"
              ? fnArgValues[0]
              : fnArgValues[0].url;
          ctx.global["__fetches"][url] = logData.index;
        }

        if (fnKnownValue === "Response.prototype.json") {
          fn = function(this: Response) {
            const response: Response = this;
            let then = ctx.knownValues.getValue("Promise.prototype.then");
            const p = ctx.knownValues
              .getName("Response.prototype.text")
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
                {
                  context: [JSON],
                  function: [JSON.parse],
                  arg0: [text, t]
                },
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
            return fnArgValuesForApply[0];
          }
        }

        let mapResultTrackingValues;
        if (fnKnownValue === "Array.prototype.map") {
          mapResultTrackingValues = [];
          fnArgValuesForApply = fnArgValues.slice();
          const originalMappingFunction = getFnArgForApply(0);
          setFnArgForApply(0, function(this: any, item, index, array) {
            const itemTrackingInfo = ctx.getObjectPropertyTrackingValue(
              array,
              index.toString()
            );
            let context;
            if (fnArgValues.length > 1) {
              context = [fnArgValues[1], fnArgs[1]];
            } else {
              context = [ctx.global, null];
            }
            const ret = ctx.global[doOperation](
              "callExpression",
              {
                context: this,
                function: [originalMappingFunction, null],
                arg0: [item, itemTrackingInfo, null],
                arg1: [index, null],
                arg2: [array, null]
              },
              {},
              logData.loc
            );
            mapResultTrackingValues.push(ctx.lastOpTrackingResult);

            return ret;
          });
        }

        let reduceResultTrackingValue;
        let reduceResultNormalValue;
        if (fnKnownValue === "Array.prototype.reduce") {
          if (fnArgs.length > 1) {
            reduceResultTrackingValue = fnArgs[1];
            reduceResultNormalValue = fnArgValues[1];
          } else {
            // "If no initial value is supplied, the first element in the array will be used."
            // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/reduce
            reduceResultNormalValue = object[0];
            reduceResultTrackingValue = ctx.getObjectPropertyTrackingValue(
              object,
              0
            );
          }

          const originalReduceFunction = getFnArgForApply(0);

          setFnArgForApply(0, function(
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
              {
                context: [ctx.global, null],
                function: [originalReduceFunction, null],
                arg0: [reduceResultNormalValue, reduceResultTrackingValue],
                arg1: [param, paramTrackingValue],
                arg2: [currentIndex, null],
                arg3: [array, null]
              },
              {},
              logData.loc
            );
            reduceResultNormalValue = ret;
            reduceResultTrackingValue = ctx.lastOpTrackingResult;

            return ret;
          });
        }

        let filterResults;
        if (fnKnownValue === "Array.prototype.filter") {
          filterResults = [];

          const originalFilterFunction = getFnArgForApply(0);

          setFnArgForApply(0, function(element, index, array, thisArg) {
            const ret = ctx.global[doOperation](
              "callExpression",
              {
                context: [ctx.global, null],
                function: [originalFilterFunction, null],
                arg0: [
                  element,
                  ctx.getObjectPropertyTrackingValue(array, index)
                ],
                arg1: [index, null],
                arg2: [array, null],
                arg3: [thisArg, null]
              },
              {},
              logData.loc
            );

            filterResults.push(ret);

            return ret;
          });
        }

        const lastReturnStatementResultBeforeCall =
          ctx.lastReturnStatementResult && ctx.lastReturnStatementResult[1];
        ret = fn.apply(object, fnArgValuesForApply);
        ctx.argTrackingInfo = null;
        const lastReturnStatementResultAfterCall =
          ctx.lastReturnStatementResult && ctx.lastReturnStatementResult[1];
        // Don't pretend to have a tracked return value if an uninstrumented function was called
        // (not 100% reliable e.g. if the uninstrumented fn calls an instrumented fn)
        if (fnIsEval && hasInstrumentationFunction) {
          ctx.registerEvalScript(ret.evalScript);
          ret = ret.returnValue;
          retT = ctx.lastOpTrackingResultWithoutResetting;
        } else if (specialValuesForPostprocessing[fnKnownValue]) {
          try {
            retT = specialValuesForPostprocessing[fnKnownValue](
              getSpecialCaseArgs()
            );
          } catch (err) {
            console.error("post procressing error", fnKnownValue, err);
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

        if (fnKnownValue === "Array.prototype.map") {
          mapResultTrackingValues.forEach((tv, i) => {
            ctx.trackObjectPropertyAssignment(
              ret,
              i.toString(),
              mapResultTrackingValues[i],
              ctx.createOperationLog({
                operation: ctx.operationTypes.arrayIndex,
                args: {},
                result: i,
                astArgs: {},
                loc: logData.loc
              })
            );
          });
        }
        if (fnKnownValue === "Array.prototype.reduce") {
          retT = reduceResultTrackingValue;
        }
        if (fnKnownValue === "Array.prototype.filter") {
          let resultArrayIndex = 0;
          object.forEach(function(originalArrayItem, originalArrayIndex) {
            if (filterResults[originalArrayIndex]) {
              ctx.trackObjectPropertyAssignment(
                ret,
                resultArrayIndex,
                ctx.getObjectPropertyTrackingValue(object, originalArrayIndex),
                ctx.createOperationLog({
                  operation: ctx.operationTypes.arrayIndex,
                  args: {},
                  result: resultArrayIndex,
                  astArgs: {},
                  loc: logData.loc
                })
              );

              resultArrayIndex++;
            }
          });
        }
      }
    }
    extraTrackingValues.returnValue = [ret, retT]; // pick up value from returnStatement

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
        {
          operation: OperationTypes.callExpression,
          args,
          result: operationLog.result
        },
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

    var args: any[] = [];
    path.node.arguments.forEach(arg => {
      args.push(
        ignoredArrayExpression([arg, getLastOperationTrackingResultCall()])
      );
    });

    let executionContext;
    let executionContextTrackingValue;
    if (isMemberExpressionCall) {
      executionContext = ignoredCallExpression(
        "getLastMemberExpressionObjectValue",
        []
      );
      executionContextTrackingValue = ignoredCallExpression(
        "getLastMemberExpressionObjectTrackingValue",
        []
      );
    } else {
      executionContext = ignoredIdentifier("undefined");
      executionContextTrackingValue = ignoreNode(this.t.nullLiteral());
    }

    var fnArgs = {};
    args.forEach((arg, i) => {
      fnArgs["arg" + i] = arg;
    });

    const astArgs = {};
    if (isNewExpression) {
      astArgs["isNewExpression"] = ignoreNode(this.t.booleanLiteral(true));
    }

    var call = this.createNode!(
      {
        function: [
          path.node.callee,
          isMemberExpressionCall
            ? getLastOperationTrackingResultCall()
            : getLastOperationTrackingResultCall()
        ],
        context: [executionContext, executionContextTrackingValue],
        ...fnArgs
      },
      astArgs,
      path.node.callee.loc
    );

    // todo: would it be better for perf if I updated existing call
    // instead of using replaceWith?
    return call;
  }
};

export default CallExpression;
