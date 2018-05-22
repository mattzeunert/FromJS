import { testHelpers } from "@fromjs/core";
const { instrumentAndRun, server } = testHelpers;
import { traverse as _traverse } from "./traverse";

const traverse = function (firstStep) {
  return _traverse.call(this, firstStep, [], server)
}

function getStepTypeList(traversalResult) {
  return traversalResult.map(t => t.operationLog.operation);
}

test("Can track concatenation of 'a' and 'b'", async () => {
  const { normal, tracking, code } = await instrumentAndRun("return 'a' + 'b'")
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
  `)
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
  `)
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
  `)

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
    `)

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

test("Can track values through conditional expression", async () => {
  const { normal, tracking, code } = await instrumentAndRun(`
    var b = false ? "a" : "b"
    return b
  `)
  expect(normal).toBe("b");
  var t = await traverse({ operationLog: tracking, charIndex: 0 });

  expect(getStepTypeList(t)).toEqual([
    "identifier",
    "conditionalExpression",
    "stringLiteral"
  ]);
});

describe("Can traverse string replacement calls", async () => {
  test("works for simple replacements using regexes", async () => {
    const { normal, tracking, code } = await instrumentAndRun(`
    var ret = "ababab".replace(/b/g, "cc") // => "accaccacc"
    return ret
  `)
    expect(normal).toBe("accaccacc");
    var t = await traverse({ operationLog: tracking, charIndex: 5 });

    expect(getStepTypeList(t)).toEqual([
      "identifier",
      "callExpression",
      "stringLiteral"
    ]);

    const lastStep = t[t.length - 1]
    expect(lastStep.charIndex).toBe(1)
    expect(lastStep.operationLog.result.str).toBe("cc")
  }

  test("works for simple replacements using strings", async () => {
      const { normal, tracking, code } = await instrumentAndRun(`
    var ret = "Hello {{name}}!".replace("{{name}}", "Susan")
    return ret
  `)
      expect(normal).toBe("Hello Susan!");
      var t1 = await traverse({ operationLog: tracking, charIndex: 2 });
      const t1LastStep = t1[t1.length - 1]
      expect(t1LastStep.charIndex).toBe(2)

      var t2 = await traverse({ operationLog: tracking, charIndex: 6 });
      const t2LastStep = t2[t2.length - 1]
      expect(t2LastStep.charIndex).toBe(0)
    })

    test("works for non-match locations behind a match", async () => {
      const { normal, tracking, code } = await instrumentAndRun(`
    var ret = "abc".replace("a", "12345")
    return ret
  `)
      expect(normal).toBe("12345bc");
      var t1 = await traverse({ operationLog: tracking, charIndex: 6 }); // "c"
      const t1LastStep = t1[t1.length - 1]
      expect(t1LastStep.charIndex).toBe(2)
    })
});
