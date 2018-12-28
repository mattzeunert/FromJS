import { testHelpers } from "@fromjs/core";
const { instrumentAndRun, server } = testHelpers;
import { traverse as _traverse, TraversalStep } from "./traverse";

const traverse = async function(firstStep, options = {}) {
  options = Object.assign({ optimistic: false }, options);
  const steps: TraversalStep[] = (await _traverse.call(
    null,
    firstStep,
    [],
    server,
    options
  )) as any;
  return steps;
};

function getStepTypeList(traversalResult) {
  return traversalResult.map(t => t.operationLog.operation);
}

test("Can track concatenation of 'a' and 'b'", async () => {
  const { normal, tracking, code } = await instrumentAndRun("return 'a' + 'b'");
  expect(normal).toBe("ab");
  var t1 = await traverse({ operationLog: tracking, charIndex: 0 });
  var t2 = await traverse({ operationLog: tracking, charIndex: 1 });
  var t1LastStep = t1[t1.length - 1];
  var t2LastStep = t2[t2.length - 1];
  expect(t1LastStep.operationLog.operation).toBe("stringLiteral");
  expect(t1LastStep.operationLog.result.primitive).toBe("a");
  expect(t2LastStep.operationLog.operation).toBe("stringLiteral");
  expect(t2LastStep.operationLog.result.primitive).toBe("b");
});

test("Can track concatenation of 'a' and 'b' in an add function", async () => {
  const { normal, tracking, code } = await instrumentAndRun(`
    function add(arg1, arg2) {
      return arg1 + arg2
    }
    return add('a', 'b')
  `);
  expect(normal).toBe("ab");
  var t1 = await traverse({ operationLog: tracking, charIndex: 0 });
  var t2 = await traverse({ operationLog: tracking, charIndex: 1 });
  var t1LastStep = t1[t1.length - 1];
  var t2LastStep = t2[t2.length - 1];
  expect(t1LastStep.operationLog.operation).toBe("stringLiteral");
  expect(t1LastStep.operationLog.result.primitive).toBe("a");
  expect(t2LastStep.operationLog.operation).toBe("stringLiteral");
  expect(t2LastStep.operationLog.result.primitive).toBe("b");

  expect(getStepTypeList(t1)).toEqual([
    "callExpression", // add()
    "returnStatement", // return
    "binaryExpression", // +
    "identifier", // arg1
    "stringLiteral" // "a"
  ]);
});

describe("Assignment Expressions", () => {
  test("Can track values through object assignments", async () => {
    const { normal, tracking, code } = await instrumentAndRun(`
      var obj = {}
      obj.a = "x"
      return obj.a
    `);
    var t = await traverse({ operationLog: tracking, charIndex: 0 });

    expect(getStepTypeList(t)).toEqual([
      "memberExpression",
      "assignmentExpression",
      "stringLiteral"
    ]);
  });
  test("Can track used return values of assignment expressions (to variables)", async () => {
    const { normal, tracking, code } = await instrumentAndRun(`
      var str = "a"
      debugger
      return (str += "b")
    `);

    expect(normal).toBe("ab");
    var t1 = await traverse({ operationLog: tracking, charIndex: 0 });
    const t1LastStep = t1[t1.length - 1];
    expect(t1LastStep.operationLog.operation).toBe("stringLiteral");
    expect(t1LastStep.operationLog.result.primitive).toBe("a");

    var t2 = await traverse({ operationLog: tracking, charIndex: 1 });
    const t2LastStep = t2[t2.length - 1];
    expect(t2LastStep.operationLog.operation).toBe("stringLiteral");
    expect(t2LastStep.operationLog.result.primitive).toBe("b");
  });
  test("Can traverse += operation for object assignments", async () => {
    const { normal, tracking, code } = await instrumentAndRun(`
    var obj = { a: "a" }
    obj.a += "b"
    return obj.a
  `);

    expect(normal).toBe("ab");
    var t1 = await traverse({ operationLog: tracking, charIndex: 0 });
    const t1LastStep = t1[t1.length - 1];
    expect(t1LastStep.operationLog.operation).toBe("stringLiteral");
    expect(t1LastStep.operationLog.result.primitive).toBe("a");

    var t2 = await traverse({ operationLog: tracking, charIndex: 1 });
    const t2LastStep = t2[t2.length - 1];
    expect(t2LastStep.operationLog.operation).toBe("stringLiteral");
    expect(t2LastStep.operationLog.result.primitive).toBe("b");
  });
  test("Can traverse results of assignment expression", async () => {
    const { normal, tracking, code } = await instrumentAndRun(`
      var v
      return v = "a"
    `);
    expect(normal).toBe("a");
    var t1 = await traverse({ operationLog: tracking, charIndex: 0 });
    const t1LastStep = t1[t1.length - 1];
    expect(t1LastStep.operationLog.operation).toBe("stringLiteral");
    expect(t1LastStep.operationLog.result.primitive).toBe("a");
    expect(t1LastStep.charIndex).toBe(0);
  });
  test("Can traverse results of assignment expression if assigning to an object", async () => {
    const { normal, tracking, code } = await instrumentAndRun(`
      var obj = {}
      return obj.a = "a"
    `);
    expect(normal).toBe("a");
    var t1 = await traverse({ operationLog: tracking, charIndex: 0 });
    const t1LastStep = t1[t1.length - 1];
    expect(t1LastStep.operationLog.operation).toBe("stringLiteral");
    expect(t1LastStep.operationLog.result.primitive).toBe("a");
    expect(t1LastStep.charIndex).toBe(0);
  });
});

test("Can track values through object literals", async () => {
  const { normal, tracking, code } = await instrumentAndRun(`
    var obj = {a: "x"}
    return obj.a
  `);

  var t = await traverse({ operationLog: tracking, charIndex: 0 });

  expect(getStepTypeList(t)).toEqual([
    "memberExpression",
    "objectProperty",
    "stringLiteral"
  ]);
});

test("Can traverse String.prototype.slice", async () => {
  const { normal, tracking, code } = await instrumentAndRun(`
      var str = "abcde"
      str = str.slice(2,4)
      return str
    `);

  expect(normal).toBe("cd");
  var t = await traverse({ operationLog: tracking, charIndex: 0 });
  var lastStep = t[t.length - 1];

  expect(lastStep.charIndex).toBe(2);

  expect(getStepTypeList(t)).toEqual([
    "identifier",
    "assignmentExpression",
    "callExpression",
    "identifier",
    "stringLiteral"
  ]);
});

describe("Array.prototype.splice", () => {
  test("Can traverse Array.prototype.splice return value", async () => {
    const { normal, tracking, code } = await instrumentAndRun(`
        var arr = [1,2,3,4]
        return arr.splice(1,2).join("")
      `);

    expect(normal).toBe("23");
    let step = await traverseAndGetLastStep(tracking, 0);
    expect(step.operationLog.operation).toBe("numericLiteral");
    step = await traverseAndGetLastStep(tracking, 1);
    expect(step.operationLog.operation).toBe("numericLiteral");
  });
});

describe("Object.entries", () => {
  test("Return value of Object.entries is tracked", async () => {
    const { normal, tracking, code } = await instrumentAndRun(`
        const entries = Object.entries({a:"A",b:"B"})
        return entries[0][0] + entries[0][1] + entries[1][0] + entries[1][1]
      `);

    expect(normal).toBe("aAbB");
    let step = await traverseAndGetLastStep(tracking, 0);
    expect(step.operationLog.operation).toBe("stringLiteral");
    expect(step.charIndex).toBe(0);
    expect(step.operationLog.result.primitive).toBe("a");
    step = await traverseAndGetLastStep(tracking, 3);
    expect(step.operationLog.operation).toBe("stringLiteral");
    expect(step.charIndex).toBe(0);
    expect(step.operationLog.result.primitive).toBe("B");
  });
});

