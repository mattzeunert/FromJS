declare var __FUNCTION_NAMES__, __OPERATION_TYPES__, __OPERATIONS_EXEC__;
export default function() {
  (function(
    functionNames,
    operationTypes,
    operationsExec,
    operationArrayArguments
  ) {
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

        args;
        if (operationArrayArguments[opName]) {
          operationArrayArguments[opName].forEach(arrayArgName => {});
        }
        args = Object.values(objArgs);
        argNames = Object.keys(objArgs);
      } else {
        argNames = Array.from(new Array(args.length)).map(
          a => "unknown arg name"
        );
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
      var extraTrackingValues = {};
      var ret;
      if (operationsExec[opName]) {
        var setters = {
          lastMemberExpressionResult: arr => {
            lastMemberExpressionObjectValue = arr[0];
            lastMemberExpressionObjectTrackingValue = arr[1];
          },
          extraArgTrackingValues: values => {
            extraTrackingValues = values;
          },
          argTrackingInfo(info) {
            argTrackingInfo = info;
          }
        };
        ret = operationsExec[opName](objArgs, astArgs, {
          setters,
          operationTypes,
          getObjectPropertyTrackingValue,
          trackObjectPropertyAssignment,
          getLastOpTrackingResult() {
            return lastOpTrackingResult;
          }
        });
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
      } else if (opName === "numericLiteral") {
        ret = argValues[0];
      } else {
        console.log("unhandled op", opName, args);
        throw Error("oh no");
      }

      trackingValue = {
        type: opName,
        argValues,
        objArgs,
        argTrackingValues,
        extraArgs: extraTrackingValues,
        resVal: ret,
        argNames,
        astArgs
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
  })(
    __FUNCTION_NAMES__,
    __OPERATION_TYPES__,
    __OPERATIONS_EXEC__,
    __OPERATION_ARRAY_ARGUMENTS__
  );
}
