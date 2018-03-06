import compile from "./compile";
import * as OperationTypes from "./OperationTypes";

function instrumentAndRun(code) {
  return new Promise(resolve => {
    code = `getTrackingAndNormalValue((function(){ ${code} })())`;
    compile(code).then(result => {
      // console.log(result.code);
      var result = eval(result.code);
      // console.log(JSON.stringify(result.tracking, null, 4));
      resolve(result);
    });
  });
}

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

test("Can handle variables that aren't declared explicitly", done => {
  instrumentAndRun(`
    var fnGlobal = function(){}
    fnGlobal(global)

    var fn = function(a){ return a * 2 }
    var fn2 = function() { return fn(arguments[0]) }
    return fn2(2)
  `).then(({ normal, tracking }) => {
    expect(normal).toBe(4);
    done();
  });
});

/*
var four = (function(v){
  fn(v)
})(2)

v_t not defined!
*/

// test return [a,b]
// todo: handle objects somehow
