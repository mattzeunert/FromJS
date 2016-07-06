import addElOrigin from "./addElOrigin"
import mapInnerHTMLAssignment from "./mapInnerHTMLAssignment"
import Origin from "../origin"

var initialHTMLHasBeenProcessed =false;
export function makeSureInitialHTMLHasBeenProcessed(){
    if (initialHTMLHasBeenProcessed) {return}
    processElementsAvailableOnInitialLoad()
}

export default function processElementsAvailableOnInitialLoad(){
    var originalHtml = decodeURIComponent(nativeInnerHTMLDescriptor.get.call(document.getElementById("fromjs-initial-html")))

    // replace everythign before body tag
    var bodyContentAndAfter = originalHtml.substr(originalHtml.search(/\<body.*\>/))
    // remove body tag
    bodyContentAndAfter = bodyContentAndAfter.substr(originalHtml.match(/\<body.*\>/)[0].length)
    // remove closing body tag
    var bodyContent = bodyContentAndAfter.substr(0, bodyContentAndAfter.indexOf("</body>"))

    originalHtml = {
        value: originalHtml,
        origin: new Origin({
            action: "Initial Page HTML",
            inputValues: [],
            value: originalHtml,
            isHTMLFileContent: {
                filename: document.getElementById("fromjs-initial-html").getAttribute("html-filename")
            }
        })
    }
    mapInnerHTMLAssignment(document.body, originalHtml, "Initial Body HTML",  bodyContentAndAfter.length - originalHtml.value.length)

    initialHTMLHasBeenProcessed = true;
    //processNode(document.body, originalHtml)
}
//
// function processNode(el, originalHtml){
//     var isTextNode = el.innerHTML === undefined
//     if (isTextNode) {
//         addElOrigin(el, "textValue", {
//             "action": "initial html",
//             inputValues: [stringTrace(originalHtml)],
//             value: el.textContent,
//             inputValuesCharacterIndex: [0]
//         })
//
//     } else {
//         var children = Array.prototype.slice.apply(el.childNodes, [])
//
//         addElOrigin(el, "replaceContents", {
//             action: "initial html",
//             children: children
//         })
//
//         addElOrigin(el, "tagName", {
//             action: "initial html",
//             value: el.tagName,
//             inputValues: [stringTrace(originalHtml)],
//             inputValuesCharacterIndex: [0]
//         })
//
//         for (var i = 0;i<el.attributes.length;i++) {
//             var attr = el.attributes[i]
//             addElOrigin(el, "attribute_" + attr.name, {
//                 action: "initial html",
//                 value: " " + attr.name + "='" + attr.textContent + "'",
//                 inputValues: [stringTrace(originalHtml)],
//                 inputValuesCharacterIndex: [0]
//             })
//         }
//
//
//         children.forEach(function(child){
//             processNode(child, originalHtml)
//         })
//     }
// }
