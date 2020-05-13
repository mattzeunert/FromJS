const EventEmitter = require('events');

let messages = ""

const emitter1 = new EventEmitter();
emitter1.on("message", (msg) => {
    messages += msg
})
emitter1.emit("message", "abc")

class MyEmitter extends EventEmitter {
    constructor() {
        super()
        setTimeout(() => {
            this.emit("message", "xyz")
        }, 50)
    }
}

const emitter2 = new MyEmitter()
emitter2.on("message", (msg) => {
    messages += msg
})

setTimeout(() => {
    console.log("Inspect:" + __fromJSGetTrackingIndex(messages))
    __fromJSWaitForSendLogsAndExitNodeProcess()
}, 100)