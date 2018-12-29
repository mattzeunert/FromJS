function generateEvalUrl(type) {
  return (
    "http://fromjs-temporary-url.com:5555/" +
    type +
    Math.floor(Math.random() * 1000000000) +
    ".js"
  );
}

export default function handleEvalScript(code, compile, details, done) {
  const type = (details && details.type) || "eval";
  const url = generateEvalUrl(type);

  return compile(code, url, function(babelResult) {
    const instrumentedCode = babelResult.code + "\n//# sourceURL=" + url;
    done({
      instrumentedCode,
      code,
      url,
      locs: babelResult.locs
    });
  });
}
