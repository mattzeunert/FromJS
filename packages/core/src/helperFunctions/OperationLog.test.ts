import { getSerializedValueObject } from "./OperationLog";

it("Does not include function values as length in the result (because they'll cause exceptions when passed into postmessage... JSON.stringify will just wipe them)", () => {
  var obj = {
    length: function() {}
  };
  const sv = getSerializedValueObject(obj, null, null);
  expect(sv.length).toBe(undefined);
});

it("Does include length for strings", () => {
  var str = "abc";
  const sv = getSerializedValueObject(str, null, null);
  expect(sv.length).toBe(3);
});
