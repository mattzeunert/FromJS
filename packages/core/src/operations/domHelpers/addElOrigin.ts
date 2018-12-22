import { consoleLog, consoleWarn } from "../../helperFunctions/logging";
import { safelyReadProperty } from "../../util";

export default function addElOrigin(el, what, origin) {
  const {
    action,
    value,
    inputValuesCharacterIndex,
    extraCharsAdded,
    offsetAtCharIndex,
    error,
    child,
    children,
    trackingValue // aka inputValue
  } = origin;

  if (!el) {
    debugger;
  }

  if (!el.__elOrigin) {
    el.__elOrigin = {};
  }

  if (what === "replaceContents") {
    el.__elOrigin.contents = children;
  } else if (what === "appendChild") {
    if (!el.__elOrigin.contents) {
      el.__elOrigin.contents = [];
    }
    el.__elOrigin.contents.push(child);
  } else if (what === "prependChild") {
    if (!el.__elOrigin.contents) {
      el.__elOrigin.contents = [];
    }

    el.__elOrigin.contents.push(child);
  } else if (what === "prependChildren") {
    children.forEach(child => {
      addElOrigin(el, "prependChild", { child });
    });
  } else {
    if (!("trackingValue" in origin)) {
      consoleLog("no tracking value in addelorigin");
    }
    el.__elOrigin[what] = {
      action,
      trackingValue,
      inputValuesCharacterIndex: inputValuesCharacterIndex || [0],
      extraCharsAdded: extraCharsAdded || 0,
      offsetAtCharIndex
    };
  }
}

export function addOriginInfoToCreatedElement(
  el,
  tagNameTrackingValue,
  action
) {
  if (typeof tagNameTrackingValue !== "number") {
    debugger;
    throw Error("tag name tracking value should be number");
  }
  const origin = {
    trackingValue: tagNameTrackingValue,
    value: el.tagName,
    action
  };
  addElOrigin(el, "openingTagStart", origin);
  addElOrigin(el, "openingTagEnd", origin);
  addElOrigin(el, "closingTag", origin);
}

export function addElAttributeNameOrigin(el, attrName, origin) {
  addElOrigin(el, "attribute_" + attrName + "_name", origin);
}
export function addElAttributeValueOrigin(el, attrName, origin) {
  addElOrigin(el, "attribute_" + attrName + "_value", origin);
}

export function getElAttributeNameOrigin(el, attrName) {
  return el.__elOrigin && el.__elOrigin["attribute_" + attrName + "_name"];
}
export function getElAttributeValueOrigin(el, attrName) {
  return el.__elOrigin && el.__elOrigin["attribute_" + attrName + "_value"];
}

export function processClonedNode(
  cloneResult,
  sourceNode,
  opts: { isDeep: boolean }
) {
  const { isDeep } = opts;

  const nodeType = safelyReadProperty(sourceNode, "nodeType");

  if (nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
    for (var i = 0; i < sourceNode.childNodes.length; i++) {
      processClonedNode(
        cloneResult.childNodes[i],
        sourceNode.childNodes[i],
        opts
      );
    }
  } else if (nodeType === Node.ELEMENT_NODE) {
    ["openingTagStart", "openingTagEnd", "closingTag"].forEach(originName => {
      if (sourceNode.__elOrigin && sourceNode.__elOrigin[originName]) {
        addElOrigin(cloneResult, originName, sourceNode.__elOrigin[originName]);
      } else {
        console.warn("clone element but no __elOrigin");
      }
    });

    for (var i = 0; i < sourceNode.attributes.length; i++) {
      const attr = sourceNode.attributes[i];
      const nameOrigin = getElAttributeNameOrigin(sourceNode, attr.name);
      const valueOrigin = getElAttributeValueOrigin(sourceNode, attr.name);
      if (nameOrigin) {
        addElAttributeNameOrigin(cloneResult, attr.name, nameOrigin);
      }
      if (valueOrigin) {
        addElAttributeValueOrigin(cloneResult, attr.name, valueOrigin);
      }
    }
  } else if (nodeType === Node.TEXT_NODE) {
    if (sourceNode.__elOrigin) {
      addElOrigin(cloneResult, "textValue", sourceNode.__elOrigin.textValue);
    }
  } else if (nodeType === Node.COMMENT_NODE) {
    if (sourceNode.__elOrigin) {
      addElOrigin(cloneResult, "textValue", sourceNode.__elOrigin.textValue);
    }
  } else {
    consoleWarn("unhandled cloneNode");
  }

  if (nodeType === Node.ELEMENT_NODE) {
    if (isDeep) {
      sourceNode.childNodes.forEach((childNode, i) => {
        processClonedNode(cloneResult.childNodes[i], childNode, opts);
      });
    }
  }
}
