export function regExpContainsNestedGroup(re) {
  let str = re.toString();
  str = str.replace(/\\\(/g, "").replace(/\\\)/g, ""); // remove escaped parens

  let isInGroup = false;
  for (var i = 0; i < str.length; i++) {
    const char = str[i];
    if (char === "(") {
      if (isInGroup) {
        return true;
      } else {
        isInGroup = true;
      }
    } else if (char === ")") {
      isInGroup = false;
    }
  }
  return false;
}

export function countGroupsInRegExp(re) {
  // http://stackoverflow.com/questions/16046620/regex-to-count-the-number-of-capturing-groups-in-a-regex
  return new RegExp(re.toString() + "|").exec("")!.length;
}
