import { expect, test, describe } from 'bun:test';
import { parse, serialize } from '../src/parser';
import { querySelector } from '../src/selector';
import {
  setAttr, removeAttr, addClass, removeClass, toggleClass,
  attr, attrs, data, hasClass, classes,
  newTag, createTextNode, createComment,
  setText, setInnerHtml, append, prepend, insert, remove, empty,
  clone, decompose, smooth,
  replaceWith, wrap, unwrap, insertBefore, insertAfter
} from '../src/mutate';

describe('attribute mutations', () => {
  test('setAttr sets attribute', () => {
    const doc = parse('<a>Link</a>');
    const a = doc.children[0] as any;
    setAttr(a, 'href', '/test');
    expect(a.attributes.get('href')).toBe('/test');
  });

  test('setAttr updates id property', () => {
    const doc = parse('<div></div>');
    const div = doc.children[0] as any;
    setAttr(div, 'id', 'main');
    expect(div.id).toBe('main');
  });

  test('setAttr updates classList', () => {
    const doc = parse('<div></div>');
    const div = doc.children[0] as any;
    setAttr(div, 'class', 'foo bar');
    expect(div.classList?.has('foo')).toBe(true);
    expect(div.classList?.has('bar')).toBe(true);
  });

  test('removeAttr removes attribute', () => {
    const doc = parse('<a href="/test">Link</a>');
    const a = doc.children[0] as any;
    removeAttr(a, 'href');
    expect(a.attributes.has('href')).toBe(false);
  });

  test('addClass adds class', () => {
    const doc = parse('<div class="foo"></div>');
    const div = doc.children[0] as any;
    addClass(div, 'bar');
    expect(div.classList?.has('bar')).toBe(true);
    expect(div.attributes.get('class')).toBe('foo bar');
  });

  test('addClass adds multiple classes', () => {
    const doc = parse('<div></div>');
    const div = doc.children[0] as any;
    addClass(div, 'foo bar baz');
    expect(div.classList?.size).toBe(3);
  });

  test('removeClass removes class', () => {
    const doc = parse('<div class="foo bar"></div>');
    const div = doc.children[0] as any;
    removeClass(div, 'foo');
    expect(div.classList?.has('foo')).toBe(false);
    expect(div.classList?.has('bar')).toBe(true);
  });

  test('removeClass removes class attribute when empty', () => {
    const doc = parse('<div class="foo"></div>');
    const div = doc.children[0] as any;
    removeClass(div, 'foo');
    expect(div.attributes.has('class')).toBe(false);
  });

  test('toggleClass toggles class', () => {
    const doc = parse('<div class="foo bar"></div>');
    const div = doc.children[0] as any;
    toggleClass(div, 'foo');
    expect(div.classList?.has('foo')).toBe(false);
    expect(div.classList?.has('bar')).toBe(true);
    toggleClass(div, 'foo');
    expect(div.classList?.has('foo')).toBe(true);
  });

  test('toggleClass with force', () => {
    const doc = parse('<div class="foo"></div>');
    const div = doc.children[0] as any;
    toggleClass(div, 'foo', true);
    expect(div.classList?.has('foo')).toBe(true);
    toggleClass(div, 'bar', false);
    expect(div.classList?.has('bar')).toBe(false);
  });

  test('attr gets attribute value', () => {
    const doc = parse('<a href="/test">Link</a>');
    const a = doc.children[0] as any;
    expect(attr(a, 'href')).toBe('/test');
    expect(attr(a, 'class')).toBeUndefined();
  });

  test('attrs gets all attributes', () => {
    const doc = parse('<a href="/test" class="link">Link</a>');
    const a = doc.children[0] as any;
    expect(attrs(a)).toEqual({ href: '/test', class: 'link' });
  });

  test('data gets data attributes', () => {
    const doc = parse('<div data-id="1" data-name="test" class="foo"></div>');
    const div = doc.children[0] as any;
    expect(data(div)).toEqual({ id: '1', name: 'test' });
  });

  test('hasClass checks class presence', () => {
    const doc = parse('<div class="foo bar"></div>');
    const div = doc.children[0] as any;
    expect(hasClass(div, 'foo')).toBe(true);
    expect(hasClass(div, 'baz')).toBe(false);
  });

  test('classes returns class list', () => {
    const doc = parse('<div class="foo bar"></div>');
    const div = doc.children[0] as any;
    expect(classes(div)).toEqual(['foo', 'bar']);
  });
});

