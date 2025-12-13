# Decorator Usage Example

## Using Decorators to Define Entities

```typescript
import {
  entity,
  property,
  children,
  parent,
  Entity,
  Children,
  Parent,
} from "@filipgorny/collection";

// Entity name is automatically inferred from class name
@entity()
class User {
  // Type is automatically inferred from TypeScript type
  @property()
  name: string;

  @property()
  email: string;

  @property()
  age: number;

  @property()
  isActive: boolean;

  // Children must use Children<EntityClass> type
  @children()
  orders: Children<Order>;

  // Parent must use Parent<EntityClass> type
  @parent()
  company: Parent<Company>;
}

@entity()
class Order {
  @property()
  orderId: string;

  @property()
  total: number;

  @property()
  date: Date;
}

@entity()
class Product {
  // You can still explicitly specify the type if needed
  @property(PropertyType.STRING)
  title: string;

  @property()
  price: number;

  @property()
  inStock: boolean;

  @property()
  createdAt: Date;
}

@entity()
class Company {
  @property()
  name: string;

  @children()
  departments: Children<Department>;
}

@entity()
class Department {
  @property()
  name: string;

  @property()
  budget: number;

  @children()
  employees: Children<User>;

  @parent()
  company: Parent<Company>;
}

@entity("Product")
class ProductEntity {
  @property(PropertyType.STRING)
  title!: string;

  @property(PropertyType.NUMBER)
  price!: number;

  @property(PropertyType.BOOLEAN)
  inStock!: boolean;

  @property(PropertyType.DATE)
  createdAt!: Date;
}

@entity("Department")
class DepartmentEntity {
  @property(PropertyType.STRING)
  name!: string;

  @property(PropertyType.NUMBER)
  budget!: number;

  @children()
  employees!: any[];

  @parent()
  company!: any;
}

// Method 1: Create Entity instances directly from decorated classes
const userEntity = Entity.from(User);
const productEntity = Entity.from(Product);
const departmentEntity = Entity.from(Department);

console.log(userEntity.name); // "User"
console.log(userEntity.getProperties()); // Array of Property objects
console.log(productEntity.getProperties()); // [title, price, inStock, createdAt]

// Method 2: Use SchemaBuilder.register() to register decorated classes
import { define } from "@filipgorny/collection";

const schema = define()
  .register(User)
  .register(Product)
  .register(Department)
  .register(Company)
  .register(Order)
  .build();

// Access registered entities
const registeredUser = schema.entities.get("User");
const registeredProduct = schema.entities.get("Product");

// Use with Collection
import { Collection, ArraySource } from "@filipgorny/collection";

const users = [
  { name: "John Doe", email: "john@example.com", age: 30, isActive: true },
  { name: "Jane Smith", email: "jane@example.com", age: 25, isActive: true },
];

const userCollection = new Collection<User>(userEntity, new ArraySource(users));

for (const user of userCollection) {
  console.log(user.name, user.email);
}
```

## Decorators API

### @entity()

Class decorator that marks a class as an entity definition.

- Entity name is automatically inferred from the class name

### @property(type?: PropertyType)

Property decorator that defines an entity property.

- `type` - Optional property type (STRING, NUMBER, BOOLEAN, DATE, ARRAY, OBJECT, NULL, UNDEFINED)
- If not specified, type is automatically inferred from TypeScript type:
  - `string` → `PropertyType.STRING`
  - `number` → `PropertyType.NUMBER`
  - `boolean` → `PropertyType.BOOLEAN`
  - `Date` → `PropertyType.DATE`
  - `Array` → `PropertyType.ARRAY`
  - `Object` → `PropertyType.OBJECT`

### @children()

Property decorator that marks a property as a children relationship.

- **Property must be of type `Children<EntityClass>`**
- Validates at runtime that the property type is correct

### @parent()

Property decorator that marks a property as a parent relationship.

- **Property must be of type `Parent<EntityClass>`**
- Validates at runtime that the property type is correct

## Entity.from(Class)

Static method that creates an Entity instance from a decorated class.

- Reads all metadata from decorators
- Creates Entity with proper name and properties
- Returns a fully configured Entity instance

## Benefits

1. **Type-safe definitions** - Use TypeScript classes to define entities
2. **Metadata-driven** - All configuration stored in decorators
3. **Reusable** - Same class can generate multiple Entity instances
4. **IDE support** - Full autocomplete and type checking
5. **Clean syntax** - Declarative entity definitions
