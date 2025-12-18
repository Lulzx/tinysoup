import { expect, test, describe } from 'bun:test';
import { parse, serialize } from '../src/parser';
import { sanitize, sanitizeHtml, escapeHtmlText } from '../src/sanitize';

describe('sanitize', () => {
  test('removes disallowed tags', () => {
    const doc = parse('<div><script>alert(1)</script><p>Safe</p></div>');
    sanitize(doc);
    const result = serialize(doc);
    expect(result).not.toContain('<script>');
    expect(result).toContain('<p>Safe</p>');
  });

  test('keeps allowed tags', () => {
    const doc = parse('<div><p><strong>Bold</strong></p></div>');
    sanitize(doc);
    const result = serialize(doc);
    expect(result).toContain('<p>');
    expect(result).toContain('<strong>');
  });

  test('removes disallowed attributes', () => {
    const doc = parse('<a href="/safe" onclick="alert(1)">Link</a>');
    sanitize(doc);
    const a = doc.children[0] as any;
    expect(a.attributes.get('href')).toBe('/safe');
    expect(a.attributes.has('onclick')).toBe(false);
  });

  test('sanitizes javascript: URLs', () => {
    const doc = parse('<a href="javascript:alert(1)">Link</a>');
    sanitize(doc);
    const a = doc.children[0] as any;
    expect(a.attributes.has('href')).toBe(false);
  });

  test('allows safe protocols', () => {
    const doc = parse('<a href="https://example.com">Link</a>');
    sanitize(doc);
    const a = doc.children[0] as any;
    expect(a.attributes.get('href')).toBe('https://example.com');
  });

  test('allows relative URLs', () => {
    const doc = parse('<a href="/path"><img src="../image.jpg"></a>');
    sanitize(doc);
    const a = doc.children[0] as any;
    expect(a.attributes.get('href')).toBe('/path');
    expect(a.children[0].attributes.get('src')).toBe('../image.jpg');
  });

  test('respects allowedTags option', () => {
    const doc = parse('<div><p>Text</p><span>More</span></div>');
    sanitize(doc, { allowedTags: ['p'] });
    const result = serialize(doc);
    expect(result).toContain('<p>');
    expect(result).not.toContain('<span>');
    expect(result).not.toContain('<div>');
  });

  test('respects allowedAttrs option', () => {
    const doc = parse('<a href="/link" title="Title" class="link">Text</a>');
    sanitize(doc, { allowedAttrs: { a: ['href'] } });
    const a = doc.children[0] as any;
    expect(a.attributes.get('href')).toBe('/link');
    expect(a.attributes.has('title')).toBe(false);
    expect(a.attributes.has('class')).toBe(false);
  });

  test('allows data attributes when enabled', () => {
    const doc = parse('<div data-id="1" data-name="test">Text</div>');
    sanitize(doc, { allowDataAttrs: true });
    const div = doc.children[0] as any;
    expect(div.attributes.get('data-id')).toBe('1');
    expect(div.attributes.get('data-name')).toBe('test');
  });

  test('strips data attributes when disabled', () => {
    const doc = parse('<div data-id="1">Text</div>');
    sanitize(doc, { allowDataAttrs: false });
    const div = doc.children[0] as any;
    expect(div.attributes.has('data-id')).toBe(false);
  });

  test('strips classes when disabled', () => {
    const doc = parse('<div class="foo bar">Text</div>');
    sanitize(doc, { allowClasses: false });
    const div = doc.children[0] as any;
    expect(div.attributes.has('class')).toBe(false);
  });

  test('stripAll converts to text', () => {
    const doc = parse('<div><p>Hello</p><p>World</p></div>');
    const div = doc.children[0] as any;
    sanitize(div, { stripAll: true });
    const result = serialize(doc);
    expect(result).toContain('Hello');
    expect(result).toContain('World');
  });

  test('custom sanitizeUrl function', () => {
    const doc = parse('<a href="custom://link">Text</a>');
    sanitize(doc, {
      sanitizeUrl: (url) => url.startsWith('custom://') ? url : null
    });
    const a = doc.children[0] as any;
    expect(a.attributes.get('href')).toBe('custom://link');
  });
});

describe('sanitizeHtml', () => {
  test('sanitizes and returns HTML string', () => {
    const result = sanitizeHtml('<div><script>bad</script><p>good</p></div>');
    expect(result).not.toContain('<script>');
    expect(result).toContain('<p>good</p>');
  });

  test('accepts options', () => {
    const result = sanitizeHtml('<div><p>Text</p></div>', { allowedTags: ['p'] });
    expect(result).not.toContain('<div>');
    expect(result).toContain('<p>Text</p>');
  });
});

describe('escapeHtmlText', () => {
  test('escapes special characters', () => {
    expect(escapeHtmlText('<script>')).toBe('&lt;script&gt;');
    expect(escapeHtmlText('a & b')).toBe('a &amp; b');
    expect(escapeHtmlText('"quoted"')).toBe('&quot;quoted&quot;');
    expect(escapeHtmlText("'single'")).toBe('&#39;single&#39;');
  });

  test('handles mixed content', () => {
    expect(escapeHtmlText('<a href="test">Link & Text</a>'))
      .toBe('&lt;a href=&quot;test&quot;&gt;Link &amp; Text&lt;/a&gt;');
  });
});
