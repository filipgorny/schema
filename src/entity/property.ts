import { PropertyType } from "./property-type";

export class Property {
  constructor(
    public name: string,
    public type: PropertyType,
  ) {}
}
