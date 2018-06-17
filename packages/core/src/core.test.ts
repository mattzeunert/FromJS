import * as OperationTypes from "./OperationTypes";
import { instrumentAndRun } from "./testHelpers";
import { compileSync } from "./compile";
import { assignmentExpression } from "@babel/types";

test("adds 1 + 2 to equal 3", done => {
  instrumentAndRun("return 1 + 2").then(({ normal, tracking }) => {
    expect(normal).toBe(3);
    expect(tracking.operation).toBe(OperationTypes.binaryExpression);
    expect(tracking.args.left.operation).toBe(OperationTypes.numericLiteral);

    done();
  });
});

test("Can handle variable declarations with init value", done => {
  instrumentAndRun(`
    var a = "Hello", b = 2
    return b
  `).then(({ normal, tracking }) => {
    expect(normal).toBe(2);
    expect(tracking.args.value.operation).toBe("numericLiteral");

    done();
  });
});

test("Can handle try catch statements", done => {
  instrumentAndRun(`
    try {} catch (err) {}
    return null
  `).then(({ normal, tracking }) => {
    done();
  });
});

describe("UnaryExpression", () => {
  test("Can handle ++ unary expresion", done => {
    instrumentAndRun(`
      var a = 0
      a++
      return a
    `).then(({ normal, tracking }) => {
      expect(normal).toBe(1);
      done();
    });
  });

  test("Does not break negative numeric literals", async () => {
    const { normal, tracking, code } = await instrumentAndRun(`
        return -100
      `);

    expect(normal).toBe(-100);
    expect(tracking.result.primitive).toBe(-100);
  });

  test("Does not break minus sign before identifier", async () => {
    const { normal, tracking, code } = await instrumentAndRun(`
        const num = 100
        return -num
      `);

    expect(normal).toBe(-100);
    expect(tracking.result.primitive).toBe(-100);
  });
});

test("Can handle function expressions", done => {
  instrumentAndRun(`
    var fn = function sth(){}
    return null
  `).then(({ normal, tracking }) => {
    done();
  });
});

test("Can handle typeof on non existent variables", done => {
  instrumentAndRun(`
    return typeof a
  `).then(({ normal, tracking }) => {
    done();
  });
});

describe("Can handle variables that aren't declared explicitly", () => {
  test("global variables", done => {
    instrumentAndRun(`
      global.__abcdef = "a"
      __abcdef = "b"
      return 0
    `).then(({ normal, tracking }) => {
      done();
    });
  });
  test("global variables in function calls", done => {
    instrumentAndRun(`
      var fnGlobal = function(){}
      fnGlobal(global)
      return 0
    `).then(({ normal, tracking }) => {
      done();
    });
  });
  test("arguments object", done => {
    instrumentAndRun(`
      var fn = function(a){ return a * 2 }
      var fn2 = function() { return fn(arguments[0]) }
      return fn2(2)
    `).then(({ normal, tracking }) => {
      expect(normal).toBe(4);
      done();
    });
  });
});

describe("Can handle while loops correctly", () => {
  test("simple", done => {
    instrumentAndRun(`
      var list = [1]
      var item
      var counter =0
      while (item = list.pop()) {
        counter++
        if (counter > 1) {
          throw Error("counter value too high")
        }
      }
      return counter
    `).then(({ normal, tracking, code }) => {
      expect(normal).toBe(1);
      done();
    });
  });
  test("complex", done => {
    instrumentAndRun(`
      var list = [1, null]
      var item
      var counter = 0
      while ((item = list.shift()) !== null) {
        counter++
        if (counter > 1) {
          throw Error("counter value too high")
        }
      }

      return counter
    `).then(({ normal, tracking, code }) => {
      expect(normal).toBe(1);
      done();
    });
  });
});

test("Can handle assignments in if statements", done => {
  instrumentAndRun(`
    var a
    if (a=0) {
      return "not ok"
    }
    return "ok"
  `).then(({ normal, tracking }) => {
    expect(normal).toBe("ok");
    done();
  });
});

test("Can handle for loops that contain assignments in the condition", done => {
  instrumentAndRun(`
    var elems = [{n: 1}, {n: 2}]
    var elem
    var i = 0
    for ( ; (elem = elems[ i ]) !== undefined; i++ ) {
      if (!elem || typeof elem.n !== "number") {
        throw Error("fail")
      }
    }
    return 0
  `).then(({ normal, tracking }) => {
    done();
  });
});

