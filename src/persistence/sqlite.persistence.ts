import "reflect-metadata";
import Database from "better-sqlite3";
import { Persistence } from "./persistence";
import { Schema } from "@/definition/schema/schema";
import { Entity } from "@/entity";
import { PropertyType } from "@/entity";
import { Relation, RelationType } from "@/entity/relation";
import { DatabaseNotInitializedError } from "@/errors";
import { PARENT_METADATA_KEY } from "@/decorator/metadata-keys";

export class SqlitePersistence implements Persistence {
  private db: Database.Database | null = null;

  constructor(
    private readonly schema: Schema,
    private readonly dbPath: string = ":memory:",
  ) {}

  async initialize(): Promise<void> {
    this.db = new Database(this.dbPath);

    // Create tables for each entity
    for (const entity of this.schema.entities) {
      await this.createTableForEntity(entity);
    }

    // Create foreign keys after all tables are created
    for (const entity of this.schema.entities) {
      await this.createForeignKeysForEntity(entity);
    }
  }

  private async createTableForEntity(entity: Entity): Promise<void> {
    const columns: string[] = [];

    // Add property columns
    for (const property of entity.getProperties()) {
      const sqlType = this.mapPropertyTypeToSql(property.type);

      // If this is the id property, make it the primary key
      if (property.name === "id") {
        columns.push(`${property.name} ${sqlType} PRIMARY KEY`);
      } else {
        columns.push(`${property.name} ${sqlType}`);
      }
    }

    const createTableSql = `CREATE TABLE IF NOT EXISTS ${entity.name} (${columns.join(", ")})`;
    this.db!.exec(createTableSql);
  }

  private async createForeignKeysForEntity(entity: Entity): Promise<void> {
    // Handle parent relationships (many-to-one)
    for (const parent of entity.getParents()) {
      const foreignKeyColumn = `${parent.entity.name}_id`;
      const alterSql = `ALTER TABLE ${entity.name} ADD COLUMN ${foreignKeyColumn} TEXT REFERENCES ${parent.entity.name}(id)`;
      try {
        this.db!.exec(alterSql);
      } catch (e) {
        // Column might already exist
      }
    }

    // Handle children relationships (one-to-many) - managed from the child side
  }

  private mapPropertyTypeToSql(type: PropertyType): string {
    switch (type) {
      case PropertyType.STRING:
        return "TEXT";
      case PropertyType.NUMBER:
        return "REAL";
      case PropertyType.BOOLEAN:
        return "INTEGER"; // SQLite uses 0/1 for boolean
      case PropertyType.DATE:
        return "INTEGER"; // Store as Unix timestamp in milliseconds
      case PropertyType.ARRAY:
      case PropertyType.OBJECT:
        return "TEXT"; // Store as JSON
      case PropertyType.NULL:
      case PropertyType.UNDEFINED:
        return "TEXT";
      default:
        return "TEXT";
    }
  }

  async query(sql: string, params: any[] = []): Promise<any[]> {
    if (!this.db) {
      throw new DatabaseNotInitializedError();
    }
    const stmt = this.db.prepare(sql);
    const result = stmt.all(...params);
    return result;
  }

  async execute(sql: string, params: any[] = []): Promise<void> {
    if (!this.db) {
      throw new DatabaseNotInitializedError();
    }
    const stmt = this.db.prepare(sql);
    stmt.run(...params);
  }

  async close(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}
