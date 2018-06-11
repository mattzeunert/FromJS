import { testHelpers } from "@fromjs/core";
const { instrumentAndRun, server } = testHelpers;
import { traverse as _traverse } from "./traverse";

const traverse = function(firstStep) {
  return _traverse.call(null, firstStep, [], server);
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
  expect(t1LastStep.operationLog.result.str).toBe("a");
  expect(t2LastStep.operationLog.operation).toBe("stringLiteral");
  expect(t2LastStep.operationLog.result.str).toBe("b");
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
  expect(t1LastStep.operationLog.result.str).toBe("a");
  expect(t2LastStep.operationLog.operation).toBe("stringLiteral");
  expect(t2LastStep.operationLog.result.str).toBe("b");

  expect(getStepTypeList(t1)).toEqual([
    "callExpression", // add()
    "returnStatement", // return
    "binaryExpression", // +
    "identifier", // arg1
    "functionArgument", // (arg1)
    "stringLiteral" // "a"
  ]);
});

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

  expect(lastStep.operationLog.result.str).toBe("a");
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
    expect(lastStep.operationLog.result.str).toBe("cc");
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
    "functionArgument",
    "stringLiteral"
  ]);
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
      expect(t1LastStep.operationLog.result.str).toBe("cd");

      var t2 = await traverse({ operationLog: tracking, charIndex: 3 });
      const t2LastStep = t2[t2.length - 1];
      expect(t2LastStep.charIndex).toBe(1);
      expect(t2LastStep.operationLog.result.str).toBe("-#-");
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
    expect(t1LastStep.operationLog.result.str).toBe(",");
  });
  it("Can traverse join calls with undefined/null values", async () => {
    const { normal, tracking, code } = await instrumentAndRun(`
      return [null, undefined].join("-")
    `);
    expect(normal).toBe("-");
    var t1 = await traverse({ operationLog: tracking, charIndex: 0 });
    const t1LastStep = t1[t1.length - 1];
    expect(t1LastStep.charIndex).toBe(0);
    expect(t1LastStep.operationLog.result.str).toBe("-");
  });
});
