import * as OperationTypes from "./OperationTypes";
import { instrumentAndRun } from "./testHelpers";

test("adds 1 + 2 to equal 3", done => {
  instrumentAndRun("return 1 + 2").then(({ normal, tracking }) => {
    expect(normal).toBe(3);
    expect(tracking.type).toBe(OperationTypes.binaryExpression);
    expect(tracking.argTrackingValues[1].type).toBe(
      OperationTypes.numericLiteral
    );

    done();
  });
});

test("Can track values across function calls", done => {
  instrumentAndRun(`
    function appendB(str) {
      
      return add(str, "b")
    }
    function add(arg1, arg2) {
      return arg1 + arg2
    }
    return appendB("a")
  `).then(({ normal, tracking }) => {
    expect(normal).toBe("ab");
    expect(tracking.type).toBe(OperationTypes.binaryExpression);
    expect(
      tracking.argTrackingValues[1].argTrackingValues[0].argTrackingValues[0]
        .type
    ).toBe(OperationTypes.stringLiteral);

    done();
  });
});

test("Can handle variable declarations with init value", done => {
  instrumentAndRun(`
    var a = "Hello", b = 2
    return b
  `).then(({ normal, tracking }) => {
    console.log({ tracking });
    expect(normal).toBe(2);
    expect(tracking.argTrackingValues[0].type).toBe("numericLiteral");

    done();
  });
});

test("Can handle object literals", done => {
  instrumentAndRun(`
    var stringKey = {"a": "a"}
    var numberKey = {1: "a"}
    return {a: "a"}
  `).then(({ normal, tracking }) => {
    expect(normal.a).toBe("a");
    done();
  });
});

test("Can handle try catch statements", done => {
  instrumentAndRun(`
    try {} catch (err) {}
  `).then(({ normal, tracking }) => {
    done();
  });
});

test("Can handle for in statements", done => {
  instrumentAndRun(`
    var obj = {}
    for (var key in obj) {}
    for (key in obj) {}
  `).then(({ normal, tracking }) => {
    done();
  });
});

test("Can handle function expressions", done => {
  instrumentAndRun(`
    var fn = function sth(){}
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
    `).then(({ normal, tracking }) => {
      done();
    });
  });
  test("global variables in function calls", done => {
    instrumentAndRun(`
      var fnGlobal = function(){}
      fnGlobal(global)
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
          throw Error("no")
        }
      }
      return counter
    `).then(({ normal, tracking }) => {
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
        console.log("aaaa", item, counter)
        if (counter > 1) {
          throw Error("no")
        }
      }
      
      return counter
    `).then(({ normal, tracking }) => {
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
  `).then(({ normal, tracking }) => {
    // expect(normal).toBe("ok");
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

// test return [a,b]
// todo: handle objects somehow
