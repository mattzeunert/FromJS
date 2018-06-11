import { read } from "fs";
import OperationLog from "./OperationLog";
import KnownValues from "./KnownValues";

export interface ExecContext {
  getObjectPropertyTrackingValue: (
    object: any,
    propertyName: string | number
  ) => number;
  extraArgTrackingValues: any;
  lastMemberExpressionResult: [any, any];
  createOperationLog(any): number;
  operationTypes: any;
  loc: any;
  argTrackingInfo: any;
  global: any;
  registerEvalScript(evalScript: any): void;
  knownValues: KnownValues;
  trackObjectPropertyAssignment(
    object: any,
    propertyName: string | number,
    valueTrackingValue: number | OperationLog,
    nameTrackingValue?: number | OperationLog
  );
  lastReturnStatementResult: any;
  readonly lastOpTrackingResultWithoutResetting;
  readonly lastOpTrackingResult: any;
  runtimeArgs: any;
  readonly lastOperationType: string;
}
