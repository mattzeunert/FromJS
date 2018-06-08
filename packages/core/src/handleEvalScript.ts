function generateEvalUrl() {
  return (
    "http://localhost:11111/eval" +
    Math.floor(Math.random() * 10000000000) +
    ".js"
  );
}

export default function handleEvalScript(code, compile, done) {
  const url = generateEvalUrl();

  return compile(code, url, function(babelResult) {
    const instrumentedCode = babelResult.code + "\n//# sourceURL=" + url;
    done({
      instrumentedCode,
      code,
      url
    });
  });
}
