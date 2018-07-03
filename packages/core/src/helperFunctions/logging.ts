import KnownValues from "./KnownValues";

// Helper function code must never use native functions like console.log/warn/... etc
// because they can be overwritten by page JS.
// If the page JS in turn triggers another helper code console log call you get an
// infinite loop

let knownValues: KnownValues;

export function initLogging(kv: KnownValues) {
  knownValues = kv;
}

export function consoleLog(...args) {
  return knownValues.getValue("console.log").apply(this, arguments);
}

export function consoleCount(...args) {
  return knownValues.getValue("console.count").apply(this, arguments);
}

export function consoleWarn(...args) {
  return knownValues.getValue("console.warn").apply(this, arguments);
}

export function consoleError(...args) {
  return knownValues.getValue("console.error").apply(this, arguments);
}
