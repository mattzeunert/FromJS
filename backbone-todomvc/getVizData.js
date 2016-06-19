function resolveStackArray(stackArray, callback){
    var str = stackArray.join("\n")

    var err = ErrorStackParser.parse({stack: str});
    var gps = new StackTraceGPS();

    var newStackFrames = new Array(err.length);
    var frame;
    err.forEach(function(frame, i){
        gps.pinpoint(frame).then(function(newFrame){
            newStackFrames[i] = newFrame.toString();
        }, function(){
            newStackFrames[i] = frame.toString();
            console.log("error", arguments)
        });
    })

    setTimeout(function(){
        callback(newStackFrames.join("\n"))
    }, 1000)
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
                 children.push({
                    action: elOrigin.action,
                    elIdentifier: elOrigin.child.tagName,
                    children: ssss.children,
                    inputValues: ssss.inputValues
                })
                callback()
            })
        } else if (elOrigin.inputValues){
            async.map(elOrigin.inputValues, function(iv, callback){
                var origin = _.clone(iv.origin);

                callback(origin)
            }, function(inputV){
                inputValues = inputV;
                callback()
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
