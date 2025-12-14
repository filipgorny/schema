export enum RelationType {
  ONE_TO_ONE = "ONE_TO_ONE",
  ONE_TO_MANY = "ONE_TO_MANY",
  MANY_TO_ONE = "MANY_TO_ONE",
  MANY_TO_MANY = "MANY_TO_MANY",
}

export class Relation {
  constructor(
    public readonly type: RelationType,
    public readonly targetEntityName: string,
    public readonly propertyName: string,
  ) {}
}
