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
    console.log("makecall", {
      fn: fn.toString(),
      args: JSON.stringify(args, null, 4)
    });
    // console.log({fn, object, objectKey, args})
    if (fn) {
      // not called as part of a member expresison
      object = this;
    } else {
      fn = object[objectKey];
    }
    argTrackingInfo = args.map(arg => arg[1]);
    var ret = fn.apply(object, args.map(arg => arg[0]));
    argTrackingInfo = null;

    return ret;
  };

  global[
    functionNames.getFunctionArgTrackingInfo
  ] = function getArgTrackingInfo(index) {
    return argTrackingInfo[index];
  };

  global.getTrackingAndNormalValue = function(value) {
    return {
      normal: value,
      tracking: argTrackingInfo[0]
    };
  };

  var lastOpResult = null;
  global[functionNames.doOperation] = function op(opName, ...args) {
    console.log(opName, JSON.stringify(args, null, 4));
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

    lastOpResult = trackingValue;
    return ret;
  };

  global[functionNames.getLastOperationTrackingResult] = function getLastOp() {
    return lastOpResult;
  };

  var meta = [];
  var identicalMappings = {};
  var contextIds = 1;
  var allValues = {};
  function startCallAndGetContextId(paramNames) {
    var contextId = contextIds++;
    paramNames.forEach((paramName, i) => {
      var callingWith = global.callingWith[i];
      identicalMappings[contextId + "_" + paramName] =
        callingWith[1] + "_" + callingWith[0];
    });
    console.log({ identicalMappings });
    return contextId;
  }
  function assignVar(contextId, identifier, info, infoId) {
    console.log("assignVar", { contextId, identifier, info, infoId });
    if (!meta[contextId]) {
      meta[contextId] = {};
    }
    meta[contextId][identifier] = infoId;
    return info;
  }
  function stringLiteral(str, contextId, codeId) {
    console.log("stringliteral", str, codeId);
    return str;
  }
  function add(a, b, contextId, addMeta, leftmeta, rightmeta) {
    console.log("add", { contextId, addMeta, leftmeta, rightmeta });
    return a + b;
  }
  function beforeCall(fnName, argInfo) {
    console.log("Calling ", fnName, "with", argInfo);
    global.callingWith = argInfo;
  }
  var lastRet;
  var retWholeId;
  function beforeReturn(ret, contextId, valueId) {
    console.log("beforereturn", ret, contextId, valueId);
    retWholeId = contextId + "_" + valueId;
    lastRet = ret;
  }
  function afterCall(contextId, valueId) {
    console.log("aftercall", arguments);
    identicalMappings[retWholeId] = contextId + "_" + valueId;
    console.log("IDENT", identicalMappings);
    return lastRet;
  }

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

  function iV(type, ivLoc, rawArgs) {
    function getArg(arg) {
      return {
        value: arg[0],
        // contextId: arg[1],
        // loc: arg[2],
        key: arg[1] + "_" + arg[2]
      };
    }
    var args = rawArgs.map(getArg);
    // console.log(args)
    allValues[args[0].key] = {
      type,
      args
    };
    var ret;
    if (type === "add") {
      ret = args[0].value + args[1].value;
    } else if (type === "stringLiteral") {
      ret = args[0].value;
    } else if (type === "identifier") {
      ret = args[0].value;
    } else if (type === "numberLiteral") {
      ret = args[0].value;
    } else {
      throw "unhandled: " + type;
    }
    allValues[ivLoc[0] + "_" + ivLoc[1]] = {
      type,
      args,
      value: ret
    };
    return ret;
  }
})(__FUNCTION_NAMES__, __OPERATION_TYPES__);
