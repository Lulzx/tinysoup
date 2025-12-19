import { expect, test, describe } from 'bun:test';
import { parse, serialize, detectEncoding } from '../src/parser';

describe('parse', () => {
  test('parses basic HTML', () => {
    const doc = parse('<div><p>Hello</p></div>');
    expect(doc.tagName).toBe('#document');
    expect(doc.children.length).toBe(1);
    const div = doc.children[0] as any;
    expect(div.tagName).toBe('div');
    expect(div.children[0].tagName).toBe('p');
  });

  test('parses attributes', () => {
    const doc = parse('<a href="/test" class="link btn" id="main">Click</a>');
    const a = doc.children[0] as any;
    expect(a.attributes.get('href')).toBe('/test');
    expect(a.attributes.get('class')).toBe('link btn');
    expect(a.id).toBe('main');
    expect(a.classList?.has('link')).toBe(true);
    expect(a.classList?.has('btn')).toBe(true);
  });

  test('handles void elements', () => {
    const doc = parse('<div><br><img src="test.jpg"><hr></div>');
    const div = doc.children[0] as any;
    expect(div.children.length).toBe(3);
    expect(div.children[0].tagName).toBe('br');
    expect(div.children[1].tagName).toBe('img');
    expect(div.children[2].tagName).toBe('hr');
  });

  test('handles self-closing tags', () => {
    const doc = parse('<div><input type="text" /><span/></div>');
    const div = doc.children[0] as any;
    expect(div.children[0].tagName).toBe('input');
  });

  test('parses comments', () => {
    const doc = parse('<div><!-- comment --><p>text</p></div>');
    const div = doc.children[0] as any;
    expect(div.children[0].type).toBe('comment');
    expect(div.children[0].content).toBe(' comment ');
  });

  test('parses doctype', () => {
    const doc = parse('<!DOCTYPE html><html></html>');
    expect(doc.children[0].type).toBe('doctype');
    expect((doc.children[0] as any).content).toBe('html');
  });

  test('handles nested elements', () => {
    const doc = parse('<ul><li><a href="#">Link 1</a></li><li><a href="#">Link 2</a></li></ul>');
    const ul = doc.children[0] as any;
    expect(ul.tagName).toBe('ul');
    expect(ul.children.length).toBe(2);
    expect(ul.children[0].tagName).toBe('li');
    expect(ul.children[0].children[0].tagName).toBe('a');
  });

  test('decodes HTML entities', () => {
    const doc = parse('<p>&lt;script&gt; &amp; &quot;test&quot;</p>');
    const p = doc.children[0] as any;
    expect(p.children[0].content).toBe('<script> & "test"');
  });

  test('handles raw text elements', () => {
    const doc = parse('<script>const x = 1 < 2;</script>');
    const script = doc.children[0] as any;
    expect(script.children[0].content).toBe('const x = 1 < 2;');
  });

  test('decodes RCDATA elements', () => {
    const doc = parse('<textarea>1 &lt; 2</textarea><title>Fish &amp; Chips</title>');
    const textarea = doc.children[0] as any;
    const title = doc.children[1] as any;
    expect(textarea.children[0].content).toBe('1 < 2');
    expect(title.children[0].content).toBe('Fish & Chips');
  });

  test('handles custom element closing tags', () => {
    const doc = parse('<my-tag>One</my-tag><x:tag>Two</x:tag>');
    const first = doc.children[0] as any;
    const second = doc.children[1] as any;
    expect(first.tagName).toBe('my-tag');
    expect(second.tagName).toBe('x:tag');
  });

  test('auto-closes implicit tags', () => {
    const doc = parse('<ul><li>One<li>Two<li>Three</ul>');
    const ul = doc.children[0] as any;
    expect(ul.children.length).toBe(3);
    expect(ul.children[0].tagName).toBe('li');
    expect(ul.children[1].tagName).toBe('li');
    expect(ul.children[2].tagName).toBe('li');
  });

  test('tracks source locations', () => {
    const doc = parse('<div>\n  <p>Hello</p>\n</div>', { trackSourceLocations: true });
    const div = doc.children[0] as any;
    expect(div.sourceLocation).toBeDefined();
    expect(div.sourceLocation.line).toBe(1);
    const p = div.children[1] as any;
    expect(p.sourceLocation.line).toBe(2);
  });

  test('applies strainer filter', () => {
    const doc = parse('<p class="keep">A</p><p class="skip">B</p><p class="keep">C</p>', {
      strainer: { name: 'p', attrs: { class: 'keep' } }
    });
    const paragraphs = doc.children.filter((c: any) => c.type === 'element');
    expect(paragraphs.length).toBe(2);
  });

  test('xml mode respects self-closing', () => {
    const doc = parse('<root><item/><item></item></root>', { xmlMode: true });
    const root = doc.children[0] as any;
    expect(root.children.length).toBe(2);
  });
});

