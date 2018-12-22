export function safelyReadProperty(obj, propertyName) {
  try {
    return obj[propertyName];
  } catch (err) {
    console.log(
      "Tried to read property, but got err – usually fine, can happen e.g. overwriting HTMLElement prototype",
      obj,
      propertyName,
      err
    );
    return null;
  }
}

export function nullOnError(fn) {
  try {
    return fn();
  } catch (err) {
    console.log("using null on error");
    return null;
  }
}

export function countObjectKeys(obj) {
  let count = 0;
  for (const key in obj) {
    count++;
  }
  return count;
}
