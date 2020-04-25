const prettyBytes = require("pretty-bytes")

let bytes = 400000
let msg = "Size: " + prettyBytes(bytes)
console.log(msg)

setTimeout(() => {
    console.log("waited 10s")
}, 10000)

// const lighthouse = require('lighthouse');
// const chromeLauncher = require('chrome-launcher');
// const log = require("lighthouse-logger");
// log.setLevel("info");


// function launchChromeAndRunLighthouse(url, opts, config = null) {
//     return chromeLauncher.launch({ chromeFlags: opts.chromeFlags }).then(chrome => {
//         opts.port = chrome.port;
//         return lighthouse(url, opts, config).then(results => {
//             // use results.lhr for the JS-consumable output
//             // https://github.com/GoogleChrome/lighthouse/blob/master/types/lhr.d.ts
//             // use results.report for the HTML/JSON/CSV output as a string
//             // use results.artifacts for the trace/screenshots/other specific case you need (rarer)
//             return chrome.kill().then(() => results.lhr)
//         });
//     });
// }

// const opts = {
//     settings: {
//         onlyCategories: ['performance'],
//     },
//     logLevel: "info"
//     // chromeFlags: ['--show-paint-rects']
// };

// // Usage:
// launchChromeAndRunLighthouse('https://example.com', opts).then(results => {
//     const str = JSON.stringify(results)
//     console.log(Object.keys(results), str.slice(0, 1000))
//     // Use results!
// });


// const lighthouse = require("lighthouse")

