import { expect, test, describe } from 'bun:test';
import { parse } from '../src/parser';
import { extractFrom } from '../src/extract';
import { extract } from '../src/convenience';

const html = `
<div class="product-list">
  <article class="product" data-id="1">
    <h2>Product A</h2>
    <span class="price">$19.99</span>
    <a href="/product/1" class="link">View</a>
    <ul class="tags">
      <li>sale</li>
      <li>new</li>
    </ul>
  </article>
  <article class="product" data-id="2">
    <h2>Product B</h2>
    <span class="price">$29.99</span>
    <a href="/product/2" class="link">View</a>
    <ul class="tags">
      <li>featured</li>
    </ul>
  </article>
</div>
`;

describe('extractFrom', () => {
  const doc = parse(html);

  test('extracts text with selector string', () => {
    const result = extractFrom(doc, {
      firstProduct: '.product h2'
    });
    expect(result.firstProduct).toBe('Product A');
  });

  test('extracts attribute', () => {
    const result = extractFrom(doc, {
      link: { select: '.product a', attr: 'href' }
    });
    expect(result.link).toBe('/product/1');
  });

  test('extracts all matching text', () => {
    const result = extractFrom(doc, {
      names: { select: '.product h2', all: true }
    });
    expect(result.names).toEqual(['Product A', 'Product B']);
  });

  test('extracts all attributes', () => {
    const result = extractFrom(doc, {
      links: { select: '.product a', attr: 'href', all: true }
    });
    expect(result.links).toEqual(['/product/1', '/product/2']);
  });

  test('transforms value', () => {
    const result = extractFrom(doc, {
      price: { select: '.price', transform: (v: string) => parseFloat(v.replace('$', '')) }
    });
    expect(result.price).toBe(19.99);
  });

  test('extracts nested structure', () => {
    const result = extractFrom(doc, {
      products: {
        select: '.product',
        all: true,
        children: {
          name: 'h2',
          price: '.price',
          link: { select: 'a', attr: 'href' }
        }
      }
    });
    expect(result.products.length).toBe(2);
    expect(result.products[0].name).toBe('Product A');
    expect(result.products[0].price).toBe('$19.99');
    expect(result.products[0].link).toBe('/product/1');
    expect(result.products[1].name).toBe('Product B');
  });

  test('handles missing elements', () => {
    const result = extractFrom(doc, {
      missing: '.nonexistent'
    });
    expect(result.missing).toBe('');
  });

  test('nested extraction with transform', () => {
    const result = extractFrom(doc, {
      products: {
        select: '.product',
        all: true,
        children: {
          name: 'h2',
          price: { select: '.price', transform: (v: string) => parseFloat(v.replace('$', '')) },
          id: { select: '', attr: 'data-id', transform: Number }
        }
      }
    });
    expect(result.products[0].price).toBe(19.99);
  });
});

describe('extract convenience', () => {
  test('extracts from HTML string', () => {
    const result = extract(html, {
      title: '.product h2',
      links: { select: 'a', attr: 'href', all: true }
    });
    expect(result.title).toBe('Product A');
    expect(result.links.length).toBe(2);
  });
});
