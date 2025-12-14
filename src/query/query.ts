import { Filter, FilterOperator } from "./filter";
import { LogicOperator, LogicType } from "./logic-operator";

export class Query {
  private filters: (Filter | LogicOperator)[] = [];
  private limitValue?: number;
  private offsetValue?: number;
  private orderByField?: string;
  private orderDirection?: "ASC" | "DESC";

  constructor(public readonly entityName: string) {}

  where(field: string, operator: FilterOperator, value?: any): Query {
    this.filters.push(new Filter(field, operator, value));
    return this;
  }

  equals(field: string, value: any): Query {
    return this.where(field, FilterOperator.EQUALS, value);
  }

  notEquals(field: string, value: any): Query {
    return this.where(field, FilterOperator.NOT_EQUALS, value);
  }

  greaterThan(field: string, value: any): Query {
    return this.where(field, FilterOperator.GREATER_THAN, value);
  }

  greaterThanOrEqual(field: string, value: any): Query {
    return this.where(field, FilterOperator.GREATER_THAN_OR_EQUAL, value);
  }

  lessThan(field: string, value: any): Query {
    return this.where(field, FilterOperator.LESS_THAN, value);
  }

  lessThanOrEqual(field: string, value: any): Query {
    return this.where(field, FilterOperator.LESS_THAN_OR_EQUAL, value);
  }

  like(field: string, pattern: string): Query {
    return this.where(field, FilterOperator.LIKE, pattern);
  }

  in(field: string, values: any[]): Query {
    return this.where(field, FilterOperator.IN, values);
  }

  notIn(field: string, values: any[]): Query {
    return this.where(field, FilterOperator.NOT_IN, values);
  }

  isNull(field: string): Query {
    return this.where(field, FilterOperator.IS_NULL);
  }

  isNotNull(field: string): Query {
    return this.where(field, FilterOperator.IS_NOT_NULL);
  }

  and(...conditions: (Filter | LogicOperator)[]): Query {
    this.filters.push(new LogicOperator(LogicType.AND, conditions));
    return this;
  }

  or(...conditions: (Filter | LogicOperator)[]): Query {
    this.filters.push(new LogicOperator(LogicType.OR, conditions));
    return this;
  }

  not(condition: Filter | LogicOperator): Query {
    this.filters.push(new LogicOperator(LogicType.NOT, [condition]));
    return this;
  }

  limit(value: number): Query {
    this.limitValue = value;
    return this;
  }

  offset(value: number): Query {
    this.offsetValue = value;
    return this;
  }

  orderBy(field: string, direction: "ASC" | "DESC" = "ASC"): Query {
    this.orderByField = field;
    this.orderDirection = direction;
    return this;
  }

  getFilters(): (Filter | LogicOperator)[] {
    return [...this.filters];
  }

  getLimit(): number | undefined {
    return this.limitValue;
  }

  getOffset(): number | undefined {
    return this.offsetValue;
  }

  getOrderBy(): { field: string; direction: "ASC" | "DESC" } | undefined {
    if (this.orderByField) {
      return {
        field: this.orderByField,
        direction: this.orderDirection || "ASC",
      };
    }
    return undefined;
  }
}
