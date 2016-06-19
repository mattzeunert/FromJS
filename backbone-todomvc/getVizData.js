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


function jsonifyElOriginOfEl(el, callback){
    console.log("jsonify for ", el)
    if (!el.__elOrigin){
        console.log("no elorigin for", el)
        callback({action: "no el origin"});
        return;
    }
    var children = [];
    var inputValues = []
    async.each(el.__elOrigin, function(elOrigin, callback){
        if (elOrigin.child){
            jsonifyElOriginOfEl(elOrigin.child, function(ssss){
                var data = {
                   action: elOrigin.action,
                   elIdentifier: elOrigin.child.tagName,
                   children: ssss.children,
                   inputValues: ssss.inputValues
               }
                if (elOrigin.stack){
                    resolveStackArray(elOrigin.stack, function(resolvedStack){
                        children.push(data);
                        data.stack = elOrigin.stack;
                        data.resolvedStack = resolvedStack;
                        callback()
                    })
                } else {
                    children.push(data)
                   callback()
                }

            })
        } else if (elOrigin.inputValues){
            async.map(elOrigin.inputValues, function(iv, callback){
                var origin = _.clone(iv.origin);
                resolveStacksInOrigin(origin, function(){
                    callback(null, origin)
                })

            }, function(err, inputV){
                if (elOrigin.action === "assign innerHTML") {
                    resolveStackArray(elOrigin.stack, function(resolvedStack){
                        children.push({
                            inputValues: inputV,
                            action: "assign innerHTML",
                            stack: elOrigin.stack,
                            resolvedStack: resolvedStack
                        })
                        callback()
                    })

                }
                else {
                    console.log("other input value thing....", elOrigin.action)
                    inputValues = inputV
                    callback()
                }


            })

        }
    }, function(){
        callback({
            children: children,
            inputValues: inputValues
        })
    })
}

setTimeout(function(){
    jsonifyElOriginOfEl(document.body, function(oooo){

        window.oooo = oooo;
        console.log("got oooo")
    })
}, 5000)
