import compile from "./compile";
import * as OperationTypes from "./OperationTypes";
import { instrumentAndRun } from "./testHelpers";
import traverse from "./traverse";

function getStepTypeList(traversalResult) {
  return traversalResult.map(t => t.trackingValue.type);
}

test("Can track concatenation of 'a' and 'b'", done => {
  instrumentAndRun("return 'a' + 'b'").then(({ normal, tracking }) => {
    expect(normal).toBe("ab");
    var t1 = traverse(tracking, 0);
    var t2 = traverse(tracking, 1);
    var t1LastStep = t1[t1.length - 1];
    var t2LastStep = t2[t2.length - 1];
    expect(t1LastStep.trackingValue.type).toBe("stringLiteral");
    expect(t1LastStep.trackingValue.argValues[0]).toBe("a");
    expect(t2LastStep.trackingValue.type).toBe("stringLiteral");
    expect(t2LastStep.trackingValue.argValues[0]).toBe("b");

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
    var t1 = traverse(tracking, 0);
    var t2 = traverse(tracking, 1);
    var t1LastStep = t1[t1.length - 1];
    var t2LastStep = t2[t2.length - 1];
    expect(t1LastStep.trackingValue.type).toBe("stringLiteral");
    expect(t1LastStep.trackingValue.argValues[0]).toBe("a");
    expect(t2LastStep.trackingValue.type).toBe("stringLiteral");
    expect(t2LastStep.trackingValue.argValues[0]).toBe("b");

    expect(getStepTypeList(t1)).toEqual([
      "functionReturnValue", // add()
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
    var t = traverse(tracking, 0);

    expect(getStepTypeList(t)).toEqual([
      "memberExpression",
      "objectPropertyAssignment",
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
    var t = traverse(tracking, 0);

    expect(getStepTypeList(t)).toEqual([
      "memberExpression",
      "objectExpression",
      "stringLiteral"
    ]);

    done();
  });
});
