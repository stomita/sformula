/* @flow */
import type { Context, ExpressionType, ExpressionTypeDictionary, Describer } from './types'; 
import { parseFormula } from './formula';
import { context as builtins, types as builtinTypeDict } from './builtin';
import { extractFields } from './fieldExtraction';
import { createFieldTypeDictionary } from './fieldType';
import { calculateReturnType } from './typeCalculation';

type Formula = {
  formula: string,
  fields: string[],
  returnType: $PropertyType<ExpressionType, 'type'>,
  evaluate(context: Context): any
};

/**
 * 
 */
export async function parse(formula: string, describer: Describer): Promise<Formula> {
  const expression = parseFormula(formula);
  const fields = extractFields(expression);
  const fieldTypeDict = await createFieldTypeDictionary(fields, describer);
  const { returnType: { type: returnType } } = calculateReturnType(expression, { ...fieldTypeDict, ...builtinTypeDict });
  return {
    formula,
    fields,
    returnType,
    evaluate(context: Context = {}) {

    },
  };
}