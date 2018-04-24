/* @flow */
import { DateTime } from 'luxon';

/**
 * 
 */
export function isCastatibleType(srcType: string, dstType: string) {
  return (
    srcType === dstType ||
    srcType === 'any' || dstType === 'any' ||
    (srcType === 'datetime' && dstType === 'date') ||
    ((srcType === 'number' || srcType === 'currency' || srcType === 'percent') &&
     (dstType === 'number' || dstType === 'currency' || dstType === 'percent'))
  );
}

function applyScale(n: number, scale: number) {
  const power = 10 ** scale;
  return Math.round(n * power) / power;
}

/**
 * 
 */
export function castValue(value: any, srcType: string, dstType: string, scale: ?number) {
  if (value == null) { return value; }
  if (dstType === 'date' && srcType === 'datetime') {
    return DateTime.fromISO(value).toUTC().toISODate();
  }
  if (dstType === 'percent' && srcType !== 'percent') {
    value = value * 100;
  }
  if (typeof scale === 'number' &&
      (dstType === 'number' || dstType === 'currency' || dstType === 'percent')) {
    value = applyScale(value, scale);
  }
  return value;
}

