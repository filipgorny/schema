export class ClassHasNotEntityDefinitionError extends Error {
  constructor(className: string) {
    super(
      `Class "${className}" does not have @entity() decorator. Please add @entity() decorator to the class.`,
    );
    this.name = "ClassHasNotEntityDefinitionError";
  }
}
