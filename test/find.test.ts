import { expect, test, describe } from 'bun:test';
import { parse } from '../src/parser';
import {
  findAll, find, findNext, findPrev, findAllNext, findAllPrev,
  findNextSibling, findPrevSibling, findNextSiblings, findPrevSiblings,
  findParent, findParents, closest, walkElements
} from '../src/find';

const html = `
<div id="root">
  <header>
    <h1>Title</h1>
  </header>
  <main>
    <p class="intro">Intro text</p>
    <p>Regular text</p>
    <p class="highlight">Highlighted</p>
  </main>
  <footer>
    <p>Footer</p>
  </footer>
</div>
`;

describe('findAll', () => {
  const doc = parse(html);

  test('finds by tag name string', () => {
    const result = findAll(doc, 'p');
    expect(result.length).toBe(4);
  });

  test('finds by tag name option', () => {
    const result = findAll(doc, { name: 'p' });
    expect(result.length).toBe(4);
  });

  test('finds by tag regex', () => {
    const result = findAll(doc, { name: /^h/ });
    expect(result.length).toBe(2);
  });

  test('finds by tag array', () => {
    const result = findAll(doc, { name: ['header', 'footer'] });
    expect(result.length).toBe(2);
  });

  test('finds by predicate', () => {
    const result = findAll(doc, el => el.tagName === 'p');
    expect(result.length).toBe(4);
  });

  test('finds by string content', () => {
    const result = findAll(doc, { string: 'Title' });
    expect(result.length).toBeGreaterThanOrEqual(1);
  });

  test('finds by string regex', () => {
    const result = findAll(doc, { string: /Title/ });
    expect(result.length).toBeGreaterThanOrEqual(1);
  });

  test('finds by attrs', () => {
    const result = findAll(doc, { attrs: { class: 'intro' } });
    expect(result.length).toBe(1);
  });

  test('finds by attrs regex', () => {
    const result = findAll(doc, { attrs: { class: /^intro|highlight$/ } });
    expect(result.length).toBe(2);
  });

  test('finds by attrs presence', () => {
    const result = findAll(doc, { attrs: { class: true } });
    expect(result.length).toBe(2);
  });

  test('finds by attrs absence', () => {
    const result = findAll(doc, { name: 'p', attrs: { class: false } });
    expect(result.length).toBe(2);
  });

  test('respects limit', () => {
    const result = findAll(doc, { name: 'p', limit: 2 });
    expect(result.length).toBe(2);
  });

  test('non-recursive search', () => {
    const main = find(doc, 'main')!;
    const result = findAll(main, { name: 'p', recursive: false });
    expect(result.length).toBe(3);
  });
});

describe('find', () => {
  const doc = parse(html);

  test('returns first match', () => {
    const result = find(doc, 'p');
    expect(result?.classList?.has('intro')).toBe(true);
  });

  test('returns null when not found', () => {
    const result = find(doc, 'span');
    expect(result).toBeNull();
  });
});

describe('findNext/findPrev', () => {
  const doc = parse(html);
  const intro = find(doc, { attrs: { class: 'intro' } })!;

  test('findNext finds next element', () => {
    const result = findNext(intro);
    expect(result?.tagName).toBe('p');
    expect(result?.classList).toBeUndefined();
  });

  test('findNext with filter', () => {
    const result = findNext(intro, { attrs: { class: 'highlight' } });
    expect(result?.classList?.has('highlight')).toBe(true);
  });

  test('findPrev finds previous element', () => {
    const highlight = find(doc, { attrs: { class: 'highlight' } })!;
    const result = findPrev(highlight);
    expect(result?.tagName).toBe('p');
  });

  test('findAllNext finds all subsequent elements', () => {
    const result = findAllNext(intro, 'p');
    expect(result.length).toBe(3);
  });

  test('findAllPrev finds all previous elements', () => {
    const footer = find(doc, 'footer')!;
    const result = findAllPrev(footer, 'p');
    expect(result.length).toBe(3);
  });
});

describe('findNextSibling/findPrevSibling', () => {
  const doc = parse(html);
  const intro = find(doc, { attrs: { class: 'intro' } })!;

  test('findNextSibling finds next sibling', () => {
    const result = findNextSibling(intro);
    expect(result?.tagName).toBe('p');
  });

  test('findNextSibling with filter', () => {
    const result = findNextSibling(intro, { attrs: { class: 'highlight' } });
    expect(result?.classList?.has('highlight')).toBe(true);
  });

  test('findPrevSibling finds previous sibling', () => {
    const highlight = find(doc, { attrs: { class: 'highlight' } })!;
    const result = findPrevSibling(highlight);
    expect(result?.tagName).toBe('p');
  });

  test('findNextSiblings finds all next siblings', () => {
    const result = findNextSiblings(intro);
    expect(result.length).toBe(2);
  });

  test('findPrevSiblings finds all previous siblings', () => {
    const highlight = find(doc, { attrs: { class: 'highlight' } })!;
    const result = findPrevSiblings(highlight);
    expect(result.length).toBe(2);
  });
});

describe('findParent/findParents', () => {
  const doc = parse(html);
  const intro = find(doc, { attrs: { class: 'intro' } })!;

  test('findParent without filter returns immediate parent', () => {
    const result = findParent(intro);
    expect(result?.tagName).toBe('main');
  });

  test('findParent with filter', () => {
    const result = findParent(intro, { name: 'div' });
    expect(result?.id).toBe('root');
  });

  test('findParents returns all ancestors', () => {
    const result = findParents(intro);
    expect(result.length).toBe(2);
  });

  test('findParents with filter', () => {
    const p = find(doc, { name: 'p', string: 'Footer' })!;
    const result = findParents(p, 'div');
    expect(result.length).toBe(1);
  });
});

describe('closest', () => {
  const doc = parse(html);
  const intro = find(doc, { attrs: { class: 'intro' } })!;

  test('finds closest ancestor by selector', () => {
    const result = closest(intro, 'main');
    expect(result?.tagName).toBe('main');
  });

  test('finds closest with class selector', () => {
    const result = closest(intro, '#root');
    expect(result?.id).toBe('root');
  });

  test('returns null when not found', () => {
    const result = closest(intro, 'span');
    expect(result).toBeNull();
  });

  test('can match the element itself', () => {
    const result = closest(intro, '.intro');
    expect(result).toBe(intro);
  });
});

describe('walkElements', () => {
  const doc = parse('<div><p>A</p><p>B</p><span><a>C</a></span></div>');

  test('yields all descendants in order', () => {
    const div = doc.children[0] as any;
    const tags = [...walkElements(div)].map(el => el.tagName);
    expect(tags).toEqual(['p', 'p', 'span', 'a']);
  });
});
