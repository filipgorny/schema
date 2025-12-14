import "reflect-metadata";
import { Database } from "./database";
import { Entity } from "@/entity/entity";
import {
  PARENT_METADATA_KEY,
  CHILDREN_METADATA_KEY,
} from "@/decorator/metadata-keys";
import { Query } from "@/query/query";

/**
 * Creates a proxy around entity instances that:
 * 1. Lazy-loads parent entities when @parent() properties are accessed
 * 2. Lazy-loads children collections when @children() properties are accessed
 * 3. Maintains type compatibility with the original entity class
 */
export class EntityProxy {
  private static parentCache = new WeakMap<any, Map<string, any>>();
  private static childrenCache = new WeakMap<any, Map<string, any[]>>();

  /**
   * Creates a proxied instance of an entity that supports lazy loading
   * @param instance The entity instance to wrap
   * @param entity The entity metadata
   * @param database The database instance for lazy loading
   * @returns A proxied instance with lazy loading capabilities
   */
  static create<T>(instance: T, entity: Entity, database: Database): T {
    // Initialize caches for this instance
    if (!this.parentCache.has(instance)) {
      this.parentCache.set(instance, new Map());
    }
    if (!this.childrenCache.has(instance)) {
      this.childrenCache.set(instance, new Map());
    }

    const classType = entity.classType;
    if (!classType) {
      return instance; // No classType available, return as-is
    }

    // Build map of property names to parent/children entities
    // This works for both decorator-based and manually-built entities
    const parentFieldMap = new Map<string, Entity>();
    const childrenFieldMap = new Map<string, Entity>();

    // Get parent fields from decorator metadata if available
    const parentMetadata: any[] =
      Reflect.getMetadata(PARENT_METADATA_KEY, classType) || [];
    parentMetadata.forEach((m) => {
      // Derive parent entity name from property name
      const parentEntityName =
        m.propertyKey.charAt(0).toUpperCase() + m.propertyKey.slice(1);
      // Find the parent entity in the entity's parents
      const parentRef = entity
        .getParents()
        .find((p) => p.entity.name === parentEntityName);
      if (parentRef) {
        parentFieldMap.set(m.propertyKey, parentRef.entity);
      }
    });

    // Get children fields from decorator metadata if available
    const childrenMetadata: any[] =
      Reflect.getMetadata(CHILDREN_METADATA_KEY, classType) || [];
    childrenMetadata.forEach((m) => {
      // Derive child entity name from property name (remove trailing 's')
      let childEntityName = m.propertyKey;
      if (childEntityName.endsWith("s")) {
        childEntityName = childEntityName.slice(0, -1);
      }
      childEntityName =
        childEntityName.charAt(0).toUpperCase() + childEntityName.slice(1);
      // Find the child entity in the entity's children
      const childRef = entity
        .getChildren()
        .find((c) => c.entity.name === childEntityName);
      if (childRef) {
        childrenFieldMap.set(m.propertyKey, childRef.entity);
      }
    });

    const parentFields = Array.from(parentFieldMap.keys());
    const childrenFields = Array.from(childrenFieldMap.keys());

    return new Proxy(instance as any, {
      get(target: any, prop: string | symbol, receiver: any) {
        // Get the original value
        const value = Reflect.get(target, prop, receiver);

        // Handle parent lazy loading (from decorator metadata)
        if (typeof prop === "string" && parentFields.includes(prop)) {
          return EntityProxy.loadParent(
            target,
            prop,
            entity,
            database,
            instance,
          );
        }

        // Handle children lazy loading (from decorator metadata)
        if (typeof prop === "string" && childrenFields.includes(prop)) {
          return EntityProxy.loadChildren(
            target,
            prop,
            entity,
            database,
            instance,
          );
        }

        // For manually-built entities without decorators:
        // Check if this property access might be a parent relationship
        // by looking for a corresponding FK column
        if (typeof prop === "string" && !parentFields.includes(prop)) {
          const foreignKeyName =
            prop.charAt(0).toUpperCase() + prop.slice(1) + "_id";
          if (target[foreignKeyName] !== undefined) {
            // This looks like a parent property, try to load it
            return EntityProxy.loadParent(
              target,
              prop,
              entity,
              database,
              instance,
            );
          }
        }

        return value;
      },

      set(target: any, prop: string | symbol, value: any, receiver: any) {
        // If setting a parent property, extract the ID and set the foreign key
        if (typeof prop === "string" && parentFields.includes(prop)) {
          // Clear cache when parent is set
          const cache = EntityProxy.parentCache.get(instance);
          if (cache) {
            cache.delete(prop);
          }

          // If value has an id, set the foreign key
          if (value && value.id) {
            const foreignKeyName = EntityProxy.getForeignKeyName(prop);
            Reflect.set(target, foreignKeyName, value.id, receiver);
          }
        }

        // If setting a children property, clear the cache
        if (typeof prop === "string" && childrenFields.includes(prop)) {
          const cache = EntityProxy.childrenCache.get(instance);
          if (cache) {
            cache.delete(prop);
          }
        }

        return Reflect.set(target, prop, value, receiver);
      },
    });
  }

