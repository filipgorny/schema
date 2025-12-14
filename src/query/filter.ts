export enum FilterOperator {
  EQUALS = "EQUALS",
  NOT_EQUALS = "NOT_EQUALS",
  GREATER_THAN = "GREATER_THAN",
  GREATER_THAN_OR_EQUAL = "GREATER_THAN_OR_EQUAL",
  LESS_THAN = "LESS_THAN",
  LESS_THAN_OR_EQUAL = "LESS_THAN_OR_EQUAL",
  LIKE = "LIKE",
  IN = "IN",
  NOT_IN = "NOT_IN",
  IS_NULL = "IS_NULL",
  IS_NOT_NULL = "IS_NOT_NULL",
}

export class Filter {
  constructor(
    public readonly field: string,
    public readonly operator: FilterOperator,
    public readonly value?: any,
  ) {}
}
