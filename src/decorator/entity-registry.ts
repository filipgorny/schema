import { ClassType } from "@filipgorny/types";

// Global registry to store entity class references from Children and Parent instances
export class EntityRegistry {
  private static childrenRegistry = new WeakMap<any, Map<string, ClassType>>();
  private static parentRegistry = new WeakMap<any, Map<string, ClassType>>();

  static registerChildren(
    target: any,
    propertyKey: string,
    entityClass: ClassType,
  ): void {
    if (!this.childrenRegistry.has(target)) {
      this.childrenRegistry.set(target, new Map());
    }
    this.childrenRegistry.get(target)!.set(propertyKey, entityClass);
  }

  static getChildren(target: any): Map<string, ClassType> {
    return this.childrenRegistry.get(target) || new Map();
  }

  static registerParent(
    target: any,
    propertyKey: string,
    entityClass: ClassType,
  ): void {
    if (!this.parentRegistry.has(target)) {
      this.parentRegistry.set(target, new Map());
    }
    this.parentRegistry.get(target)!.set(propertyKey, entityClass);
  }

  static getParent(target: any): Map<string, ClassType> {
    return this.parentRegistry.get(target) || new Map();
  }
}
