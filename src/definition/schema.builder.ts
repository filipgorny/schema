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
    classType: any,
    nameOrBuilder?: string | ((entity: EntityBuilder) => EntityBuilder),
    builder?: (entity: EntityBuilder) => EntityBuilder,
  ): SchemaBuilder {
    let entityName: string | undefined;
    let builderFn: ((entity: EntityBuilder) => EntityBuilder) | undefined;

    // Parse overloaded arguments
    if (typeof nameOrBuilder === "string") {
      entityName = nameOrBuilder;
      builderFn = builder;
    } else {
      builderFn = nameOrBuilder;
    }

    const entityBuilder = new EntityBuilder(classType, entityName);
    const builtEntity = builderFn
      ? builderFn(entityBuilder).build()
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
    // Resolve parent/children relationships before creating schema
    this.resolveRelationships();
    return new Schema(this.getEntities());
  }

  private resolveRelationships(): void {
    // Build a map of entity names to entities for quick lookup
    const entityMap = new Map<string, Entity>();
    this.entities.forEach((entity) => {
      entityMap.set(entity.name, entity);
    });

    // Resolve parent and children relationships
    this.entities.forEach((entity) => {
      const parentMetadata = entity.getParentMetadata();
      const childrenMetadata = entity.getChildrenMetadata();

      // For each parent metadata, find the parent entity and add relationship
      parentMetadata.forEach((parentMeta: any) => {
        // Derive parent entity name from property name (e.g., "car" -> "Car")
        const parentPropertyName = parentMeta.propertyKey;
        const parentEntityName =
          parentPropertyName.charAt(0).toUpperCase() +
          parentPropertyName.slice(1);

        const parentEntity = entityMap.get(parentEntityName);
        if (parentEntity) {
          entity.addParent(parentEntity);
        }
      });

      // For each children metadata, find the child entity and add relationship
      childrenMetadata.forEach((childMeta: any) => {
        // Derive child entity name from property name (e.g., "rentals" -> "Rental")
        const childPropertyName = childMeta.propertyKey;
        let childEntityName = childPropertyName;
        // Remove trailing 's' for simple pluralization
        if (childEntityName.endsWith("s")) {
          childEntityName = childEntityName.slice(0, -1);
        }
        childEntityName =
          childEntityName.charAt(0).toUpperCase() + childEntityName.slice(1);

        const childEntity = entityMap.get(childEntityName);
        if (childEntity) {
          entity.addChild(childEntity);
        }
      });
    });
  }
}
