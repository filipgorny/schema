import { Filter, FilterOperator } from "@/query/filter";
import { LogicOperator, LogicType } from "@/query/logic-operator";

export interface SqlResult {
  sql: string;
  params: any[];
}

export class FilterTranslator {
  static translateFilter(filter: Filter): SqlResult {
    const sqlOperator = this.mapOperatorToSql(filter.operator);

    if (
      filter.operator === FilterOperator.IS_NULL ||
      filter.operator === FilterOperator.IS_NOT_NULL
    ) {
      return { sql: `${filter.field} ${sqlOperator}`, params: [] };
    }

    if (
      filter.operator === FilterOperator.IN ||
      filter.operator === FilterOperator.NOT_IN
    ) {
      const placeholders = filter.value.map(() => "?").join(", ");
      return {
        sql: `${filter.field} ${sqlOperator} (${placeholders})`,
        params: filter.value,
      };
    }

    return {
      sql: `${filter.field} ${sqlOperator} ?`,
      params: [filter.value],
    };
  }

  static translateLogicOperator(logic: LogicOperator): SqlResult {
    const results = logic.conditions.map((condition) => {
      if (condition instanceof Filter) {
        return this.translateFilter(condition);
      } else {
        return this.translateLogicOperator(condition);
      }
    });

    const sqls = results.map((r) => `(${r.sql})`);
    const params = results.flatMap((r) => r.params);

    if (logic.type === LogicType.NOT) {
      return { sql: `NOT ${sqls[0]}`, params };
    }

    return { sql: sqls.join(` ${logic.type} `), params };
  }

  private static mapOperatorToSql(operator: FilterOperator): string {
    const mapping: Record<FilterOperator, string> = {
      [FilterOperator.EQUALS]: "=",
      [FilterOperator.NOT_EQUALS]: "!=",
      [FilterOperator.GREATER_THAN]: ">",
      [FilterOperator.GREATER_THAN_OR_EQUAL]: ">=",
      [FilterOperator.LESS_THAN]: "<",
      [FilterOperator.LESS_THAN_OR_EQUAL]: "<=",
      [FilterOperator.LIKE]: "LIKE",
      [FilterOperator.IN]: "IN",
      [FilterOperator.NOT_IN]: "NOT IN",
      [FilterOperator.IS_NULL]: "IS NULL",
      [FilterOperator.IS_NOT_NULL]: "IS NOT NULL",
    };
    return mapping[operator];
  }
}
