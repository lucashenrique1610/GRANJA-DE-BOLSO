import { describe, expect, it } from 'vitest';
import { sanitizeSpreadsheetCell } from './exportUtils';

describe('sanitizeSpreadsheetCell', () => {
  it('neutraliza formulas que iniciam com =', () => {
    expect(sanitizeSpreadsheetCell('=HYPERLINK("http://evil")')).toBe("'=HYPERLINK(\"http://evil\")");
  });

  it('neutraliza formulas que iniciam com +', () => {
    expect(sanitizeSpreadsheetCell('+cmd|calc')).toBe("'+cmd|calc");
  });

  it('neutraliza formulas que iniciam com -', () => {
    expect(sanitizeSpreadsheetCell('-2+3')).toBe("'-2+3");
  });

  it('neutraliza formulas que iniciam com @', () => {
    expect(sanitizeSpreadsheetCell('@SUM(1,2)')).toBe("'@SUM(1,2)");
  });

  it('neutraliza mesmo com espacos antes do sinal', () => {
    expect(sanitizeSpreadsheetCell('  =1+1')).toBe("'  =1+1");
  });

  it('mantem valores normais intactos', () => {
    expect(sanitizeSpreadsheetCell('Ovos caipira')).toBe('Ovos caipira');
    expect(sanitizeSpreadsheetCell('')).toBe('');
  });
});