import OperationLog from "./helperFunctions/OperationLog";

export default function traverseStringConcat(
  left: OperationLog,
  right: OperationLog,
  charIndex: number
) {
  if (charIndex < left.result.length) {
    return {
      operationLog: left,
      charIndex: charIndex
    };
  } else {
    return {
      operationLog: right,
      charIndex: charIndex - left.result.length
    };
  }
}
