import { Entity } from "@/entity";

export class Schema {
  constructor(public readonly entities: Entity[]) {}

  getEntity(name: string): Entity | undefined {
    return this.entities.find((e) => e.name === name);
  }

  getEntities(): Entity[] {
    return [...this.entities];
  }

  hasEntity(name: string): boolean {
    return this.entities.some((e) => e.name === name);
  }

  getEntityNames(): string[] {
    return this.entities.map((e) => e.name);
  }
}
