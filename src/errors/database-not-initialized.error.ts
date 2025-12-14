export class DatabaseNotInitializedError extends Error {
  constructor() {
    super("Database not initialized");
    this.name = "DatabaseNotInitializedError";
  }
}
