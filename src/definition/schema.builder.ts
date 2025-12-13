import { Entity } from "@/entity";
import { Property } from "@/entity";
import { PropertyType } from "@/entity";
import { Collection } from "@/entity";
import { Source } from "@/source";

export class SchemaBuilder {
  private entities: Map<string, Entity> = new Map();
  private collections: Map<string, Collection<any>> = new Map();

  entity(
    name: string,
    builder?: (entity: EntityBuilder) => EntityBuilder,
  ): SchemaBuilder {
    const entityBuilder = new EntityBuilder(name);
    const builtEntity = builder
      ? builder(entityBuilder).build()
      : entityBuilder.build();
    this.entities.set(name, builtEntity);
    return this;
  }

  collection<T extends Entity>(
    name: string,
    entityName: string,
    source: Source,
  ): SchemaBuilder {
    const entity = this.entities.get(entityName);
    if (!entity) {
      throw new Error(
        `Entity "${entityName}" not found. Define it first with entity().`,
      );
    }
    this.collections.set(name, new Collection<T>(entity, source));
    return this;
  }

  getEntity(name: string): Entity | undefined {
    return this.entities.get(name);
  }

  getCollection<T extends Entity>(name: string): Collection<T> | undefined {
    return this.collections.get(name) as Collection<T> | undefined;
  }

  getEntities(): Map<string, Entity> {
    return new Map(this.entities);
  }

  getCollections(): Map<string, Collection<any>> {
    return new Map(this.collections);
  }

  hasEntity(name: string): boolean {
    return this.entities.has(name);
  }

  hasCollection(name: string): boolean {
    return this.collections.has(name);
  }

  build() {
    return {
      entities: this.getEntities(),
      collections: this.getCollections(),
    };
  }
}

export class EntityBuilder {
  private entity: Entity;

  constructor(name: string) {
    this.entity = new Entity(name);
  }

  property(name: string, type: PropertyType): EntityBuilder {
    this.entity.addProperty(new Property(name, type));
    return this;
  }

  child(name: string): EntityBuilder {
    const childBuilder = new EntityBuilder(name);
    this.entity.addChild(childBuilder.entity);
    return childBuilder;
  }

  children(...entities: Entity[]): EntityBuilder {
    this.entity.addChildren(...entities);
    return this;
  }

  getEntity(): Entity {
    return this.entity;
  }

  build(): Entity {
    return this.entity;
  }
}
