import OperationLog from "./helperFunctions/OperationLog";

function getResultLen(log: OperationLog) {
  return log.result.type === "string"
    ? log.result.length
    : (log.result.primitive + "").length;
}

export default function traverseConcat(
  left: OperationLog,
  right: OperationLog,
  charIndex: number
) {
  let leftStr;
  if (left.result.type === "string") {
    leftStr = left.result.primitive;
  } else if (left.result.type === "number") {
    leftStr = left.result.primitive + "";
  } else if (left.result.type === "undefined") {
    [leftStr === "undefined"];
  }
  if (typeof leftStr !== "string") {
    console.log("Can't traverse concat", left.result, right.result);
    return;
  }

  const leftLength = leftStr.length;

  if (charIndex < leftLength) {
    return {
      operationLog: left,
      charIndex: charIndex
    };
  } else {
    return {
      operationLog: right,
      charIndex: charIndex - leftLength
    };
  }
}
