import { v4 as uuidv4 } from "uuid";
import { Property } from "./property";
import { EntityReference } from "./entity-reference";

export class Entity {
  public readonly id: string;
  public name: string;
  private properties: Property[] = [];
  private children: EntityReference[] = [];
  private parent: EntityReference | null = null;

  constructor(name: string) {
    this.id = uuidv4();
    this.name = name;
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

  setParent(entity: Entity): void {
    this.parent = new EntityReference(entity);
  }

  getParent(): EntityReference | null {
    return this.parent;
  }

  removeParent(): void {
    this.parent = null;
  }

  hasParent(): boolean {
    return this.parent !== null;
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
