import { expect, test, describe } from 'bun:test';
import { parse } from '../src/parser';
import { querySelectorAll, querySelector, matches, selectParents } from '../src/selector';

const html = `
<div id="root" class="container">
  <header class="header">
    <h1 lang="en">Title</h1>
    <nav>
      <a href="/" class="link active">Home</a>
      <a href="/about" class="link">About</a>
      <a href="/contact" class="link">Contact</a>
    </nav>
  </header>
  <main>
    <article class="post" data-id="1">
      <h2>Post 1</h2>
      <p class="intro">First paragraph</p>
      <p>Second paragraph</p>
    </article>
    <article class="post featured" data-id="2">
      <h2>Post 2</h2>
      <p class="intro">Featured intro</p>
    </article>
  </main>
  <footer>
    <p>Footer text</p>
  </footer>
</div>
`;

describe('querySelectorAll', () => {
  const doc = parse(html);

  test('selects by tag', () => {
    const result = querySelectorAll(doc, 'p');
    expect(result.length).toBe(4);
  });

  test('selects by class', () => {
    const result = querySelectorAll(doc, '.link');
    expect(result.length).toBe(3);
  });

  test('selects by id', () => {
    const result = querySelectorAll(doc, '#root');
    expect(result.length).toBe(1);
  });

  test('selects by attribute presence', () => {
    const result = querySelectorAll(doc, '[data-id]');
    expect(result.length).toBe(2);
  });

  test('selects by attribute value', () => {
    const result = querySelectorAll(doc, '[data-id="1"]');
    expect(result.length).toBe(1);
  });

  test('selects by attribute starts with', () => {
    const result = querySelectorAll(doc, '[href^="/a"]');
    expect(result.length).toBe(1);
  });

  test('selects by attribute ends with', () => {
    const result = querySelectorAll(doc, '[href$="act"]');
    expect(result.length).toBe(1);
  });

  test('selects by attribute contains', () => {
    const result = querySelectorAll(doc, '[href*="out"]');
    expect(result.length).toBe(1);
  });

  test('selects descendant', () => {
    const result = querySelectorAll(doc, 'nav a');
    expect(result.length).toBe(3);
  });

  test('selects direct child', () => {
    const result = querySelectorAll(doc, 'nav > a');
    expect(result.length).toBe(3);
  });

  test('selects adjacent sibling', () => {
    const result = querySelectorAll(doc, 'h2 + p');
    expect(result.length).toBe(2);
  });

  test('selects general sibling', () => {
    const result = querySelectorAll(doc, 'h2 ~ p');
    expect(result.length).toBe(3);
  });

  test('selects multiple selectors', () => {
    const result = querySelectorAll(doc, 'h1, h2');
    expect(result.length).toBe(3);
  });

  test('selects with multiple classes', () => {
    const result = querySelectorAll(doc, '.post.featured');
    expect(result.length).toBe(1);
  });

  test('respects limit option', () => {
    const result = querySelectorAll(doc, 'p', { limit: 2 });
    expect(result.length).toBe(2);
  });
});

