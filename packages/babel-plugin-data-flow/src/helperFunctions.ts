(function(functionNames, operationTypes) {
  var global = Function("return this")();
  if (global.__didInitializeDataFlowTracking) {
    return;
  }
  global.__didInitializeDataFlowTracking = true;

  var argTrackingInfo = null;
  global[functionNames.makeCall] = function _makeCall(
    fn,
    object,
    objectKey,
    args
  ) {
    // console.log("makecall", {
    //   fn: fn.toString(),
    //   args: JSON.stringify(args, null, 4)
    // });
    // console.log({fn, object, objectKey, args})
    if (fn) {
      // not called as part of a member expresison
      object = this;
    } else if (typeof object !== "undefined") {
      fn = object[objectKey];
    } else {
      debugger;
      throw Error("Can't find which function to call");
    }
    argTrackingInfo = args.map(arg => arg[1]);
    var ret = fn.apply(object, args.map(arg => arg[0]));
    argTrackingInfo = null;

    return ret;
  };

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
    return {
      normal: value,
      tracking: argTrackingInfo[0]
    };
  };

  const objTrackingMap = new Map();
  function trackObjectPropertyAssignment(obj, propName, trackingValue) {
    // console.log("setting to", obj, propName, trackingValue);
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

  var lastOpValueResult = null;
  var lastOpTrackingResult = null;
  global[functionNames.doOperation] = function op(opName, ...args) {
    // console.log(opName, JSON.stringify(args, null, 4));
    var value, trackingValue;
    var argValues = args.map(arg => arg[0]);
    var argTrackingValues = args.map(arg => arg[1]);
    var extraTrackingValues = [];
    var ret;
    if (opName === "stringLiteral") {
      ret = argValues[0];
    } else if (opName === "identifier") {
      ret = argValues[0];
    } else if (opName === "returnStatement") {
      ret = argValues[0];
    } else if (opName === "evaluateAssignment") {
      ret = argValues[0];
    } else if (opName === operationTypes.binaryExpression) {
      var [operation, left, right] = argValues;
      if (operation === "+") {
        ret = left + right;
      } else {
        throw Error("unknown bine exp operation");
      }
    } else if (opName === operationTypes.objectPropertyAssignment) {
      let [obj, propName, value] = argValues;
      let [objT, propNameT, valueT] = argTrackingValues;
      ret = obj[propName] = value;
      trackObjectPropertyAssignment(obj, propName, {
        type: opName,
        argValues: [],
        argTrackingValues: [valueT]
      });
    } else if (opName === "memberExpression") {
      var [object, property] = argValues;
      ret = object[property];
      extraTrackingValues.push(
        getObjectPropertyTrackingValue(object, property)
      );
    } else if (opName === "numericLiteral") {
      ret = argValues[0];
    } else if (opName === operationTypes.objectExpression) {
      var obj = {};
      var methodProperties = {};
      for (var i = 0; i < args.length; i++) {
        var property = args[i];
        // console.log(property);
        var propertyV = property.map(x => x[0]);
        var propertyT = property.map(x => x[1]);
        var [propertyType, propertyKey, propertyValue] = propertyV;
        var [propertyTypeT, propertyKeyT, propertyValueT] = propertyT;
        if (propertyType === "ObjectProperty") {
          var [object, property] = argValues;
          obj[propertyKey] = propertyValue;
          trackObjectPropertyAssignment(obj, propertyKey, {
            type: opName,
            argValues: [],
            argTrackingValues: [propertyValueT]
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
      return obj;
    } else {
      console.log("unhandled op", opName, args);
      throw Error("oh no");
    }

    trackingValue = {
      type: opName,
      argValues,
      argTrackingValues,
      extraTrackingValues
      // place: Error()
      //   .stack.split("\\n")
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
  global[functionNames.getLastOperationTrackingResult] = function getLastOp() {
    var ret = lastOpTrackingResult;
    lastOpTrackingResult = null;
    return ret;
  };

  function inspect(value, n) {
    // console.log("Should inspect", value, n, JSON.stringify(argTrackingInfo, null, 4))
    console.log("#### should inspect", value);
    inspectInner(value, argTrackingInfo[0], n);
  }

  function inspectInner(value, trackingValue, charIndex) {
    console.log(value, "char", value[charIndex], trackingValue.type);
    if (trackingValue.type === "identifier") {
      inspectInner(value, trackingValue.args[1], charIndex);
    } else if (trackingValue.type === "plusBinEx") {
      var [leftValue, leftTrackingValue] = trackingValue.args[0];
      var [rightValue, rightTrackingValue] = trackingValue.args[1];
      leftValue += "";
      rightValue += "";
      if (charIndex < leftValue.length) {
        inspectInner(leftValue, leftTrackingValue, charIndex);
      } else {
        charIndex -= leftValue.length;
        inspectInner(rightValue, rightTrackingValue, charIndex);
      }
    }
  }
})(__FUNCTION_NAMES__, __OPERATION_TYPES__);
