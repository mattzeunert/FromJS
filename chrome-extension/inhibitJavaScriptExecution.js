window.allowJSExecution = inhibitJavaScriptExecution();

function inhibitJavaScriptExecution(){
    console.log("inhibiting js execution")
    var windowProperties = {};
    var Object = window.Object
    var console = window.console
    var Error = window.Error

    function getPropertyDescriptor(object, propertyName){
        var descriptor = Object.getOwnPropertyDescriptor(object, propertyName);
        if (!descriptor) {
            return getPropertyDescriptor(Object.getPrototypeOf(object), propertyName);
        }
        return descriptor;
    }

    for (var propName in window){
        try {
            windowProperties[propName] = getPropertyDescriptor(window, propName)
            Object.defineProperty(window, propName, {
                get: function(){
                    propName
                    throw Error("JavaScript Execution Inhibited")
                },
                set: function(){
                    propName
                    throw Error("JavaScript Execution Inhibited")
                },
                configurable: true
            })
        } catch (err) {
            // debugger
            // console.info(err)
        }
    }


    return function allowJSExecution(){
        for (var propName in window){
            if (!(propName in windowProperties)) {
                delete windowProperties[propName]
            }
        }

        for (var propName in windowProperties){
            try {
                Object.defineProperty(window, propName, windowProperties[propName])
            } catch (err) {
                // debugger
                // console.info(err)
            }
        }
    }
}
