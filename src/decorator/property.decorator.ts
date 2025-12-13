import "reflect-metadata";
import { PropertyType } from "@/entity";
import { PROPERTIES_METADATA_KEY } from "./metadata-keys";

export interface PropertyMetadata {
  name: string;
  type: PropertyType;
}

function inferPropertyType(designType: any): PropertyType {
  if (designType === String) return PropertyType.STRING;
  if (designType === Number) return PropertyType.NUMBER;
  if (designType === Boolean) return PropertyType.BOOLEAN;
  if (designType === Date) return PropertyType.DATE;
  if (designType === Array) return PropertyType.ARRAY;
  if (designType === Object) return PropertyType.OBJECT;
  return PropertyType.OBJECT;
}

export function property(type?: PropertyType): PropertyDecorator {
  return (target: any, propertyKey: string | symbol) => {
    const properties: PropertyMetadata[] =
      Reflect.getMetadata(PROPERTIES_METADATA_KEY, target.constructor) || [];

    // Get the design type from TypeScript metadata
    const designType = Reflect.getMetadata("design:type", target, propertyKey);
    const propertyType = type || inferPropertyType(designType);

    properties.push({
      name: propertyKey.toString(),
      type: propertyType,
    });

    Reflect.defineMetadata(
      PROPERTIES_METADATA_KEY,
      properties,
      target.constructor,
    );
  };
}
