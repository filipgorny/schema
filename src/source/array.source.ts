import { Source } from "./source";

export class ArraySource implements Source {
  private currentIndex: number = 0;

  constructor(private data: any[]) {}

  next(): any {
    if (this.hasNext()) {
      return this.data[this.currentIndex++];
    }
    return undefined;
  }

  hasNext(): boolean {
    return this.currentIndex < this.data.length;
  }

  reset(): void {
    this.currentIndex = 0;
  }

  getAll(): any[] {
    return [...this.data];
  }

  size(): number {
    return this.data.length;
  }
}
