import { ClassType } from "@filipgorny/types";

/**
 * Marker class for children relationships - only used internally by decorators.
 * Users should declare children properties using an array of the actual entity type.
 * Example: `@children() rentals?: Rental[];`
 */
export class Children<T = any> {
  constructor(public readonly entityClass: ClassType<T>) {}
}
