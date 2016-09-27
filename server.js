var http = require("http");
var fs = require("fs");
var endsWith = require('ends-with');
var startsWith = require("starts-with")
var stringContains = require("string-contains");
import processJavaScriptCode from "./src/compilation/processJavaScriptCode"
import { replaceJSScriptTags } from "./src/getJSScriptTags"
var _ = require("underscore")

var port = parseFloat(process.argv[2])
if (!port) {
    port = 7500;
}

http.createServer(handleRequest).listen(port)
console.log("Open localhost:" + port + " in your browser and open an HTML file from there")

function handleRequest(request, response){
    var path = request.url.split("?")[0]
    var isInternalRequest = startsWith(path, "/fromjs-internals/")

    if (isInternalRequest){
        if (endsWith(path, "fromjs.css")) {
            path = require("path").normalize(__dirname + "/../src/fromjs.css")
        }

        path = path.replace("/fromjs-internals/", __dirname + "/../" + "dist/")
    } else {
        path = "." + path
    }

    console.log("Request for", request.url)
    if (endsWith(path, ".js.map") && !isInternalRequest){
        path = path.substr(0, path.length - ".map".length)
    }
    if (endsWith(path, ".dontprocess")){
        path = path.substr(0, path.length - ".dontprocess".length)
    }


    if (fs.existsSync(path)){
        if (fs.lstatSync(path).isDirectory()){
            var files = fs.readdirSync(path);
            response.write("<html>")
            files.forEach(function(file){
                response.write("<a href='" + encodeURI("/" + path + (endsWith(path, "/") ? "" : "/") + file)  +"'>" + _.escape(file) + "</a><br/>")
            })
            response.write("</html>")
        } else {
            var fileContents = fs.readFileSync(path).toString()

            if (endsWith(request.url, ".html")){
                var originalHtmlScriptTag = "<script id='fromjs-initial-html' html-filename='" + request.url + "' type='text/template'>" + encodeURIComponent(fileContents) + "</script>"
                var fromJSUrl = "/fromjs-internals/from.js"
                var scriptTagHtml = '<script src="' + fromJSUrl + '" charset="utf-8"></script><script>window.fromJSEnableTracing()</script>'
                var linkTagHtml = '<link rel="stylesheet" href="' + "/fromjs-internals/fromjs.css" + '"/>'
                var insertedHtml = originalHtmlScriptTag + scriptTagHtml + linkTagHtml

                var uid = 1;
                fileContents = replaceJSScriptTags(fileContents, function(content) {
                    var encodedScript = encodeURI(content)
                    return `
                        var script = originalCreateElement.call(document, "script")
                        script.text = decodeURI("${encodedScript}")
                        document.documentElement.appendChild(script)
                    `
                })

                // we need a  proper solution for processing initial page html... but for now this has to do
                var script = "<script>makeSureInitialHTMLHasBeenProcessed()</script>"
                var hasBody = false;
                fileContents = fileContents.replace(/<body[\w\W]*?>[\w\W]*?<\/body>/, function(match){
                    var hasScriptTag = false;
                    hasBody = true;

                    match = match.replace(/<script[\w\W]*?>[\w\W]*?<\/script>/g, function(scriptMatch){
                        if (scriptMatch.split(">")[0].indexOf("template") !== -1) {
                            // skip script tag that look like templates
                            return scriptMatch
                        }
                        if (hasScriptTag) {return scriptMatch}
                        hasScriptTag = true;
                        return script + scriptMatch
                    })
                    if (!hasScriptTag) {
                        match = match.replace(/<\/body>$/, script + "</body>")
                    }
                    return match
                })
                if (!hasBody) {
                    fileContents += script
                }

                if (stringContains(fileContents, "<head>")){
                    fileContents = fileContents.replace("<head>", "<head>" + insertedHtml)
                } else {
                    fileContents = insertedHtml + fileContents
                }
            }

            if (endsWith(request.url, ".html.dontprocess")){
                // nothing i need to do actually
            }

            if ((endsWith(request.url, ".js") || endsWith(request.url, ".js.map")) &&
                !stringContains(request.url, "/dontprocess") &&
                !stringContains(request.url, "/vis") &&
                !stringContains(request.url, ".dontprocess") &&
                !isInternalRequest
            ) {
                var jsFileName = path.split("/")[path.split("/").length - 1]
                if (endsWith(request.url, ".js")) {
                    try {
                        var res = processJavaScriptCode(fileContents)
                        fileContents = res.code
                        fileContents += "\n//# sourceMappingURL=" + jsFileName + ".map"
                    } catch (err) {
                        console.error("Error processing JS code: ", err)
                        fileContents = "console.error('Server error: " + err.toString() + "')"
                    }

                }
                if (endsWith(request.url, ".js.map") ){
                    fileContents = JSON.stringify(processJavaScriptCode(fileContents, {filename: jsFileName}).map, null, 4)
                }
            }
            response.write(fileContents)
        }
    } else {
        response.writeHead(404, {"Content-Type": "text/plain"});
        response.write("not found")
    }
    response.end();
}
