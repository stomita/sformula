/* @flow */
import { DateTime } from 'luxon';
import { applyScale } from '../cast';
import type {
  Context, ExpressionType, ExpressionTypeDictionary, MaybeTypeAnnotated,
} from '../types';
import { MSECS_IN_DAY, ISO8601_DATETIME_FORMAT } from './constants';
import stringBuiltins from './string';
import datetimeBuiltins from './datetime';
import logicBuiltins from './logic';
import numberBuiltins from './number';
import operatorBuiltins from './operator';

const builtins = {
  ...stringBuiltins,
  ...datetimeBuiltins,
  ...logicBuiltins,
  ...numberBuiltins,
  ...operatorBuiltins,
};

export type BuiltinFunctionName = $Keys<typeof builtins>;

const types: ExpressionTypeDictionary = Object.keys(builtins).reduce((types, name) => {
  const type = builtins[name].type;
  return { ...types, [name]: type }; 
}, {});

const context: Context = Object.keys(builtins).reduce((context, name) => {
  const value = builtins[name].value;
  return { ...context, [name]: value }; 
}, {});

export { context, types };