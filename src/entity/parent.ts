import { ClassType } from "@filipgorny/types";

/**
 * Marker class for parent relationships - only used internally by decorators.
 * Users should declare parent properties using the actual entity type.
 * Example: `@parent() car?: Car;`
 */
export class Parent<T = any> {
  constructor(public readonly entityClass: ClassType<T>) {}
}
