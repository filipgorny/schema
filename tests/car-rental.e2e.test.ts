import "reflect-metadata";
import {
  entity,
  property,
  children,
  parent,
  PropertyType,
  define,
  Database,
  SqlitePersistence,
  Query,
} from "../src";

// Helper to generate simple IDs
let idCounter = 0;
const generateId = () => `id-${++idCounter}`;

// Define Car entity
@entity()
class Car {
  id = generateId();

  @property()
  brand: string;

  @property()
  model: string;

  @property()
  type: string; // sedan, suv, etc

  @property(PropertyType.NUMBER)
  pricePerDay: number;

  @children()
  rentals?: Rental[];

  constructor(
    brand: string = "",
    model: string = "",
    type: string = "",
    pricePerDay: number = 0,
  ) {
    this.brand = brand;
    this.model = model;
    this.type = type;
    this.pricePerDay = pricePerDay;
  }
}

// Define Customer entity
@entity()
class Customer {
  id = generateId();

  @property()
  name: string;

  @property()
  email: string;

  @property()
  phone: string;

  @children()
  rentals?: Rental[];

  constructor(name: string = "", email: string = "", phone: string = "") {
    this.name = name;
    this.email = email;
    this.phone = phone;
  }
}

// Define Rental entity
@entity()
class Rental {
  id = generateId();

  @property(PropertyType.DATE)
  startDate: Date;

  @property(PropertyType.DATE)
  endDate: Date;

  @property(PropertyType.NUMBER)
  totalDays: number;

  @property(PropertyType.NUMBER)
  totalPrice: number;

  @parent()
  car?: Car;

  @parent()
  customer?: Customer;

  constructor(
    startDate: Date = new Date(),
    endDate: Date = new Date(),
    totalDays: number = 0,
    totalPrice: number = 0,
  ) {
    this.startDate = startDate;
    this.endDate = endDate;
    this.totalDays = totalDays;
    this.totalPrice = totalPrice;
  }
}

