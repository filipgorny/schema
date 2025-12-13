# Collection Usage Examples

## Creating Entities and Collections with Sources

```typescript
import { define, PropertyType, ArraySource } from "@filipgorny/collection";

// Define a schema with entities
const schema = define()
  .entity("User", (user) =>
    user
      .property("name", PropertyType.STRING)
      .property("email", PropertyType.STRING)
      .property("age", PropertyType.NUMBER),
  )
  .entity("Product", (product) =>
    product
      .property("title", PropertyType.STRING)
      .property("price", PropertyType.NUMBER)
      .property("inStock", PropertyType.BOOLEAN),
  )
  .build();

// Get entities
const userEntity = schema.entities.get("User");
const productEntity = schema.entities.get("Product");
```

## Using Collections with ArraySource

```typescript
import { Collection, ArraySource, PropertyType } from "@filipgorny/collection";

// Sample data
const users = [
  { name: "John Doe", email: "john@example.com", age: 30 },
  { name: "Jane Smith", email: "jane@example.com", age: 25 },
  { name: "Bob Johnson", email: "bob@example.com", age: 35 },
];

// Create a collection with ArraySource
const userEntity = define()
  .entity("User", (user) =>
    user
      .property("name", PropertyType.STRING)
      .property("email", PropertyType.STRING)
      .property("age", PropertyType.NUMBER),
  )
  .build()
  .entities.get("User");

const userCollection = new Collection(userEntity!, new ArraySource(users));

// Iterate using for...of
for (const user of userCollection) {
  console.log(user.name, user.email);
}

// Using next() and hasNext()
userCollection.reset();
while (userCollection.hasNext()) {
  const user = userCollection.next();
  console.log(user);
}

// Using forEach
userCollection.forEach((user, index) => {
  console.log(`${index}: ${user.name}`);
});

// Using map
const names = userCollection.map((user) => user.name);
console.log(names); // ['John Doe', 'Jane Smith', 'Bob Johnson']

// Using filter
const adults = userCollection.filter((user) => user.age >= 30);
console.log(adults); // Users with age >= 30

// Using find
const john = userCollection.find((user) => user.name === "John Doe");
console.log(john);

// Get all items
const allUsers = userCollection.getAll();

// Get size
console.log(userCollection.size()); // 3
```

## Creating Collections in Schema

```typescript
const schema = define()
  .entity("Product", (product) =>
    product
      .property("title", PropertyType.STRING)
      .property("price", PropertyType.NUMBER),
  )
  .collection(
    "products",
    "Product",
    new ArraySource([
      { title: "Laptop", price: 999 },
      { title: "Mouse", price: 25 },
    ]),
  )
  .build();

const productsCollection = schema.collections.get("products");

for (const product of productsCollection!) {
  console.log(product.title, product.price);
}
```

## Entities with Children

```typescript
const company = define()
  .entity("Company", (c) =>
    c
      .property("name", PropertyType.STRING)
      .child("department", (dept) =>
        dept
          .property("name", PropertyType.STRING)
          .property("budget", PropertyType.NUMBER),
      ),
  )
  .build()
  .entities.get("Company");

console.log(company?.getChildren()); // Get all child entities
```
