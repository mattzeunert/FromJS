const intl2 = require('intl');
const number = 123456.789;
let formatter = new intl2.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' })

let value = formatter.format(number)
console.log("Inspect:" + __fromJSGetTrackingIndex(value))
__fromJSWaitForSendLogsAndExitNodeProcess()