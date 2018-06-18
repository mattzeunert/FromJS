import { SerializedValue } from "../../core/src/helperFunctions/OperationLog";

// TODO: might be useful to merge this with BE types

class FESerializedValue implements SerializedValue {
  length: any;
  type: string;
  keys?: string[];
  primitive: number | null | string;
  knownValue: string | null;
  knownTypes: null | any[];

  constructor(data) {
    Object.keys(data).forEach(key => {
      this[key] = data[key];
    });
  }

  getTruncatedUIString() {
    if (["string", "null", "number", "boolean"].includes(this.type)) {
      let ret = this.primitive + "";
      if (ret.length > 200) {
        return ret.slice(0, 200);
      } else {
        return ret;
      }
    }

    console.log(
      "keys arent' stored right now (easy to enable by might be bad for perf) so just showing type"
    );
    return "[" + this.type + "]";

    // return "[" + this.type + "]" + " {" + this.keys.join(", ") + "}";
  }
}

export default class FEOperationLog {
  result: FESerializedValue;
  constructor(operationLogData) {
    Object.keys(operationLogData).forEach(key => {
      if (key === "result") {
        this.result = new FESerializedValue(operationLogData[key]);
      } else {
        this[key] = operationLogData[key];
      }
    });
  }
}
