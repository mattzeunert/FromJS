declare var __FUNCTION_NAMES__, __OPERATION_TYPES__;
export default function() {
  (function(functionNames, operationTypes) {
    var global = Function("return this")();
    if (global.__didInitializeDataFlowTracking) {
      return;
    }
    global.__didInitializeDataFlowTracking = true;

    var argTrackingInfo = null;

    global[
      functionNames.getFunctionArgTrackingInfo
    ] = function getArgTrackingInfo(index) {
      if (!argTrackingInfo) {
        console.log("no arg tracking info...");
        return { info: "none" };
      }
      return argTrackingInfo[index];
    };

    global.getTrackingAndNormalValue = function(value) {
      // console.log("getTrackingAndNormalValue", value)
      return {
        normal: value,
        tracking: argTrackingInfo[0]
      };
    };

    global.inspect = function(value) {
      global.inspectedValue = {
        normal: value,
        tracking: argTrackingInfo[0]
      };
    };

    const objTrackingMap = new Map();
    function trackObjectPropertyAssignment(obj, propName, trackingValue) {
      // console.log("trackObjectPropertyAssignment", obj, propName, trackingValue)
      var objectPropertyTrackingInfo = objTrackingMap.get(obj);
      if (!objectPropertyTrackingInfo) {
        objectPropertyTrackingInfo = {};
        objTrackingMap.set(obj, objectPropertyTrackingInfo);
      }
      objectPropertyTrackingInfo[propName] = trackingValue;
    }
    function getObjectPropertyTrackingValue(obj, propName) {
      var objectPropertyTrackingInfo = objTrackingMap.get(obj);
      if (!objectPropertyTrackingInfo) {
        return null;
      }
      return objectPropertyTrackingInfo[propName];
    }
    window["getObjectPropertyTrackingValue"] = getObjectPropertyTrackingValue;

    var lastMemberExpressionObjectValue = null;
    var lastMemberExpressionObjectTrackingValue = null;
    global["getLastMemberExpressionObjectValue"] = function() {
      return lastMemberExpressionObjectValue;
    };

    global["getLastMemberExpressionObjectTrackingValue"] = function() {
      return lastMemberExpressionObjectTrackingValue;
    };

    const memoValues = {};
    global["__setMemoValue"] = function(key, value, trackingValue) {
      // console.log("setmemovalue", value)
      memoValues[key] = { value, trackingValue };
      return value;
    };
    global["__getMemoValue"] = function(key) {
      return memoValues[key].value;
    };
    global["__getMemoTrackingValue"] = function(key, value, trackingValue) {
      return memoValues[key].trackingValue;
    };

    var lastOpValueResult = null;
    var lastOpTrackingResult = null;
    global[functionNames.doOperation] = function op(opName, ...args) {
      var value, trackingValue;

      var objArgs;
      var astArgs;
      var argNames = [];
      if (args && args[0] && args[0].isUsingObjectSyntax) {
        // todo: remove this condition, should always use obj syntax
        objArgs = args[0];
        astArgs = args[1];
        delete objArgs.isUsingObjectSyntax;
        args = Object.values(objArgs);
        argNames = Object.keys(objArgs);
      } else {
        argNames = Array.from(new Array(args.length)).map(
          a => "unknown arg name"
        );
      }

      if (opName === operationTypes.arrayExpression) {
        args = args[0];
      }
      var argValues = args.map(arg => arg[0]);
      var argTrackingValues = args.map(arg => {
        if (arg[1] === null) {
          return {
            type: "Unknown type",
            resVal: arg[0],
            argTrackingValues: [],
            argValues: []
          };
        }
        return arg[1];
      });
      var extraTrackingValues = [];
      var extraTrackingValueArgNames = [];
      var ret;
      if (opName === operationTypes.callExpression) {
        var [__, ___, ...fnArgs] = args;
        var [fn, object] = argValues;
        argTrackingInfo = fnArgs.map(arg => ({
          type: operationTypes.functionArgument,
          argValues: [ret],
          argTrackingValues: [arg[1]],
          fnToString: fn.toString(),
          resVal: [arg[0]]
        }));
        var fnArgValues = fnArgs.map(arg => arg[0]);

        ret = fn.apply(object, fnArgValues);

        argTrackingInfo = null;

        extraTrackingValues.push(
          lastOpTrackingResult // pick up value from returnStatement
        );
      } else if (opName === "stringLiteral") {
        ret = argValues[0];
      } else if (opName === "identifier") {
        ret = argValues[0];
      } else if (opName === "returnStatement") {
        // console.log("returnstatement", argValues[0])
        ret = argValues[0];
      } else if (opName === operationTypes.arrayExpression) {
        ret = argValues;
      } else if (opName === operationTypes.assignmentExpression) {
        const assignmentType = argValues[1];
        if (assignmentType === "MemberExpression") {
          let [operator, aType, obj, propName, argument] = argValues;
          let [
            operatorT,
            aTypeT,
            objT,
            propNameT,
            argumentT
          ] = argTrackingValues;

          var currentValue = obj[propName];
          var currentValueT = {
            type: "memexpAsLeftAssExp",
            argValues: [obj, propName],
            argTrackingValues: [objT, propNameT],
            argNames: ["object", "property Name"]
          };

          if (operator === "=") {
            ret = obj[propName] = argument;
          } else if (operator === "+=") {
            ret = obj[propName] = obj[propName] + argument;
          } else {
            throw Error("unknown op " + operator);
          }

          trackObjectPropertyAssignment(obj, propName, {
            type: opName,
            argValues: [currentValue, argument],
            argTrackingValues: [currentValueT, argumentT],
            argNames: ["currentValue", "argument"]
          });
        } else if (assignmentType === "Identifier") {
          const [
            operator,
            aType,
            currentValue,
            resultValue,
            argument
          ] = argValues;
          // console.log({resultValue})
          ret = resultValue;
        } else {
          throw Error("unknown: " + assignmentType);
        }
      } else if (opName === operationTypes.binaryExpression) {
        var { left, right } = objArgs;
        left = left[0];
        right = right[0];

        var { operator } = astArgs;
        if (operator === "+") {
          ret = left + right;
        } else if (operator === "-") {
          ret = left - right;
        } else if (operator === "*") {
          ret = left * right;
        } else if (operator === "/") {
          ret = left / right;
        } else {
          throw Error("unknown bin exp operator: " + operator);
        }
      } else if (opName === "memberExpression") {
        // var [object, property] = argValues;
        // var [objectT, propertyT] = argTrackingValues
        var object = objArgs.object[0];
        var objectT = objArgs.object[1];
        var propertyName = objArgs.propName[0];
        ret = object[propertyName];
        extraTrackingValueArgNames.push("property value");
        extraTrackingValues.push(
          getObjectPropertyTrackingValue(object, propertyName)
        );

        lastMemberExpressionObjectValue = object;
        lastMemberExpressionObjectTrackingValue = objectT;
      } else if (opName === "numericLiteral") {
        ret = argValues[0];
      } else if (opName === operationTypes.objectExpression) {
        var obj = {};
        var methodProperties = {};
        for (var i = 0; i < args.length; i++) {
          var property = args[i];
          var propertyV = property.map(x => x[0]);
          var propertyT = property.map(x => x[1]);
          var [propertyType, propertyKey, propertyValue] = propertyV;
          var [propertyTypeT, propertyKeyT, propertyValueT] = propertyT;
          if (propertyType === "ObjectProperty") {
            var [object, property] = argValues;
            obj[propertyKey] = propertyValue;
            trackObjectPropertyAssignment(obj, propertyKey, {
              type: opName,
              argNames: ["property value"],
              argValues: [propertyValue],
              argTrackingValues: [propertyValueT],
              resVal: propertyValue
            });
          } else if (propertyType === "ObjectMethod") {
            var propertyKind = property[2];
            var fn = property[3];
            if (!methodProperties[propertyKey]) {
              methodProperties[propertyKey] = {
                enumerable: true,
                configurable: true
              };
            }
            methodProperties[propertyKey][propertyKind] = fn;
          }
        }
        Object.defineProperties(obj, methodProperties);

        lastOpTrackingResult = {
          type: opName,
          argValues: [],
          argTrackingValues: [],
          extraTrackingValues: [],
          resVal: obj
          // place: Error()
          //   .stack.split("\\\\n")
          //   .slice(2, 3)
        };

        return obj;
      } else {
        console.log("unhandled op", opName, args);
        throw Error("oh no");
      }

      trackingValue = {
        type: opName,
        argValues,
        argTrackingValues,
        extraTrackingValues,
        resVal: ret,
        argNames,
        astArgs,
        extraTrackingValueArgNames
        // place: Error()
        //   .stack.split("\\\\n")
        //   .slice(2, 3)
      };

      lastOpValueResult = ret;
      lastOpTrackingResult = trackingValue;

      return ret;
    };

    global[functionNames.getLastOperationValueResult] = function getLastOp() {
      var ret = lastOpValueResult;
      lastOpValueResult = null;
      return ret;
    };
    global[
      functionNames.getLastOperationTrackingResult
    ] = function getLastOp() {
      var ret = lastOpTrackingResult;
      lastOpTrackingResult = null;
      return ret;
    };
  })(__FUNCTION_NAMES__, __OPERATION_TYPES__);
}
