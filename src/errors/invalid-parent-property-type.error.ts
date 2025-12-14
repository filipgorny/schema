export class InvalidParentPropertyTypeError extends Error {
  constructor(propertyKey: string) {
    super(`Property ${propertyKey} must be of type Parent<EntityClass>`);
    this.name = "InvalidParentPropertyTypeError";
  }
}
