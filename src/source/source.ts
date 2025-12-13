export interface Source {
  next(): any;
  hasNext(): boolean;
  reset(): void;
  getAll(): any[];
  size(): number;
}