test("Traverse str[n] character access", async () => {
  const { normal, tracking, code } = await instrumentAndRun(`
  var str = "abcde"
  return str[2]
`);

  expect(normal).toBe("c");
  var t = await traverse({ operationLog: tracking, charIndex: 0 });
  var lastStep = t[t.length - 1];

  expect(lastStep.charIndex).toBe(2);
  expect(lastStep.operationLog.operation).toBe("stringLiteral");
});

test("Traversing += assignment expressions", async () => {
  const { normal, tracking, code } = await instrumentAndRun(`
    var a = "a"
    a += "b"
    return a
  `);
  expect(normal).toBe("ab");
  var t = await traverse({ operationLog: tracking, charIndex: 0 });
  var lastStep = t[t.length - 1];

  expect(lastStep.operationLog.result.primitive).toBe("a");
});

test("Can track values through conditional expression", async () => {
  const { normal, tracking, code } = await instrumentAndRun(`
    var b = false ? "a" : "b"
    return b
  `);
  expect(normal).toBe("b");
  var t = await traverse({ operationLog: tracking, charIndex: 0 });

  expect(getStepTypeList(t)).toEqual([
    "identifier",
    "conditionalExpression",
    "stringLiteral"
  ]);
});

describe("Can traverse string replacement calls", () => {
  test("works for simple replacements using regexes", async () => {
    const { normal, tracking, code } = await instrumentAndRun(`
    var ret = "ababab".replace(/b/g, "cc") // => "accaccacc"
    return ret
  `);
    expect(normal).toBe("accaccacc");
    var t = await traverse({ operationLog: tracking, charIndex: 5 });

    expect(getStepTypeList(t)).toEqual([
      "identifier",
      "callExpression",
      "stringLiteral"
    ]);

    const lastStep = t[t.length - 1];
    expect(lastStep.charIndex).toBe(1);
    expect(lastStep.operationLog.result.primitive).toBe("cc");
  });

  test("works for simple replacements using strings", async () => {
    const { normal, tracking, code } = await instrumentAndRun(`
    var ret = "Hello {{name}}!".replace("{{name}}", "Susan")
    return ret
  `);
    expect(normal).toBe("Hello Susan!");
    var t1 = await traverse({ operationLog: tracking, charIndex: 2 });
    const t1LastStep = t1[t1.length - 1];
    expect(t1LastStep.charIndex).toBe(2);

    var t2 = await traverse({ operationLog: tracking, charIndex: 6 });
    const t2LastStep = t2[t2.length - 1];
    expect(t2LastStep.charIndex).toBe(0);
  });

  test("works for non-match locations behind a match", async () => {
    const { normal, tracking, code } = await instrumentAndRun(`
    var ret = "abc".replace("a", "12345")
    return ret
  `);
    expect(normal).toBe("12345bc");
    var t1 = await traverse({ operationLog: tracking, charIndex: 6 }); // "c"
    const t1LastStep = t1[t1.length - 1];
    expect(t1LastStep.charIndex).toBe(2);
  });

  test("Works for $n substitutions", async () => {
    const { normal, tracking, code } = await instrumentAndRun(`
    var ret = "abbbxy".replace(/(b+)/, "$1<>")
    return ret
  `);
    expect(normal).toBe("abbb<>xy");
    var t1 = await traverse({
      operationLog: tracking,
      charIndex: "abbb<>xy".indexOf("y")
    });
    const t1LastStep = t1[t1.length - 1];
    expect(t1LastStep.charIndex).toBe("abbbxy".indexOf("y"));
  });
});

describe("JSON.parse", () => {
  it("Can traverse JSON.parse", async () => {
    const { normal, tracking, code } = await instrumentAndRun(`
        var json = '{"a": {"b": 5}}';
        var obj = JSON.parse(json);
        return obj.a.b
      `);

    var t = await traverse({ operationLog: tracking, charIndex: 0 });
    var lastStep = t[t.length - 1];

    expect(lastStep.operationLog.operation).toBe("stringLiteral");
    expect(lastStep.charIndex).toBe(12);
  });

  it("Can traverse JSON.parse when using keys", async () => {
    const { normal, tracking, code } = await instrumentAndRun(`

        var json = '{"a":"abc", "b": "bcd"}';
        var obj = JSON.parse(json);
        return Object.keys(obj)[1]
      `);

    var t = await traverse({ operationLog: tracking, charIndex: 0 });
    var lastStep = t[t.length - 1];

    expect(normal).toBe("b");
    expect(lastStep.operationLog.operation).toBe("stringLiteral");
    expect(lastStep.charIndex).toBe(13);
  });

  it("Can traverse JSON.parse with JSON containting arrays", async () => {
    const { normal, tracking, code } = await instrumentAndRun(`
        var json = '{"a": {"b": ["one", "two"]}}';
        var obj = JSON.parse(json);
        return obj.a.b[1]
      `);

    var t = await traverse({ operationLog: tracking, charIndex: 0 });
    var lastStep = t[t.length - 1];

    expect(normal).toBe("two");
    expect(lastStep.operationLog.operation).toBe("stringLiteral");
    expect(lastStep.charIndex).toBe(21);
  });

  it("Returns the correct character index for longer strings", async () => {
    const text = `{"a": {"b": "Hello"}}`;
    const { normal, tracking, code } = await instrumentAndRun(`
        var json = '${text}';
        var obj = JSON.parse(json);
        return obj.a.b
      `);

    var t = await traverse({
      operationLog: tracking,
      charIndex: "Hello".indexOf("l")
    });
    var lastStep = t[t.length - 1];

    expect(lastStep.operationLog.operation).toBe("stringLiteral");
    expect(lastStep.charIndex).toBe(text.indexOf("l"));
  });

  it("Can find property names in the JSON", async () => {
    const { normal, tracking, code } = await instrumentAndRun(`
        var obj = JSON.parse('{"a": {"b": 5}}');
        let ret
        for (var name in obj) {
          ret = name
        }
        return ret
      `);

    expect(normal).toBe("a");

    var t = await traverse({ operationLog: tracking, charIndex: 0 });
    var lastStep = t[t.length - 1];

    expect(lastStep.operationLog.operation).toBe("stringLiteral");
    expect(lastStep.charIndex).toBe(2);
    expect(getStepTypeList(t)).toContain("jsonParseResult");
  });

  it("Can handle character mapping if the JSON contains an escaped line break", async () => {
    const { normal, tracking, code } = await instrumentAndRun(`
        var json = '{"a": "\\\\nHello"}';
        var obj = JSON.parse(json);
        return obj.a + "|" + json
      `);

    const json = normal.split("|")[1];

    var t = await traverse({
      operationLog: tracking,
      charIndex: normal.indexOf("l")
    });
    var lastStep = t[t.length - 1];

    expect(lastStep.operationLog.operation).toBe("stringLiteral");
    expect(lastStep.charIndex).toBe(json.indexOf("l"));
  });

  it("Can handle character mapping if the JSON contains an unicode escape sequence ", async () => {
    const { normal, tracking, code } = await instrumentAndRun(`
        var json = '{"a": "\\\\u003cHello"}';
        var obj = JSON.parse(json);
        return obj.a + "|" + json
      `);

    const json = normal.split("|")[1];

    var t = await traverse({
      operationLog: tracking,
      charIndex: normal.indexOf("l")
    });
    var lastStep = t[t.length - 1];

    expect(lastStep.operationLog.operation).toBe("stringLiteral");
    expect(lastStep.charIndex).toBe(json.indexOf("l"));
  });

  it("Can handle JSON that just contains a string", async () => {
    const { normal, tracking, code } = await instrumentAndRun(`
        var json = '"abc"';
        var str = JSON.parse(json);
        return str
      `);

    var t = await traverse({
      operationLog: tracking,
      charIndex: normal.indexOf("b")
    });
    var lastStep = t[t.length - 1];

    expect(lastStep.operationLog.operation).toBe("stringLiteral");
    expect(lastStep.charIndex).toBe('"abc"'.indexOf("b"));
  });

  it("Can handle JSON that just contains a number", async () => {
    const { normal, tracking, code } = await instrumentAndRun(`
        var json = '5';
        var str = JSON.parse(json);
        return str
      `);
    expect(normal).toBe(5);

    var t = await traverse({
      operationLog: tracking,
      charIndex: 0
    });
    var lastStep = t[t.length - 1];

    expect(lastStep.operationLog.operation).toBe("stringLiteral");
  });
});

