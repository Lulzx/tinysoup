import { expect, test, describe } from 'bun:test';
import { parse } from '../src/parser';
import { querySelectorAll } from '../src/selector';
import { Elements, children, siblings } from '../src/elements';

const html = `
<ul id="list">
  <li class="item active">First</li>
  <li class="item">Second</li>
  <li class="item">Third</li>
</ul>
`;

describe('Elements', () => {
  const doc = parse(html);
  const items = querySelectorAll(doc, 'li');
  const els = new Elements(items);

  test('length returns count', () => {
    expect(els.length).toBe(3);
  });

  test('isEmpty returns false for non-empty', () => {
    expect(els.isEmpty).toBe(false);
  });

  test('isEmpty returns true for empty', () => {
    expect(new Elements([]).isEmpty).toBe(true);
  });

  test('first returns first element', () => {
    expect(els.first?.classList?.has('active')).toBe(true);
  });

  test('first returns null for empty', () => {
    expect(new Elements([]).first).toBeNull();
  });

  test('last returns last element', () => {
    const lastText = els.last?.children[0] as any;
    expect(lastText.content).toBe('Third');
  });

  test('last returns null for empty', () => {
    expect(new Elements([]).last).toBeNull();
  });

  test('at returns element at index', () => {
    expect(els.at(1)?.children[0]).toHaveProperty('content', 'Second');
  });

  test('at supports negative index', () => {
    expect(els.at(-1)?.children[0]).toHaveProperty('content', 'Third');
  });

  test('at returns null for out of bounds', () => {
    expect(els.at(10)).toBeNull();
  });

  test('is iterable', () => {
    const tags = [];
    for (const el of els) {
      tags.push(el.tagName);
    }
    expect(tags).toEqual(['li', 'li', 'li']);
  });

  test('toArray returns array', () => {
    const arr = els.toArray();
    expect(Array.isArray(arr)).toBe(true);
    expect(arr.length).toBe(3);
  });

  test('map transforms elements', () => {
    const texts = els.map(el => (el.children[0] as any).content);
    expect(texts).toEqual(['First', 'Second', 'Third']);
  });

  test('filter filters elements', () => {
    const filtered = els.filter(el => el.classList?.has('active'));
    expect(filtered.length).toBe(1);
  });

  test('matching filters by selector', () => {
    const matched = els.matching('.active');
    expect(matched.length).toBe(1);
  });

  test('find returns first matching', () => {
    const found = els.find(el => !el.classList?.has('active'));
    expect(found?.children[0]).toHaveProperty('content', 'Second');
  });

  test('find returns null when not found', () => {
    const found = els.find(el => el.tagName === 'div');
    expect(found).toBeNull();
  });

  test('some returns true if any match', () => {
    expect(els.some(el => el.classList?.has('active'))).toBe(true);
  });

  test('some returns false if none match', () => {
    expect(els.some(el => el.tagName === 'div')).toBe(false);
  });

  test('every returns true if all match', () => {
    expect(els.every(el => el.classList?.has('item'))).toBe(true);
  });

  test('every returns false if any fails', () => {
    expect(els.every(el => el.classList?.has('active'))).toBe(false);
  });

  test('texts returns text content', () => {
    expect(els.texts()).toEqual(['First', 'Second', 'Third']);
  });

  test('attrs returns attribute values', () => {
    const doc2 = parse('<a href="/a">A</a><a href="/b">B</a><a>C</a>');
    const links = new Elements(querySelectorAll(doc2, 'a'));
    expect(links.attrs('href')).toEqual(['/a', '/b', undefined]);
  });

  test('select queries within all elements', () => {
    const doc2 = parse('<div><span>A</span></div><div><span>B</span></div>');
    const divs = new Elements(querySelectorAll(doc2, 'div'));
    const spans = divs.select('span');
    expect(spans.length).toBe(2);
  });

  test('unique removes duplicates', () => {
    const doc2 = parse('<div><p>A</p></div>');
    const p = querySelectorAll(doc2, 'p')[0];
    const withDupes = new Elements([p, p, p]);
    expect(withDupes.unique().length).toBe(1);
  });
});

describe('children', () => {
  const doc = parse('<div><p>A</p>text<p>B</p></div>');
  const div = doc.children[0] as any;

  test('returns only element children', () => {
    const result = children(div);
    expect(result.length).toBe(2);
    expect(result.first?.tagName).toBe('p');
  });
});

describe('siblings', () => {
  const doc = parse('<ul><li>A</li><li id="target">B</li><li>C</li></ul>');
  const target = querySelectorAll(doc, '#target')[0];

  test('returns sibling elements excluding self', () => {
    const result = siblings(target);
    expect(result.length).toBe(2);
  });

  test('returns empty Elements when no parent', () => {
    const orphan = parse('<div></div>').children[0] as any;
    orphan.parent = null;
    const result = siblings(orphan);
    expect(result.isEmpty).toBe(true);
  });
});
