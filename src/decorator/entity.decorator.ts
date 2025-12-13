import "reflect-metadata";
import { ENTITY_METADATA_KEY } from "./metadata-keys";

export function entity(): ClassDecorator {
  return (target: any) => {
    const entityName = target.name;
    Reflect.defineMetadata(ENTITY_METADATA_KEY, entityName, target);
  };
}
