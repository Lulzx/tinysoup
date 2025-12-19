import type { Element, Node, TextNode, CommentNode, DoctypeNode, ParseOptions, SoupStrainer, TagMatch, TextMatch, SourceLocation } from '../types';
import { decodeEntities } from './entities';

const VOID_ELEMENTS = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
  'link', 'meta', 'param', 'source', 'track', 'wbr'
]);

const RAW_TEXT_ELEMENTS = new Set(['script', 'style']);
const RCDATA_ELEMENTS = new Set(['textarea', 'title']);

const AUTO_CLOSE_MAP: Record<string, Set<string>> = {
  li: new Set(['li']),
  dt: new Set(['dt', 'dd']),
  dd: new Set(['dt', 'dd']),
  p: new Set([
    'address', 'article', 'aside', 'blockquote', 'details', 'div', 'dl',
    'fieldset', 'figcaption', 'figure', 'footer', 'form', 'h1', 'h2', 'h3',
    'h4', 'h5', 'h6', 'header', 'hgroup', 'hr', 'main', 'menu', 'nav', 'ol',
    'p', 'pre', 'section', 'table', 'ul'
  ]),
  rt: new Set(['rt', 'rp']),
  rp: new Set(['rt', 'rp']),
  optgroup: new Set(['optgroup']),
  option: new Set(['option', 'optgroup']),
  thead: new Set(['tbody', 'tfoot']),
  tbody: new Set(['tbody', 'tfoot']),
  tfoot: new Set(['tbody']),
  tr: new Set(['tr']),
  td: new Set(['td', 'th']),
  th: new Set(['td', 'th']),
};

function matchesTag(tagName: string, match: TagMatch): boolean {
  if (typeof match === 'string') return tagName === match.toLowerCase();
  if (match instanceof RegExp) return match.test(tagName);
  if (Array.isArray(match)) return match.some(t => tagName === t.toLowerCase());
  return match(tagName);
}

function matchesText(text: string, match: TextMatch): boolean {
  if (typeof match === 'string') return text.includes(match);
  if (match instanceof RegExp) return match.test(text);
  return match(text);
}

function matchesAttrs(attrs: Map<string, string>, expected: Record<string, string | RegExp | boolean>): boolean {
  for (const [name, exp] of Object.entries(expected)) {
    const value = attrs.get(name);
    if (exp === true && value === undefined) return false;
    if (exp === false && value !== undefined) return false;
    if (typeof exp === 'string' && value !== exp) return false;
    if (exp instanceof RegExp && (!value || !exp.test(value))) return false;
  }
  return true;
}

function matchesStrainer(el: Element, strainer: SoupStrainer, getText: () => string): boolean {
  if (strainer.name && !matchesTag(el.tagName, strainer.name)) return false;
  if (strainer.attrs && !matchesAttrs(el.attributes, strainer.attrs)) return false;
  if (strainer.string && !matchesText(getText(), strainer.string)) return false;
  return true;
}

