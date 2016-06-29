var async = require("async");
import resolveFrame from "./resolve-frame"

function resolveStackArray(stackArray, callback){
    var allCodeIsPartOfStringTrace = stackArray.length === 0;
    if (allCodeIsPartOfStringTrace){
        callback(null, [])
        return;
    }

    async.map(stackArray, resolveFrame, function(err, newStackFrames){
        callback(newStackFrames)
    })
}
//
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

export default function exportElementOrigin(origin){
    console.time("Resolving all origin stacks")
    resolveStacksInOrigin(origin, function(){
        console.timeEnd("Resolving all origin stacks")
        localStorage.setItem("visData", JSON.stringify(origin))
    })
}
