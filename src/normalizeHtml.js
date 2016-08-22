var div = document.createElement("div");
export default function normalizeHtml(str){
    // convert stuff like & to &amp;
    nativeInnerHTMLDescriptor.set.call(div, str);
    return nativeInnerHTMLDescriptor.get.call(div);
}

var attrDiv = document.createElement("div")
export function normalizeHtmlAttribute(str){
    nativeSetAttribute.call(attrDiv, "sth", str)
    var outerHTML = attrDiv.outerHTML;
    var start = "<div sth='"
    var end = "'></div>"
    return outerHTML.slice(start.length, -end.length)
}