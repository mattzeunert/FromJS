import addElOrigin from "./addElOrigin"
import mapInnerHTMLAssignment from "./mapInnerHTMLAssignment"

export default function processElementsAvailableOnInitialLoad(){
    var originalHtml = decodeURIComponent(document.getElementById("fromjs-initial-html").innerHTML)

    // replace everythign before body tag
    originalHtml = originalHtml.substr(originalHtml.search(/\<body.*\>/))
    // remove body tag
    originalHtml = originalHtml.substr(originalHtml.match(/\<body.*\>/)[0].length)

    mapInnerHTMLAssignment(document.body, originalHtml, "initial html")


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
