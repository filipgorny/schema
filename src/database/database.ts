import "reflect-metadata";
import { Persistence } from "@/persistence/persistence";
import { Schema } from "@/definition/schema/schema";
import { Query } from "@/query/query";
import { Collection } from "./collection";
import { QueryTranslator } from "@/sql/query-translator";
import {
  ENTITY_METADATA_KEY,
  PARENT_METADATA_KEY,
} from "@/decorator/metadata-keys";
import { InvalidEntityInstanceError, EntityNotFoundError } from "@/errors";

export class Database {
  constructor(
    private readonly persistence: Persistence,
    private readonly schema: Schema,
  ) {}

  async initialize(): Promise<void> {
    await this.persistence.initialize();
  }

  async get<T>(query: Query): Promise<Collection<T>> {
    const entity = this.schema.getEntity(query.entityName);
    if (!entity) {
      throw new EntityNotFoundError(query.entityName);
    }

    const { sql, params } = QueryTranslator.translateToSql(query);
    const results = await this.persistence.query(sql, params);

    return new Collection<T>(entity, results, this);
  }

  async save(value: any): Promise<void> {
    const classType = value.constructor;

    // Try to get entity name from @entity() decorator first
    let entityName = Reflect.getMetadata(ENTITY_METADATA_KEY, classType);

    // If no decorator, try to find entity in schema by classType
    if (!entityName) {
      const entityByClass = this.schema
        .getEntities()
        .find((e) => e.classType === classType);
      if (entityByClass) {
        entityName = entityByClass.name;
      }
    }

    if (!entityName) {
      throw new InvalidEntityInstanceError(value);
    }

    const entity = this.schema.getEntity(entityName);
    if (!entity) {
      throw new EntityNotFoundError(entityName);
    }

    // Extract values from entity properties
    const values: any = { id: value.id };
    for (const property of entity.getProperties()) {
      let val = value[property.name];
      // Convert Date to Unix timestamp (milliseconds) for SQLite
      if (val instanceof Date) {
        val = val.getTime();
      }
      values[property.name] = val;
    }

    // Get parent fields metadata and extract FK values from parent properties
    const parentMetadata: any[] =
      Reflect.getMetadata(PARENT_METADATA_KEY, classType) || [];

    for (const parentMeta of parentMetadata) {
      const parentProp = parentMeta.propertyKey;
      const parentInstance = value[parentProp];

      if (parentInstance && parentInstance.id) {
        // Add FK to values: e.g., "car" -> "Car_id"
        const foreignKeyName =
          parentProp.charAt(0).toUpperCase() + parentProp.slice(1) + "_id";
        values[foreignKeyName] = parentInstance.id;
      }
    }

    // Generate INSERT SQL
    const fields = Object.keys(values);
    const placeholders = fields.map(() => "?").join(", ");
    const sql = `INSERT OR REPLACE INTO ${entityName} (${fields.join(", ")}) VALUES (${placeholders})`;
    const params = fields.map((f) => values[f]);

    await this.persistence.execute(sql, params);
  }

  async delete(value: any): Promise<void> {
    const classType = value.constructor;

    // Try to get entity name from @entity() decorator first
    let entityName = Reflect.getMetadata(ENTITY_METADATA_KEY, classType);

    // If no decorator, try to find entity in schema by classType
    if (!entityName) {
      const entityByClass = this.schema
        .getEntities()
        .find((e) => e.classType === classType);
      if (entityByClass) {
        entityName = entityByClass.name;
      }
    }

    if (!entityName) {
      throw new InvalidEntityInstanceError(value);
    }

    const entity = this.schema.getEntity(entityName);
    if (!entity) {
      throw new EntityNotFoundError(entityName);
    }

    // Generate DELETE SQL
    const sql = `DELETE FROM ${entityName} WHERE id = ?`;
    const params = [value.id];

    await this.persistence.execute(sql, params);
  }

  async close(): Promise<void> {
    await this.persistence.close();
  }
}
