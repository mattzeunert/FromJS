import addElOrigin from "./addElOrigin"
import mapInnerHTMLAssignment from "./mapInnerHTMLAssignment"
import Origin from "../origin"

var initialHTMLHasBeenProcessed =false;
export function makeSureInitialHTMLHasBeenProcessed(){
    if (initialHTMLHasBeenProcessed) {return}
    processElementsAvailableOnInitialLoad()
}

export default function processElementsAvailableOnInitialLoad(){
    if (window.processElementsAvailableOnInitialLoadDisabled) {return}

    var initialHTMLContainer = document.getElementById("fromjs-initial-html")
    if (initialHTMLContainer === null) {
        return
    }

    var originalHtml = decodeURIComponent(nativeInnerHTMLDescriptor.get.call(initialHTMLContainer))

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
}

export function disableProcessHTMLOnInitialLoad(){
    // used for tests
    // put on window because karma seems to load different bundles
    // for different specs
    // will see if I end up find a proper modular solution
    window.processElementsAvailableOnInitialLoadDisabled = true;
}
