// two chars in a string literal can map to one char in the actual string value (i.e. if there's an escape sequence like
// "\n" that becomes one new line character)
export function adjustColumnForEscapeSequences(str, columnNumber) {
  for (var i = 0; i < columnNumber; i++) {
    if (str[i] === "\\") {
      var charAfter = str[i + 1];
      if (charAfter === "u") {
        const escapeSequence = str.slice(i, i + 6);
        columnNumber += escapeSequence.length - 1;
      } else {
        columnNumber++;
      }
    }
  }
  return columnNumber;
}
