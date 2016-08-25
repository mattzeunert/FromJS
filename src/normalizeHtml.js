var div = document.createElement("div");
export default function normalizeHtml(str, tagName){
    if (tagName !== "SCRIPT") {
        // convert stuff like & to &amp;
        nativeInnerHTMLDescriptor.set.call(div, str);
        str = nativeInnerHTMLDescriptor.get.call(div);
    }
    if (tagName === "NOSCRIPT") {
        str = str.replace(/</g, "&lt;")
        str = str.replace(/>/g, "&gt;")
    }
    return str;
}

var attrDiv = document.createElement("div")
export function normalizeHtmlAttribute(str){
    nativeSetAttribute.call(attrDiv, "sth", str)
    var outerHTML = attrDiv.outerHTML;
    var start = "<div sth='"
    var end = "'></div>"
    return outerHTML.slice(start.length, -end.length)
}