export function detectEncoding(html: string | Uint8Array): string {
  if (html instanceof Uint8Array) {
    if (html[0] === 0xEF && html[1] === 0xBB && html[2] === 0xBF) return 'utf-8';
    if (html[0] === 0xFE && html[1] === 0xFF) return 'utf-16be';
    if (html[0] === 0xFF && html[1] === 0xFE) return 'utf-16le';
    html = new TextDecoder('utf-8').decode(html);
  }

  const metaCharset = html.match(/<meta\s+charset=["']?([^"'\s>]+)/i);
  if (metaCharset) return metaCharset[1].toLowerCase();

  const metaContentType = html.match(/<meta\s+http-equiv=["']?content-type["']?\s+content=["']?[^"']*charset=([^"'\s;>]+)/i);
  if (metaContentType) return metaContentType[1].toLowerCase();

  const metaContent = html.match(/<meta\s+content=["']?[^"']*charset=([^"'\s;>]+)["']?\s+http-equiv=["']?content-type/i);
  if (metaContent) return metaContent[1].toLowerCase();

  return 'utf-8';
}

export function parse(html: string, options: ParseOptions = {}): Element {
  const {
    lowerCaseTags = true,
    lowerCaseAttributes = true,
    strainer,
    trackSourceLocations = false,
    xmlMode = false
  } = options;

  const root: Element = {
    type: 'element',
    tagName: '#document',
    attributes: new Map(),
    children: [],
    parent: null,
  };

  let current: Element = root;
  let pos = 0;
  let line = 1;
  let column = 1;
  const len = html.length;

  function getLocation(): SourceLocation {
    return { line, column, offset: pos };
  }

  function advance(count: number = 1): void {
    for (let i = 0; i < count && pos < len; i++) {
      if (html[pos] === '\n') {
        line++;
        column = 1;
      } else {
        column++;
      }
      pos++;
    }
  }

  function createElement(tagName: string): Element {
    const el: Element = {
      type: 'element',
      tagName: lowerCaseTags ? tagName.toLowerCase() : tagName,
      attributes: new Map(),
      children: [],
      parent: null,
    };
    if (trackSourceLocations) el.sourceLocation = getLocation();
    return el;
  }

  function createText(content: string, loc?: SourceLocation): TextNode {
    const node: TextNode = { type: 'text', content, parent: null };
    if (trackSourceLocations && loc) node.sourceLocation = loc;
    return node;
  }

  function createComment(content: string, loc?: SourceLocation): CommentNode {
    const node: CommentNode = { type: 'comment', content, parent: null };
    if (trackSourceLocations && loc) node.sourceLocation = loc;
    return node;
  }

  function appendChild(parent: Element, child: Node): void {
    child.parent = parent;
    parent.children.push(child);
  }

  function shouldAutoClose(openTag: string, newTag: string): boolean {
    if (xmlMode) return false;
    return AUTO_CLOSE_MAP[openTag]?.has(newTag) ?? false;
  }

  function closeToTag(tagName: string): boolean {
    let el: Element | null = current;
    while (el && el !== root) {
      if (el.tagName === tagName) {
        current = el.parent!;
        return true;
      }
      el = el.parent;
    }
    return false;
  }

  function skipWhitespace(): void {
    while (pos < len && /\s/.test(html[pos])) advance();
  }

  function parseAttribute(): { name: string; value: string } | null {
    skipWhitespace();
    if (pos >= len || html[pos] === '>' || html[pos] === '/') return null;

    const nameStart = pos;
    while (pos < len && !/[\s=\/>]/.test(html[pos])) advance();
    const name = html.slice(nameStart, pos);
    if (!name) return null;

    skipWhitespace();
    if (html[pos] !== '=') {
      return { name: lowerCaseAttributes ? name.toLowerCase() : name, value: '' };
    }
    advance();
    skipWhitespace();

    let value: string;
    const quote = html[pos];
    if (quote === '"' || quote === "'") {
      advance();
      const valueStart = pos;
      while (pos < len && html[pos] !== quote) advance();
      value = html.slice(valueStart, pos);
      advance();
    } else {
      const valueStart = pos;
      while (pos < len && !/[\s>]/.test(html[pos])) advance();
      value = html.slice(valueStart, pos);
    }

    return {
      name: lowerCaseAttributes ? name.toLowerCase() : name,
      value: decodeEntities(value)
    };
  }

  function parseRawText(tagName: string, decode: boolean): string {
    const endTag = `</${tagName}`;
    const endIdx = html.toLowerCase().indexOf(endTag.toLowerCase(), pos);
    if (endIdx === -1) {
      const text = html.slice(pos);
      while (pos < len) advance();
      return decode ? decodeEntities(text) : text;
    }
    const text = html.slice(pos, endIdx);
    while (pos < endIdx) advance();
    return decode ? decodeEntities(text) : text;
  }

  function getElementText(el: Element): string {
    let text = '';
    for (const child of el.children) {
      if (child.type === 'text') text += (child as TextNode).content;
      else if (child.type === 'element') text += getElementText(child as Element);
    }
    return text;
  }

  function applyStrainer(el: Element): boolean {
    if (!strainer) return true;
    return matchesStrainer(el, strainer, () => getElementText(el));
  }

  while (pos < len) {
    if (html[pos] === '<') {
      if (html.slice(pos, pos + 4) === '<!--') {
        const loc = trackSourceLocations ? getLocation() : undefined;
        advance(4);
        const endIdx = html.indexOf('-->', pos);
        const content = endIdx === -1 ? html.slice(pos) : html.slice(pos, endIdx);
        appendChild(current, createComment(content, loc));
        if (endIdx === -1) {
          while (pos < len) advance();
        } else {
          while (pos < endIdx + 3) advance();
        }
      } else if (html.slice(pos, pos + 9).toLowerCase() === '<!doctype') {
        const loc = trackSourceLocations ? getLocation() : undefined;
        advance(9);
        const endIdx = html.indexOf('>', pos);
        const content = endIdx === -1 ? html.slice(pos) : html.slice(pos, endIdx);
        const doctype: DoctypeNode = { type: 'doctype', content: content.trim(), parent: null };
        if (trackSourceLocations && loc) doctype.sourceLocation = loc;
        appendChild(current, doctype);
        if (endIdx === -1) {
          while (pos < len) advance();
        } else {
          while (pos <= endIdx) advance();
        }
      } else if (html[pos + 1] === '/') {
        advance(2);
        const nameStart = pos;
        while (pos < len && /[a-zA-Z0-9:-]/.test(html[pos])) advance();
        const tagName = lowerCaseTags
          ? html.slice(nameStart, pos).toLowerCase()
          : html.slice(nameStart, pos);
        while (pos < len && html[pos] !== '>') advance();
        advance();
        closeToTag(tagName);
      } else if (html[pos + 1] === '!' || html[pos + 1] === '?') {
        advance();
        while (pos < len && html[pos] !== '>') advance();
        advance();
      } else {
        advance();
        const nameStart = pos;
        while (pos < len && /[a-zA-Z0-9:-]/.test(html[pos])) advance();
        const tagName = lowerCaseTags
          ? html.slice(nameStart, pos).toLowerCase()
          : html.slice(nameStart, pos);

        if (!tagName) {
          const loc = trackSourceLocations ? getLocation() : undefined;
          appendChild(current, createText('<', loc));
          continue;
        }

        if (shouldAutoClose(current.tagName, tagName)) {
          current = current.parent!;
        }

        const element = createElement(tagName);

        while (true) {
          const attr = parseAttribute();
          if (!attr) break;
          element.attributes.set(attr.name, attr.value);
          if (attr.name === 'id') element.id = attr.value;
          if (attr.name === 'class') {
            element.classList = new Set(attr.value.split(/\s+/).filter(Boolean));
          }
        }

        skipWhitespace();
        const selfClosing = html[pos] === '/';
        if (selfClosing) advance();
        while (pos < len && html[pos] !== '>') advance();
        advance();

        const isVoid = xmlMode ? selfClosing : VOID_ELEMENTS.has(tagName);

        const isRawText = RAW_TEXT_ELEMENTS.has(tagName) && !xmlMode;
        const isRcData = RCDATA_ELEMENTS.has(tagName) && !xmlMode;

        if (!selfClosing && !isVoid) {
          if (isRawText || isRcData) {
            const rawText = parseRawText(tagName, isRcData);
            if (rawText) appendChild(element, createText(rawText));
          }
        }

        if (applyStrainer(element)) {
          appendChild(current, element);
          if (!selfClosing && !isVoid && !(isRawText || isRcData)) {
            current = element;
          }
        }
      }
    } else {
      const loc = trackSourceLocations ? getLocation() : undefined;
      const textStart = pos;
      while (pos < len && html[pos] !== '<') advance();
      const text = html.slice(textStart, pos);
      if (text) {
        appendChild(current, createText(decodeEntities(text), loc));
      }
    }
  }

  return root;
}
