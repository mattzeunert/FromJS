// from here: https://stackoverflow.com/questions/39574989/calculating-pi-in-javascript-using-gregory-leibniz-series
function pi(n) {
    var v = 0;
    var i;
    for (i = 1; i <= n; i += 4) {  // increment by 4
        v += 1 / i - 1 / (i + 2); // add the value of the series
    }
    return 4 * v;                  // apply the factor at last
}

console.time("Calc pi")
const value = pi(500000)
console.timeEnd("Calc pi")

console.log("Inspect:" + __fromJSGetTrackingIndex(value));
__fromJSWaitForSendLogsAndExitNodeProcess()