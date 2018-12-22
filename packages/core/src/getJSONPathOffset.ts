export function getJSONPathOffset(json, initialAst, keyPath, isKey) {
  let ast = initialAst;
  const keys = keyPath.slice();
  return get(ast, keys);

  function get(ast, keys) {
    const key = keys.shift();
    let initialAstForDebug = ast;

    ast = ast.children.find((child, i) => {
      if (child.key) {
        // object
        return child.key.value === key;
      } else {
        // array
        return i === parseFloat(key);
      }
    });

    if (keys.length === 0) {
      let ret;
      if (isKey) {
        ret = ast.key.loc.start.offset;
      } else {
        if (ast.key) {
          // object
          ret = ast.value.loc.start.offset;
        } else {
          ret = ast.loc.start.offset;
        }
      }
      if (json[ret] === '"') {
        ret++;
      }
      return ret;
    }

    let nextAst;
    if (ast.value) {
      nextAst = ast.value;
    } else {
      nextAst = ast;
    }

    return get(nextAst, keys);
  }
}