describe('pseudo-classes', () => {
  const doc = parse(html);

  test(':first-child', () => {
    const result = querySelectorAll(doc, 'a:first-child');
    expect(result.length).toBe(1);
    expect(result[0].attributes.get('href')).toBe('/');
  });

  test(':last-child', () => {
    const result = querySelectorAll(doc, 'a:last-child');
    expect(result.length).toBe(1);
    expect(result[0].attributes.get('href')).toBe('/contact');
  });

  test(':nth-child', () => {
    const result = querySelectorAll(doc, 'a:nth-child(2)');
    expect(result.length).toBe(1);
    expect(result[0].attributes.get('href')).toBe('/about');
  });

  test(':nth-child(odd)', () => {
    const result = querySelectorAll(doc, 'a:nth-child(odd)');
    expect(result.length).toBe(2);
  });

  test(':nth-child(even)', () => {
    const result = querySelectorAll(doc, 'a:nth-child(even)');
    expect(result.length).toBe(1);
  });

  test(':first-of-type', () => {
    const result = querySelectorAll(doc, 'p:first-of-type');
    expect(result.length).toBe(3);
  });

  test(':last-of-type', () => {
    const result = querySelectorAll(doc, 'p:last-of-type');
    expect(result.length).toBe(3);
  });

  test(':only-child', () => {
    const doc2 = parse('<div><p>Only</p></div><div><p>A</p><p>B</p></div>');
    const result = querySelectorAll(doc2, 'p:only-child');
    expect(result.length).toBe(1);
  });

  test(':empty', () => {
    const doc2 = parse('<div><p></p><p>Text</p><p>   </p></div>');
    const result = querySelectorAll(doc2, 'p:empty');
    expect(result.length).toBe(2);
  });

  test(':not', () => {
    const result = querySelectorAll(doc, 'a:not(.active)');
    expect(result.length).toBe(2);
  });

  test(':has with descendant', () => {
    const result = querySelectorAll(doc, 'article:has(.intro)');
    expect(result.length).toBe(2);
  });

  test(':has with direct child', () => {
    const result = querySelectorAll(doc, 'article:has(> h2)');
    expect(result.length).toBe(2);
  });

  test(':has with adjacent sibling', () => {
    const result = querySelectorAll(doc, 'h2:has(+ .intro)');
    expect(result.length).toBe(2);
  });

  test(':is', () => {
    const result = querySelectorAll(doc, ':is(h1, h2)');
    expect(result.length).toBe(3);
  });

  test(':where', () => {
    const result = querySelectorAll(doc, 'article :where(.intro, h2)');
    expect(result.length).toBe(4);
  });

  test(':lang', () => {
    const result = querySelectorAll(doc, ':lang(en)');
    expect(result.length).toBe(1);
    expect(result[0].tagName).toBe('h1');
  });

  test(':contains', () => {
    const result = querySelectorAll(doc, 'p:contains(First)');
    expect(result.length).toBe(1);
  });

  test(':root', () => {
    const result = querySelectorAll(doc, ':root');
    expect(result.length).toBe(1);
    expect(result[0].tagName).toBe('div');
  });

  test(':enabled/:disabled', () => {
    const doc2 = parse('<input type="text"><input type="text" disabled>');
    expect(querySelectorAll(doc2, ':enabled').length).toBe(1);
    expect(querySelectorAll(doc2, ':disabled').length).toBe(1);
  });

  test(':checked', () => {
    const doc2 = parse('<input type="checkbox"><input type="checkbox" checked>');
    expect(querySelectorAll(doc2, ':checked').length).toBe(1);
  });
});

describe('querySelector', () => {
  const doc = parse(html);

  test('returns first match', () => {
    const result = querySelector(doc, 'p');
    expect(result?.tagName).toBe('p');
    expect(result?.classList?.has('intro')).toBe(true);
  });

  test('returns null when not found', () => {
    const result = querySelector(doc, '.nonexistent');
    expect(result).toBeNull();
  });
});

describe('matches', () => {
  const doc = parse('<div class="foo bar" id="test" data-x="1"></div>');
  const el = doc.children[0] as any;

  test('matches tag', () => {
    expect(matches(el, 'div')).toBe(true);
    expect(matches(el, 'span')).toBe(false);
  });

  test('matches class', () => {
    expect(matches(el, '.foo')).toBe(true);
    expect(matches(el, '.bar')).toBe(true);
    expect(matches(el, '.baz')).toBe(false);
  });

  test('matches id', () => {
    expect(matches(el, '#test')).toBe(true);
    expect(matches(el, '#other')).toBe(false);
  });

  test('matches combined', () => {
    expect(matches(el, 'div.foo#test')).toBe(true);
    expect(matches(el, 'div.foo.bar')).toBe(true);
  });

  test('matches attribute', () => {
    expect(matches(el, '[data-x]')).toBe(true);
    expect(matches(el, '[data-x="1"]')).toBe(true);
    expect(matches(el, '[data-y]')).toBe(false);
  });
});

describe('selectParents', () => {
  const doc = parse('<div class="a"><div class="b"><p id="target">Text</p></div></div>');
  const p = querySelector(doc, '#target')!;

  test('finds all matching ancestors', () => {
    const result = selectParents(p, 'div');
    expect(result.length).toBe(2);
  });

  test('finds specific ancestor', () => {
    const result = selectParents(p, '.a');
    expect(result.length).toBe(1);
  });

  test('returns empty array when no match', () => {
    const result = selectParents(p, 'span');
    expect(result.length).toBe(0);
  });
});
