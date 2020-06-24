import HtmlToOperationLogMapping from "./HtmlToOperationLogMapping";
import { consoleLog } from "./logging";

function tagTypeHasClosingTag(tagName) {
  return document.createElement(tagName).outerHTML.indexOf("></") !== -1;
}

function getNodeHtmlParts(node: Node) {
  const origin = node["__elOrigin"] || {};
  let parts = [];
  if (node.nodeType === Node.ELEMENT_NODE) {
    var el = node as HTMLElement;
    var innerHTML = el.innerHTML;
    // var { openingTag, closingTag } = getOpeningAndClosingTags(
    //   el.outerHTML,
    //   el.innerHTML
    // );

    const tagName = el.tagName.toLowerCase();

    parts.push(["<" + tagName, origin.openingTagStart]);

    for (var i = 0; i < el.attributes.length; i++) {
      const attr = el.attributes[i];
      parts.push([" " + attr.name, origin["attribute_" + attr.name + "_name"]]);
      parts.push([
        '="' + attr.textContent + '"',
        origin["attribute_" + attr.name + "_value"]
      ]);
    }

    parts.push([">", origin.openingTagEnd]);

    el.childNodes.forEach(child => {
      parts = [...parts, ...getNodeHtmlParts(child)];
    });

    if (tagTypeHasClosingTag(tagName)) {
      parts.push(["</" + tagName + ">", origin.closingTag]);
    }
  } else if (node.nodeType === Node.TEXT_NODE) {
    parts.push([node.textContent, origin.textValue]);
  } else if (node.nodeType === Node.COMMENT_NODE) {
    parts.push(["<!--", origin.commentStart]);
    parts.push([node.textContent, origin.textValue]);
    parts.push(["-->", origin.commentEnd]);
  } else {
    consoleLog("TODO unknown node type");
  }
  return parts;
}

export default function getHtmlNodeOperationLogMapping(node) {
  const htmlParts = getNodeHtmlParts(node);
  const outerHTML = htmlParts.map(p => p[0]).join("");

  if (node["outerHTML"] !== undefined && outerHTML !== node["outerHTML"]) {
    console.warn("OuterHTML is missing something for mapping");
  }

  return new HtmlToOperationLogMapping(htmlParts);
}
