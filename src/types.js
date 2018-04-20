/* @flow */
export type Context = {
  [name: string]: any,
};

export type PrimitiveExpressionType = {
  type: 'string',
} | {
  type: 'number',
  precision?: number,
  scale?: number,
} | {
  type: 'boolean',
} | {
  type: 'date',
} | {
  type: 'datetime',
} | {
  type: 'currency',
  precision?: number,
  scale?: number,
} | {
  type: 'any',
};

export type ExpressionType = PrimitiveExpressionType | {
  type: 'object',
  sobject: string,
  properties: ExpressionTypeDictionary,
} | {
  type: 'function',
  arguments: Array<{
    argument: ExpressionType,
    optional: boolean
  }>,
  returns: ExpressionType,
} | {
  type: 'template',
  ref: string
};

export type ExpressionTypeDictionary = {
  [identifier: string]: ?ExpressionType
};

export type DescribeFieldResult = {
  name: string,
  label: string,
  type: string,
  precision: number,
  scale: number,
  relationshipName: string | null,
  referenceTo: string[] | null,
};

export type DescribeSObjectResult = {
  label: string,
  name: string,
  fields: DescribeFieldResult[],
};

export interface Describer {
  sobject: string,
  describe(sobjectType: string): Promise<DescribeSObjectResult>;
}
