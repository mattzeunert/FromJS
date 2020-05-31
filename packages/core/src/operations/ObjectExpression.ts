import { ExecContext } from "../helperFunctions/ExecContext";
import {
  getLastOperationTrackingResultCall,
  ignoredStringLiteral,
  ignoredArrayExpression,
  getBabelTypes
} from "../babelPluginHelpers";
import { EXPLICIT_NAMES } from "../config";
import * as OperationTypes from "../OperationTypes";

const OBJECT_METHOD = EXPLICIT_NAMES ? "ObjectMethod" : "met";
const OBJECT_PROPERTY = EXPLICIT_NAMES ? "ObjectProperty" : "pr";
const OBJECT_SPREAD_ELEMENT = EXPLICIT_NAMES ? "SpreadElement" : "se";

function traverseFullObjectExpression(node, keyPath: string[]) {
  if (node._didAddObjectPaths) {
    return;
  }
  node._didAddObjectPaths = true;
  node.properties.forEach(prop => {
    if (prop.value && prop.key && (prop.key.value || prop.key.name)) {
      let propKeyPath = [...keyPath, prop.key.value || prop.key.name];
      if (prop.value.type === "ObjectExpression") {
        traverseFullObjectExpression(prop.value, propKeyPath);
      } else {
        prop.value.loc.objectPath = propKeyPath;
      }
    }
  });
}

export default <any>{
  argNames: ["property"],
  argIsArray: [true],
  exec: function objectExpressionExec(
    args,
    astArgs,
    ctx: ExecContext,
    logData: any
  ) {
    const [propertiesArg] = args;
    var obj = {};
    var methodProperties = {};

    for (var i = 0; i < propertiesArg.length; i++) {
      var property = propertiesArg[i];

      const [type, key, value, kind] = property;

      var propertyType = type[0];
      var propertyKey = key[0];

      if (propertyType === OBJECT_PROPERTY) {
        var propertyValue = value[0];
        var propertyValueT = value[1];

        obj[propertyKey] = propertyValue;

        ctx.trackObjectPropertyAssignment(
          obj,
          propertyKey,
          ctx.createOperationLog({
            operation: OperationTypes.objectProperty,
            args: { propertyValue: [propertyValue, propertyValueT] },
            result: propertyValue,
            astArgs: {},
            loc: logData.loc
          }),
          key[1]
        );
      } else if (propertyType === OBJECT_SPREAD_ELEMENT) {
        let objToCopyFrom = value[0];
        let objToCopyFromTrackingValue = value[1];
        Object.entries(objToCopyFrom || {}).forEach(([key, value]) => {
          obj[key] = value;
          ctx.trackObjectPropertyAssignment(
            obj,
            key,
            ctx.createOperationLog({
              operation: OperationTypes.objectProperty,
              args: {
                propertyValue: [
                  value,
                  ctx.getObjectPropertyTrackingValue(objToCopyFrom, key)
                ]
              },
              result: propertyValue,
              astArgs: {},
              loc: logData.loc
            }),
            ctx.getObjectPropertyNameTrackingValue(objToCopyFrom, key)
          );
        });
      } else if (propertyType === OBJECT_METHOD) {
        var propertyKind = kind[0];
        var fn = value[0];
        if (!methodProperties[propertyKey]) {
          methodProperties[propertyKey] = {
            enumerable: true,
            configurable: true
          };
        }
        if (propertyKind === "method") {
          obj[propertyKey] = fn;
        } else {
          methodProperties[propertyKey][propertyKind] = fn;
        }
      }
    }
    Object.defineProperties(obj, methodProperties);

    return obj;
  },
  traverse(operationLog, charIndex) {
    return {
      operationLog: operationLog.args.propertyValue,
      charIndex: charIndex
    };
  },
  visitor(path) {
    path.node.properties.forEach(function(prop) {
      if (prop.type === "SpreadElement") {
      } else if (prop.key.type === "Identifier") {
        const loc = prop.key.loc;
        prop.key = getBabelTypes().stringLiteral(prop.key.name);
        prop.key.loc = loc;
        if (!loc) {
          debugger;
        }
      }
    });

    // Add objectPath to values – we use that in the UI to show what the
    // surrounding object is when users can only see a few lines of it
    let initialPath: string[] = [];
    if (path.parentPath.node.type === "VariableDeclarator") {
      initialPath.push(path.parentPath.node.id.name);
    }
    traverseFullObjectExpression(path.node, initialPath);

    function makeArray(type, key, value, kind?) {
      var ret = [type, key, value];
      if (kind !== undefined) {
        ret.push(kind);
      }
      ret = ret.map(a => ignoredArrayExpression(a));
      return ignoredArrayExpression(ret);
    }

    var properties = path.node.properties.map(function(prop) {
      if (prop.type === "ObjectMethod") {
        // getters/setters or something like this: obj = {fn(){}}
        var kind = ignoredStringLiteral(prop.kind);
        kind.ignore = true;
        return makeArray(
          [ignoredStringLiteral(OBJECT_METHOD)],
          [prop.key],
          [getBabelTypes().functionExpression(null, prop.params, prop.body)],
          [kind]
        );
      } else if (prop.type === "SpreadElement") {
        return makeArray(
          [ignoredStringLiteral(OBJECT_SPREAD_ELEMENT)],
          [ignoredStringLiteral("n/a")],
          [prop.argument, getLastOperationTrackingResultCall()]
        );
      } else {
        return makeArray(
          [ignoredStringLiteral(OBJECT_PROPERTY)],
          [prop.key, getLastOperationTrackingResultCall()],
          [prop.value, getLastOperationTrackingResultCall()]
        );
      }
    });

    var call = this.createNode!([properties], null, path.node.loc);

    return call;
  }
};