describe("JSON.stringify", () => {
  it("Can traverse a JSON.stringify result", async () => {
    const { normal, tracking, code } = await instrumentAndRun(`
        var obj = {greeting: "Hello ", name: {first: "w", last: "orld"}}
        var str = JSON.stringify(obj, null, 4);
        return str
      `);

    var lastStep = await traverseAndGetLastStep(
      tracking,
      normal.indexOf("Hello")
    );
    expect(lastStep.operationLog.operation).toBe("stringLiteral");
    expect(lastStep.charIndex).toBe(0);
    expect(lastStep.operationLog.result.primitive).toBe("Hello ");

    var lastStep = await traverseAndGetLastStep(
      tracking,
      normal.indexOf("orld")
    );
    expect(lastStep.charIndex).toBe(0);
    expect(lastStep.operationLog.result.primitive).toBe("orld");

    var lastStep = await traverseAndGetLastStep(
      tracking,
      normal.indexOf("first")
    );
    expect(lastStep.charIndex).toBe(0);
    expect(lastStep.operationLog.result.primitive).toBe("first");
  });

  it("Can traverse JSON.stringify result that's not prettified", async () => {
    const { normal, tracking, code } = await instrumentAndRun(`
        var obj = {greeting: "Hello ", name: {first: "w", last: "orld"}}
        var str = JSON.stringify(obj);
        return str
      `);

    var lastStep = await traverseAndGetLastStep(
      tracking,
      normal.indexOf("orld") + 2
    );
    expect(lastStep.operationLog.operation).toBe("stringLiteral");
    expect(lastStep.charIndex).toBe(2);
    expect(lastStep.operationLog.result.primitive).toBe("orld");
  });

  it("Can traverse JSON.stringify correctly when looking at keys", async () => {
    const { normal, tracking, code } = await instrumentAndRun(`
        var obj = {greeting: "Hello "};
        var str = JSON.stringify(obj);
        return str
      `);

    var lastStep = await traverseAndGetLastStep(
      tracking,
      normal.indexOf("greeting")
    );
    expect(lastStep.operationLog.operation).toBe("stringLiteral");
    expect(lastStep.charIndex).toBe(0);
    expect(lastStep.operationLog.result.primitive).toBe("greeting");
  });

  it("Can traverse JSON.stringify result where keys are used multiple times", async () => {
    const { normal, tracking, code } = await instrumentAndRun(`
        var obj = {
          one: {hello: 123},
          two: {}
        }
        obj.two["he" + "llo"] = 456
        var str = JSON.stringify(obj);
        return str
      `);

    var lastStep = await traverseAndGetLastStep(
      tracking,
      normal.lastIndexOf("hello")
    );
    expect(lastStep.operationLog.operation).toBe("stringLiteral");
    expect(lastStep.charIndex).toBe(0);
    expect(lastStep.operationLog.result.primitive).toBe("he");
  });

  it("Can handle arrays", async () => {
    const { normal, tracking, code } = await instrumentAndRun(`
        var arr = ["one", "two"]
        var str = JSON.stringify(arr);
        return str
      `);

    var lastStep = await traverseAndGetLastStep(
      tracking,
      normal.indexOf("two")
    );
    expect(lastStep.operationLog.operation).toBe("stringLiteral");
    expect(lastStep.charIndex).toBe(0);
    expect(lastStep.operationLog.result.primitive).toBe("two");
  });

  it("Can handle nested arrays", async () => {
    const { normal, tracking, code } = await instrumentAndRun(`
        var arr = ["one", ["two", "three"]]
        var str = JSON.stringify(arr);
        return str
      `);

    var lastStep = await traverseAndGetLastStep(
      tracking,
      normal.indexOf("three")
    );
    expect(lastStep.operationLog.operation).toBe("stringLiteral");
    expect(lastStep.charIndex).toBe(0);
    expect(lastStep.operationLog.result.primitive).toBe("three");
  });

  it("Doesn't break if property names contain dots", async () => {
    const { normal, tracking, code } = await instrumentAndRun(`
        var obj = {"a.b": "c"}
        var str = JSON.stringify(obj);
        return str
      `);

    var lastStep = await traverseAndGetLastStep(tracking, normal.indexOf("c"));
    expect(lastStep.operationLog.operation).toBe("stringLiteral");
    expect(lastStep.charIndex).toBe(0);
    expect(lastStep.operationLog.result.primitive).toBe("c");
  });

  it("Doesn't break if there are undefiend properties", async () => {
    const { normal, tracking, code } = await instrumentAndRun(`
        var obj = {"a": undefined, "b": 5}
        var str = JSON.stringify(obj);
        return str
      `);

    var lastStep = await traverseAndGetLastStep(tracking, normal.indexOf("5"));
    expect(lastStep.operationLog.operation).toBe("numericLiteral");
  });

  it("Can handle JSON that just contains a string", async () => {
    const { normal, tracking, code } = await instrumentAndRun(`
        var json = "abc";
        var str = JSON.stringify(json);
        return str
      `);

    expect(normal).toBe('"abc"');

    var lastStep = await traverseAndGetLastStep(
      tracking,
      normal.indexOf("abc")
    );
    expect(lastStep.operationLog.operation).toBe("stringLiteral");
  });

  it("Can handle JSON that just contains a number", async () => {
    const { normal, tracking, code } = await instrumentAndRun(`
        var json = 5;
        var str = JSON.stringify(json);
        return str
      `);
    expect(normal).toBe("5");

    var t = await traverse({
      operationLog: tracking,
      charIndex: 0
    });
    var lastStep = t[t.length - 1];

    expect(lastStep.operationLog.operation).toBe("numericLiteral");
  });

  it("Can handle values that are Symbols", async () => {
    const { normal, tracking, code } = await instrumentAndRun(`
        var json = {a: Symbol("sth")};
        var str = JSON.stringify(json);
        return str
      `);
    expect(normal).toBe("{}");
  });
});

it("Can traverse arguments for a function expression (rather than a function declaration)", async () => {
  const { normal, tracking, code } = await instrumentAndRun(`
    var fn = function(a) {
      return a
    }
    return fn("a")
  `);
  expect(normal).toBe("a");
  var t = await traverse({ operationLog: tracking, charIndex: 0 });
  const tLastStep = t[t.length - 1];
  expect(getStepTypeList(t)).toEqual([
    "callExpression",
    "returnStatement",
    "identifier",
    "stringLiteral"
  ]);
});