test("Does not call getters twice when making calls", done => {
  instrumentAndRun(`
    var obj = {}
    var getterInvocationCount = 0
    Object.defineProperty(obj, "sth", {
      get: function(){
        getterInvocationCount++
        return {
          fn: function(){
            return 99
          }
        }
      }
    })

    var val = obj.sth.fn()
    if (getterInvocationCount > 1) {
      throw Error("getter called too often")
    }
    return 0
  `).then(({ normal, tracking }) => {
    done();
  });
});

test("Returns the assigned value from assignments", done => {
  instrumentAndRun(`
    var b
    var a = (b = 5)
    return a
  `).then(({ normal, tracking }) => {
    expect(normal).toBe(5);
    done();
  });
});

describe("Object literals", () => {
  test("Can handle object literals", done => {
    instrumentAndRun(`
      var stringKey = {"a": "a"}
      var numberKey = {1: "a"}
      return {a: "a"}
    `).then(({ normal, tracking, code }) => {
      expect(normal.a).toBe("a");
      done();
    });
  });

  test("Tracks object literal values", done => {
    instrumentAndRun(`
      var obj = {
        a: 5,
        b: 6
      }
      return obj.a
    `).then(({ normal, tracking }) => {
      expect(normal).toBe(5);

      done();
    });
  });

  test("Doesn't break object literals with object methods", done => {
    instrumentAndRun(`
      var obj = {
        fn() { return 3}
      }
      return obj.fn()
    `).then(({ normal, tracking }) => {
      expect(normal).toBe(3);

      done();
    });
  });

  test("Doesn't break object literals with object methods", done => {
    instrumentAndRun(`
      var obj = {
        get sth() { return 4}
      }
      return obj.sth
    `).then(({ normal, tracking }) => {
      expect(normal).toBe(4);

      done();
    });
  });
});

test("Tracks object property assignments", done => {
  instrumentAndRun(`
    var obj = {}
    obj.a = 5
    return obj.a
  `).then(({ normal, tracking }) => {
    expect(normal).toBe(5);
    done();
  });
});

test("Tracks object property assignments with computed properties", done => {
  instrumentAndRun(`
    var obj = {}
    obj["a"] = 5
    return obj.a
  `).then(({ normal, tracking }) => {
    expect(normal).toBe(5);

    done();
  });
});

test("Tracks where a function's context came from", done => {
  instrumentAndRun(`
    var a = "a"
    return a.slice(0)
  `).then(({ normal, tracking, code }) => {
    // function context is string "a"
    var identifier = tracking.args.context;
    expect(identifier.args.value.operation).toBe("stringLiteral");

    done();
  });
});

describe("Tracks values across assignments", () => {
  it("Works when assigning a new value", done => {
    instrumentAndRun(`
    var a = "a"
    a = "b"
    return a
  `).then(({ normal, tracking, code }) => {
      var strLit = tracking.args.value.args.argument;
      expect(strLit.operation).toBe("stringLiteral");
      expect(strLit.result.primitive).toBe("b");

      done();
    });
  });
  it("Works when assigning a variable value", done => {
    instrumentAndRun(`
    var a = "a"
    var b = "b"
    a = b
    return a
  `).then(({ normal, tracking, code }) => {
      expect(normal).toBe("b");
      expect(tracking.args.value.args.newValue.args.value.operation).toBe(
        "stringLiteral"
      );

      done();
    });
  });
});

it("Can track `-` binary expressions", done => {
  instrumentAndRun(`
    var a = 10 - 8
    return a
  `).then(({ normal, tracking, code }) => {
    expect(normal).toBe(2);
    expect(tracking.args.value.operation).toBe("binaryExpression");

    done();
  });
});

it("Can track `/=` binary expressions", done => {
  instrumentAndRun(`
    var a = 10
    a /= 2
    return a
  `).then(({ normal, tracking, code }) => {
    expect(normal).toBe(5);

    var assignmentExpression = tracking.args.value;
    expect(assignmentExpression.operation).toBe(
      OperationTypes.assignmentExpression
    );

    expect(assignmentExpression.astArgs.operator).toBe("/=");
    expect(assignmentExpression.args.currentValue.result.primitive).toBe(10);
    expect(assignmentExpression.args.argument.result.primitive).toBe(2);

    done();
  });
});

