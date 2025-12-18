# tinysoup

**Zero-dependency HTML parser & manipulation. BeautifulSoup-inspired API for TypeScript.**

## Why?

| Library | Size | Dependencies |
|---------|------|--------------|
| Cheerio | ~300KB | 5+ |
| JSDOM | ~2MB | 20+ |
| **tinysoup** | **~62KB** | **0** |

## Install

```bash
npm install tinysoup
```

## Quick Start

```typescript
import { parseHtml, text, extract } from 'tinysoup';

// Parse HTML
const doc = parseHtml('<div><h1>Hello</h1><p class="intro">World</p></div>');

// CSS Selectors
const h1 = doc.selectOne('h1');
const paragraphs = doc.select('p');

// Quick text extraction
const title = text(html, 'h1'); // "Hello"

// Structured extraction
const data = extract(html, {
  title: 'h1',
  intro: '.intro',
  links: { select: 'a', attr: 'href', all: true },
  products: {
    select: '.product',
    all: true,
    children: {
      name: 'h2',
      price: { select: '.price', transform: parseFloat }
    }
  }
});
```

## Features

### CSS Selectors

```typescript
doc.select('div')                    // tag
doc.select('#id')                    // id
doc.select('.class')                 // class
doc.select('[href]')                 // has attribute
doc.select('[href="/"]')             // attribute equals
doc.select('[href^="https"]')        // starts with
doc.select('[href$=".pdf"]')         // ends with
doc.select('[href*="example"]')      // contains
doc.select('div span')               // descendant
doc.select('div > span')             // direct child
doc.select('h1 + p')                 // adjacent sibling
doc.select('h1 ~ p')                 // general sibling
doc.select(':first-child')           // pseudo-classes
doc.select(':nth-child(2n+1)')
doc.select(':not(.active)')
doc.select(':has(> img)')            // relational
doc.select(':lang(en)')              // language
```

### BeautifulSoup-style Find

```typescript
// Find by tag name
doc.findAll('div')
doc.find('a')

// Find with options
doc.findAll({ name: 'div', attrs: { class: /header/ } })
doc.find({ string: /hello/i })

// Find with predicate
doc.findAll(el => el.tagName === 'a' && el.attributes.has('href'))
```

### Text Extraction

```typescript
import { getText, strippedStrings } from 'tinysoup';

getText(el)                          // all text content
getText(el, { separator: ' ' })      // with separator
getText(el, { strip: true })         // trimmed

// Generator of non-empty strings
for (const s of strippedStrings(el)) {
  console.log(s);
}
```

### Element Manipulation

```typescript
import {
  setAttr, addClass, removeClass,
  append, prepend, remove, wrap, unwrap,
  newTag, insert
} from 'tinysoup';

// Attributes
setAttr(el, 'href', '/new');
addClass(el, 'active');
removeClass(el, 'hidden');

// Content
append(el, '<span>new</span>');
prepend(el, '<span>first</span>');
insert(el, 2, '<span>at index 2</span>');

// Structure
wrap(el, '<div class="wrapper"></div>');
unwrap(el);
remove(el);

// Create elements without parsing
const div = newTag('div', {
  attrs: { class: 'container', id: 'main' },
  children: ['Hello ', newTag('strong', { children: ['World'] })]
});
```

### Traversal

```typescript
import {
  findNext, findPrev, findNextSibling, findPrevSibling,
  findParent, findParents, closest, children, siblings
} from 'tinysoup';

findNext(el)                         // next element in document order
findNext(el, 'div')                  // next matching element
findPrev(el)                         // previous element
findNextSibling(el)                  // next sibling element
findParent(el, { name: 'div' })      // first matching ancestor
closest(el, '.container')            // closest ancestor matching selector
```

### Sanitization

```typescript
import { sanitize, sanitizeHtml } from 'tinysoup';

// Sanitize in place
sanitize(el, {
  allowedTags: ['p', 'a', 'strong'],
  allowedAttrs: { a: ['href'] }
});

// Sanitize HTML string
const clean = sanitizeHtml(dirtyHtml);
```

### Output Formats

```typescript
doc.toHtml()                                    // default
doc.toHtml({ format: 'minimal' })               // no unnecessary quotes
doc.toHtml({ format: 'html5' })                 // HTML5 doctype
doc.toHtml({ format: 'xhtml' })                 // self-closing tags
doc.prettify()                                  // indented output
doc.prettify({ indent: '\t', newline: '\n' })
```

### Advanced Parsing

```typescript
// SoupStrainer - filter during parse
const doc = parseHtml(html, {
  strainer: { name: 'div', attrs: { class: /product/ } }
});

// Source location tracking
const doc = parseHtml(html, { trackSourceLocations: true });
const el = doc.selectOne('h1');
console.log(el.sourceLocation); // { line: 5, column: 3, offset: 42 }

// XML mode
const doc = parseHtml(xml, { xmlMode: true });

// Encoding detection
import { detectEncoding } from 'tinysoup';
const encoding = detectEncoding(buffer); // 'utf-8', 'utf-16le', etc.
```

### Structured Extraction

```typescript
import { extract } from 'tinysoup';

const data = extract(html, {
  // Simple: selector → text
  title: 'h1',

  // Attribute
  link: { select: 'a', attr: 'href' },

  // Multiple values
  tags: { select: '.tag', all: true },

  // Transform
  price: { select: '.price', transform: parseFloat },

  // Nested
  products: {
    select: '.product',
    all: true,
    children: {
      name: 'h2',
      price: { select: '.price', transform: parseFloat }
    }
  }
});
```

## API Reference

### Document

```typescript
const doc = parseHtml(html, options?);

doc.select(selector, { limit? })     // Elements
doc.selectOne(selector)              // Element | null
doc.exists(selector)                 // boolean
doc.count(selector)                  // number
doc.findAll(options)                 // Element[]
doc.find(options)                    // Element | null
doc.getText(options?)                // string
doc.toHtml(options?)                 // string
doc.prettify(options?)               // string
doc.extract(spec)                    // typed result
doc.sanitize(options?)               // this
```

### Elements Collection

```typescript
const els = doc.select('div');

els.length                           // number
els.isEmpty                          // boolean
els.first                            // Element | null
els.last                             // Element | null
els.at(index)                        // Element | null
els.toArray()                        // Element[]
els.map(fn)                          // T[]
els.filter(fn)                       // Elements
els.find(fn)                         // Element | null
els.texts()                          // string[]
els.attrs(name)                      // (string | undefined)[]
els.matching(selector)               // Elements
```

## License

MIT
