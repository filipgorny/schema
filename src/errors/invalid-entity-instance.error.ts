export class InvalidEntityInstanceError extends Error {
  constructor(value: any) {
    const className = value?.constructor?.name || typeof value;
    super(
      `Value of type "${className}" is not a valid entity instance. ` +
        `Ensure the class is decorated with @entity() decorator.`,
    );
    this.name = "InvalidEntityInstanceError";
  }
}
