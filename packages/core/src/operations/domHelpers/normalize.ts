let normalizeHtml, normalizeHtmlAttribute;

if (typeof document !== "undefined") {
  var div = document.createElement("div");
  normalizeHtml = function normalizeHtml(str, tagName) {
    if (tagName !== "SCRIPT" && tagName !== "NOSCRIPT") {
      // convert stuff like & to &amp;
      div.innerHTML = str;
      str = div.innerHTML;
    }
    if (tagName === "NOSCRIPT") {
      str = str.replace(/\&/g, "&amp;");
      str = str.replace(/</g, "&lt;");
      str = str.replace(/>/g, "&gt;");
    }
    return str;
  };

  var attrDiv = document.createElement("div");
  normalizeHtmlAttribute = function normalizeHtmlAttribute(str) {
    attrDiv.setAttribute("sth", str);
    var outerHTML = attrDiv.outerHTML;
    var start = "<div sth='";
    var end = "'></div>";
    return outerHTML.slice(start.length, -end.length);
  };
}

export { normalizeHtml, normalizeHtmlAttribute };
