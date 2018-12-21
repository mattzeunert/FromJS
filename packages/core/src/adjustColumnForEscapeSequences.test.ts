import { adjustColumnForEscapeSequences } from "./adjustColumnForEscapeSequences";

describe("adjustColumnForEscapeSequences", function() {
  it("Knows that a new line character in a string is represented by two characters (\n) in code", function() {
    var code = "Hello\\nworld!";
    var str = "Hello\nworld!";
    var wIndex = str.indexOf("w");
    var adjustedIndex = adjustColumnForEscapeSequences(code, wIndex);
    expect(code[adjustedIndex]).toBe("w");
  });
  it("Knows that a tab character in a string is represented by two characters (\t) in code", function() {
    var code = "Hello\\tworld!";
    var str = "Hello\tworld!";
    var wIndex = str.indexOf("w");
    var adjustedIndex = adjustColumnForEscapeSequences(code, wIndex);
    expect(code[adjustedIndex]).toBe("w");
  });
  it("Treats an escaped double quote sign in code as two characters", function() {
    var code = `\\"Hello`;
    var str = `"Hello`;
    var index = str.indexOf("H");
    var adjustedIndex = adjustColumnForEscapeSequences(code, index);
    expect(code[adjustedIndex]).toBe("H");
  });
  it("Treats an unescaped double quote sign in code as two characters", function() {
    var code = `"Hello`;
    var str = `"Hello`;
    var index = str.indexOf("H");
    var adjustedIndex = adjustColumnForEscapeSequences(code, index);
    expect(code[adjustedIndex]).toBe("H");
  });
  it("Treats an escaped single quote sign in code as two characters", function() {
    var code = `\\'Hello`;
    var str = `'Hello`;
    var index = str.indexOf("H");
    var adjustedIndex = adjustColumnForEscapeSequences(code, index);
    expect(code[adjustedIndex]).toBe("H");
  });
  it("Treats an unescaped single quote sign in code as two characters", function() {
    var code = `'Hello`;
    var str = `'Hello`;
    var index = str.indexOf("H");
    var adjustedIndex = adjustColumnForEscapeSequences(code, index);
    expect(code[adjustedIndex]).toBe("H");
  });
});
