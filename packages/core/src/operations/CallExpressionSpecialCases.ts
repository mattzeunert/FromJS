import { ValueMapV2 } from "../ValueMapV2";
import HtmlToOperationLogMapping from "../helperFunctions/HtmlToOperationLogMapping";
import { ExecContext } from "../helperFunctions/ExecContext";
import {
  consoleLog,
  consoleError,
  consoleWarn
} from "../helperFunctions/logging";
import {
  regExpContainsNestedGroup,
  countGroupsInRegExp
} from "../regExpHelpers";
import { mapPageHtml } from "../mapPageHtml";
import { safelyReadProperty } from "../util";
import addElOrigin, {
  addOriginInfoToCreatedElement,
  addElAttributeNameOrigin,
  addElAttributeValueOrigin,
  getElAttributeNameOrigin,
  getElAttributeValueOrigin,
  processClonedNode
} from "./domHelpers/addElOrigin";
import mapInnerHTMLAssignment from "./domHelpers/mapInnerHTMLAssignment";
import * as cloneRegExp from "clone-regexp";
import { doOperation } from "../FunctionNames";
import * as jsonToAst from "json-to-ast";
import { getJSONPathOffset } from "../getJSONPathOffset";
import * as get from "lodash/get";
import { traverseObject } from "../traverseObject";
import { pathToFileURL } from "url";
import {
  getShortOperationName,
  getShortExtraArgName,
  getShortKnownValueName
} from "../names";

function getFnArg(args, index) {
  return args[2][index];
}

function getFullUrl(url) {
  var a = document.createElement("a");
  a.href = url;
  return a.href;
}

export type SpecialCaseArgs = {
  ctx: ExecContext;
  object: any;
  fnArgTrackingValues: any[];
  logData: any;
  fnArgValues: any[];
  ret: any;
  extraTrackingValues: any;
  runtimeArgs: any;
  fn: any;
  retT: any;
  args: any[];
  context: any;
  extraState: any;
};

const writeFile = ({
  fn,
  ctx,
  fnArgValues,
  fnArgTrackingValues,
  args,
  logData,
  context
}) => {
  const path = require("path");

  let absPath = fnArgValues[0];
  if (!absPath.startsWith("/")) {
    const cwd = eval("process.cwd()");
    absPath = path.resolve(cwd, absPath);
  }
  ctx.registerEvent({
    type: "fileWrite",
    logIndex: fnArgTrackingValues[1],
    path: fnArgValues[0],
    absPath
  });
  let ret = fn.apply(ctx, fnArgValues);

  return [ret, null];
};