describe("String.prototype.substr", () => {
  it("Works in when passing a positive start and length", async () => {
    const { normal, tracking, code } = await instrumentAndRun(`
      return "abcde".substr(2, 2)
    `);
    expect(normal).toBe("cd");
    var t = await traverse({ operationLog: tracking, charIndex: 1 }); // char "d"

    const tLastStep = t[t.length - 1];
    expect(tLastStep.charIndex).toBe(3);
  });
  it("Works in when passing a start argument only", async () => {
    const { normal, tracking, code } = await instrumentAndRun(`
      return "abcde".substr(2)
    `);
    expect(normal).toBe("cde");
    var t = await traverse({ operationLog: tracking, charIndex: 1 }); // char "c"

    const tLastStep = t[t.length - 1];
    expect(tLastStep.charIndex).toBe(3);
  });
  it("Works in when passing a negative start argument", async () => {
    const { normal, tracking, code } = await instrumentAndRun(`
      return "abcde".substr(-2, 1)
    `);
    expect(normal).toBe("d");
    var t = await traverse({ operationLog: tracking, charIndex: 0 }); // char "d"

    const tLastStep = t[t.length - 1];
    expect(tLastStep.charIndex).toBe(3);
  });
});

describe("String.prototype.trim", () => {
  it("Adjusts char index based on amount of whitespace removed", async () => {
    const { normal, tracking, code } = await instrumentAndRun(`
      const str = String.fromCharCode(10) + "     ab cd"
      return str.trim()
    `);
    expect(normal).toBe("ab cd");
    var t = await traverse({ operationLog: tracking, charIndex: 3 }); // char "c"

    const tLastStep = t[t.length - 1];
    expect(tLastStep.charIndex).toBe(8);
  });
  it("Doesn't break if there's no whitespace at the start", async () => {
    const { normal, tracking, code } = await instrumentAndRun(`
      const str = "abc"
      return str.trim()
    `);
    expect(normal).toBe("abc");
    var t = await traverse({ operationLog: tracking, charIndex: 2 }); // char "c"

    const tLastStep = t[t.length - 1];
    expect(tLastStep.charIndex).toBe(2);
  });
  it("Doesn't break when called with apply", async () => {
    const { normal, tracking, code } = await instrumentAndRun(`
      var str = " a"
      return String.prototype.trim.apply(str, [])
    `);
    expect(normal).toBe("a");
    var t = await traverse({ operationLog: tracking, charIndex: 0 });

    const tLastStep = t[t.length - 1];
    expect(tLastStep.charIndex).toBe(1);
  });
});

it("Can traverse arguments fn.apply(this, arguments)", async () => {
  const { normal, tracking, code } = await instrumentAndRun(`
    function f1() {
      return f2.apply(this, arguments)
    }
    function f2(a) {
      return a + a
    }
    return f1("a")
  `);
  expect(normal).toBe("aa");
  var t = await traverse({ operationLog: tracking, charIndex: 0 });
  const tLastStep = t[t.length - 1];
  expect(tLastStep.operationLog.operation).toBe("stringLiteral");
});

describe("Arrays", () => {
  it("Can traverse values in array literals", async () => {
    const { normal, tracking, code } = await instrumentAndRun(`
      var arr = ["a", "b"]
      return arr[1]
    `);
    expect(normal).toBe("b");
    var t = await traverse({ operationLog: tracking, charIndex: 0 });
    const tLastStep = t[t.length - 1];
    expect(tLastStep.operationLog.operation).toBe("stringLiteral");
  });
  it("Can traverse pushed values", async () => {
    const { normal, tracking, code } = await instrumentAndRun(`
      var arr = []
      arr.push("a", "b")
      return arr[1]
    `);
    expect(normal).toBe("b");
    var t = await traverse({ operationLog: tracking, charIndex: 0 });
    const tLastStep = t[t.length - 1];
    expect(tLastStep.operationLog.operation).toBe("stringLiteral");
  });

  describe("Array.prototype.join", () => {
    it("Can traverse basic join call", async () => {
      const { normal, tracking, code } = await instrumentAndRun(`
        var arr = ["ab", "cd"]
        return arr.join("-#-")
      `);
      expect(normal).toBe("ab-#-cd");
      var t1 = await traverse({ operationLog: tracking, charIndex: 6 });
      const t1LastStep = t1[t1.length - 1];
      expect(t1LastStep.charIndex).toBe(1);
      expect(t1LastStep.operationLog.result.primitive).toBe("cd");

      var t2 = await traverse({ operationLog: tracking, charIndex: 3 });
      const t2LastStep = t2[t2.length - 1];
      expect(t2LastStep.charIndex).toBe(1);
      expect(t2LastStep.operationLog.result.primitive).toBe("-#-");
    });
  });
  it("Can traverse join calls with the default separator (,)", async () => {
    const { normal, tracking, code } = await instrumentAndRun(`
      var arr = ["a", "b"]
      return arr.join()
    `);
    expect(normal).toBe("a,b");
    var t1 = await traverse({ operationLog: tracking, charIndex: 1 });
    const t1LastStep = t1[t1.length - 1];
    expect(t1LastStep.charIndex).toBe(0);
    expect(t1LastStep.operationLog.result.primitive).toBe(",");
  });
  it("Can traverse join calls with undefined/null values", async () => {
    const { normal, tracking, code } = await instrumentAndRun(`
      return [null, undefined].join("-")
    `);
    expect(normal).toBe("-");
    var t1 = await traverse({ operationLog: tracking, charIndex: 0 });
    const t1LastStep = t1[t1.length - 1];
    expect(t1LastStep.charIndex).toBe(0);
    expect(t1LastStep.operationLog.result.primitive).toBe("-");
  });
  it("Can traverse join called with .call", async () => {
    const { normal, tracking, code } = await instrumentAndRun(`
      return Array.prototype.join.call(["a","b"], "-")
    `);
    expect(normal).toBe("a-b");
    var t1 = await traverse({ operationLog: tracking, charIndex: 2 });
    const t1LastStep = t1[t1.length - 1];
    expect(t1LastStep.charIndex).toBe(0);
    expect(t1LastStep.operationLog.result.primitive).toBe("b");
  });
  it("Works on array like objects", async () => {
    const { normal, tracking, code } = await instrumentAndRun(`
      return Array.prototype.join.call({0: "a", 1: "b", length: 2})
    `);
    expect(normal).toBe("a,b");
    var t1 = await traverse({ operationLog: tracking, charIndex: 2 });
    const t1LastStep = t1[t1.length - 1];
    expect(t1LastStep.charIndex).toBe(0);
    expect(t1LastStep.operationLog.result.primitive).toBe("b");
  });
});

it("Tracks Object.keys", async () => {
  const { normal, tracking, code } = await instrumentAndRun(`
  const obj = {}
  obj["a"] = 100
  return Object.keys(obj)[0]
`);
  expect(normal).toBe("a");
  var t1 = await traverse({ operationLog: tracking, charIndex: 0 });
  const t1LastStep = t1[t1.length - 1];
  expect(t1LastStep.operationLog.operation).toBe("stringLiteral");
});

it("Can traverse Object.assign", async () => {
  const { normal, tracking, code } = await instrumentAndRun(`
    let obj = {a: "a"}
    let obj2 = {b: "b"}
    obj = Object.assign(obj, obj2)
    return obj.b
  `);
  expect(normal).toBe("b");
  var t1 = await traverse({ operationLog: tracking, charIndex: 0 });
  const t1LastStep = t1[t1.length - 1];
  expect(t1LastStep.operationLog.operation).toBe("stringLiteral");
});

