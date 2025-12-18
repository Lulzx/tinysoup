# tinysoup

Zero-dependency HTML parser with BeautifulSoup-inspired API for TypeScript.

```bash
npm install tinysoup
```

## Quick Start

```typescript
import { parseHtml, text, extract } from 'tinysoup';

const doc = parseHtml('<div><h1>Hello</h1><p class="intro">World</p></div>');
doc.selectOne('h1');              // Element
doc.select('p');                  // Elements

// One-liner extraction
text(html, 'h1');                 // "Hello"

// Structured extraction
extract(html, {
  title: 'h1',
  links: { select: 'a', attr: 'href', all: true },
  products: {
    select: '.product', all: true,
    children: { name: 'h2', price: { select: '.price', transform: parseFloat } }
  }
});
```

## Selectors

```typescript
doc.select('div')                 // tag
doc.select('.class, #id')         // class, id, multiple
doc.select('[href^="https"]')     // attribute (=, ^=, $=, *=, ~=)
doc.select('div > p + span')      // combinators
doc.select(':nth-child(2n+1)')    // pseudo-classes
doc.select(':has(> img)')         // relational
doc.select(':not(.hidden)')       // negation
```

## Find (BeautifulSoup-style)

```typescript
doc.findAll('div')
doc.find({ name: 'a', attrs: { href: /^https/ } })
doc.findAll(el => el.classList?.has('active'))
```

## Traversal

```typescript
findNext(el)                      // next in document order
findNextSibling(el, 'div')        // next sibling matching
findParent(el, { name: 'ul' })    // ancestor matching
closest(el, '.container')         // closest ancestor by selector
children(el)                      // direct children
```

## Manipulation

```typescript
setAttr(el, 'href', '/new')
addClass(el, 'active')
append(el, '<span>new</span>')
insert(el, 2, '<p>at index</p>')
wrap(el, '<div class="wrapper"></div>')
remove(el)

// Create without parsing
newTag('div', { attrs: { class: 'box' }, children: ['Hello'] })
```

## Text

```typescript
getText(el)                       // all text
getText(el, { strip: true, separator: ' ' })
strippedStrings(el)               // generator of non-empty strings
```

## Output

```typescript
doc.toHtml()                      // default
doc.toHtml({ format: 'minimal' }) // unquoted attrs where valid
doc.toHtml({ format: 'xhtml' })   // self-closing tags
doc.prettify()                    // indented
```

## Sanitize

```typescript
sanitize(el, { allowedTags: ['p', 'a'], allowedAttrs: { a: ['href'] } })
sanitizeHtml(dirtyHtml)
```

## Advanced

```typescript
// Filter during parse
parseHtml(html, { strainer: { name: 'div', attrs: { class: /item/ } } })

// Track source locations
parseHtml(html, { trackSourceLocations: true })
el.sourceLocation  // { line: 5, column: 3, offset: 42 }

// Detect encoding
detectEncoding(buffer)  // 'utf-8', 'utf-16le', etc.

// XML mode
parseHtml(xml, { xmlMode: true })
```

## Elements Collection

```typescript
const els = doc.select('li');
els.length / els.first / els.last / els.at(-1)
els.map(fn) / els.filter(fn) / els.find(fn)
els.texts() / els.attrs('href')
els.matching('.active')
```

## Testing

```bash
bun test
```

234 tests covering parser, selectors, traversal, manipulation, and sanitization.

## License

MIT