function addJsonParseResultTrackingValues(
  parsed,
  jsonString,
  jsonStringTrackingValue,
  { ctx, logData }
) {
  if (
    typeof parsed === "string" ||
    typeof parsed === "number" ||
    typeof parsed === "boolean"
  ) {
    return [
      parsed,
      ctx.createOperationLog({
        operation: ctx.operationTypes.jsonParseResult,
        args: {
          json: jsonStringTrackingValue
        },
        result: parsed,
        runtimeArgs: {
          isPrimitive: true,
          charIndexAdjustment:
            typeof parsed === "string" ? 1 /* account for quote sign */ : 0
        },
        loc: logData.loc
      })
    ];
  }

  traverseObject(parsed, (keyPath, value, key, obj) => {
    const trackingValue = ctx.createOperationLog({
      operation: ctx.operationTypes.jsonParseResult,
      args: {
        json: jsonStringTrackingValue
      },
      result: value,
      runtimeArgs: {
        keyPath: keyPath,
        isKey: false
      },
      loc: logData.loc
    });
    const nameTrackingValue = ctx.createOperationLog({
      operation: ctx.operationTypes.jsonParseResult,
      args: {
        json: jsonStringTrackingValue
      },
      result: key,
      runtimeArgs: {
        keyPath: keyPath,
        isKey: true
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

  return [parsed, ctx.getEmptyTrackingInfo("JSON.parse result", logData.loc)];
}

export const specialCasesWhereWeDontCallTheOriginalFunction: {
  [knownValueName: string]: (args: SpecialCaseArgs) => any;
} = {
  [getShortKnownValueName("String.prototype.replace")]: ({
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
                  var maxSubmatchIndex = countGroupsInRegExp(getFnArg(args, 0));
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

        extraTrackingValues[getShortExtraArgName("replacement" + index)] = [
          null,
          ctx.createOperationLog({
            operation: ctx.operationTypes.stringReplacement,
            args: {
              value: getFnArg(args, 1)
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
  [getShortKnownValueName("JSON.parse")]: ({
    fn,
    ctx,
    fnArgValues,
    args,
    logData
  }) => {
    const jsonString = fnArgValues[0];
    const parsed = fn.call(JSON, jsonString);
    var [ret, retT] = addJsonParseResultTrackingValues(
      parsed,
      jsonString,
      getFnArg(args, 0),
      {
        ctx,
        logData
      }
    );

    return [ret, retT];
  },
  [getShortKnownValueName("require")]: ({
    fn,
    ctx,
    fnArgValues,
    args,
    logData,
    context
  }) => {
    let ret = fn.apply(context, fnArgValues);
    let retT = ctx.getEmptyTrackingInfo("Required value", logData.loc);

    let path = fnArgValues[0];
    if (path.endsWith(".json")) {
      console.log("required json", path);
      // Need to use fn (i.e. require) to resolve path relative to
      // the file that contains the raw code
      let absPath = fn.resolve(path);
      let json = JSON.parse(require("fs").readFileSync(absPath, "utf-8"));
      [ret, retT] = addJsonParseResultTrackingValues(
        ret,
        json,
        ctx.getEmptyTrackingInfo("requireJson", logData.loc),
        { ctx, logData }
      );
    }

    return [ret, retT];
  },
  [getShortKnownValueName("fs.readFileSync")]: ({
    fn,
    ctx,
    fnArgValues,
    args,
    logData,
    context
  }) => {
    const jsonString = fnArgValues[0];
    const parsed = fn.call(JSON, jsonString);
    var ret, retT;

    const path = require("path");

    let filePath = fnArgValues[0];
    let encodingArg = fnArgValues[1];

    const cwd = eval("process.cwd()");
    if (typeof encodingArg === "string" && filePath.endsWith(".js")) {
      if (!filePath.startsWith("/")) {
        filePath = path.resolve(cwd, filePath);
      }
      filePath = filePath.replace(
        global["fromJSNodeOutPath"],
        global["fromJSNodeSourcePath"]
      );
      console.log("Will read", filePath);
    }

    ret = fn.apply(context, [filePath, ...fnArgValues.slice(1)]);

    retT = ctx.createOperationLog({
      operation: ctx.operationTypes.readFileSyncResult,
      args: {
        // json: getFnArg(args, 0)
      },
      result: ret,
      runtimeArgs: {
        filePath,
        absPath: filePath.startsWith("/")
          ? filePath
          : path.resolve(cwd, filePath)
      },
      loc: logData.loc
    });

    return [ret, retT];
  },
  [getShortKnownValueName("fs.writeFileSync")]: writeFile,
  [getShortKnownValueName("fs.writeFile")]: writeFile
};

// add tracking values to returned objects
export const specialValuesForPostprocessing: {
  [knownValueName: string]: (args: SpecialCaseArgs) => any;
} = {
  [getShortKnownValueName("String.prototype.match")]: ({
    object,
    ctx,
    logData,
    fnArgValues,
    ret,
    context
  }) => {
    ctx = <ExecContext>ctx;
    if (!Array.isArray(ret)) {
      return;
    }
    let regExp = fnArgValues[0];
    if (!(regExp instanceof RegExp)) {
      consoleLog("non regexp match param, is this possible?");
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
        if (matchString === undefined) {
          newMatches.push(undefined);
          continue;
        }
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
        let charsToRemove = 0;
        if (!regExpContainsNestedGroup(regExp)) {
          // nested groups means there can be repetition
          charsToRemove = indexOffset + matchString.length;
        }
        charsRemovedFromFullMatch += charsToRemove;
        fullMatchRemaining = fullMatchRemaining.slice(charsToRemove);
      }
      matches = newMatches;
    }

    if (matches.length < ret.length) {
      debugger;
    }
    ret.forEach((item, i) => {
      if (matches[i] === undefined) {
        return;
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
        ctx.createArrayIndexOperationLog(i, logData.loc)
      );
    });
  },
  [getShortKnownValueName("RegExp.prototype.exec")]: ({
    object,
    ctx,
    logData,
    fnArgValues,
    ret,
    context,
    fnArgTrackingValues
  }) => {
    ctx = <ExecContext>ctx;
    const regExp = object;
    if (!ret) {
      return;
    }
    if (regExp.global) {
      ctx.trackObjectPropertyAssignment(
        ret,
        0,
        ctx.createOperationLog({
          operation: ctx.operationTypes.execResult,
          args: {
            string: [fnArgValues[0], fnArgTrackingValues[0]]
          },
          result: ret,
          astArgs: {},
          runtimeArgs: {
            matchIndex: ret.index
          },
          loc: logData.loc
        })
      );
    } else {
      for (var i = 1; i < ret.length + 1; i++) {
        ctx.trackObjectPropertyAssignment(
          ret,
          i,
          ctx.createOperationLog({
            operation: ctx.operationTypes.execResult,
            args: {
              string: [fnArgValues[0], fnArgTrackingValues[0]]
            },
            result: ret,
            astArgs: {},
            runtimeArgs: {
              // will give false results sometimes, but good enough
              matchIndex: fnArgValues[0].indexOf(ret[i])
            },
            loc: logData.loc
          })
        );
      }
    }
  },
  [getShortKnownValueName("String.prototype.split")]: ({
    object,
    fnArgTrackingValues,
    ctx,
    logData,
    fnArgValues,
    ret,
    context
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
            separator: [fnArgValues[0], fnArgTrackingValues[0]]
          },
          runtimeArgs: {
            splitResultIndex: i
          },
          result: item,
          astArgs: {},
          loc: logData.loc
        }),
        ctx.createArrayIndexOperationLog(i, logData.loc)
      );
    });
  },
  [getShortKnownValueName("Array.prototype.push")]: ({
    object,
    fnArgTrackingValues,
    ctx,
    logData
  }) => {
    const arrayLengthBeforePush = object.length - fnArgTrackingValues.length;
    fnArgTrackingValues.forEach((arg, i) => {
      const arrayIndex = arrayLengthBeforePush + i;
      ctx.trackObjectPropertyAssignment(
        object,
        arrayIndex,
        arg,
        ctx.createArrayIndexOperationLog(arrayIndex, logData.loc)
      );
    });
    return fnArgTrackingValues[fnArgTrackingValues.length - 1];
  },
  [getShortKnownValueName("Array.prototype.pop")]: ({ extraState }) => {
    return extraState.poppedValueTrackingValue;
  },
  [getShortKnownValueName("Object.keys")]: ({
    ctx,
    logData,
    fnArgValues,
    ret,
    retT
  }) => {
    ret.forEach((key, i) => {
      const trackingValue = ctx.getObjectPropertyNameTrackingValue(
        fnArgValues[0],
        key
      );
      const nameTrackingValue = ctx.createArrayIndexOperationLog(
        i,
        logData.loc
      );
      ctx.trackObjectPropertyAssignment(
        ret,
        i,
        trackingValue,
        nameTrackingValue
      );
    });
    return retT;
  },
  [getShortKnownValueName("Object.entries")]: ({
    ctx,
    logData,
    fnArgValues,
    ret,
    retT
  }) => {
    const obj = fnArgValues[0];
    ret.forEach((entryArr, i) => {
      const [key, value] = entryArr;
      const valueTv = ctx.getObjectPropertyTrackingValue(obj, key);
      const keyTv = ctx.getObjectPropertyNameTrackingValue(obj, key);
      ctx.trackObjectPropertyAssignment(entryArr, 1, valueTv);
      ctx.trackObjectPropertyAssignment(entryArr, 0, keyTv);
    });
    return retT;
  },
  [getShortKnownValueName("Object.assign")]: ({
    ctx,
    logData,
    fnArgValues,
    fnArgTrackingValues
  }) => {
    ctx = <ExecContext>ctx;
    const target = fnArgValues[0];
    const sources = fnArgValues.slice(1);
    sources.forEach((source, sourceIndex) => {
      if (!source || typeof source !== "object") {
        return;
      }
      Object.keys(source).forEach(key => {
        const valueTrackingValue = ctx.createOperationLog({
          operation: ctx.operationTypes.objectAssignResult,
          args: {
            sourceObject: [source, fnArgTrackingValues[sourceIndex + 1]],
            value: [null, ctx.getObjectPropertyTrackingValue(source, key)],
            call: [null, logData.index]
          },
          result: source[key],
          astArgs: {},
          loc: logData.loc
        });
        const nameTrackingValue = ctx.createOperationLog({
          operation: ctx.operationTypes.objectAssignResult,
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
  [getShortKnownValueName("Array.prototype.shift")]: ({
    object,
    extraState,
    ctx
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

    return extraState.shiftedTrackingValue;
  },
  [getShortKnownValueName("Array.prototype.unshift")]: ({
    object,
    extraState,
    ctx,
    fnArgTrackingValues,
    fnArgValues
  }) => {
    // Note: O(n) is not very efficient...
    const array = object;
    const unshiftedItems = fnArgValues[0];
    for (let i = unshiftedItems.length; i < array.length; i++) {
      ctx.trackObjectPropertyAssignment(
        array,
        i.toString(),
        ctx.getObjectPropertyTrackingValue(array, i - unshiftedItems.length),
        ctx.getObjectPropertyNameTrackingValue(array, i - unshiftedItems.length)
      );
    }

    for (let i = 0; i <= unshiftedItems.length; i++) {
      ctx.trackObjectPropertyAssignment(array, i, fnArgTrackingValues[i], null);
    }

    return extraState.shiftedTrackingValue;
  },
  [getShortKnownValueName("Array.prototype.slice")]: ({
    object,

    ctx,
    logData,
    fnArgValues,
    ret
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
          value: [
            null,
            valueTv ||
              ctx.getEmptyTrackingInfo(
                "Unknown Array.prototype.slice value",
                logData.loc
              )
          ],
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
  [getShortKnownValueName("Array.prototype.splice")]: ({
    object,
    ctx,
    logData,
    fnArgValues,
    ret
  }) => {
    ctx = <ExecContext>ctx;
    const resultArray = ret;
    const inputArray = object;

    let startIndex, deleteCount;
    if (fnArgValues.length >= 2) {
      startIndex = fnArgValues[0];
      deleteCount = fnArgValues[1];
    }

    resultArray.forEach((value, i) => {
      const originalIndex = i + startIndex;
      const tv = ctx.getObjectPropertyTrackingValue(
        inputArray,
        originalIndex.toString()
      );

      ctx.trackObjectPropertyAssignment(
        resultArray,
        i.toString(),
        ctx.createOperationLog({
          operation: ctx.operationTypes.arraySplice,
          args: {
            value: [null, tv],
            call: [null, logData.index]
          },
          result: value,
          astArgs: {},
          loc: logData.loc
        })
      );
    });

    // if (fnArgValues.length === 0) {
    //   startIndex = 0;
    //   endIndex = resultArray.length;
    // } else {
    //   startIndex = fnArgValues[0];
    //   if (startIndex < 0) {
    //     startIndex = inputArray.length + startIndex;
    //   }
    //   endIndex = fnArgValues[0];
    //   if (endIndex < 0) {
    //     endIndex = inputArray.length + endIndex;
    //   }
    // }
  },
  [getShortKnownValueName("Array.prototype.join")]: ({
    object,
    fnArgTrackingValues,
    ctx,
    logData,
    retT,
    extraTrackingValues
  }) => {
    for (var i = 0; i < object.length; i++) {
      let arrayValueTrackingValue = ctx.getObjectPropertyTrackingValue(
        object,
        i
      );
      if (!arrayValueTrackingValue) {
        arrayValueTrackingValue = ctx.getEmptyTrackingInfo(
          "Unknown Array Join Value",
          logData.loc
        );
      }
      extraTrackingValues["arrayValue" + i] = [
        null, // not needed, avoid object[i] lookup which may have side effects
        arrayValueTrackingValue
      ];
    }
    if (fnArgTrackingValues[0]) {
      extraTrackingValues["separator"] = [null, fnArgTrackingValues[0]];
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
  [getShortKnownValueName("Array.prototype.concat")]: ({
    object,
    fnArgTrackingValues,
    ctx,
    logData,
    fnArgValues,
    ret
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
            loc: logData.loc
          }),
          ctx.createArrayIndexOperationLog(i, logData.loc)
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
        trackProp(i, concatValue, fnArgTrackingValues[valueIndex - 1]);
        i++;
      }
    });
  },
  [getShortKnownValueName("Array.prototype.map")]: ({
    extraState,
    ret,
    ctx,
    logData
  }) => {
    const { mapResultTrackingValues } = extraState;
    mapResultTrackingValues.forEach((tv, i) => {
      ctx.trackObjectPropertyAssignment(
        ret,
        i.toString(),
        mapResultTrackingValues[i],
        ctx.createArrayIndexOperationLog(i, logData.loc)
      );
    });
  },
  [getShortKnownValueName("Array.prototype.reduce")]: ({ extraState }) => {
    return extraState.reduceResultTrackingValue;
  },
  [getShortKnownValueName("Array.prototype.filter")]: ({
    extraState,
    ctx,
    ret,
    object,
    logData
  }) => {
    let resultArrayIndex = 0;
    object.forEach(function(originalArrayItem, originalArrayIndex) {
      if (extraState.filterResults[originalArrayIndex]) {
        ctx.trackObjectPropertyAssignment(
          ret,
          resultArrayIndex,
          ctx.getObjectPropertyTrackingValue(object, originalArrayIndex),
          ctx.createArrayIndexOperationLog(resultArrayIndex, logData.loc)
        );

        resultArrayIndex++;
      }
    });
  },
  [getShortKnownValueName("document.createElement")]: ({
    fnArgTrackingValues,
    ret
  }) => {
    addOriginInfoToCreatedElement(
      ret,
      fnArgTrackingValues[0],
      "document.createElement"
    );
  },
  [getShortKnownValueName("document.createTextNode")]: ({
    fnArgTrackingValues,
    ret
  }) => {
    addElOrigin(ret, "textValue", {
      trackingValue: fnArgTrackingValues[0]
    });
  },
  [getShortKnownValueName("document.createComment")]: ({
    fnArgTrackingValues,
    ret
  }) => {
    addElOrigin(ret, "textValue", {
      trackingValue: fnArgTrackingValues[0]
    });
  },
  [getShortKnownValueName("HTMLElement.prototype.cloneNode")]: ({
    ret,
    object,
    fnArgTrackingValues,
    fnArgValues
  }) => {
    const isDeep = !!fnArgValues[0];
    processClonedNode(ret, object, { isDeep });
  },
  [getShortKnownValueName("document.importNode")]: ({
    ret,
    object,
    fnArgTrackingValues,
    fnArgValues
  }) => {
    const importedNode = fnArgValues[0];
    const isDeep = !!fnArgValues[1];
    processClonedNode(ret, importedNode, { isDeep });
  },
  [getShortKnownValueName("HTMLElement.prototype.setAttribute")]: ({
    object,
    fnArgTrackingValues,
    fnArgValues
  }) => {
    const [attrNameArg, attrValueArg] = fnArgTrackingValues;
    let attrName = fnArgValues[0];
    addElAttributeNameOrigin(object, attrName, {
      trackingValue: attrNameArg
    });
    addElAttributeValueOrigin(object, attrName, {
      trackingValue: attrValueArg
    });
  },
  [getShortKnownValueName("HTMLElement.prototype.insertAdjacentHTML")]: ({
    object,
    fnArgTrackingValues,
    fnArgValues
  }) => {
    const position = fnArgValues[0].toLowerCase();
    if (position !== "afterbegin") {
      consoleLog("Not tracking insertAdjacentHTML at", position);
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
      [html, fnArgTrackingValues[1]],
      "insertAdjacentHTML",
      undefined,
      undefined,
      childNodesBefore
    );
  },
  [getShortKnownValueName("DOMParser.prototype.parseFromString")]: ({
    fnArgValues,
    fnArgTrackingValues,
    ret
  }) => {
    const html = fnArgValues[0];
    const htmlArg = [html, fnArgTrackingValues[0]];

    const doc = ret;

    mapPageHtml(doc, html, fnArgTrackingValues[0], "parseFromString");
  },
  [getShortKnownValueName("JSON.stringify")]: ({
    fnArgTrackingValues,
    ctx,
    fnArgValues,
    ret,
    runtimeArgs
  }: SpecialCaseArgs) => {
    const stringifiedObject = fnArgValues[0];
    const jsonIndexToTrackingValue = {};
    runtimeArgs.jsonIndexToTrackingValue = jsonIndexToTrackingValue;
    const jsonString = ret;
    if (!jsonString) {
      // e.g. return value can be undefined when pass a class into JSON.stringify
      return;
    }

    const objectAfterParse = JSON.parse(jsonString);

    if (["boolean", "string", "number"].includes(typeof stringifiedObject)) {
      jsonIndexToTrackingValue[0] = fnArgTrackingValues[0];
    } else {
      const ast = jsonToAst(jsonString);

      traverseObject(
        stringifiedObject,
        (keyPath, value, key, traversedObject) => {
          const keyExistsInJSON = get(objectAfterParse, keyPath) !== undefined;
          if (!keyExistsInJSON) {
            // this property won't be included in the JSON string
            return;
          }

          if (!Array.isArray(traversedObject)) {
            const jsonKeyIndex = getJSONPathOffset(
              jsonString,
              ast,
              keyPath,
              true
            );
            jsonIndexToTrackingValue[
              jsonKeyIndex
            ] = ctx.getObjectPropertyNameTrackingValue(traversedObject, key);
          }

          let jsonValueIndex = getJSONPathOffset(
            jsonString,
            ast,
            keyPath,
            false
          );
          if (jsonString[jsonValueIndex] === '"') {
            jsonValueIndex++;
          }

          jsonIndexToTrackingValue[
            jsonValueIndex
          ] = ctx.getObjectPropertyTrackingValue(traversedObject, key);
        }
      );
    }
  }
};

export function traverseKnownFunction({
  operationLog,
  knownFunction,
  charIndex
}) {
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

        valueMap.push(start, end, replacement, replacement.result.primitive);
        currentIndexInSubjectString = end;
      });
      valueMap.push(
        currentIndexInSubjectString,
        subjectOperationLog.result.primitive.length,
        subjectOperationLog,
        subjectOperationLog.result.primitive.slice(currentIndexInSubjectString),
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
      Object.entries(jsonIndexToTrackingValue).forEach(([index, tv]: any) => {
        index = parseFloat(index);

        if (
          charIndex - index >= 0 &&
          (!closestLoc || closestLoc.index - index < charIndex - index)
        ) {
          closestLoc = { index, tv };
        }
      });

      if (!closestLoc) {
        return null;
      }

      return {
        operationLog: closestLoc.tv,
        charIndex: charIndex - closestLoc.index
      };
    case "Number.prototype.toString":
    case "Number.prototype.toFixed":
      return {
        operationLog: operationLog.args.context,
        charIndex: charIndex
      };
    case "Number.prototype.toPrecision":
      return {
        operationLog: operationLog.args.context,
        charIndex: charIndex
      };
    case "Number.prototype.constructor":
      return {
        operationLog: operationLog.args.arg0,
        charIndex
      };
    case "String.prototype.constructor":
      return {
        operationLog: operationLog.args.arg0,
        charIndex
      };
    case "String.prototype.charAt":
      return {
        operationLog: operationLog.args.context,
        charIndex: charIndex + operationLog.args.arg0.result.primitive
      };
    case "Math.round":
      return {
        operationLog: operationLog.args.arg0,
        charIndex
      };
    case "Math.min":
      let smallestValue = Number.POSITIVE_INFINITY;
      let smallestOperationLog = null;

      allArgs(operationLog, arg => {
        if (arg.result.primitive < smallestValue) {
          smallestValue = arg.result.primitive;
          smallestOperationLog = arg;
        }
      });
      return {
        operationLog: smallestOperationLog,
        charIndex
      };
    case "Math.max":
      let largestValue = Number.NEGATIVE_INFINITY;
      let largestOperationLog = null;

      allArgs(operationLog, arg => {
        if (arg.result.primitive > largestValue) {
          largestValue = arg.result.primitive;
          largestOperationLog = arg;
        }
      });
      return {
        operationLog: largestOperationLog,
        charIndex
      };
    case "Date.prototype.getTime":
    case "Date.prototype.valueOf":
    case "String.prototype.toLowerCase":
    case "String.prototype.toUpperCase":
      return {
        operationLog: operationLog.args.context,
        charIndex
      };
    case "Date.prototype.constructor":
    case "Math.abs":
    case "parseFloat":
      return {
        operationLog: operationLog.args.arg0,
        charIndex
      };
    default:
      return {
        operationLog: operationLog.extraArgs.returnValue,
        charIndex: charIndex
      };
  }
}

export interface FnProcessorArgs {
  extraState: any;
  setArgValuesForApply: (vals: any) => void;
  fnArgValues: any[];
  getFnArgForApply: (argIndex: any) => any;
  setFnArgForApply: (argIndex: any, argValue: any) => void;
  ctx: ExecContext;
  setContext: (c: any) => void;
  fnArgTrackingValues: any[];
  logData: any;
  object: any;
  setFunction: any;
  fnArgValuesAtInvocation: any[];
  fnArgTrackingValuesAtInvocation: any[];
}

export const knownFnProcessors = {
  [getShortKnownValueName("Array.prototype.map")]: ({
    extraState,
    setArgValuesForApply,
    fnArgValues,
    getFnArgForApply,
    setFnArgForApply,
    ctx,
    setContext,
    fnArgTrackingValues,
    logData
  }: FnProcessorArgs) => {
    extraState.mapResultTrackingValues = [];
    setArgValuesForApply(fnArgValues.slice());
    const originalMappingFunction = getFnArgForApply(0);
    setFnArgForApply(0, function(this: any, item, index, array) {
      const itemTrackingInfo = ctx.getObjectPropertyTrackingValue(
        array,
        index.toString()
      );
      if (fnArgValues.length > 1) {
        setContext([fnArgValues[1], fnArgTrackingValues[1]]);
      } else {
        setContext([this, null]);
      }
      const ret = ctx.global[doOperation](
        "callExpression",
        [
          [originalMappingFunction, null],
          [this, null],
          [
            [item, itemTrackingInfo, null],
            [index, null],
            [array, null]
          ]
        ],
        {},
        logData.loc
      );
      extraState.mapResultTrackingValues.push(ctx.lastOpTrackingResult);
      return ret;
    });
  },
  [getShortKnownValueName("Array.prototype.reduce")]: ({
    extraState,
    getFnArgForApply,
    setFnArgForApply,
    ctx,
    fnArgTrackingValues,
    logData,
    object
  }: FnProcessorArgs) => {
    if (fnArgTrackingValues.length > 1) {
      extraState.reduceResultTrackingValue = fnArgTrackingValues[1];
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
  },
  [getShortKnownValueName("Array.prototype.filter")]: ({
    extraState,
    getFnArgForApply,
    setFnArgForApply,
    ctx,
    logData
  }: FnProcessorArgs) => {
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
  },
  [getShortKnownValueName("Array.prototype.pop")]: ({
    extraState,
    ctx,
    object
  }: FnProcessorArgs) => {
    extraState.poppedValueTrackingValue = null;
    if (object && object.length > 0) {
      extraState.poppedValueTrackingValue = ctx.getObjectPropertyTrackingValue(
        object,
        object.length - 1
      );
    }
  },
  [getShortKnownValueName("Array.prototype.shift")]: ({
    extraState,
    ctx,
    object
  }: FnProcessorArgs) => {
    extraState.shiftedTrackingValue = null;
    if (object && object.length > 0) {
      extraState.shiftedTrackingValue = ctx.getObjectPropertyTrackingValue(
        object,
        0
      );
    }
  },
  [getShortKnownValueName("Response.prototype.json")]: ({
    setFunction,
    ctx,
    logData
  }: FnProcessorArgs) => {
    setFunction(function(this: Response) {
      const response: Response = this;
      let then = ctx.knownValues.getValue("Promise.prototype.then");
      const p = ctx.knownValues
        .getValue("Response.prototype.text")
        .apply(response);
      return then.call(p, function(text) {
        if (text === '{"ok":true}') {
          return Promise.resolve(JSON.parse(text));
        }

        console.log(response.url, ctx.global["__fetches"][response.url]);
        const t = ctx.createOperationLog({
          operation: ctx.operationTypes.fetchResponse,
          args: {
            value: [text],
            fetchCall: ["(FetchCall)", ctx.global["__fetches"][response.url]]
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
    });
  },
  [getShortKnownValueName("fetch")]: ({
    ctx,
    logData,
    fnArgValues,
    fnArgValuesAtInvocation
  }: FnProcessorArgs) => {
    // not super accurate but until there's a proper solution
    // let's pretend we can match the fetch call
    // to the response value via the url
    ctx.global["__fetches"] = ctx.global["__fetches"] || {};
    let url =
      typeof fnArgValuesAtInvocation[0] === "string"
        ? fnArgValuesAtInvocation[0]
        : fnArgValuesAtInvocation[0].url;
    console.log({ url, full: getFullUrl(url) });
    url = getFullUrl(url);

    ctx.global["__fetches"][url] = logData.index;
  },
  [getShortKnownValueName("XMLHttpRequest.prototype.open")]: ({
    ctx,
    logData,
    fnArgValues
  }: FnProcessorArgs) => {
    ctx.global["__xmlHttpRequests"] = ctx.global["__xmlHttpRequests"] || {};
    let url = fnArgValues[1];
    url = getFullUrl(url);
    ctx.global["__xmlHttpRequests"][url] = logData.index;
  }
};

function allArgs(operationLog, fn) {
  let i = 0;
  while ("arg" + i in operationLog.args) {
    fn(operationLog.args["arg" + i]);
    i++;
  }
}
