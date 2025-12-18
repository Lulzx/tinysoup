import { expect, test, describe } from 'bun:test';
import { parse } from '../src/parser';
import { getText, getString, strippedStrings, strings } from '../src/text';

describe('getText', () => {
  test('extracts all text content', () => {
    const doc = parse('<div><p>Hello</p><p>World</p></div>');
    const div = doc.children[0] as any;
    expect(getText(div)).toBe('HelloWorld');
  });

  test('with separator', () => {
    const doc = parse('<div><p>Hello</p><p>World</p></div>');
    const div = doc.children[0] as any;
    expect(getText(div, { separator: ' ' })).toBe('Hello World');
  });

  test('with strip', () => {
    const doc = parse('<div><p>  Hello  </p><p>  World  </p></div>');
    const div = doc.children[0] as any;
    expect(getText(div, { strip: true })).toBe('HelloWorld');
  });

  test('with strip and separator', () => {
    const doc = parse('<div><p>  Hello  </p><p>  World  </p></div>');
    const div = doc.children[0] as any;
    expect(getText(div, { strip: true, separator: ' ' })).toBe('Hello World');
  });

  test('handles nested elements', () => {
    const doc = parse('<div><p>Hello <strong>bold</strong> text</p></div>');
    const div = doc.children[0] as any;
    expect(getText(div)).toBe('Hello bold text');
  });

  test('handles empty elements', () => {
    const doc = parse('<div></div>');
    const div = doc.children[0] as any;
    expect(getText(div)).toBe('');
  });
});

describe('getString', () => {
  test('returns text content of single text child', () => {
    const doc = parse('<p>Hello</p>');
    const p = doc.children[0] as any;
    expect(getString(p)).toBe('Hello');
  });

  test('returns null for multiple children', () => {
    const doc = parse('<p>Hello <strong>World</strong></p>');
    const p = doc.children[0] as any;
    expect(getString(p)).toBeNull();
  });

  test('recurses into single element child', () => {
    const doc = parse('<div><p>Hello</p></div>');
    const div = doc.children[0] as any;
    expect(getString(div)).toBe('Hello');
  });

  test('returns null for empty element', () => {
    const doc = parse('<div></div>');
    const div = doc.children[0] as any;
    expect(getString(div)).toBeNull();
  });
});

describe('strippedStrings', () => {
  test('yields non-empty trimmed strings', () => {
    const doc = parse('<div><p>  Hello  </p><p>  </p><p>  World  </p></div>');
    const div = doc.children[0] as any;
    const result = [...strippedStrings(div)];
    expect(result).toEqual(['Hello', 'World']);
  });

  test('handles nested elements', () => {
    const doc = parse('<div><p>A <strong>B</strong> C</p></div>');
    const div = doc.children[0] as any;
    const result = [...strippedStrings(div)];
    expect(result).toEqual(['A', 'B', 'C']);
  });
});

describe('strings', () => {
  test('yields all text content', () => {
    const doc = parse('<div><p>Hello</p><p>World</p></div>');
    const div = doc.children[0] as any;
    const result = [...strings(div)];
    expect(result).toEqual(['Hello', 'World']);
  });

  test('includes whitespace', () => {
    const doc = parse('<div><p>  Hello  </p></div>');
    const div = doc.children[0] as any;
    const result = [...strings(div)];
    expect(result).toEqual(['  Hello  ']);
  });
});
