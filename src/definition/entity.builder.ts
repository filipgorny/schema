import { Entity, Property, PropertyType } from "@/entity";

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
    return new EntityBuilder(name);
  }

  children(...entities: Entity[]): EntityBuilder {
    this.entity.addChildren(...entities);
    return this;
  }

  build(): Entity {
    return this.entity;
  }
}
