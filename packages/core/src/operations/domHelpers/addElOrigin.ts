export default function addElOrigin(el, what, origin) {
  const {
    action,
    inputValues,
    value,
    inputValuesCharacterIndex,
    extraCharsAdded,
    offsetAtCharIndex,
    error,
    child,
    children
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
    const tv = inputValues[0][1];
    if (!tv) {
      console.error("no tv", inputValues, inputValues[0], inputValues[0][1]);
    }
    el.__elOrigin[what] = {
      action,
      trackingValue: tv,
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
  const origin = {
    inputValues: [[null, tagNameTrackingValue]],
    value: el.tagName,
    action
  };
  addElOrigin(el, "openingTagStart", origin);
  addElOrigin(el, "openingTagEnd", origin);
  addElOrigin(el, "closingTag", origin);
}
