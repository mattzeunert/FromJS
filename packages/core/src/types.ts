export type ValueTrackingValuePair = [any, number | null];

export interface CreateOperationLogArgs {
  operation: string;
  args?: any;
  astArgs?: any;
  result?: any;
  runtimeArgs?: any;
  loc?: any;
  value?: any;
  extraArgs?: any;
  index?: any;
}
