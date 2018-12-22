import * as OperationTypes from "./OperationTypes";
import {
  consoleLog,
  consoleError,
  consoleWarn
} from "./helperFunctions/logging";

export class ValueMapV2 {
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
