import { Entity } from "./entity";
import { Source } from "@/source";

export class Collection<T extends Entity> implements Iterable<T> {
  constructor(
    public readonly entity: Entity,
    private source: Source,
  ) {}

  getName(): string {
    return this.entity.name;
  }

  next(): T | undefined {
    return this.source.next() as T | undefined;
  }

  hasNext(): boolean {
    return this.source.hasNext();
  }

  reset(): void {
    this.source.reset();
  }

  getAll(): T[] {
    return this.source.getAll() as T[];
  }

  size(): number {
    return this.source.size();
  }

  [Symbol.iterator](): Iterator<T> {
    this.source.reset();
    return {
      next: (): IteratorResult<T> => {
        if (this.source.hasNext()) {
          const value = this.source.next();
          return { value: value as T, done: false };
        }
        return { value: undefined as any, done: true };
      },
    };
  }

  forEach(callback: (item: T, index: number) => void): void {
    this.reset();
    let index = 0;
    while (this.hasNext()) {
      const item = this.next();
      if (item !== undefined) {
        callback(item, index++);
      }
    }
    this.reset();
  }

  map<U>(callback: (item: T, index: number) => U): U[] {
    const result: U[] = [];
    this.reset();
    let index = 0;
    while (this.hasNext()) {
      const item = this.next();
      if (item !== undefined) {
        result.push(callback(item, index++));
      }
    }
    this.reset();
    return result;
  }

  filter(callback: (item: T, index: number) => boolean): T[] {
    const result: T[] = [];
    this.reset();
    let index = 0;
    while (this.hasNext()) {
      const item = this.next();
      if (item !== undefined && callback(item, index++)) {
        result.push(item);
      }
    }
    this.reset();
    return result;
  }

  find(callback: (item: T, index: number) => boolean): T | undefined {
    this.reset();
    let index = 0;
    while (this.hasNext()) {
      const item = this.next();
      if (item !== undefined && callback(item, index++)) {
        this.reset();
        return item;
      }
    }
    this.reset();
    return undefined;
  }
}
