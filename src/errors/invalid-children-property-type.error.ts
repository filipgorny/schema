export class InvalidChildrenPropertyTypeError extends Error {
  constructor(propertyKey: string) {
    super(`Property ${propertyKey} must be of type Children<EntityClass>`);
    this.name = "InvalidChildrenPropertyTypeError";
  }
}
