var download = require('download')
var fs = require("fs")
var mkdirp = require("mkdirp")
var _ = require("underscore")
var endsWith = require('ends-with');
var files = [
    "http://localhost:7500/react-compiled/node_modules/todomvc-common/base.js",
    "http://localhost:7500/react-compiled/js/app.js",
    "http://localhost:7500/react-compiled/js/footer.js",
    "http://localhost:7500/react-compiled/js/todoItem.js",
    "http://localhost:7500/react-compiled/js/todoModel.js",
    "http://localhost:7500/react-compiled/js/app.js",
    "http://localhost:7500/react-compiled/node_modules/director/build/director.js",
    "http://localhost:7500/react-compiled/node_modules/classnames/index.js",
    "http://localhost:7500/react-compiled/node_modules/react/dist/react-with-addons.js",
    "http://localhost:7500/react-compiled/js/utils.js",
]

var sourceMapFiles = files.map(file => file + ".map")
var originalFiles = files.map(file => file + ".dontprocess")
files = files.concat(originalFiles)
files = files.concat(sourceMapFiles)

files.push("http://localhost:8080/dist/from.js")

var OUT_DIR = "./gh-pages/react-todomvc/"
files.push("http://localhost:7500/react-compiled/index.html")

files.push("http://localhost:7500/react-compiled/node_modules/todomvc-common/base.css")
files.push("http://localhost:7500/react-compiled/node_modules/todomvc-app-css/index.css")
files.push("http://localhost:7500/fromjs-internals/fromjs.css")

files.forEach(function(file){
    console.log("requesting", file)
    download(file).then(function(content){
        content = content.toString()
        var fileName = file.replace("http://localhost:7500/react-compiled/", "")
        fileName = fileName.replace("http://localhost:7500/", "") // for fromjs internals
        fileName = fileName.replace("http://localhost:8080/dist", "fromjs-internals")
        var parts = fileName.split("/")
        parts.pop()
        var dir = OUT_DIR + parts.join("/")
        console.log("create dir", dir)
        // console.log(file, "content", content.substr(0, 200))
        mkdirp(dir, function(){
            if (endsWith(fileName, ".html")){
                content = content.replace("/fromjs-internals/fromjs.css", "fromjs-internals/fromjs.css")
                content = content.replace("http://localhost:8080/dist/from.js", "fromjs-internals/from.js")
            }
            fs.writeFileSync(OUT_DIR + fileName, content)
        })
    }).catch( function(){
        console.log("fail", arguments)
    })
})
