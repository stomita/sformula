/* @flow */
import moment from 'moment';
import type {
  Context, ExpressionType, ExpressionTypeDictionary,
} from './types';

type ContextDefinition = {
  [name: string]: {
    value: any,
    type: ExpressionType,
  }
};

const builtins: ContextDefinition = {
  'TODAY': {
    value: () => {
      return moment().format('YYYY-MM-DD');
    },
    type: {
      type: 'function',
      arguments: [],
      returns: { type: 'date' },
    },
  },

  // builtin operators 
  '$$ADD_DATE$$': {
    value: (d: string, n: number) => {
      return moment(d).add(n, 'days').format('YYYY-MM-DD');
    },
    type: {
      type: 'function',
      arguments: [{
        argument: { type: 'date' },
        optional: false,
      }, {
        argument: { type: 'number', precision: -1, scale: -1 },
        optional: false,
      }],
      returns: { type: 'date' },
    },
  },
  '$$ADD_DATETIME$$': {
    value: (d: string, n: number) => {
      return moment(d).add(n, 'days').toISOString();
    },
    type: {
      type: 'function',
      arguments: [{
        argument: { type: 'datetime' },
        optional: false,
      }, {
        argument: { type: 'number', precision: -1, scale: -1 },
        optional: false,
      }],
      returns: { type: 'datetime' },
    },
  },
  '$$SUBTRACT_DATE$$': {
    value: (d: string, n: number) => {
      return moment(d).add(-n, 'days').format('YYYY-MM-DD');
    },
    type: {
      type: 'function',
      arguments: [{
        argument: { type: 'date' },
        optional: false,
      }, {
        argument: { type: 'number', precision: -1, scale: -1 },
        optional: false,
      }],
      returns: { type: 'date' },
    },
  },
  '$$SUBTRACT_DATETIME$$': {
    value: (d: string, n: number) => {
      return moment(d).add(-n, 'days').toISOString();
    },
    type: {
      type: 'function',
      arguments: [{
        argument: { type: 'datetime' },
        optional: false,
      }, {
        argument: { type: 'number', precision: -1, scale: -1 },
        optional: false,
      }],
      returns: { type: 'datetime' },
    },
  },
  '$$DIFF_DATE$$': {
    value: (d1: string, d2: string) => {
      return moment(d1).diff(d2, 'days');
    },
    type: {
      type: 'function',
      arguments: [{
        argument: { type: 'date' },
        optional: false,
      }, {
        argument: { type: 'date' },
        optional: false,
      }],
      returns: { type: 'number', precision: 18, scale: 0 },
    },
  },
  '$$DIFF_DATETIME$$': {
    value: (d1: string, d2: string) => {
      return moment(d1).diff(d2, 'days');
    },
    type: {
      type: 'function',
      arguments: [{
        argument: { type: 'datetime' },
        optional: false,
      }, {
        argument: { type: 'datetime' },
        optional: false,
      }],
      returns: { type: 'number', precision: -1, scale: -1 },
    },
  },
};

const types: ExpressionTypeDictionary = Object.keys(builtins).reduce((types, name) => {
  const type = builtins[name].type;
  return { ...types, [name]: type }; 
}, {});

const context: Context = Object.keys(builtins).reduce((context, name) => {
  const value = builtins[name].value;
  return { ...context, [name]: value }; 
}, {});

export { context, types };