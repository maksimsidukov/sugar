import { describe, expect, it } from 'vitest';
import { formatGlucose, parseGlucoseInput } from './measurement';

describe('parseGlucoseInput', () => {
  it.each([
    ['5,6', 5.6],
    [' 12,0 ', 12],
    ['7.8', 7.8],
    ['0,1', 0.1],
    ['99,9', 99.9],
  ])('принимает %s как %f', (raw, expected) => {
    expect(parseGlucoseInput(raw)).toBe(expected);
  });

  it.each([
    '',
    ' ',
    '5',
    '5,',
    ',6',
    '5,67',
    '1,2,3',
    '1.2.3',
    'abc',
    'NaN',
    'Infinity',
    '-5,0',
    '0,0',
    '100,0',
  ])('отклоняет некорректное значение %s', (raw) => {
    expect(parseGlucoseInput(raw)).toBeNull();
  });
});

describe('formatGlucose', () => {
  it('использует запятую и один знак после неё', () => {
    expect(formatGlucose(5.6)).toBe('5,6');
    expect(formatGlucose(12)).toBe('12,0');
  });
});
