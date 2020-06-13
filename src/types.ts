export type Maybe<T> = T | null | undefined;

export type Context = {
  [name: string]: any;
};

export type PrimitiveExpressionType =
  | {
      type: "string";
    }
  | {
      type: "number";
      precision?: number;
      scale?: number;
    }
  | {
      type: "currency";
      precision?: number;
      scale?: number;
    }
  | {
      type: "percent";
      precision?: number;
      scale?: number;
    }
  | {
      type: "boolean";
    }
  | {
      type: "date";
    }
  | {
      type: "datetime";
    }
  | {
      type: "time";
    }
  | {
      type: "any";
    };

export type AdditionalPrimitiveExpressionType =
  | {
      type: "id";
    }
  | {
      type: "picklist";
      picklistValues?: Array<{
        label: string;
        value: string;
      }>;
    }
  | {
      type: "multipicklist";
      picklistValues?: Array<{
        label: string;
        value: string;
      }>;
    };

export type FunctionArgType = {
  argument: ExpressionType;
  optional: boolean;
};

export type ExpressionType =
  | PrimitiveExpressionType
  | AdditionalPrimitiveExpressionType
  | {
      type: "object";
      sobject?: string;
      properties: ExpressionTypeDictionary;
    }
  | {
      type: "function";
      arguments: FunctionArgType[] | ((p: number) => FunctionArgType[]);
      returns: ExpressionType;
    }
  | {
      type: "template";
      ref: string;
      anyOf?: ExpressionType[];
    };

export type ExpressionTypeDictionary = {
  [identifier: string]: Maybe<ExpressionType>;
};

export type MaybeTypeAnnotated<T> =
  | T
  | [T, string, Maybe<number>, Maybe<number>];

export type DescribeFieldResult = {
  name: string;
  label: string;
  type: string;
  precision: number;
  scale: number;
  picklistValues: Maybe<
    Array<{
      value: string;
      label: string;
    }>
  >;
  relationshipName: Maybe<string>;
  referenceTo: Maybe<string[]>;
};

export type DescribeSObjectResult = {
  label: string;
  name: string;
  fields: DescribeFieldResult[];
};

export interface Describer {
  sobject: string;
  describe(sobjectType: string): Promise<DescribeSObjectResult>;
}
