function generateEvalUrl(type, name) {

  let fileName = type + (name || "") + "_" +
    Math.floor(Math.random() * 1000000000) +
    ".js";
  return (
    "http://fromjs-temporary-url.com:5555/" +
    fileName
  );
}

export default function handleEvalScript(code, compile, details, done, onError= function(err){}) {
  const type = (details && details.type) || "eval";
  const url = generateEvalUrl(type, details.name);

  try {
  return compile(code, url, function(babelResult) {
    const instrumentedCode = babelResult.code + "\n//# sourceURL=" + url;
    done({
      instrumentedCode,
      code,
      url,
      locs: babelResult.locs
    });
  });}catch(err){ 
    console.log("onerror", err.message)
    onError(err)
  }
}
