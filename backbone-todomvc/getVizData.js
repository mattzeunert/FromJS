function resolveStackArray(stackArray, callback){
    stackArray = stackArray.filter(function(frame){
        if (frame.indexOf("string-trace.js") !== -1) {
            return false;
        }
        if (frame.indexOf("(native)") !== -1) {
            return false;
        }
        return true
    })

    var str = stackArray.join("\n")

    var err = ErrorStackParser.parse({stack: str});


    var sourceCache = {};
    var fnEls = document.getElementsByClassName("string-trace-fn")
    fnEls = Array.prototype.slice.call(fnEls)
    fnEls.forEach(function(el){
        var key = el.getAttribute("fn") + ".js"
        sourceCache[key] = el.innerHTML
    })

    var gps = new StackTraceGPS({sourceCache: sourceCache});

    function resFrame(frame, callback){
        gps._get(frame.fileName).then(function(src){
            var lines = src.split("\n")
            frame.prevLine = lines[frame.lineNumber - 1 - 1]// adjust for lines being one-indexed
            frame.nextLine = lines[frame.lineNumber + 1 - 1]
            frame.line = lines[frame.lineNumber - 1];

            callback(null, JSON.parse(JSON.stringify(frame)))
        })

    }

    async.map(err, function(frame, callback){
        gps.pinpoint(frame).then(function(newFrame){
            resFrame(newFrame, callback)
        }, function(){
            resFrame(frame, callback)
            console.log("error", arguments)
        });
    }, function(err, newStackFrames){
        callback(newStackFrames)
    })
}

function resolveStacksInOrigin(origin, callback){
    var functionsToCall = []
    if (origin.stack){
        functionsToCall.push(function(callback){
            resolveStackArray(origin.stack, function(newStack){
                origin.resolvedStack = newStack
                callback()
            })
        })
    }
    if (origin.inputValues) {
        functionsToCall.push(function(callback){
            async.each(origin.inputValues, function(iv, callback){
                if (!iv) {callback();}
                else {
                    resolveStacksInOrigin(iv, callback)
                }
            }, function(){
                callback();
            })
        })
    }


    async.series(functionsToCall, function(){
        callback();
    })

}

function isElement(value){
    return value instanceof Element
}

function resolveStackIfAvailable(data, callback){
    if (data.stack){
        resolveStackArray(data.stack, function(resolvedStack){
            data = _.clone(data);
            data.resolvedStack = resolvedStack;
            callback(null, data)
        })
    } else {
       callback(null, data)
    }
}

function OriginTreeItem(){

}

function jsonifyElOriginOfEl(el, callback){
    if (!el.__elOrigin){
        console.warn("no elorigin for", el)
        callback({action: "no el origin"});
        return;
    }

    var inputValues = []
    async.each(el.__elOrigin, function(elOrigin, callback){
        async.map(elOrigin.inputValues, function(value, callback){
            if (isElement(value)){
                jsonifyElOriginOfEl(value, function(jsonifiedEl){
                    console.log("JSONIFIED", value, jsonifiedEl)
                    var data = {
                       action: elOrigin.action,
                       actionDetails: value.tagName,
                       inputValues: jsonifiedEl.inputValues,
                       value: elOrigin.value
                   }
                   resolveStackIfAvailable(data, function(err, data){
                       callback(null, data)
                   })
                })
            } else {
                var origin = _.clone(value.origin);
                resolveStacksInOrigin(origin, function(){
                    callback(null, origin)
                })
            }
        }, function(err, inputV){
            if (elOrigin.action === "assign innerHTML") {
                resolveStackArray(elOrigin.stack, function(resolvedStack){
                    inputValues.push({
                        inputValues: inputV,
                        action: "assign innerHTML",
                        stack: elOrigin.stack,
                        value: elOrigin.value,
                        resolvedStack: resolvedStack
                    })
                    callback()
                })
            }
            else if (elOrigin.action === "initial html") {
                inputValues.push({
                    action: elOrigin.action,
                    actionDetails: elOrigin.actionDetails,
                    inputValues: inputV
                })
                callback()
            } else {
                inputValues.push({
                    action: elOrigin.action,
                    inputValues: inputV
                })
                callback()
            }


        })

    }, function(){
        callback({
            inputValues: inputValues
        })
    })
}

setTimeout(function(){
    window.JSON.parse = nativeJSONParse
    console.time("Get visData")
    jsonifyElOriginOfEl(document.body, function(oooo){

        window.oooo = oooo;
        console.timeEnd("Get visData")
        localStorage.setItem("visData", JSON.stringify(oooo))
        console.log("got oooo, saved to localstorage")
    })
}, 2000)
