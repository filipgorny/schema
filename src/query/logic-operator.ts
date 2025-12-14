import { Filter } from "./filter";

export enum LogicType {
  AND = "AND",
  OR = "OR",
  NOT = "NOT",
}

export class LogicOperator {
  constructor(
    public readonly type: LogicType,
    public readonly conditions: (Filter | LogicOperator)[],
  ) {}
}
