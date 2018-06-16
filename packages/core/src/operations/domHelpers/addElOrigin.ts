export default function addElOrigin(el, what, trackingValue) {
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
  } = trackingValue;

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
    el.__elOrigin[what] = {
      action,
      trackingValue: inputValues[0][1],
      inputValuesCharacterIndex,
      extraCharsAdded,
      offsetAtCharIndex
    };
  }
}
