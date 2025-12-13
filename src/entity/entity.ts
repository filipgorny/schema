import "reflect-metadata";
import { v4 as uuidv4 } from "uuid";
import { Property } from "./property";
import { EntityReference } from "./entity-reference";
import {
  ENTITY_METADATA_KEY,
  PROPERTIES_METADATA_KEY,
  CHILDREN_METADATA_KEY,
  PARENT_METADATA_KEY,
} from "@/decorator/metadata-keys";
import type { PropertyMetadata } from "@/decorator";

export class Entity {
  public readonly id: string;
  private properties: Property[] = [];
  private children: EntityReference[] = [];
  private parents: EntityReference[] = [];

  constructor(public readonly name: string) {
    this.id = uuidv4();
  }

  static from(target: any, entityCache: Map<any, Entity> = new Map()): Entity {
    // Check cache to avoid circular dependencies
    if (entityCache.has(target)) {
      return entityCache.get(target)!;
    }

    // Get entity name from metadata
    const entityName: string = Reflect.getMetadata(ENTITY_METADATA_KEY, target);
    if (!entityName) {
      throw new Error(`Class ${target.name} is not decorated with @entity()`);
    }

    // Create entity
    const entity = new Entity(entityName);

    // Add to cache immediately to handle circular references
    entityCache.set(target, entity);

    // Get properties from metadata
    const properties: PropertyMetadata[] =
      Reflect.getMetadata(PROPERTIES_METADATA_KEY, target) || [];
    properties.forEach((prop) => {
      entity.addProperty(new Property(prop.name, prop.type));
    });

    // Get children metadata
    const childrenMetadata: any[] =
      Reflect.getMetadata(CHILDREN_METADATA_KEY, target) || [];
    childrenMetadata.forEach((childMeta: any) => {
      if (childMeta.entityClass) {
        const childEntity = Entity.from(childMeta.entityClass, entityCache);
        entity.addChild(childEntity);
      }
    });

    // Get parent metadata
    const parentMetadata: any[] =
      Reflect.getMetadata(PARENT_METADATA_KEY, target) || [];
    parentMetadata.forEach((parentMeta: any) => {
      if (parentMeta.entityClass) {
        const parentEntity = Entity.from(parentMeta.entityClass, entityCache);
        entity.addParent(parentEntity);
      }
    });

    return entity;
  }

  addProperty(property: Property): void {
    this.properties.push(property);
  }

  getProperties(): Property[] {
    return [...this.properties];
  }

  getProperty(name: string): Property | undefined {
    return this.properties.find((prop) => prop.name === name);
  }

  removeProperty(name: string): boolean {
    const index = this.properties.findIndex((prop) => prop.name === name);
    if (index !== -1) {
      this.properties.splice(index, 1);
      return true;
    }
    return false;
  }

  hasProperty(name: string): boolean {
    return this.properties.some((prop) => prop.name === name);
  }

  addParent(entity: Entity): void {
    this.parents.push(new EntityReference(entity));
  }

  addParents(...entities: Entity[]): void {
    entities.forEach((entity) =>
      this.parents.push(new EntityReference(entity)),
    );
  }

  getParents(): EntityReference[] {
    return [...this.parents];
  }

  getParent(id: string): EntityReference | undefined {
    return this.parents.find((parent) => parent.entity.id === id);
  }

  removeParent(id: string): boolean {
    const index = this.parents.findIndex((parent) => parent.entity.id === id);
    if (index !== -1) {
      this.parents.splice(index, 1);
      return true;
    }
    return false;
  }

  hasParent(id: string): boolean {
    return this.parents.some((parent) => parent.entity.id === id);
  }

  getParentsCount(): number {
    return this.parents.length;
  }

  addChild(entity: Entity): void {
    this.children.push(new EntityReference(entity));
  }

  addChildren(...entities: Entity[]): void {
    entities.forEach((entity) =>
      this.children.push(new EntityReference(entity)),
    );
  }

  getChildren(): EntityReference[] {
    return [...this.children];
  }

  getChild(id: string): EntityReference | undefined {
    return this.children.find((child) => child.entity.id === id);
  }

  removeChild(id: string): boolean {
    const index = this.children.findIndex((child) => child.entity.id === id);
    if (index !== -1) {
      this.children.splice(index, 1);
      return true;
    }
    return false;
  }

  hasChild(id: string): boolean {
    return this.children.some((child) => child.entity.id === id);
  }

  getChildrenCount(): number {
    return this.children.length;
  }
}
