// const file1 = require("fs").readFileSync("a.txt", "utf-8")
// const file2 = require("fs").readFileSync("b.txt", "utf8")
// const file3 = require("fs").readFileSync("code.js", "utf8")

// const str = file1 + file2 + " " + file3
// console.log("----")
// console.log(str.slice(0, 100))



////---------------------

const lighthouse = require('lighthouse');
const chromeLauncher = require('chrome-launcher');
const log = require("lighthouse-logger");
const saveResults = require("./node_modules/lighthouse/lighthouse-cli/run").saveResults
log.setLevel("info");

function launchChromeAndRunLighthouse(url, opts, config = null) {
    let chromePromise = Promise.resolve({})
    if (isGatherMode) {
        chromePromise = chromeLauncher.launch({ chromeFlags: opts.chromeFlags })
    }
    return chromePromise.then(chrome => {
        opts.port = chrome.port;
        debugger
        return lighthouse(url, opts, config).then(results => {

            console.log(typeof results.report)
            // use results.lhr for the JS-consumable output
            // https://github.com/GoogleChrome/lighthouse/blob/master/types/lhr.d.ts
            // use results.report for the HTML/JSON/CSV output as a string
            // use results.artifacts for the trace/screenshots/other specific case you need (rarer)
            return results
            // return chrome.kill().then(() => results.lhr)
        });
    });
}

const opts = {
    onlyCategories: ['seo'],
    output: ["json", "html"],
    logLevel: "info"
    // chromeFlags: ['--show-paint-rects']
};

console.log(process.argv)
let isGatherMode = process.argv[2] === "gather"
if (isGatherMode) {
    opts.gatherMode = "../lh-artifacts"
} else {
    opts.auditMode = "../lh-artifacts"
}

// Usage:
launchChromeAndRunLighthouse('https://example.com', opts).then(runnerResult => {
    // const reportStr = JSON.stringify(runnerResult.report)
    // runnerResult.report = JSON.parse(runnerResult.report)
    // console.log(runnerResult.report)
    console.log(typeof runnerResult.report)
    const r = JSON.stringify(runnerResult.report)
    saveResults(runnerResult, { output: ["json", "html"] }).then(() => {
        console.log("done save, will wait 20s then exit")
        setTimeout(() => {
            console.log("Will exit")
            process.exit()
        }, 20 * 1000)
    })

    // const rep = results.report
    // console.log(rep.slice(0, 100))
    // const str = JSON.stringify(results)
    // console.log(Object.keys(results), str.slice(0, 1000))

    // Use results!
});
////---------------------


// const lighthouse = require("lighthouse")



// const prettier = require("prettier");
// const axios = require("axios")

// axios("https://cdnjs.cloudflare.com/ajax/libs/lodash.js/4.17.15/lodash.core.js").then(({ data }) => {
//     const res = prettier.format(data, { semi: false, parser: "babel" });
//     console.log(res)
// })



// const prettyBytes = require("pretty-bytes")

// let bytes = 400000
// let msg = "Size: " + prettyBytes(bytes)
// console.log(msg)

// setTimeout(() => {
//     console.log("waited 10s")
// }, 10000)


