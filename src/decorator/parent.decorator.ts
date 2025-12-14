import "reflect-metadata";
import { PARENT_METADATA_KEY } from "./metadata-keys";
import { Parent } from "@/entity/parent";
import { InvalidParentPropertyTypeError } from "@/errors";

export interface ParentMetadata {
  propertyKey: string;
  entityClass: any;
}

export function parent(): PropertyDecorator {
  return (target: any, propertyKey: string | symbol) => {
    const parentList: ParentMetadata[] =
      Reflect.getMetadata(PARENT_METADATA_KEY, target.constructor) || [];

    // Get the design type from TypeScript metadata
    const designType = Reflect.getMetadata("design:type", target, propertyKey);

    // Store parent metadata (no validation - users can use actual entity types)
    parentList.push({
      propertyKey: propertyKey.toString(),
      entityClass: designType,
    });

    Reflect.defineMetadata(PARENT_METADATA_KEY, parentList, target.constructor);
  };
}