describe("Array.slice", () => {
  it("Supports traversal of normal usage", async () => {
    const { normal, tracking, code } = await instrumentAndRun(`
        var arr = ["1", "2", "3"]
        return arr.slice(1,3)[1]
      `);
    expect(normal).toBe("3");
    var t1 = await traverse({ operationLog: tracking, charIndex: 0 });
    const t1LastStep = t1[t1.length - 1];
    expect(t1LastStep.operationLog.operation).toBe("stringLiteral");
  });
  it("Supports traversal with negative start index", async () => {
    const { normal, tracking, code } = await instrumentAndRun(`
        var arr = ["1", "2", "3", "4"]
        return arr.slice(-3, 3)[1]
      `);
    expect(normal).toBe("3");
    var t1 = await traverse({ operationLog: tracking, charIndex: 0 });
    const t1LastStep = t1[t1.length - 1];
    expect(t1LastStep.operationLog.operation).toBe("stringLiteral");
  });
  it("Supports traversal with negative start index and no end index", async () => {
    const { normal, tracking, code } = await instrumentAndRun(`
        var arr = ["1", "2", "3", "4"]
        return arr.slice(-2)[1]
      `);
    expect(normal).toBe("4");
    var t1 = await traverse({ operationLog: tracking, charIndex: 0 });
    const t1LastStep = t1[t1.length - 1];
    expect(t1LastStep.operationLog.operation).toBe("stringLiteral");
  });
  it("Supports traversal with positive start index and no end index", async () => {
    const { normal, tracking, code } = await instrumentAndRun(`
        var arr = ["1", "2", "3", "4"]
        return arr.slice(1)[2]
      `);
    expect(normal).toBe("4");
    var t1 = await traverse({ operationLog: tracking, charIndex: 0 });
    const t1LastStep = t1[t1.length - 1];
    expect(t1LastStep.operationLog.operation).toBe("stringLiteral");
  });
  it("Supports traversal with positive start index and negative end index", async () => {
    const { normal, tracking, code } = await instrumentAndRun(`
        var arr = ["1", "2", "3", "4"]
        return arr.slice(1, -1)[1]
      `);
    expect(normal).toBe("3");
    var t1 = await traverse({ operationLog: tracking, charIndex: 0 });
    const t1LastStep = t1[t1.length - 1];
    expect(t1LastStep.operationLog.operation).toBe("stringLiteral");
  });
  it("Supports being called with .call and arguments object", async () => {
    const { normal, tracking, code } = await instrumentAndRun(`
        const slice = Array.prototype.slice
        function fn() {
          const arr = slice.call(arguments)
          return arr[0]
        }
        return fn("Hi")
      `);
    expect(normal).toBe("Hi");
    var t1 = await traverse({ operationLog: tracking, charIndex: 0 });
    const t1LastStep = t1[t1.length - 1];
    expect(t1LastStep.operationLog.operation).toBe("stringLiteral");
  });
});

describe("Array.prototype.map", () => {
  it("Passes values through to mapping function", async () => {
    const { normal, tracking, code } = await instrumentAndRun(`
        var arr = ["1", "2"]
        return arr.map(function(value){
          return value
        })[1]
      `);
    expect(normal).toBe("2");
    var t1 = await traverse({ operationLog: tracking, charIndex: 0 });
    const t1LastStep = t1[t1.length - 1];
    expect(t1LastStep.operationLog.operation).toBe("stringLiteral");
  });
  it("Supports all callback arguments and thisArg", async () => {
    const { normal, tracking, code } = await instrumentAndRun(`
        var arr = ["1", "2"]
        return arr.map(function(value, index, array){
          return value + index + array.length + this
        }, "x")[0]
      `);
    expect(normal).toBe("102x");
  });
  it("When invoked with .apply, still supports all callback arguments and thisArg", async () => {
    const { normal, tracking, code } = await instrumentAndRun(`
        var arr = ["1", "2"]
        const map = arr.map
        var arr2 = map.apply(arr, [function(value, index, array){
          return value + index + array.length + this
        }, "x"])
        return arr2[0]
      `);
    expect(normal).toBe("102x");
  });
  it("When invoked with .call, still supports all callback arguments and thisArg", async () => {
    const { normal, tracking, code } = await instrumentAndRun(`
        var arr = ["1", "2"]
        const map = arr.map
        var arr2 = map.call(arr, function(value, index, array){
          return value + index + array.length + this
        }, "x")
        return arr2[0]
      `);
    expect(normal).toBe("102x");
  });
});

describe("Array.prototype.filter", () => {
  it("Passes values through to filter function and tracks result values", async () => {
    const { normal, tracking, code } = await instrumentAndRun(`
        var arr = ["1", "2", "3", "4"]
        let v
        const greaterThan2 = arr.filter(function(value){
          v = value
          return parseFloat(value) > 2
        })
        return v + "-" + greaterThan2[0]
      `);
    expect(normal).toBe("4-3");

    var t1 = await traverse({ operationLog: tracking, charIndex: 0 });
    const t1LastStep = t1[t1.length - 1];
    expect(t1LastStep.operationLog.operation).toBe("stringLiteral");

    var t2 = await traverse({ operationLog: tracking, charIndex: 2 });
    const t2LastStep = t2[t2.length - 1];
    expect(t2LastStep.operationLog.operation).toBe("stringLiteral");
  });
  it("Doesn't break this argument", async () => {
    const { normal, tracking, code } = await instrumentAndRun(`
        let arr = ["1","2","3","4"]
        let t 
        arr = arr.filter(function(value){
          t = this.toString()
          return value > parseFloat(this)
        }, "2")
        return arr[0] + t
      `);
    expect(normal).toBe("32");

    var t1 = await traverse({ operationLog: tracking, charIndex: 0 });
    const t1LastStep = t1[t1.length - 1];
    expect(t1LastStep.operationLog.operation).toBe("stringLiteral");
  });
});

describe("Array.concat", () => {
  it("Works when calling .concat with an array argument", async () => {
    const { normal, tracking, code } = await instrumentAndRun(`
        var arr = ["1"].concat(["2"])
        return arr[0] + arr[1]
      `);
    expect(normal).toBe("12");

    var t1 = await traverse({ operationLog: tracking, charIndex: 0 });
    const t1LastStep = t1[t1.length - 1];
    expect(t1LastStep.operationLog.operation).toBe("stringLiteral");
    expect(t1LastStep.operationLog.result.primitive).toBe("1");

    var t2 = await traverse({ operationLog: tracking, charIndex: 1 });
    const t2LastStep = t2[t2.length - 1];
    expect(t2LastStep.operationLog.operation).toBe("stringLiteral");
    expect(t2LastStep.operationLog.result.primitive).toBe("2");
  });
  it("Works when calling .concat with an non-array argument", async () => {
    const { normal, tracking, code } = await instrumentAndRun(`
        var arr = ["1"].concat("2")
        return arr[0] + arr[1]
      `);
    expect(normal).toBe("12");

    var t2 = await traverse({ operationLog: tracking, charIndex: 1 });
    const t2LastStep = t2[t2.length - 1];
    expect(t2LastStep.operationLog.operation).toBe("stringLiteral");
    expect(t2LastStep.operationLog.result.primitive).toBe("2");
  });
});

describe("encodeURICompoennt", () => {
  it("Can traverse encodeURIComponent", async () => {
    const { normal, tracking, code } = await instrumentAndRun(`
        return encodeURIComponent("a@b#c")
      `);
    expect(normal).toBe("a%40b%23c");

    var t1 = await traverse({ operationLog: tracking, charIndex: 7 });
    const t1LastStep = t1[t1.length - 1];
    expect(t1LastStep.operationLog.operation).toBe("stringLiteral");
    expect(t1LastStep.charIndex).toBe(3);

    var t2 = await traverse({ operationLog: tracking, charIndex: 9 });
    const t2LastStep = t2[t2.length - 1];
    expect(t2LastStep.charIndex).toBe(4);
  });
  it("Can traverse encodeURIComponent when called with .call", async () => {
    const { normal, tracking, code } = await instrumentAndRun(`
        return encodeURIComponent.call(null, "a@b#c")
      `);
    expect(normal).toBe("a%40b%23c");

    var t1 = await traverse({ operationLog: tracking, charIndex: 7 });
    const t1LastStep = t1[t1.length - 1];
    expect(t1LastStep.operationLog.operation).toBe("stringLiteral");
    expect(t1LastStep.charIndex).toBe(3);

    var t2 = await traverse({ operationLog: tracking, charIndex: 9 });
    const t2LastStep = t2[t2.length - 1];
    expect(t2LastStep.charIndex).toBe(4);
  });
});

