import { regExpContainsNestedGroup } from "./regExpHelpers";

describe("regExpContainsNestedGroup", () => {
  it("Detects when there are nested groups", () => {
    expect(regExpContainsNestedGroup(/(([a-z])b)/)).toBe(true);
  });
  it("Detects when there are no nested groups", () => {
    expect(regExpContainsNestedGroup(/(a-z)/)).toBe(false);
  });
  it("It can handle escaped parentheses", () => {
    expect(regExpContainsNestedGroup(/(\(a-z)/)).toBe(false);
  });
});
