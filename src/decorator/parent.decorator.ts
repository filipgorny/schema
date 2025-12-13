import "reflect-metadata";
import { PARENT_METADATA_KEY } from "./metadata-keys";
import { Parent } from "@/entity/parent";

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

    // Validate that the property is of type Parent
    if (designType !== Parent) {
      throw new Error(
        `Property ${propertyKey.toString()} must be of type Parent<EntityClass>`,
      );
    }

    parentList.push({
      propertyKey: propertyKey.toString(),
      entityClass: designType,
    });

    Reflect.defineMetadata(PARENT_METADATA_KEY, parentList, target.constructor);
  };
}