it("Can traverse decodeURIComponent", async () => {
  const { normal, tracking, code } = await instrumentAndRun(`
      return decodeURIComponent("a%40b%23c")
    `);
  expect(normal).toBe("a@b#c");

  var t1 = await traverse({ operationLog: tracking, charIndex: 3 });
  const t1LastStep = t1[t1.length - 1];
  expect(t1LastStep.operationLog.operation).toBe("stringLiteral");
  expect(t1LastStep.charIndex).toBe(5);

  var t2 = await traverse({ operationLog: tracking, charIndex: 4 });
  const t2LastStep = t2[t2.length - 1];
  expect(t2LastStep.charIndex).toBe(8);
});

describe("String.prototype.match", () => {
  test("Can traverse String.prototype.match results", async () => {
    const { normal, tracking, code } = await instrumentAndRun(`
        const arr = "a4c89a".match(/[0-9]+/g)
        return arr[0] + arr[1]
      `);

    expect(normal).toBe("489");

    var t1 = await traverse({ operationLog: tracking, charIndex: 0 });
    const t1LastStep = t1[t1.length - 1];
    expect(t1LastStep.operationLog.operation).toBe("stringLiteral");
    expect(t1LastStep.charIndex).toBe(1);

    var t2 = await traverse({ operationLog: tracking, charIndex: 2 });
    const t2LastStep = t2[t2.length - 1];
    expect(t2LastStep.charIndex).toBe(4);
  });

  // not technically a traversal test but it makes sense to have .match tests in one place
  // ... maybe we should just merge core.test.ts with traverse.test.ts
  // ... or move them next to the relevant files, like callexpression.ts
  it("Doesn't break on non-global regexes with multiple match groups", async () => {
    const { normal, tracking, code } = await instrumentAndRun(`
        const arr = "zzabc".match(/(a)(b)/)
        return arr[0] + arr[1] + arr[2]
      `);

    expect(normal).toBe("abab");
  });

  it("Tries to not get confused with same matched characters in mutliple groups", async () => {
    const { normal, tracking, code } = await instrumentAndRun(`
        const arr = "zzaba".match(/(a)(b)(a)/)
        return arr[1] + arr[2] + arr[3]
      `);

    expect(normal).toBe("aba");

    var t2 = await traverse({ operationLog: tracking, charIndex: 2 });
    const t2LastStep = t2[t2.length - 1];
    expect(t2LastStep.charIndex).toBe(4);
  });

  it("Works when some match groups don't have a match", async () => {
    const { normal, tracking, code } = await instrumentAndRun(`
        const arr = "ac".match(/(a)(b)?(c)/)
        return arr[3]
      `);

    expect(normal).toBe("c");

    var t2 = await traverse({ operationLog: tracking, charIndex: 0 });
    const t2LastStep = t2[t2.length - 1];
    expect(t2LastStep.operationLog.operation).toBe("stringLiteral");
    expect(t2LastStep.charIndex).toBe(1);
  });

  it("Works somewhat when using nested groups in a non global regex", async () => {
    // Easier to construct here than escaping it in the string
    const re = /^\s*([\s\S]+?)\s+in\s+([\s\S]+?)(?:\s+as\s+([\s\S]+?))?(?:\s+track\s+by\s+([\s\S]+?))?\s*$/;
    const { normal, tracking, code } = await instrumentAndRun(
      `
        // Example based on angular todomvc
        const str = "todo in todos | filter:statusFilter track by $index"
        const re = outsideArgs.re
        const arr = str.match(re);

        return arr[0]
      `,
      { re }
    );

    expect(normal).toBe("todo in todos | filter:statusFilter track by $index");

    var t2 = await traverse({ operationLog: tracking, charIndex: 2 });
    const t2LastStep = t2[t2.length - 1];
    expect(t2LastStep.operationLog.operation).toBe("stringLiteral");
    expect(t2LastStep.charIndex).toBe(2);
  });
});

describe("Array.prototype.reduce", () => {
  it("Passes values through to reducer function", async () => {
    const { normal, tracking, code } = await instrumentAndRun(`
        return ["aa", "bb", "cc"].reduce(function(ret, param){
          return ret + param
        }, "")
      `);

    expect(normal).toBe("aabbcc");

    var t1 = await traverse({ operationLog: tracking, charIndex: 0 });
    const t1LastStep = t1[t1.length - 1];
    expect(t1LastStep.operationLog.operation).toBe("stringLiteral");
    expect(t1LastStep.operationLog.result.primitive).toBe("aa");

    var t2 = await traverse({ operationLog: tracking, charIndex: 5 });
    const t2LastStep = t2[t2.length - 1];
    expect(t2LastStep.operationLog.result.primitive).toBe("cc");
    expect(t2LastStep.charIndex).toBe(1);
  });
  it("It works when not passing in an initial value", async () => {
    const { normal, tracking, code } = await instrumentAndRun(`
        return ["a", "b", "c"].reduce(function(ret, param){
          return ret + param
        })
      `);

    expect(normal).toBe("abc");

    var t1 = await traverse({ operationLog: tracking, charIndex: 0 });
    const t1LastStep = t1[t1.length - 1];
    expect(t1LastStep.operationLog.operation).toBe("stringLiteral");
    expect(t1LastStep.operationLog.result.primitive).toBe("a");

    var t2 = await traverse({ operationLog: tracking, charIndex: 2 });
    const t2LastStep = t2[t2.length - 1];
    expect(t2LastStep.operationLog.result.primitive).toBe("c");
    expect(t2LastStep.charIndex).toBe(0);
  });
});

describe("String.prototype.split", () => {
  it("Can traverse string split result array ", async () => {
    const { normal, tracking, code } = await instrumentAndRun(`
        return "hello--world".split("--")[1]
      `);

    expect(normal).toBe("world");

    var t1 = await traverse({ operationLog: tracking, charIndex: 1 });
    const t1LastStep = t1[t1.length - 1];
    expect(t1LastStep.operationLog.operation).toBe("stringLiteral");
    expect(t1LastStep.charIndex).toBe(8);
  });
  it("Can traverse string split result array when called with apply", async () => {
    const { normal, tracking, code } = await instrumentAndRun(`
        return String.prototype.split.apply("hello--world", ["--"])[1]
      `);

    expect(normal).toBe("world");

    var t1 = await traverse({ operationLog: tracking, charIndex: 1 });
    const t1LastStep = t1[t1.length - 1];
    expect(t1LastStep.operationLog.operation).toBe("stringLiteral");
    expect(t1LastStep.charIndex).toBe(8);
  });
  it("Can traverse string split result array when called without a separator", async () => {
    const { normal, tracking, code } = await instrumentAndRun(`
        return String.prototype.split.apply("ab", [])[0]
      `);

    expect(normal).toBe("ab");

    var t1 = await traverse({ operationLog: tracking, charIndex: 1 });
    const t1LastStep = t1[t1.length - 1];
    expect(t1LastStep.operationLog.operation).toBe("stringLiteral");
    expect(t1LastStep.charIndex).toBe(1);
  });
  it("Can traverse string split result when passing in an object with a Symbol.split function ", async () => {
    const { normal, tracking, code } = await instrumentAndRun(`
      const separator = {
        [Symbol.split]: function(str){
          return [str.slice(0,1), str.slice(1)]
        }
      }
      return "something".split(separator)[1]
    `);

    expect(normal).toBe("omething");

    var t1 = await traverse({ operationLog: tracking, charIndex: 1 });
    const t1LastStep = t1[t1.length - 1];
    expect(t1LastStep.operationLog.operation).toBe("stringLiteral");
    expect(t1LastStep.charIndex).toBe(2);
  });
  it("It doesn't break when Symbol.split function doesn't return an array", async () => {
    const { normal, tracking, code } = await instrumentAndRun(`
      const separator = {
        [Symbol.split]: function(str){
          return 123
        }
      }
      return "something".split(separator)
    `);

    expect(normal).toBe(123);
  });
  it("Can traverse if split argument is a regular expression", async () => {
    const { normal, tracking, code } = await instrumentAndRun(`
      return "a|b".split(/|/)[2]
    `);

    expect(normal).toBe("b");
    const step = await traverseAndGetLastStep(tracking, 0);
    expect(step.operationLog.operation).toBe("stringLiteral");
    expect(step.charIndex).toBe(2);
    expect(step.operationLog.result.primitive).toBe("a|b");
  });
});

