export default function invokeIfFunction(value, callArgs) {
  if (typeof value === "function") {
    return value.apply(null, callArgs);
  }
  return value;
}
