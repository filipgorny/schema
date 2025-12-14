import "reflect-metadata";
import { CHILDREN_METADATA_KEY } from "./metadata-keys";
import { Children } from "@/entity/children";
import { InvalidChildrenPropertyTypeError } from "@/errors";

export interface ChildrenMetadata {
  propertyKey: string;
  entityClass: any;
}

export function children(): PropertyDecorator {
  return (target: any, propertyKey: string | symbol) => {
    const childrenList: ChildrenMetadata[] =
      Reflect.getMetadata(CHILDREN_METADATA_KEY, target.constructor) || [];

    // Get the design type from TypeScript metadata
    const designType = Reflect.getMetadata("design:type", target, propertyKey);

    // Store children metadata (no validation - users can use actual entity array types)
    childrenList.push({
      propertyKey: propertyKey.toString(),
      entityClass: designType,
    });

    Reflect.defineMetadata(
      CHILDREN_METADATA_KEY,
      childrenList,
      target.constructor,
    );
  };
}
