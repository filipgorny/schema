import "reflect-metadata";
import { CHILDREN_METADATA_KEY } from "./metadata-keys";
import { Children } from "@/entity/children";

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

    // Validate that the property is of type Children
    if (designType !== Children) {
      throw new Error(
        `Property ${propertyKey.toString()} must be of type Children<EntityClass>`,
      );
    }

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
