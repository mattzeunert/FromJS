var http = require("http");
var fs = require("fs");
var endsWith = require('ends-with');
var startsWith = require("starts-with")
var stringContains = require("string-contains");
var _ = require("underscore")
import processJSCode from "./compilation/processJavaScriptCode"
import babelPlugin from "./compilation/plugin"
import { replaceJSScriptTags } from "./getJSScriptTags"


var processJavaScriptCode = processJSCode(babelPlugin)


const express = require('express')
const app = express()


var bodyParser = require('body-parser')
app.use(bodyParser({limit: '50mb'}));
app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
})); 


app.post('/processJavaScriptCode', function(req, res) {
    
    const compiled = processJavaScriptCode(req.body.code, req.body.options)
    ret = {
        code: compiled.code,
        map: compiled.map
    }

    const json = JSON.stringify(ret)
    
    console.log("Code length",ret.code.length /1024/1024, "mb, json length", json.length / 1024 /1024, "mb")
    res.end(json)
});

app.get('/', (req, res) => res.send('Hello World!'))

app.listen(9544, () => console.log('Listening on port 9544'))