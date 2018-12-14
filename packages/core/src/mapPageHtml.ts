import mapInnerHTMLAssignment from "./operations/domHelpers/mapInnerHTMLAssignment";

export function mapPageHtml(doc, pageHtml, pageHtmlTrackingValue, actionType) {
  var headEtcRemovedCharCount = pageHtml.indexOf("<body");
  headEtcRemovedCharCount +=
    pageHtml.slice(headEtcRemovedCharCount).indexOf(">") + 1;
  if (headEtcRemovedCharCount == -1) {
    headEtcRemovedCharCount = 0;
  }
  var bodyEndIndex = pageHtml.indexOf("</body");
  if (bodyEndIndex === -1) {
    bodyEndIndex = pageHtml.length;
  }

  mapInnerHTMLAssignment(
    doc.body,
    [pageHtml, pageHtmlTrackingValue],
    actionType,
    -headEtcRemovedCharCount,
    bodyEndIndex
  );
}
