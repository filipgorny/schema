import { ClassType } from "@filipgorny/types";

export class Parent<T = any> {
  constructor(public readonly entityClass: ClassType<T>) {}
}
