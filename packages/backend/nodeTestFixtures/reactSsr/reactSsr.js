const React = require("react")
const ReactDOMServer = require("react-dom/server")


// Use Babel repl to compile and paste below
/*
<div>{arr.map(num => {
    return <span className="sth" style={{background: "red"}}>{num}</span>
  })}</div>
*/

const arr = Array.from(new Array(10000)).map((v, i) => { return i.toString() });

const html = ReactDOMServer.renderToString(
    React.createElement("div", null, arr.map(function (num) {
        return /*#__PURE__*/React.createElement("span", {
            className: "sth",
            style: {
                background: "red"
            }
        }, num);
    }))
);
console.log(html)
console.log("Inspect:" + __fromJSGetTrackingIndex(html))
__fromJSWaitForSendLogsAndExitNodeProcess()