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
    return {a: "a"}
  `).then(({ normal, tracking }) => {
    expect(normal.a).toBe("a");
    done();
  });
});

test("Can handle try catch statements", done => {
  instrumentAndRun(`
    try {
       
    } catch (err) {

    }
  `).then(({ normal, tracking }) => {
    done();
  });
});

// test return [a,b]
// todo: handle objects somehow
