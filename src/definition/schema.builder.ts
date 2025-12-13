import "reflect-metadata";
import { Entity } from "@/entity";
import { ClassType } from "@filipgorny/types";
import { ENTITY_METADATA_KEY } from "@/decorator/metadata-keys";
import { ClassHasNotEntityDefinitionError } from "@/errors";
import { EntityBuilder } from "./entity.builder";
import { Schema } from "./schema/schema";

export class SchemaBuilder {
  private entities: Entity[] = [];

  entity(
    name: string,
    builder?: (entity: EntityBuilder) => EntityBuilder,
  ): SchemaBuilder {
    const entityBuilder = new EntityBuilder(name);
    const builtEntity = builder
      ? builder(entityBuilder).build()
      : entityBuilder.build();
    this.entities.push(builtEntity);
    return this;
  }

  register(classType: ClassType): SchemaBuilder {
    // Check if class has @entity() decorator
    const entityName = Reflect.getMetadata(ENTITY_METADATA_KEY, classType);
    if (!entityName) {
      throw new ClassHasNotEntityDefinitionError(classType.name);
    }

    // Create entity from class
    const entity = Entity.from(classType);
    this.entities.push(entity);
    return this;
  }

  getEntity(name: string): Entity | undefined {
    return this.entities.find((e) => e.name === name);
  }

  getEntities(): Entity[] {
    return [...this.entities];
  }

  hasEntity(name: string): boolean {
    return this.entities.some((e) => e.name === name);
  }

  build(): SchemaBuilder {
    return new SchemaBuilder();
  }

  getSchema(): Schema {
    return new Schema(this.getEntities());
  }
}