describe("AssignmentExpression", () => {
  it("Does not invoke memberExpression objects more than once", done => {
    instrumentAndRun(`
      var counter = 0
      var obj = {val:"a"}
      function a() {
        counter++;
        return obj
      }
      a().val += "b"
      return [counter, obj.val]    
    `).then(({ normal, tracking, code }) => {
      expect(normal[0]).toBe(1);
      expect(normal[1]).toBe("ab");

      done();
    });
  });
});

it("Tracks array expressions", done => {
  instrumentAndRun(`
    var a = [1,2,3]
    return a
  `).then(({ normal, tracking, code }) => {
    expect(normal).toEqual([1, 2, 3]);
    expect(tracking.args.value.args.elements[0].operation).toBe(
      "numericLiteral"
    );

    done();
  });
});

describe("Supports ++ and -- operators", () => {
  it("Doesn't break the ++ operator when used on an identifier", done => {
    instrumentAndRun(`
    var a = 5
    a++
    return a
  `).then(({ normal, tracking, code }) => {
      expect(normal).toBe(6);
      done();
    });
  });
  it("Doesn't break the -- operator when used on an identifier", done => {
    instrumentAndRun(`
    var a = 5
    a--
    return a
  `).then(({ normal, tracking, code }) => {
      expect(normal).toBe(4);
      done();
    });
  });
  it("Doesn't break the ++ operator when used on a member expression", done => {
    instrumentAndRun(`
    var obj = {a: 5}
    obj.a++
    var x= obj.a
    return x
  `).then(({ normal, tracking, code }) => {
      expect(normal).toBe(6);
      done();
    });
  });
});

describe("String replace", () => {
  it("Collects extra data on replace calls", done => {
    instrumentAndRun(`
      var a = "ab".replace("b", "c")
      return a
    `).then(({ normal, tracking, code }) => {
      expect(normal).toBe("ac");
      const replacement = tracking.args.value.extraArgs.replacement0;
      const replacementValue = replacement.args.value;
      expect(replacementValue.operation).toBe("stringLiteral");
      expect(replacementValue.result.primitive).toBe("c");
      expect(replacement.runtimeArgs.start).toBe(1);
      expect(replacement.runtimeArgs.end).toBe(2);

      done();
    });
  });

  it("Doesn't break $n replacements", async () => {
    const { normal, tracking, code } = await instrumentAndRun(`
      var str = "abcad".replace(/(a)/g, "$1$1")
      return str
    `);
    expect(normal).toBe("aabcaad");
  });

  it("Doesn't break $& replacements", async () => {
    const { normal, tracking, code } = await instrumentAndRun(`
      var str = "abcad".replace(/(a)(b)/g, "-$&-$2#")
      return str
    `);
    expect(normal).toBe("-ab-b#cad");
  });

  it("Doesn't break function replacements", async () => {
    const { normal, tracking, code } = await instrumentAndRun(`
      var str = "ab".replace(/(a)/g, function(match){return match + "x"})
      return str
    `);
    expect(normal).toBe("axb");
  });
});

describe("JSON.parse", () => {
  it("Collects extra data on JSON.parse calls", done => {
    instrumentAndRun(`
    var obj = JSON.parse('{"a": {"b": 5}}')
    return obj.a.b
  `).then(({ normal, tracking, code }) => {
      expect(normal).toBe(5);
      const memberExpression = tracking;
      const propertyValue = tracking.extraArgs.propertyValue;
      const json = propertyValue.args.json;
      const keyPath = propertyValue.runtimeArgs.keyPath;
      expect(json.result.primitive).toBe('{"a": {"b": 5}}');
      expect(keyPath).toBe("a.b");

      done();
    });
  });
});

it("Tracks arguments to NewExpressions", async () => {
  const { normal, tracking, code } = await instrumentAndRun(`
  function Obj(num) {
    this.num = num
  }
  var obj = new Obj(2)
  return obj.num
`);
  expect(normal).toBe(2);
  const memberExpression = tracking;
  const assignedValue = memberExpression.extraArgs.propertyValue.args.argument;
  const fnArgument = assignedValue.args.value;
  expect(fnArgument.args.value.operation).toBe("numericLiteral");
});

it("Doesn't break when encountering a labeled statement", async () => {
  const { normal, tracking, code } = await instrumentAndRun(`
  // taken from mdn
  var str = "";

  block: {
    loop1:
    for (var i = 0; i < 5; i++) {
      if (i === 1) {
        continue loop1;
      }
      str = str + i;
      if (i > 3) {
        break block
      }
    }
    str += "x"
  }

  done:

  return str
`);
  expect(normal).toBe("0234");
});

