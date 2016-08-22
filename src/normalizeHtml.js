var div = document.createElement("div");
export default function normalizeHtml(str){
    // convert stuff like & to &amp;
    nativeInnerHTMLDescriptor.set.call(div, str);
    return nativeInnerHTMLDescriptor.get.call(div);
}