describe("Array.prototype.shift", () => {
  it("Traverses array correctly after calling shift on it", async () => {
    const { normal, tracking, code } = await instrumentAndRun(`
      const arr = ["a", "b"]
      arr.shift()
      return arr[0]
    `);

    expect(normal).toBe("b");

    var t1 = await traverse({ operationLog: tracking, charIndex: 0 });
    const t1LastStep = t1[t1.length - 1];
    expect(t1LastStep.operationLog.operation).toBe("stringLiteral");
    expect(t1LastStep.operationLog.result.primitive).toBe("b");
  });
  it("Traverses arguments array correctly after calling shift arguments", async () => {
    const { normal, tracking, code } = await instrumentAndRun(`
      function fn() {
        const shift = Array.prototype.shift
        shift.call(arguments)
        return arguments[0]
      }
      return fn("a", "b", "c")
    `);

    expect(normal).toBe("b");

    var t1 = await traverse({ operationLog: tracking, charIndex: 0 });
    const t1LastStep = t1[t1.length - 1];
    expect(t1LastStep.operationLog.operation).toBe("stringLiteral");
    expect(t1LastStep.operationLog.result.primitive).toBe("b");
  });
  it("Traverses return value from arr.shift", async () => {
    const { normal, tracking, code } = await instrumentAndRun(`
      const arr = ["a", "b"]
      arr.shift()
      return arr.shift()
    `);

    expect(normal).toBe("b");

    var t1 = await traverse({ operationLog: tracking, charIndex: 0 });
    const t1LastStep = t1[t1.length - 1];
    expect(t1LastStep.operationLog.operation).toBe("stringLiteral");
    expect(t1LastStep.operationLog.result.primitive).toBe("b");
  });
});

describe("Array.prototype.pop", () => {
  it("Traverses value after retrieving it with arr.pop", async () => {
    const { normal, tracking, code } = await instrumentAndRun(`
      const arr = ["a", "b"]
      return arr.pop()
    `);

    expect(normal).toBe("b");

    var t1 = await traverse({ operationLog: tracking, charIndex: 0 });
    const t1LastStep = t1[t1.length - 1];
    expect(t1LastStep.operationLog.operation).toBe("stringLiteral");
    expect(t1LastStep.operationLog.result.primitive).toBe("b");
  });
});

describe("Array.prototype.unshift", () => {
  it("Traverses value inserted with array.unshift", async () => {
    const { normal, tracking, code } = await instrumentAndRun(`
      const arr = ["c"]
      arr.unshift("a","b")
      return arr[1]
    `);

    expect(normal).toBe("b");

    var t1 = await traverse({ operationLog: tracking, charIndex: 0 });
    const t1LastStep = t1[t1.length - 1];
    expect(t1LastStep.operationLog.operation).toBe("stringLiteral");
    expect(t1LastStep.operationLog.result.primitive).toBe("b");
  });
});

describe("String.prototype.substring", () => {
  it("Traverses substring call with indexStart and indexEnd being strings", async () => {
    const { normal, tracking, code } = await instrumentAndRun(`
    return "abcd".substring("1", "3") // str args should also work
  `);

    expect(normal).toBe("bc");

    var t1 = await traverse({ operationLog: tracking, charIndex: 1 });
    const t1LastStep = t1[t1.length - 1];
    expect(t1LastStep.operationLog.operation).toBe("stringLiteral");
    expect(t1LastStep.charIndex).toBe(2);
  });

  it("Traverses substring call with indexEnd being less than indexStart", async () => {
    const { normal, tracking, code } = await instrumentAndRun(`
    return "abcde".substring(3,2)
  `);

    expect(normal).toBe("c");

    var t1 = await traverse({ operationLog: tracking, charIndex: 0 });
    const t1LastStep = t1[t1.length - 1];
    expect(t1LastStep.operationLog.operation).toBe("stringLiteral");
    expect(t1LastStep.charIndex).toBe(2);
  });

  it("Traverses substring when invoked with .call", async () => {
    const { normal, tracking, code } = await instrumentAndRun(`
    const substring = String.prototype.substring
    return substring.call("abcd", 1, 3)
  `);

    expect(normal).toBe("bc");

    var t1 = await traverse({ operationLog: tracking, charIndex: 1 });
    const t1LastStep = t1[t1.length - 1];
    expect(t1LastStep.operationLog.operation).toBe("stringLiteral");
    expect(t1LastStep.charIndex).toBe(2);
  });
  it("Traverses substring when invoked with .apply", async () => {
    const { normal, tracking, code } = await instrumentAndRun(`
    const substring = String.prototype.substring
    return substring.apply("abcd", [1, 3])
  `);

    expect(normal).toBe("bc");

    var t1 = await traverse({ operationLog: tracking, charIndex: 1 });
    const t1LastStep = t1[t1.length - 1];
    expect(t1LastStep.operationLog.operation).toBe("stringLiteral");
    expect(t1LastStep.charIndex).toBe(2);
  });
});

describe("String.prototype.toString", () => {
  it("Traverses toString call", async () => {
    const { normal, tracking, code } = await instrumentAndRun(`
    return "abcd".toString()
  `);

    expect(normal).toBe("abcd");

    var t1 = await traverse({ operationLog: tracking, charIndex: 1 });
    const t1LastStep = t1[t1.length - 1];
    expect(t1LastStep.operationLog.operation).toBe("stringLiteral");
    expect(t1LastStep.charIndex).toBe(1);
  });
});

async function traverseAndGetLastStep(
  operationLog,
  charIndex,
  options = {}
): Promise<TraversalStep> {
  var t1: any = await traverse({ operationLog, charIndex }, options);
  const t1LastStep = t1[t1.length - 1];
  return t1LastStep;
}

// describe("Can handle object destructuring in function parameters", () => {
//   it("Object destructuring with default parameters", async () => {
//     const { normal, tracking, code } = await instrumentAndRun(`
//     function concat({a="Hello ",b}){
//       console.log("aaa", a___tv)
//       return a + b
//     }

//     return concat({b: "World"})
//   `);
//     expect(normal).toBe("Hello World");

//     let step;
//     step = await traverseAndGetLastStep(tracking, 1);
//     console.log(step);
//     expect(step.operationLog.operation).toBe("stringLiteral");

//     step = await traverseAndGetLastStep(tracking, 6);
//     expect(step.operationLog.operation).toBe("stringLiteral");
//   });
//   it("Object destructuring with default params depending on other params", async () => {
//     const { normal, tracking, code } = await instrumentAndRun(`
//     function fn({a,b=a + "_"}){
//       return b
//     }

//     return fn({a: "z"})
//   `);
//     expect(normal).toBe("z_");

