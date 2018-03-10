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

  var lastOpValueResult = null;
  var lastOpTrackingResult = null;
  global[functionNames.doOperation] = function op(opName, ...args) {
    // console.log(opName, JSON.stringify(args, null, 4));
    var value, trackingValue;
    var argValues = args.map(arg => arg[0]);
    var argTrackingValues = args.map(arg => arg[1]);
    trackingValue = {
      type: opName,
      argValues,
      argTrackingValues
      // place: Error()
      //   .stack.split("\\n")
      //   .slice(2, 3)
    };
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
    } else if (opName === "numericLiteral") {
      ret = argValues[0];
    } else {
      console.log("unhandled op", opName, args);
      throw Error("oh no");
    }

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
