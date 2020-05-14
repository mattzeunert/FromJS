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
  if (
    left.result.primitive === undefined ||
    right.result.primitive === undefined
  ) {
    console.log("Can't traverse concat", left.result, right.result);
    return;
  }

  const leftLength = getResultLen(left);

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
