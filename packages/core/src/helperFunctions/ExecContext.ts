import OperationLog from "./OperationLog";
import KnownValues from "./KnownValues";

export interface ExecContext {
  getObjectPropertyTrackingValue: (
    object: any,
    propertyName: string | number
  ) => number;
  getObjectPropertyNameTrackingValue: (
    object: any,
    propertyName: string | number
  ) => number;
  lastMemberExpressionResult: [any, any];
  createOperationLog(any): number;
  hasInstrumentationFunction: boolean;
  operationTypes: any;
  argTrackingInfo: any;
  global: any;
  registerEvalScript(evalScript: any): void;
  knownValues: KnownValues;
  trackObjectPropertyAssignment(
    object: any,
    propertyName: string | number,
    valueTrackingValue: null | number | OperationLog,
    nameTrackingValue?: null | number | OperationLog
  );
  lastReturnStatementResult: any;
  objectHasPropertyTrackingData: (obj: any) => boolean;
  readonly lastOpTrackingResultWithoutResetting;
  readonly lastOpTrackingResult: any;
  readonly lastOperationType: string;
}
