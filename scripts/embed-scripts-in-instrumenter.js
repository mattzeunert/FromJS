// In FromJS we load the code for injected.js/inhibitJSExecution.js using
// fetch, but for the re-usable version we only want a single file that
// needs to be copied

var fs = require("fs")

var instrumenterCode = fs.readFileSync("./code-preprocessing-test/dist/ChromeCodeInstrumenterBeforeEmbedding.js").toString()
// bg code also needs replacing because it's generated before ChromeCodeInstrumenter has been updated
var bgPageCode = fs.readFileSync("./code-preprocessing-test/dist/background.js").toString()
var resolveFrameWorkerCode = fs.readFileSync("./chrome-extension/dist/resolveFrameWorker.js").toString()
var injectedCode = fs.readFileSync("./chrome-extension/dist/injected.js").toString()
var inhibitJavaScriptExecutionCode = fs.readFileSync("./chrome-extension/dist/inhibitJavaScriptExecution.js").toString()

var embedCode = `
resolveFrameWorkerCode = decodeURI("${encodeURI(resolveFrameWorkerCode)}")
inhibitJSExecutionCode = decodeURI("${encodeURI(inhibitJavaScriptExecutionCode)}")
injectedJSCode = decodeURI("${encodeURI(injectedCode)}")
`

instrumenterCode = instrumenterCode.replace("/* PRE_EMBED_SCRIPTS_HERE_INSTEAD_OF_FETCH */", () => embedCode)
bgPageCode = bgPageCode.replace("/* PRE_EMBED_SCRIPTS_HERE_INSTEAD_OF_FETCH */", () => embedCode)

fs.writeFileSync("./code-preprocessing-test/dist/ChromeCodeInstrumenter.js", instrumenterCode)
fs.writeFileSync("./code-preprocessing-test/dist/background.js", bgPageCode)
console.log("Done embedding code")