// Ideally we should detect if the uninstrumented code had "use strict"
// and only add "use strict" if it was there before
it("Doesn't break on assignment to undeclared global variables", async () => {
  const { normal, tracking, code } = await instrumentAndRun(`
    a = 10
    return a
  `);
  expect(normal).toBe(10);
});

it("Doesn't break when using non-strict mode features like with", async () => {
  const { normal, tracking, code } = await instrumentAndRun(`
    const obj = {a:1}
    let num
    with (obj) {
      num = a
    }
    return num
  `);
  expect(normal).toBe(1);
});

describe("eval/new Function", () => {
  function __fromJSEval(code) {
    let compiledCode = compileSync(code).code;
    return {
      returnValue: eval(compiledCode),
      evalScript: []
    };
  }
  afterEach(() => delete global["__fromJSEval"]);
  it("Doesn't break when no compilation function __fromJSEval is available", async () => {
    global["__forTestsDontShowCantEvalLog"] = true;
    const { normal, tracking, code } = await instrumentAndRun(`
      return eval("5")
    `);
    delete global["__forTestsDontShowCantEvalLog"];
    expect(normal).toBe(5);
  });
  it("Compiles eval'd code if __fromJSEval is available", async () => {
    global["__fromJSEval"] = __fromJSEval;
    const { normal, tracking, code } = await instrumentAndRun(`
      return eval("5")
    `);
    expect(normal).toBe(5);
    const callExpression = tracking;
    expect(callExpression.extraArgs.returnValue.operation).toBe(
      "numericLiteral"
    );
  });
  it("Compiles new Function() code if __fromJSEval is available", async () => {
    global["__fromJSEval"] = __fromJSEval;
    const { normal, tracking, code } = await instrumentAndRun(`
      const sum = new Function("a", "b", "return a + b");
      return sum(1,2)
    `);
    expect(normal).toBe(3);
    const callExpression = tracking;
    const returnValue = callExpression.extraArgs.returnValue;
    expect(returnValue.args.returnValue.operation).toBe("binaryExpression");
  });
});

describe("with statement", () => {
  it("Keeps tracking data through with statements", async () => {
    const { normal, tracking, code } = await instrumentAndRun(`
        const obj = { a : 5}
        let ret
        with (obj) {
          ret = a
        }
        return ret
      `);

    expect(normal).toBe(5);
    const assignmentExpression = tracking.args.value;
    const objectProperty =
      assignmentExpression.args.argument.extraArgs.propertyValue;
    expect(objectProperty.args.propertyValue.operation).toBe("numericLiteral");
  });
  it("Doesn't break identifiers in memberexpressions", async () => {
    const { normal, tracking, code } = await instrumentAndRun(`
        const obj = { arr: [1,2] }
        let ret = ""
        with (obj) {
          arr.forEach(function (num){
            ret += num
          })
        }
        return ret
      `);
    expect(normal).toBe("12");
  });
  it("Doesn't break expressions as with object argument", async () => {
    const { normal, tracking, code } = await instrumentAndRun(`
        const obj = { arr: [1,2] }
        let ret = ""
        with (null || obj) {
          arr.forEach(function (num){
            ret += num
          })
        }
        return ret
      `);
    expect(normal).toBe("12");
  });
});

describe("localStorage", () => {
  beforeEach(() => {
    global.localStorage = {
      prop: "hi",
      getItem() {
        return "hi";
      }
    };
  });
  afterEach(() => {
    delete global.localStorage;
  });
  it("Tracks a localStorage value accessed using localStorage.prop", async () => {
    const { normal, tracking, code } = await instrumentAndRun(`
        return localStorage.prop
      `);
    expect(normal).toBe("hi");
    expect(tracking.args.object.result.knownValue).toBe("localStorage");
  });
  it("Tracks a localStorage value accessed using localStorage.getItem('prop')", async () => {
    const { normal, tracking, code } = await instrumentAndRun(`
        return localStorage.getItem("prop")
      `);
    expect(normal).toBe("hi");
    expect(tracking.args.function.result.knownValue).toBe(
      "localStorage.getItem"
    );
  });
});

