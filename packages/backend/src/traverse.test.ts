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
});

describe("Array.map", () => {
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
});

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
});
