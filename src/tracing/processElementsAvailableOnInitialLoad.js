import addElOrigin from "./addElOrigin"
import mapInnerHTMLAssignment from "./mapInnerHTMLAssignment"
import Origin from "../origin"

var initialHTMLHasBeenProcessed =false;
export function makeSureInitialHTMLHasBeenProcessed(){
    if (initialHTMLHasBeenProcessed) {return}
    processElementsAvailableOnInitialLoad()
}

window.makeSureInitialHTMLHasBeenProcessed = makeSureInitialHTMLHasBeenProcessed

export default function processElementsAvailableOnInitialLoad(){

    if (window.processElementsAvailableOnInitialLoadDisabled) {return}

    console.log("processElementsAvailableOnInitialLoad")

    var initialHTMLContainer = document.getElementById("fromjs-initial-html")
    var htmlFilename = "page.html"
    if (initialHTMLContainer !== null) {
        // would make sense to get rid of that HTML tag completely and just assign to the fromJSIniitalPageHTml variable directly
        window.fromJSInitialPageHtml = decodeURIComponent(nativeInnerHTMLDescriptor.get.call(initialHTMLContainer))
        htmlFilename =document.getElementById("fromjs-initial-html").getAttribute("html-filename")
    }

    var originalHtml = window.fromJSInitialPageHtml

    fromJSDynamicFiles[htmlFilename] = window.fromJSInitialPageHtml
    fromJSDynamicFiles[htmlFilename + ".dontprocess"] = window.fromJSInitialPageHtml

    var originalHtmlHasBodyTag = /<body.*>/.test(originalHtml)
    var bodyContentAndAfter, bodyContent;
    if (originalHtmlHasBodyTag) {
        // replace everything before body tag
        bodyContentAndAfter = originalHtml.substr(originalHtml.search(/<body.*>/))
        // remove body tag
        bodyContentAndAfter = bodyContentAndAfter.substr(originalHtml.match(/<body.*?>/)[0].length)
        // remove closing body tag
        bodyContent = bodyContentAndAfter.substr(0, bodyContentAndAfter.indexOf("</body>"))
    } else {
        bodyContentAndAfter = originalHtml
        bodyContent = originalHtml
    }

    originalHtml = {
        value: originalHtml,
        origin: new Origin({
            action: "Initial Page HTML",
            inputValues: [],
            value: originalHtml,
            isHTMLFileContent: {
                filename: htmlFilename
            }
        })
    }
    var headEtcRemovedCharCount = originalHtml.value.length -bodyContentAndAfter.length
    var bodyEndIndex = headEtcRemovedCharCount + bodyContent.length
    mapInnerHTMLAssignment(document.body, originalHtml, "Initial Body HTML",  -headEtcRemovedCharCount, bodyEndIndex)

    initialHTMLHasBeenProcessed = true;
}

export function disableProcessHTMLOnInitialLoad(){
    // used for tests
    // put on window because karma seems to load different bundles
    // for different specs
    // will see if I end up find a proper modular solution
    window.processElementsAvailableOnInitialLoadDisabled = true;
}