describe('serialize', () => {
  test('serializes basic HTML', () => {
    const doc = parse('<div><p>Hello</p></div>');
    expect(serialize(doc)).toBe('<div><p>Hello</p></div>');
  });

  test('serializes attributes', () => {
    const doc = parse('<a href="/test" class="link">Click</a>');
    expect(serialize(doc)).toBe('<a href="/test" class="link">Click</a>');
  });

  test('serializes void elements', () => {
    const doc = parse('<div><br><img src="test.jpg"></div>');
    expect(serialize(doc)).toBe('<div><br><img src="test.jpg"></div>');
  });

  test('escapes text content', () => {
    const doc = parse('<p>Test</p>');
    (doc.children[0] as any).children[0].content = '<script> & "test"';
    expect(serialize(doc)).toBe('<p>&lt;script&gt; &amp; "test"</p>');
  });

  test('preserves raw text in script/style', () => {
    const doc = parse('<script>const x = 1 < 2;</script><style>.a{content:"<"}</style>');
    expect(serialize(doc)).toBe('<script>const x = 1 < 2;</script><style>.a{content:"<"}</style>');
  });

  test('xhtml format uses self-closing', () => {
    const doc = parse('<div><br></div>');
    expect(serialize(doc, { format: 'xhtml' })).toBe('<div><br /></div>');
  });

  test('minimal format omits quotes where valid', () => {
    const doc = parse('<input type="text" disabled>');
    const result = serialize(doc, { format: 'minimal' });
    expect(result).toContain('type=text');
    expect(result).toContain('disabled');
  });

  test('html5 format uses short doctype', () => {
    const doc = parse('<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN"><html></html>');
    expect(serialize(doc, { format: 'html5' })).toBe('<!DOCTYPE html><html></html>');
  });
});

describe('detectEncoding', () => {
  test('detects UTF-8 BOM', () => {
    const buffer = new Uint8Array([0xEF, 0xBB, 0xBF, 0x3C, 0x68, 0x74, 0x6D, 0x6C]);
    expect(detectEncoding(buffer)).toBe('utf-8');
  });

  test('detects UTF-16LE BOM', () => {
    const buffer = new Uint8Array([0xFF, 0xFE, 0x3C, 0x00]);
    expect(detectEncoding(buffer)).toBe('utf-16le');
  });

  test('detects UTF-16BE BOM', () => {
    const buffer = new Uint8Array([0xFE, 0xFF, 0x00, 0x3C]);
    expect(detectEncoding(buffer)).toBe('utf-16be');
  });

  test('detects charset from meta tag', () => {
    expect(detectEncoding('<meta charset="iso-8859-1">')).toBe('iso-8859-1');
  });

  test('detects charset from content-type meta', () => {
    expect(detectEncoding('<meta http-equiv="content-type" content="text/html; charset=windows-1252">')).toBe('windows-1252');
  });

  test('defaults to utf-8', () => {
    expect(detectEncoding('<html></html>')).toBe('utf-8');
  });
});
