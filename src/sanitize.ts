import type { Element, Node, TextNode, SanitizeOptions } from './types';
import { parse, serialize } from './parser';
import { getText } from './text';

const DEFAULT_ALLOWED_TAGS = new Set([
  'a', 'abbr', 'b', 'blockquote', 'br', 'code', 'dd', 'div', 'dl', 'dt',
  'em', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'hr', 'i', 'img', 'li',
  'ol', 'p', 'pre', 'q', 's', 'small', 'span', 'strong', 'sub', 'sup',
  'table', 'tbody', 'td', 'tfoot', 'th', 'thead', 'tr', 'u', 'ul'
]);

const DEFAULT_ALLOWED_ATTRS: Record<string, string[]> = {
  a: ['href', 'title', 'target', 'rel'],
  img: ['src', 'alt', 'title', 'width', 'height'],
  '*': ['id', 'class'],
};

const SAFE_URL_PROTOCOLS = new Set(['http:', 'https:', 'mailto:', 'tel:']);

function defaultSanitizeUrl(url: string): string | null {
  if (url.startsWith('/') || url.startsWith('./') || url.startsWith('../') || url.startsWith('#')) {
    return url;
  }
  try {
    const parsed = new URL(url);
    return SAFE_URL_PROTOCOLS.has(parsed.protocol) ? url : null;
  } catch {
    return (!url.includes(':') || url.indexOf(':') > url.indexOf('/')) ? url : null;
  }
}

export function sanitize(el: Element, options: SanitizeOptions = {}): Element {
  const {
    allowedTags = [...DEFAULT_ALLOWED_TAGS],
    allowedAttrs = DEFAULT_ALLOWED_ATTRS,
    allowDataAttrs = true,
    allowClasses = true,
    stripAll = false,
    sanitizeUrl = defaultSanitizeUrl,
  } = options;

  const allowedTagSet = new Set(allowedTags.map(t => t.toLowerCase()));

  function sanitizeElement(element: Element): Node[] {
    if (stripAll) {
      return [{ type: 'text', content: getText(element), parent: null } as TextNode];
    }

    if (!allowedTagSet.has(element.tagName) && element.tagName !== '#document') {
      const results: Node[] = [];
      for (const child of element.children) {
        if (child.type === 'text') results.push(child);
        else if (child.type === 'element') results.push(...sanitizeElement(child as Element));
      }
      return results;
    }

    const newAttrs = new Map<string, string>();
    const globalAllowed = allowedAttrs['*'] || [];
    const tagAllowed = allowedAttrs[element.tagName] || [];
    const allAllowed = new Set([...globalAllowed, ...tagAllowed]);

    for (const [name, value] of element.attributes) {
      if (name.startsWith('data-') && allowDataAttrs) { newAttrs.set(name, value); continue; }
      if (name === 'class' && !allowClasses) continue;
      if (!allAllowed.has(name)) continue;
      if (name === 'href' || name === 'src') {
        const sanitized = sanitizeUrl(value);
        if (sanitized) newAttrs.set(name, sanitized);
        continue;
      }
      if (value.toLowerCase().includes('javascript:')) continue;
      newAttrs.set(name, value);
    }

    element.attributes = newAttrs;
    element.id = newAttrs.get('id');
    element.classList = newAttrs.has('class')
      ? new Set(newAttrs.get('class')!.split(/\s+/).filter(Boolean))
      : undefined;

    const newChildren: Node[] = [];
    for (const child of element.children) {
      if (child.type === 'text') newChildren.push(child);
      else if (child.type === 'element') {
        for (const s of sanitizeElement(child as Element)) {
          s.parent = element;
          newChildren.push(s);
        }
      }
    }
    element.children = newChildren;
    return [element];
  }

  sanitizeElement(el);
  return el;
}

export function sanitizeHtml(html: string, options?: SanitizeOptions): string {
  const doc = parse(html);
  sanitize(doc, options);
  return serialize(doc);
}

export function escapeHtmlText(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
