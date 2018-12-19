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