describe('content mutations', () => {
  test('newTag creates element', () => {
    const el = newTag('div', {
      attrs: { class: 'container', id: 'main' },
      children: ['Hello']
    });
    expect(el.tagName).toBe('div');
    expect(el.id).toBe('main');
    expect(el.classList?.has('container')).toBe(true);
    expect(el.children.length).toBe(1);
    expect((el.children[0] as any).content).toBe('Hello');
  });

  test('newTag with nested elements', () => {
    const el = newTag('div', {
      children: [newTag('span', { children: ['Text'] })]
    });
    expect(el.children[0].type).toBe('element');
    expect((el.children[0] as any).tagName).toBe('span');
  });

  test('createTextNode creates text node', () => {
    const node = createTextNode('Hello');
    expect(node.type).toBe('text');
    expect(node.content).toBe('Hello');
  });

  test('createComment creates comment node', () => {
    const node = createComment('comment');
    expect(node.type).toBe('comment');
    expect(node.content).toBe('comment');
  });

  test('setText sets text content', () => {
    const doc = parse('<p>Old text</p>');
    const p = doc.children[0] as any;
    setText(p, 'New text');
    expect(p.children.length).toBe(1);
    expect(p.children[0].content).toBe('New text');
  });

  test('setInnerHtml sets HTML content', () => {
    const doc = parse('<div>Old</div>');
    const div = doc.children[0] as any;
    setInnerHtml(div, '<p>New</p><span>Content</span>');
    expect(div.children.length).toBe(2);
    expect(div.children[0].tagName).toBe('p');
  });

  test('append adds content at end', () => {
    const doc = parse('<div><p>First</p></div>');
    const div = doc.children[0] as any;
    append(div, '<p>Second</p>');
    expect(div.children.length).toBe(2);
    expect(div.children[1].tagName).toBe('p');
  });

  test('append adds element at end', () => {
    const doc = parse('<div><p>First</p></div>');
    const div = doc.children[0] as any;
    const span = newTag('span', { children: ['New'] });
    append(div, span);
    expect(div.children.length).toBe(2);
    expect(div.children[1].tagName).toBe('span');
    expect(span.parent).toBe(div);
  });

  test('prepend adds content at start', () => {
    const doc = parse('<div><p>Second</p></div>');
    const div = doc.children[0] as any;
    prepend(div, '<p>First</p>');
    expect(div.children.length).toBe(2);
    expect(div.children[0].tagName).toBe('p');
  });

  test('insert adds at position', () => {
    const doc = parse('<div><p>First</p><p>Third</p></div>');
    const div = doc.children[0] as any;
    insert(div, 1, '<p>Second</p>');
    expect(div.children.length).toBe(3);
    expect((div.children[1].children[0] as any).content).toBe('Second');
  });

  test('insert with negative index', () => {
    const doc = parse('<div><p>First</p><p>Third</p></div>');
    const div = doc.children[0] as any;
    insert(div, -1, '<p>Second</p>');
    expect(div.children.length).toBe(3);
  });

  test('remove removes element', () => {
    const doc = parse('<div><p>Keep</p><p>Remove</p></div>');
    const div = doc.children[0] as any;
    remove(div.children[1]);
    expect(div.children.length).toBe(1);
  });

  test('empty removes all children', () => {
    const doc = parse('<div><p>A</p><p>B</p></div>');
    const div = doc.children[0] as any;
    empty(div);
    expect(div.children.length).toBe(0);
  });

  test('clone creates deep copy', () => {
    const doc = parse('<div class="foo"><p>Text</p></div>');
    const div = doc.children[0] as any;
    const cloned = clone(div);
    expect(cloned.classList?.has('foo')).toBe(true);
    expect(cloned.children.length).toBe(1);
    expect(cloned.parent).toBeNull();
    expect(cloned).not.toBe(div);
  });

  test('clone shallow copy', () => {
    const doc = parse('<div><p>Text</p></div>');
    const div = doc.children[0] as any;
    const cloned = clone(div, false);
    expect(cloned.children.length).toBe(0);
  });

  test('decompose removes and clears element', () => {
    const doc = parse('<div><p class="test">Text</p></div>');
    const p = doc.children[0].children[0] as any;
    decompose(p);
    expect(p.parent).toBeNull();
    expect(p.children.length).toBe(0);
    expect(p.attributes.size).toBe(0);
  });

  test('smooth merges adjacent text nodes', () => {
    const doc = parse('<div></div>');
    const div = doc.children[0] as any;
    div.children = [
      createTextNode('Hello'),
      createTextNode(' '),
      createTextNode('World')
    ];
    smooth(div);
    expect(div.children.length).toBe(1);
    expect(div.children[0].content).toBe('Hello World');
  });
});

describe('structure mutations', () => {
  test('replaceWith replaces element', () => {
    const doc = parse('<div><p>Old</p></div>');
    const p = doc.children[0].children[0] as any;
    replaceWith(p, '<span>New</span>');
    const div = doc.children[0] as any;
    expect(div.children[0].tagName).toBe('span');
  });

  test('wrap wraps element', () => {
    const doc = parse('<div><p>Text</p></div>');
    const p = querySelector(doc, 'p')!;
    wrap(p, '<span class="wrapper"></span>');
    const div = doc.children[0] as any;
    expect(div.children[0].tagName).toBe('span');
    expect(div.children[0].children[0].tagName).toBe('p');
  });

  test('unwrap removes parent', () => {
    const doc = parse('<div><span><p>Text</p></span></div>');
    const p = querySelector(doc, 'p')!;
    unwrap(p);
    const div = doc.children[0] as any;
    expect(div.children[0].tagName).toBe('p');
  });

  test('insertBefore inserts before reference', () => {
    const doc = parse('<div><p>Second</p></div>');
    const p = querySelector(doc, 'p')!;
    const span = newTag('span', { children: ['First'] });
    insertBefore(span, p);
    const div = doc.children[0] as any;
    expect(div.children[0].tagName).toBe('span');
    expect(div.children[1].tagName).toBe('p');
  });

  test('insertAfter inserts after reference', () => {
    const doc = parse('<div><p>First</p></div>');
    const p = querySelector(doc, 'p')!;
    const span = newTag('span', { children: ['Second'] });
    insertAfter(span, p);
    const div = doc.children[0] as any;
    expect(div.children[0].tagName).toBe('p');
    expect(div.children[1].tagName).toBe('span');
  });
});
