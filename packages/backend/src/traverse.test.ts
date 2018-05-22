import { testHelpers } from "@fromjs/core";
const instrumentAndRun = testHelpers.instrumentAndRun;
import traverse from "./traverse";

function getStepTypeList(traversalResult) {
  return traversalResult.map(t => t.operationLog.operation);
}

test("Can track concatenation of 'a' and 'b'", done => {
  instrumentAndRun("return 'a' + 'b'").then(({ normal, tracking }) => {
    expect(normal).toBe("ab");
    var t1 = traverse({ operationLog: tracking, charIndex: 0 });
    var t2 = traverse({ operationLog: tracking, charIndex: 1 });
    var t1LastStep = t1[t1.length - 1];
    var t2LastStep = t2[t2.length - 1];
    expect(t1LastStep.operationLog.operation).toBe("stringLiteral");
    expect(t1LastStep.operationLog.result.str).toBe("a");
    expect(t2LastStep.operationLog.operation).toBe("stringLiteral");
    expect(t2LastStep.operationLog.result.str).toBe("b");

    done();
  });
});

test("Can track concatenation of 'a' and 'b' in an add function", done => {
  instrumentAndRun(`
    function add(arg1, arg2) {
      return arg1 + arg2
    }
    return add('a', 'b')
  `).then(({ normal, tracking, code }) => {
      expect(normal).toBe("ab");
      var t1 = traverse({ operationLog: tracking, charIndex: 0 });
      var t2 = traverse({ operationLog: tracking, charIndex: 1 });
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

      done();
    });
});

test("Can track values through object assignments", done => {
  instrumentAndRun(`
    var obj = {}
    obj.a = "x"
    return obj.a
  `).then(({ normal, tracking, code }) => {
      var t = traverse({ operationLog: tracking, charIndex: 0 });

      expect(getStepTypeList(t)).toEqual([
        "memberExpression",
        "assignmentExpression",
        "stringLiteral"
      ]);

      done();
    });
});

test("Can track values through object literals", done => {
  instrumentAndRun(`
    var obj = {a: "x"}
    return obj.a
  `).then(({ normal, tracking, code }) => {
      var t = traverse({ operationLog: tracking, charIndex: 0 });

      expect(getStepTypeList(t)).toEqual([
        "memberExpression",
        "objectProperty",
        "stringLiteral"
      ]);

      done();
    });
});

test("Can traverse String.prototype.slice", done => {
  instrumentAndRun(`
      var str = "abcde"
      str = str.slice(2,4)
      return str
    `).then(({ normal, tracking, code }) => {
      expect(normal).toBe("cd");
      var t = traverse({ operationLog: tracking, charIndex: 0 });
      var lastStep = t[t.length - 1];

      expect(lastStep.charIndex).toBe(2);

      expect(getStepTypeList(t)).toEqual([
        "identifier",
        "assignmentExpression",
        "callExpression",
        "identifier",
        "stringLiteral"
      ]);

      done();
    });
});

test("Can track values through conditional expression", done => {
  instrumentAndRun(`
    var b = false ? "a" : "b"
    return b
  `).then(({ normal, tracking, code }) => {
      expect(normal).toBe("b");
      var t = traverse({ operationLog: tracking, charIndex: 0 });

      expect(getStepTypeList(t)).toEqual([
        "identifier",
        "conditionalExpression",
        "stringLiteral"
      ]);

      done();
    });
});

describe("Can traverse string replacement calls", () => {
  test("works for simple replacements using regexes", (done) => {
    instrumentAndRun(`
    var ret = "ababab".replace(/b/g, "cc") // => "accaccacc"
    return ret
  `).then(({ normal, tracking, code }) => {
        expect(normal).toBe("accaccacc");
        var t = traverse({ operationLog: tracking, charIndex: 5 });

        expect(getStepTypeList(t)).toEqual([
          "identifier",
          "callExpression",
          "stringLiteral"
        ]);

        const lastStep = t[t.length - 1]
        expect(lastStep.charIndex).toBe(1)
        expect(lastStep.operationLog.result.str).toBe("cc")

        done();
      });
  }

  test("works for simple replacements using strings", (done) => {
      instrumentAndRun(`
    var ret = "Hello {{name}}!".replace("{{name}}", "Susan")
    return ret
  `).then(({ normal, tracking, code }) => {
          expect(normal).toBe("Hello Susan!");
          var t1 = traverse({ operationLog: tracking, charIndex: 2 });
          const t1LastStep = t1[t1.length - 1]
          expect(t1LastStep.charIndex).toBe(2)

          var t2 = traverse({ operationLog: tracking, charIndex: 6 });
          const t2LastStep = t2[t2.length - 1]
          expect(t2LastStep.charIndex).toBe(0)

          done();
        });
    })

    test("works for non-match locations behind a match", (done) => {
      instrumentAndRun(`
    var ret = "abc".replace("a", "12345")
    return ret
  `).then(({ normal, tracking, code }) => {
          expect(normal).toBe("12345bc");
          var t1 = traverse({ operationLog: tracking, charIndex: 6 }); // "c"
          const t1LastStep = t1[t1.length - 1]
          expect(t1LastStep.charIndex).toBe(2)

          done();
        });
    })
});
