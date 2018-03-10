import compile from "./compile";
import * as OperationTypes from "./OperationTypes";
import { instrumentAndRun } from "./testHelpers";
import traverse from "./traverse";

test("concatenates 'a' and 'b' and gets correct result", done => {
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