describe("Car Rental Service E2E Test", () => {
  let database: Database;
  let persistence: SqlitePersistence;

  beforeAll(async () => {
    // Create schema
    const schema = define()
      .register(Car)
      .register(Customer)
      .register(Rental)
      .getSchema();

    // Initialize persistence with in-memory SQLite
    persistence = new SqlitePersistence(schema, ":memory:");
    database = new Database(persistence, schema);
    await database.initialize();
  });

  afterAll(async () => {
    await database.close();
  });

  it("should save and retrieve cars", async () => {
    // Create and save cars
    const car1 = new Car("Toyota", "Camry", "sedan", 50);
    const car2 = new Car("Honda", "CR-V", "suv", 70);
    const car3 = new Car("Tesla", "Model 3", "sedan", 100);

    await database.save(car1);
    await database.save(car2);
    await database.save(car3);

    // Query all cars
    const query = new Query("Car");
    const cars = await database.get<Car>(query);

    expect(cars.count()).toBe(3);

    const carArray = cars.toArray();
    expect(carArray[0].brand).toBe("Toyota");
    expect(carArray[1].brand).toBe("Honda");
    expect(carArray[2].brand).toBe("Tesla");
  });

  it("should filter cars by type", async () => {
    // Query only sedans
    const query = new Query("Car").equals("type", "sedan");

    const sedans = await database.get<Car>(query);

    expect(sedans.count()).toBe(2);
    sedans.forEach((car) => {
      expect(car.type).toBe("sedan");
    });
  });

  it("should filter cars by price range", async () => {
    // Query cars with price >= 70
    const query = new Query("Car").greaterThanOrEqual("pricePerDay", 70);

    const expensiveCars = await database.get<Car>(query);

    expect(expensiveCars.count()).toBe(2);
    expensiveCars.forEach((car) => {
      expect(car.pricePerDay).toBeGreaterThanOrEqual(70);
    });
  });

  it("should save and retrieve customers", async () => {
    const customer1 = new Customer("John Doe", "john@example.com", "555-1234");
    const customer2 = new Customer(
      "Jane Smith",
      "jane@example.com",
      "555-5678",
    );

    await database.save(customer1);
    await database.save(customer2);

    const query = new Query("Customer");
    const customers = await database.get<Customer>(query);

    expect(customers.count()).toBe(2);

    const first = customers.first();
    expect(first).toBeDefined();
    expect(first!.name).toBe("John Doe");
    expect(first!.email).toBe("john@example.com");
  });

  it("should create rentals", async () => {
    const rental1 = new Rental(
      new Date("2025-01-01"),
      new Date("2025-01-05"),
      4,
      200,
    );
    const rental2 = new Rental(
      new Date("2025-01-10"),
      new Date("2025-01-15"),
      5,
      250,
    );

    await database.save(rental1);
    await database.save(rental2);

    const query = new Query("Rental").orderBy("startDate", "ASC");

    const rentals = await database.get<Rental>(query);

    expect(rentals.count()).toBe(2);

    const rentalArray = rentals.toArray();
    expect(rentalArray[0].totalDays).toBe(4);
    expect(rentalArray[1].totalDays).toBe(5);
  });

  it("should use limit and offset", async () => {
    const query = new Query("Car").orderBy("brand", "ASC").limit(2).offset(1);

    const cars = await database.get<Car>(query);

    expect(cars.count()).toBe(2);

    const first = cars.first();
    expect(first).toBeDefined();
    // Alphabetically: Honda, Tesla, Toyota. Offset 1 skips Honda, so first is Tesla
    expect(first!.brand).toBe("Tesla");
  });

  it("should use LIKE operator", async () => {
    const query = new Query("Car").like("brand", "%o%"); // Brands containing 'o'

    const cars = await database.get<Car>(query);

    expect(cars.count()).toBeGreaterThan(0);
    cars.forEach((car: any) => {
      expect(car.brand.toLowerCase()).toContain("o");
    });
  });

  it("should handle entity relations metadata", async () => {
    // Get the schema and check entities
    const schema = define()
      .register(Car)
      .register(Customer)
      .register(Rental)
      .getSchema();

    // Verify Car entity has children property metadata
    const carEntity = schema.getEntity("Car");
    expect(carEntity).toBeDefined();
    expect(carEntity!.name).toBe("Car");
    expect(carEntity!.classType).toBe(Car);

    // Check properties
    const carProps = carEntity!.getProperties();
    expect(carProps.length).toBe(4);
    expect(carProps.find((p) => p.name === "brand")).toBeDefined();
    expect(carProps.find((p) => p.name === "model")).toBeDefined();
    expect(carProps.find((p) => p.name === "type")).toBeDefined();
    expect(carProps.find((p) => p.name === "pricePerDay")).toBeDefined();

    // Verify Customer entity
    const customerEntity = schema.getEntity("Customer");
    expect(customerEntity).toBeDefined();
    expect(customerEntity!.name).toBe("Customer");
    expect(customerEntity!.classType).toBe(Customer);

    const customerProps = customerEntity!.getProperties();
    expect(customerProps.length).toBe(3);
    expect(customerProps.find((p) => p.name === "name")).toBeDefined();
    expect(customerProps.find((p) => p.name === "email")).toBeDefined();
    expect(customerProps.find((p) => p.name === "phone")).toBeDefined();

    // Verify Rental entity
    const rentalEntity = schema.getEntity("Rental");
    expect(rentalEntity).toBeDefined();
    expect(rentalEntity!.name).toBe("Rental");
    expect(rentalEntity!.classType).toBe(Rental);

    const rentalProps = rentalEntity!.getProperties();
    expect(rentalProps.length).toBe(4); // Only @property() decorated fields, NOT FK columns
    expect(rentalProps.find((p) => p.name === "startDate")).toBeDefined();
    expect(rentalProps.find((p) => p.name === "endDate")).toBeDefined();
    expect(rentalProps.find((p) => p.name === "totalDays")).toBeDefined();
    expect(rentalProps.find((p) => p.name === "totalPrice")).toBeDefined();

    // Verify parent relationships are auto-resolved from @parent() decorators
    const parents = rentalEntity!.getParents();
    expect(parents.length).toBe(2); // Car and Customer
    expect(parents.find((p) => p.entity.name === "Car")).toBeDefined();
    expect(parents.find((p) => p.entity.name === "Customer")).toBeDefined();
  });

  it("should establish parent-child relationships manually", async () => {
    // Get entities - register all entity types for relationship resolution
    const schema = define()
      .register(Car)
      .register(Customer)
      .register(Rental)
      .getSchema();

    const carEntity = schema.getEntity("Car");
    const rentalEntity = schema.getEntity("Rental");

    expect(carEntity).toBeDefined();
    expect(rentalEntity).toBeDefined();

    // Verify that relationships are now auto-resolved from @children()/@parent() decorators
    // Car already has "rentals" children relationship from @children() decorator
    const children = carEntity!.getChildren();
    expect(children.length).toBe(1); // rentals
    expect(children[0].entity.name).toBe("Rental");

    // Manually add another child to test addChild method
    carEntity!.addChild(rentalEntity!);
    expect(carEntity!.getChildren().length).toBe(2); // Now has 2 children (duplicate)

    // Verify that parent relationships are auto-resolved from @parent() decorators
    // Rental has "car" and "customer" parent relationships (both resolved since all entities registered)
    const parents = rentalEntity!.getParents();
    expect(parents.length).toBe(2); // car and customer
    expect(parents.find((p) => p.entity.name === "Car")).toBeDefined();
    expect(parents.find((p) => p.entity.name === "Customer")).toBeDefined();
  });

  it("should save and load rentals with car relationships", async () => {
    // Create a car
    const car = new Car("BMW", "X5", "suv", 120);
    await database.save(car);

    // Create rentals for this car - set parent property
    const rental1 = new Rental(
      new Date("2025-02-01"),
      new Date("2025-02-05"),
      4,
      480,
    );
    rental1.car = car; // Set parent property

    const rental2 = new Rental(
      new Date("2025-02-10"),
      new Date("2025-02-12"),
      2,
      240,
    );
    rental2.car = car; // Set parent property

    await database.save(rental1);
    await database.save(rental2);

    // Load rentals for this car
    const rentalQuery = new Query("Rental").equals("Car_id", car.id);
    const rentals = await database.get<Rental>(rentalQuery);

    expect(rentals.count()).toBe(2);

    const rentalArray = rentals.toArray();
    expect(rentalArray[0].totalDays).toBeGreaterThan(0);
    expect(rentalArray[1].totalDays).toBeGreaterThan(0);

    // Verify we can lazy load the parent
    const rental1Loaded = rentalArray.find((r: any) => r.totalDays === 4);
    expect(rental1Loaded).toBeDefined();
    const parentCar = await (rental1Loaded as any).car;
    expect(parentCar.id).toBe(car.id);
  });

  it("should lazy load parent entity from rental", async () => {
    // Create a car
    const car = new Car("BMW", "X5", "suv", 120);
    await database.save(car);

    // Create a rental with FK to car
    const rental = new Rental(
      new Date("2025-02-01"),
      new Date("2025-02-05"),
      4,
      480,
    );
    rental.car = car;
    await database.save(rental);

    // Load rental - it should come back as a proxy
    const rentalQuery = new Query("Rental").equals("id", rental.id);
    const rentals = await database.get<Rental>(rentalQuery);
    const loadedRental = rentals.first();

    expect(loadedRental).toBeDefined();
    expect(loadedRental!.totalDays).toBe(4);

    // Lazy load the parent car - the proxy intercepts this access
    const loadedCar = await (loadedRental as any).car;
    expect(loadedCar).toBeDefined();
    expect(loadedCar.brand).toBe("BMW");
    expect(loadedCar.model).toBe("X5");
    expect(loadedCar.id).toBe(car.id);
  });

  it("should lazy load children rentals from car", async () => {
    // Create a car
    const car = new Car("BMW", "X5", "suv", 120);
    await database.save(car);

    // Create multiple rentals for this car
    const rental1 = new Rental(
      new Date("2025-02-01"),
      new Date("2025-02-05"),
      4,
      480,
    );
    rental1.car = car;

    const rental2 = new Rental(
      new Date("2025-02-10"),
      new Date("2025-02-12"),
      2,
      240,
    );
    rental2.car = car;

    await database.save(rental1);
    await database.save(rental2);

    // Load the car - it should come back as a proxy
    const carQuery = new Query("Car").equals("id", car.id);
    const cars = await database.get<Car>(carQuery);
    const loadedCar = cars.first();

    expect(loadedCar).toBeDefined();

    // Lazy load the children rentals - the proxy intercepts this access
    const loadedRentals = await (loadedCar as any).rentals;
    expect(loadedRentals).toBeDefined();
    expect(loadedRentals.length).toBe(2);

    const days = loadedRentals.map((r: any) => r.totalDays).sort();
    expect(days).toEqual([2, 4]);
  });

  it("should lazy load parent entity from rental", async () => {
    // Create a car
    const car = new Car("BMW", "X5", "suv", 120);
    await database.save(car);

    // Create a rental with FK to car
    const rental = new Rental(
      new Date("2025-02-01"),
      new Date("2025-02-05"),
      4,
      480,
    );
    rental.car = car;
    await database.save(rental);

    // Load rental - it should come back as a proxy
    const rentalQuery = new Query("Rental").equals("id", rental.id);
    const rentals = await database.get<Rental>(rentalQuery);
    const loadedRental = rentals.first();

    expect(loadedRental).toBeDefined();
    expect(loadedRental!.totalDays).toBe(4);

    // Lazy load the parent car - the proxy intercepts this access
    const loadedCar = await (loadedRental as any).car;
    expect(loadedCar).toBeDefined();
    expect(loadedCar.brand).toBe("BMW");
    expect(loadedCar.model).toBe("X5");
    expect(loadedCar.id).toBe(car.id);
  });

  it("should lazy load children rentals from car", async () => {
    // Create a car
    const car = new Car("BMW", "X5", "suv", 120);
    await database.save(car);

    // Create multiple rentals for this car
    const rental1 = new Rental(
      new Date("2025-02-01"),
      new Date("2025-02-05"),
      4,
      480,
    );
    rental1.car = car;

    const rental2 = new Rental(
      new Date("2025-02-10"),
      new Date("2025-02-12"),
      2,
      240,
    );
    rental2.car = car;

    await database.save(rental1);
    await database.save(rental2);

    // Load the car - it should come back as a proxy
    const carQuery = new Query("Car").equals("id", car.id);
    const cars = await database.get<Car>(carQuery);
    const loadedCar = cars.first();

    expect(loadedCar).toBeDefined();

    // Lazy load the children rentals - the proxy intercepts this access
    const loadedRentals = await (loadedCar as any).rentals;
    expect(loadedRentals).toBeDefined();
    expect(loadedRentals.length).toBe(2);

    const days = loadedRentals.map((r: any) => r.totalDays).sort();
    expect(days).toEqual([2, 4]);
  });
});
