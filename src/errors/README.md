# Errors

## ClassHasNotEntityDefinitionError

Thrown when trying to register a class that doesn't have the `@entity()` decorator.

**Example:**

```typescript
import {
  define,
  ClassHasNotEntityDefinitionError,
} from "@filipgorny/collection";

class NotAnEntity {
  name: string;
}

try {
  define().register(NotAnEntity);
} catch (error) {
  if (error instanceof ClassHasNotEntityDefinitionError) {
    console.error(error.message);
    // "Class "NotAnEntity" does not have @entity() decorator. Please add @entity() decorator to the class."
  }
}
```