  /**
   * Lazy loads a parent entity
   */
  private static loadParent(
    target: any,
    prop: string,
    entity: Entity,
    database: Database,
    instance: any,
  ): any {
    // Check cache first
    const cache = this.parentCache.get(instance);
    if (cache && cache.has(prop)) {
      return cache.get(prop);
    }

    // Get the foreign key value
    const foreignKeyName = this.getForeignKeyName(prop);
    const foreignKeyValue = target[foreignKeyName];

    if (!foreignKeyValue) {
      return undefined; // No foreign key set
    }

    // Find the parent entity name from schema
    const parentEntityName = this.getParentEntityName(prop, entity);
    if (!parentEntityName) {
      return undefined;
    }

    // Create a promise that loads the parent
    const loadPromise = (async () => {
      const query = new Query(parentEntityName).equals("id", foreignKeyValue);
      const results = await database.get(query);
      const parent = results.first();

      // Cache the result
      if (cache) {
        cache.set(prop, parent);
      }

      return parent;
    })();

    // Return a thenable object that can be awaited
    return loadPromise;
  }

  /**
   * Lazy loads children entities
   */
  private static loadChildren(
    target: any,
    prop: string,
    entity: Entity,
    database: Database,
    instance: any,
  ): any {
    // Check cache first
    const cache = this.childrenCache.get(instance);
    if (cache && cache.has(prop)) {
      return cache.get(prop);
    }

    // Find the child entity name from schema
    const childEntityName = this.getChildEntityName(prop, entity);
    if (!childEntityName) {
      return [];
    }

    // Create a promise that loads the children
    const loadPromise = (async () => {
      // Query children by foreign key pointing to this entity
      const foreignKeyName = `${entity.name}_id`;
      const query = new Query(childEntityName).equals(
        foreignKeyName,
        target.id,
      );
      const results = await database.get(query);
      const children = results.toArray();

      // Cache the result
      if (cache) {
        cache.set(prop, children);
      }

      return children;
    })();

    // Return a thenable object that can be awaited
    return loadPromise;
  }

  /**
   * Gets the foreign key name for a parent property
   * e.g., "car" -> "Car_id"
   */
  private static getForeignKeyName(parentProp: string): string {
    // Capitalize first letter and add _id
    return parentProp.charAt(0).toUpperCase() + parentProp.slice(1) + "_id";
  }

  /**
   * Gets the parent entity name from metadata
   */
  private static getParentEntityName(
    parentProp: string,
    entity: Entity,
  ): string | undefined {
    // Look up in entity's parents
    const parents = entity.getParents();
    // For now, derive from property name (capitalize first letter)
    return parentProp.charAt(0).toUpperCase() + parentProp.slice(1);
  }

  /**
   * Gets the child entity name from metadata
   */
  private static getChildEntityName(
    childrenProp: string,
    entity: Entity,
  ): string | undefined {
    // Look up in entity's children metadata
    const children = entity.getChildren();

    if (children.length > 0) {
      // Find the matching child relationship
      // For now, we assume the property name is the pluralized entity name
      // Simple approach: remove trailing 's' and capitalize
      let singularName = childrenProp;
      if (singularName.endsWith("s")) {
        singularName = singularName.slice(0, -1);
      }
      return singularName.charAt(0).toUpperCase() + singularName.slice(1);
    }

    // Fallback: capitalize first letter and remove trailing 's'
    let singularName = childrenProp;
    if (singularName.endsWith("s")) {
      singularName = singularName.slice(0, -1);
    }
    return singularName.charAt(0).toUpperCase() + singularName.slice(1);
  }
}
