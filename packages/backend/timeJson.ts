// Show slow JSON.parse calls in the trace
const nativeParse = JSON.parse;
JSON.parse = function (json) {
  const shouldTrace = typeof json === "string" && json.length > 40000;

  let start = new Date();
  let ret = nativeParse.apply(this, arguments as any);

  if (shouldTrace) {
    const duration = new Date().valueOf() - start.valueOf();
    if (duration > 50) {
      console.log(
        "JSON.parse took " + duration + "ms",
        (json || "").slice(0, 100).replace(/\n/g, " "),
        Error("Timing").stack!.split("\n").slice(1, 4).join("\n")
      );
    }
  }
  return ret;
};

const nativeStringify = JSON.stringify;
JSON.stringify = function () {
  let start = new Date();
  const ret = nativeStringify.apply(JSON, arguments as any);
  let duration = new Date().valueOf() - start.valueOf();
  if (duration > 50) {
    console.log(
      "JSON.stringify took " + duration + "ms",
      (ret || "").slice(0, 100),
      Error("Timing").stack!.split("\n").slice(1, 4).join("\n")
    );
  }
  return ret;
};
