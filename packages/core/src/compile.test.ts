
import * as OperationTypes from "./OperationTypes";
import { instrumentAndRun } from "./testHelpers";

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

test("Can handle for in statements", done => {
  instrumentAndRun(`
    var obj = {}
    for (var key in obj) {}
    for (key in obj) {}
    return null
  `).then(({ normal, tracking }) => {
      done();
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
        expect(strLit.result.str).toBe("b");

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
        expect(
          tracking.args.value.args.newValue.args.value.operation
        ).toBe("stringLiteral");

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
      expect(assignmentExpression.args.currentValue.result.str).toBe("10");
      expect(assignmentExpression.args.argument.result.str).toBe("2");

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


it("Collects extra data on replace calls", done => {
  instrumentAndRun(`
    var a = "ab".replace("b", "c")
    return a
  `).then(({ normal, tracking, code }) => {
      expect(normal).toBe("ac")
      const replacement = tracking.args.value.extraArgs.replacement0
      const replacementValue = replacement.args.value
      expect(replacementValue.operation).toBe("stringLiteral")
      expect(replacementValue.result.str).toBe("c")
      expect(replacement.runtimeArgs.start).toBe(1)
      expect(replacement.runtimeArgs.end).toBe(2)

      done();
    });
});


describe("JSON.parse", () => {
  it("Collects extra data on JSON.parse calls", (done) => {
    instrumentAndRun(`
    var obj = JSON.parse('{"a": {"b": 5}}')
    return obj.a.b
  `).then(({ normal, tracking, code }) => {
        expect(normal).toBe(5)
        const memberExpression = tracking
        const propertyValue = tracking.extraArgs.propertyValue
        const json = propertyValue.args.json
        const keyPath = propertyValue.runtimeArgs.keyPath
        expect(json.result.str).toBe('{"a": {"b": 5}}')
        expect(keyPath).toBe("a.b")

        done();
      });
  })
});