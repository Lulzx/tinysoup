import { expect, test, describe } from 'bun:test';
import { Document, parseHtml } from '../src/document';

const html = `
<!DOCTYPE html>
<html>
<head><title>Test</title></head>
<body>
  <div id="main" class="container">
    <h1>Hello World</h1>
    <p class="intro">Introduction</p>
    <ul>
      <li>Item 1</li>
      <li>Item 2</li>
      <li>Item 3</li>
    </ul>
  </div>
</body>
</html>
`;

describe('Document', () => {
  test('constructor parses HTML', () => {
    const doc = new Document('<div>Test</div>');
    expect(doc.root.tagName).toBe('#document');
    expect(doc.root.children.length).toBeGreaterThan(0);
  });

  test('constructor accepts parse options', () => {
    const doc = new Document('<DIV></DIV>', { lowerCaseTags: false });
    expect(doc.root.children[0].tagName).toBe('DIV');
  });

  test('select returns Elements', () => {
    const doc = parseHtml(html);
    const els = doc.select('li');
    expect(els.length).toBe(3);
  });

  test('select with limit', () => {
    const doc = parseHtml(html);
    const els = doc.select('li', { limit: 2 });
    expect(els.length).toBe(2);
  });

  test('selectOne returns Element or null', () => {
    const doc = parseHtml(html);
    expect(doc.selectOne('h1')?.tagName).toBe('h1');
    expect(doc.selectOne('.nonexistent')).toBeNull();
  });

  test('exists returns boolean', () => {
    const doc = parseHtml(html);
    expect(doc.exists('h1')).toBe(true);
    expect(doc.exists('.nonexistent')).toBe(false);
  });

  test('count returns number', () => {
    const doc = parseHtml(html);
    expect(doc.count('li')).toBe(3);
    expect(doc.count('.nonexistent')).toBe(0);
  });

  test('findAll works', () => {
    const doc = parseHtml(html);
    const result = doc.findAll('li');
    expect(result.length).toBe(3);
  });

  test('findAll with options', () => {
    const doc = parseHtml(html);
    const result = doc.findAll({ name: 'li', limit: 2 });
    expect(result.length).toBe(2);
  });

  test('findAll with predicate', () => {
    const doc = parseHtml(html);
    const result = doc.findAll(el => el.tagName === 'li');
    expect(result.length).toBe(3);
  });

  test('find works', () => {
    const doc = parseHtml(html);
    const result = doc.find('li');
    expect(result?.tagName).toBe('li');
  });

  test('getText extracts text', () => {
    const doc = parseHtml('<div><p>Hello</p><p>World</p></div>');
    expect(doc.getText()).toContain('Hello');
    expect(doc.getText()).toContain('World');
  });

  test('getText with options', () => {
    const doc = parseHtml('<div><p>  Hello  </p><p>  World  </p></div>');
    expect(doc.getText({ strip: true, separator: ' ' })).toBe('Hello World');
  });

  test('strippedStrings generator', () => {
    const doc = parseHtml('<div><p>  Hello  </p><p>  World  </p></div>');
    const result = [...doc.strippedStrings];
    expect(result).toContain('Hello');
    expect(result).toContain('World');
  });

  test('toHtml serializes', () => {
    const doc = parseHtml('<div><p>Test</p></div>');
    expect(doc.toHtml()).toContain('<div><p>Test</p></div>');
  });

  test('toHtml with options', () => {
    const doc = parseHtml('<!DOCTYPE html><html></html>');
    expect(doc.toHtml({ format: 'html5' })).toBe('<!DOCTYPE html><html></html>');
  });

  test('prettify formats output', () => {
    const doc = parseHtml('<div><p>Test</p></div>');
    const result = doc.prettify();
    expect(result).toContain('\n');
    expect(result).toContain('  ');
  });

  test('prettify with options', () => {
    const doc = parseHtml('<div><p>Test</p></div>');
    const result = doc.prettify({ indent: '\t' });
    expect(result).toContain('\t');
  });

  test('extract extracts structured data', () => {
    const doc = parseHtml(html);
    const result = doc.extract({
      title: 'h1',
      items: { select: 'li', all: true }
    });
    expect(result.title).toBe('Hello World');
    expect(result.items.length).toBe(3);
  });

  test('sanitize sanitizes in place', () => {
    const doc = parseHtml('<div><script>bad</script><p>good</p></div>');
    const result = doc.sanitize();
    expect(result).toBe(doc);
    expect(doc.toHtml()).not.toContain('<script>');
  });

  test('sanitize with options', () => {
    const doc = parseHtml('<div><p>Text</p><span>More</span></div>');
    doc.sanitize({ allowedTags: ['p'] });
    expect(doc.toHtml()).toContain('<p>');
    expect(doc.toHtml()).not.toContain('<span>');
  });

  test('smooth merges text nodes', () => {
    const doc = parseHtml('<div></div>');
    const div = doc.root.children[0] as any;
    div.children = [
      { type: 'text', content: 'Hello', parent: div },
      { type: 'text', content: ' World', parent: div }
    ];
    const result = doc.smooth();
    expect(result).toBe(doc);
    expect(div.children.length).toBe(1);
  });
});

describe('parseHtml', () => {
  test('returns Document instance', () => {
    const doc = parseHtml('<div>Test</div>');
    expect(doc).toBeInstanceOf(Document);
  });

  test('accepts options', () => {
    const doc = parseHtml('<DIV></DIV>', { lowerCaseTags: false });
    expect(doc.root.children[0].tagName).toBe('DIV');
  });
});