describe("call/apply/bind", () => {
  it("Doesn't break call", async () => {
    const { normal, tracking, code } = await instrumentAndRun(`
        function fn(b) {
          return this + b
        }
        return fn.call("a", "b")
      `);

    expect(normal).toBe("ab");

    const callExpression = tracking;
    const returnStatement = callExpression.extraArgs.returnValue;
    const binaryExpression = returnStatement.args.returnValue;
    const { left, right } = binaryExpression.args;

    expect(right.args.value.result.primitive).toBe("b");
  });

  it("Doesn't break apply", async () => {
    const { normal, tracking, code } = await instrumentAndRun(`
    function fn(b) {
      return this + b
  }
    return fn.apply("a", ["b"])
  `);

    expect(normal).toBe("ab");

    const binaryExpression = tracking.extraArgs.returnValue.args.returnValue;

    const bArg = binaryExpression.args.right.args.value.args.value;
    expect(bArg.operation).not.toBe("arrayExpression"); // apply passes in array but it's not an argument
    expect(bArg.operation).toBe("stringLiteral");
  });

  it("Doesn't break apply", async () => {
    const { normal, tracking, code } = await instrumentAndRun(`
    function fn(b) {
      return this + b
    }
    fn = fn.bind("a")
    return fn("b")
  `);

    expect(normal).toBe("ab");
  });
});

describe("for ... in", () => {
  test("Can handle multiple complex nested for in statements", done => {
    // based on some Trello source code that caused problems
    instrumentAndRun(`
      var obj = {
        obj2: {a: 5}
      }
      var key1, key2
      var vOuter, vInner,x
      function getValue(obj, key) {
        return obj[key]
      }
      for (key in obj)
        for (key2 in ((x = 12), (vOuter = getValue(obj, key))))
          (vInner = vOuter[key2]), (vInner += 2);

      return vInner /* 7 */ + x /* 12 */

    `).then(({ normal, tracking }) => {
      expect(normal).toBe(19);
      done();
    });
  });

  it("Tracks for in key variables", async () => {
    const { normal, tracking, code } = await instrumentAndRun(`
    const obj = {a: "b"}
    let ret
    for (var name in obj) {
      ret = name
    }
    return ret
  `);
    expect(normal).toBe("a");
    const assignedValue = tracking.args.value.args.argument;
    expect(assignedValue.args.value.operation).toBe("stringLiteral");
  });

  it("Doesn't break if the body doesn't have a block statement, i.e. {}", async () => {
    const { normal, tracking, code } = await instrumentAndRun(`
    const obj = {a: "b"}
    let ret
    for (var name in obj) ret = name
    return ret
  `);

    expect(normal).toBe("a");
    const assignedValue = tracking.args.value.args.argument;
    expect(assignedValue.args.value.operation).toBe("stringLiteral");
  });

  it("Supports the variable being declared outside the for in loop", async () => {
    const { normal, tracking, code } = await instrumentAndRun(`
    const obj = {a: "b"}
    let ret
    let name
    for (name in obj) ret = name
    return ret
  `);

    expect(normal).toBe("a");
    const assignedValue = tracking.args.value.args.argument;
    expect(assignedValue.args.value.operation).toBe("stringLiteral");
  });

  it("Doesn't evaluate for in statement right value more than once", async () => {
    const { normal, tracking, code } = await instrumentAndRun(`
    let counter = 0
    function getObj() {
      counter++
      return {a: 1, b: 2, c: 3}
    }
    for (var key in getObj()) {

    }
    return counter
  `);

    expect(normal).toBe(1);
  });
});

describe("Doesn't break classes", () => {
  it("Doesn't break class methods", async () => {
    const { normal, tracking, code } = await instrumentAndRun(`
      const C = class {
        getA() {
          return "a";
        }
      };
      return new C().getA();
    `);

    expect(normal).toBe("a");
  });
});

describe("Doesn't break bitwise operators", async () => {
  it("Doesn't break | and & for variables", async () => {
    const { normal, tracking, code } = await instrumentAndRun(`
      const FLAG1 = 0b100
      const FLAG2 = 0b010
      let value = 0
      value |= FLAG1
      value = value | FLAG2
      return value & FLAG1
    `);
    expect(normal).toBe(0b100);
  });
  it("Doesn't break | and & for object properties", async () => {
    const { normal, tracking, code } = await instrumentAndRun(`
      const FLAG1 = 0b100
      const FLAG2 = 0b010
      let obj = {value: 0}
      obj.value |= FLAG1
      obj.value = obj.value | FLAG2
      const ret = {value: obj.value}
      ret.value &= FLAG1
      return ret.value
    `);
    expect(normal).toBe(0b100);
  });
});
