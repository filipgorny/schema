import { ClassType } from "@filipgorny/types";

export class Children<T = any> {
  constructor(public readonly entityClass: ClassType<T>) {}
}
