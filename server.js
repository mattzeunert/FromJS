var http = require("http");
var fs = require("fs");
var endsWith = require('ends-with');
var stringContains = require("string-contains");
var processJavaScriptCode = require("./process-javascript-code")

http.createServer(handleRequest).listen(8888)

function handleRequest(request, response){
    var path = "." + request.url.split("?")[0];
    console.log("Request for path ", path)
    if (fs.existsSync(path)){
        var fileContents = fs.readFileSync(path).toString()

        if (endsWith(request.url, ".js") && !stringContains(request.url, "/dontprocess") && !stringContains(request.url, "/vis") && !stringContains(request.url, "?dontprocess=yes")) {
            fileContents = processCode(fileContents)
        }
        response.write(fileContents)
    } else {
        response.writeHead(404, {"Content-Type": "text/plain"});
        response.write("not found")
    }
    response.end();
}

function processCode(code){
    var res = processJavaScriptCode(code)
    return res.code;
}
