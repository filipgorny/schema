import { Query } from "@/query/query";
import { Filter } from "@/query/filter";
import { LogicOperator } from "@/query/logic-operator";
import { FilterTranslator, SqlResult } from "./filter-translator";

export class QueryTranslator {
  static translateToSql(query: Query): SqlResult {
    let sql = `SELECT * FROM ${query.entityName}`;
    const params: any[] = [];

    // Add WHERE clause
    const filters = query.getFilters();
    if (filters.length > 0) {
      const whereResults = filters.map((filter) => {
        if (filter instanceof Filter) {
          return FilterTranslator.translateFilter(filter);
        } else if (filter instanceof LogicOperator) {
          return FilterTranslator.translateLogicOperator(filter);
        }
        return { sql: "", params: [] };
      });

      const whereSqls = whereResults.map((r) => r.sql).filter((s) => s);
      const whereParams = whereResults.flatMap((r) => r.params);

      if (whereSqls.length > 0) {
        sql += ` WHERE ${whereSqls.join(" AND ")}`;
        params.push(...whereParams);
      }
    }

    // Add ORDER BY clause
    const orderBy = query.getOrderBy();
    if (orderBy) {
      sql += ` ORDER BY ${orderBy.field} ${orderBy.direction}`;
    }

    // Add LIMIT clause
    const limit = query.getLimit();
    if (limit !== undefined) {
      sql += ` LIMIT ${limit}`;
    }

    // Add OFFSET clause
    const offset = query.getOffset();
    if (offset !== undefined) {
      sql += ` OFFSET ${offset}`;
    }

    return { sql, params };
  }
}
