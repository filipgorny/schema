import { Entity, PropertyType } from "@/entity";
import { EntityProxy } from "./entity-proxy";
import type { Database } from "./database";

export class Collection<T> implements Iterable<T> {
  constructor(
    private readonly entity: Entity,
    private readonly data: any[],
    private readonly database?: Database,
  ) {}

  *[Symbol.iterator](): Iterator<T> {
    for (const item of this.data) {
      yield this.instantiate(item);
    }
  }

  private instantiate(data: any): T {
    if (!this.entity.classType) {
      return data as T;
    }

    const instance = new this.entity.classType();

    // Convert property values based on their types
    for (const property of this.entity.getProperties()) {
      const value = data[property.name];

      if (value === null || value === undefined) {
        instance[property.name] = value;
        continue;
      }

      // Convert DATE properties from ISO string/timestamp to Date object
      if (property.type === PropertyType.DATE) {
        instance[property.name] = new Date(value);
      } else {
        instance[property.name] = value;
      }
    }

    // Wrap with proxy for lazy loading if database is available
    if (this.database) {
      return EntityProxy.create(instance, this.entity, this.database);
    }

    return instance;
  }

  toArray(): T[] {
    return this.data.map((item) => this.instantiate(item));
  }

  first(): T | undefined {
    return this.data.length > 0 ? this.instantiate(this.data[0]) : undefined;
  }

  count(): number {
    return this.data.length;
  }

  forEach(callback: (item: T, index: number) => void): void {
    this.data.forEach((item, index) => {
      callback(this.instantiate(item), index);
    });
  }

  map<U>(callback: (item: T, index: number) => U): U[] {
    return this.data.map((item, index) =>
      callback(this.instantiate(item), index),
    );
  }

  filter(callback: (item: T, index: number) => boolean): T[] {
    return this.data
      .map((item, index) => ({ item, index }))
      .filter(({ item, index }) => callback(this.instantiate(item), index))
      .map(({ item }) => this.instantiate(item));
  }

  find(callback: (item: T, index: number) => boolean): T | undefined {
    const found = this.data.find((item, index) =>
      callback(this.instantiate(item), index),
    );
    return found ? this.instantiate(found) : undefined;
  }
}