//     let step;
//     step = await traverseAndGetLastStep(tracking, 0);
//     expect(step.operationLog.result.primitive).toBe("z");
//     expect(step.operationLog.operation).toBe("stringLiteral");
//   });
// });

it("Supports arrow functions", async () => {
  const { normal, tracking, code } = await instrumentAndRun(`
      const concat = (a,b) => {return a + b};
      
      return concat("Hello ", "World")
    `);
  expect(normal).toBe("Hello World");

  let step;
  step = await traverseAndGetLastStep(tracking, 1);
  expect(step.operationLog.operation).toBe("stringLiteral");
  expect(step.charIndex).toBe(1);

  step = await traverseAndGetLastStep(tracking, 6);
  expect(step.operationLog.operation).toBe("stringLiteral");
  expect(step.charIndex).toBe(0);
});

describe("Array destructuring", () => {
  it("Works for a basic example", async () => {
    const { normal, tracking, code } = await instrumentAndRun(`
      const [one, two] = ["one", "two"]
      
      return one + two
    `);
    expect(normal).toBe("onetwo");

    let step;
    step = await traverseAndGetLastStep(tracking, 0);
    expect(step.operationLog.operation).toBe("stringLiteral");
    expect(step.charIndex).toBe(0);

    step = await traverseAndGetLastStep(tracking, 3);
    expect(step.operationLog.operation).toBe("stringLiteral");
    expect(step.charIndex).toBe(0);
  });
});

describe("getters/setters", () => {
  it("It can traverse member expression result that came from a getter", async () => {
    const { normal, tracking, code } = await instrumentAndRun(`
      const obj = {}
      Object.defineProperty(obj, "test", {
        get: function() {
          return "Hello"
        }
      })
      
      return obj.test
    `);
    expect(normal).toBe("Hello");

    let step = await traverseAndGetLastStep(tracking, 0);
    expect(step.operationLog.operation).toBe("stringLiteral");
    expect(step.charIndex).toBe(0);
  });
});

it("Can traverse array expressions that contain array patterns", async () => {
  const { normal, tracking, code } = await instrumentAndRun(
    `
      const arr1 = ["x", "y"]
      const arr2 = ["a", "b", ...arr1]
      
      return arr2[3]
    `,
    {},
    { logCode: false }
  );
  expect(normal).toBe("y");

  let step = await traverseAndGetLastStep(tracking, 0);
  expect(step.operationLog.operation).toBe("stringLiteral");
  expect(step.charIndex).toBe(0);
});

describe("Template literals", () => {
  it("Has basic support", async () => {
    const { normal, tracking, code } = await instrumentAndRun(
      "return `a${'b'}c\n${'d'}`",
      {},
      { logCode: false }
    );
    expect(normal).toBe("abc\nd");

    let step = await traverseAndGetLastStep(tracking, normal.indexOf("b"));

    expect(step.operationLog.operation).toBe("stringLiteral");
    expect(step.operationLog.result.primitive).toBe("b");
    expect(step.charIndex).toBe(0);

    step = await traverseAndGetLastStep(tracking, normal.indexOf("d"));
    expect(step.operationLog.operation).toBe("stringLiteral");
    expect(step.operationLog.result.primitive).toBe("d");
    expect(step.charIndex).toBe(0);
  });

  it("Can handle nested template literals", async () => {
    const { normal, tracking, code } = await instrumentAndRun(
      `
        function getChar(char) {
          return ${"`${char}`"}
        }

        return ${'`${getChar("a")}${getChar("b")}`'}
      `,
      {},
      { logCode: false }
    );
    expect(normal).toBe("ab");

    let step = await traverseAndGetLastStep(tracking, normal.indexOf("b"));

    expect(step.operationLog.operation).toBe("stringLiteral");
    expect(step.operationLog.result.primitive).toBe("b");
    expect(step.charIndex).toBe(0);
  });
});

it("Can traverse Number.prototype.toString", async () => {
  const { normal, tracking, code } = await instrumentAndRun(
    `
      return (5).toString()
    `,
    {},
    { logCode: false }
  );
  expect(normal).toBe("5");

  let step = await traverseAndGetLastStep(tracking, 0);

  expect(step.operationLog.operation).toBe("numericLiteral");
  expect(step.operationLog.result.primitive).toBe(5);
  expect(step.charIndex).toBe(0);
});

it("Can traverse Math.round", async () => {
  const { normal, tracking, code } = await instrumentAndRun(
    `
      return Math.round(2.5)
    `,
    {},
    { logCode: false }
  );
  expect(normal).toBe(3);

  let step = await traverseAndGetLastStep(tracking, 0);

  expect(step.operationLog.operation).toBe("numericLiteral");
  expect(step.operationLog.result.primitive).toBe(2.5);
  expect(step.charIndex).toBe(0);
});

it("Can traverse a Number constructor call", async () => {
  const { normal, tracking, code } = await instrumentAndRun(
    `
      return Number(2)
    `,
    {},
    { logCode: false }
  );
  expect(normal).toBe(2);

  let step = await traverseAndGetLastStep(tracking, 0);

  expect(step.operationLog.operation).toBe("numericLiteral");
  expect(step.operationLog.result.primitive).toBe(2);
  expect(step.charIndex).toBe(0);
});

describe("optimistic", () => {
  it("If not optimistic, does not traverse binary expression even if one is a numeric literal and the other isn't", async () => {
    const { normal, tracking, code } = await instrumentAndRun(
      `
        const complexVal = 0.656
        return complexVal * 100
      `,
      {},
      { logCode: false }
    );

    let step = await traverseAndGetLastStep(tracking, 0, false);
    expect(!!step.isOptimistic).toBe(false);

    expect(step.operationLog.operation).toBe("binaryExpression");
  });
  it("If optimistic, does not traverse binary expression even if one is a numeric literal and the other isn't", async () => {
    const { normal, tracking, code } = await instrumentAndRun(
      `
        const complexVal = 0.656
        return complexVal * 100
      `,
      {},
      { logCode: false }
    );

    let step = await traverseAndGetLastStep(tracking, 0, { optimistic: true });

    expect(step.operationLog.operation).toBe("numericLiteral");
    // expect(step.operationLog.operation).toBe(0.656);
    expect(step.isOptimistic).toBe(true);
  });
});

describe("Math.min/max", () => {
  it("Can traverse Math.min", async () => {
    const { normal, tracking, code } = await instrumentAndRun(`
      return Math.min(5,2)
    `);

    expect(normal).toBe(2);

    const step = await traverseAndGetLastStep(tracking, 0);
    expect(step.operationLog.operation).toBe("numericLiteral");
    expect(step.operationLog.result.primitive).toBe(2);
  });

  it("Can traverse Math.max", async () => {
    const { normal, tracking, code } = await instrumentAndRun(`
      return Math.max(5,2)
    `);

    expect(normal).toBe(5);

    const step = await traverseAndGetLastStep(tracking, 0);
    expect(step.operationLog.operation).toBe("numericLiteral");
    expect(step.operationLog.result.primitive).toBe(5);
  });

  it("Can traverse Math.max called with many arguments", async () => {
    const { normal, tracking, code } = await instrumentAndRun(`
      return Math.max(5,2, 10, 4)
    `);

    expect(normal).toBe(10);

    const step = await traverseAndGetLastStep(tracking, 0);
    expect(step.operationLog.operation).toBe("numericLiteral");
    expect(step.operationLog.result.primitive).toBe(10);
  });
});

it("Can traverse parseFloat", async () => {
  const { normal, tracking, code } = await instrumentAndRun(`
    return parseFloat("25")
  `);

  expect(normal).toBe(25);

  const step = await traverseAndGetLastStep(tracking, 0);
  expect(step.operationLog.operation).toBe("stringLiteral");
  expect(step.operationLog.result.primitive).toBe("25");
});
