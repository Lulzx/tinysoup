import type { Element, FindOptions, FindPredicate, TagMatch, TextMatch, MaybeElement } from '../types';
import { getText } from '../text';

export function normalizeOptions(options: FindOptions | string | FindPredicate): FindOptions {
  if (typeof options === 'string') return { name: options };
  if (typeof options === 'function') return { predicate: options };
  return options;
}

function matchesTag(el: Element, match: TagMatch): boolean {
  if (typeof match === 'string') return el.tagName === match.toLowerCase();
  if (match instanceof RegExp) return match.test(el.tagName);
  if (Array.isArray(match)) return match.some(t => el.tagName === t.toLowerCase());
  return match(el.tagName);
}

function matchesText(el: Element, match: TextMatch): boolean {
  const text = getText(el);
  if (typeof match === 'string') return text.includes(match);
  if (match instanceof RegExp) return match.test(text);
  return match(text);
}

function matchesAttrs(el: Element, attrs: Record<string, string | RegExp | boolean>): boolean {
  for (const [name, expected] of Object.entries(attrs)) {
    const value = el.attributes.get(name);
    if (expected === true && value === undefined) return false;
    if (expected === false && value !== undefined) return false;
    if (typeof expected === 'string' && value !== expected) return false;
    if (expected instanceof RegExp && (!value || !expected.test(value))) return false;
  }
  return true;
}

export function matchesOptions(el: Element, options: FindOptions): boolean {
  if (options.name && !matchesTag(el, options.name)) return false;
  if (options.string && !matchesText(el, options.string)) return false;
  if (options.attrs && !matchesAttrs(el, options.attrs)) return false;
  if (options.predicate && !options.predicate(el)) return false;
  return true;
}

export function findAll(el: Element, options: FindOptions | string | FindPredicate): Element[] {
  const opts = normalizeOptions(options);
  const results: Element[] = [];
  const recursive = opts.recursive !== false;
  const limit = opts.limit ?? Infinity;

  function walk(node: Element): void {
    if (results.length >= limit) return;
    for (const child of node.children) {
      if (child.type !== 'element') continue;
      const childEl = child as Element;
      if (matchesOptions(childEl, opts)) {
        results.push(childEl);
        if (results.length >= limit) return;
      }
      if (recursive) walk(childEl);
    }
  }

  walk(el);
  return results;
}

export function find(el: Element, options: FindOptions | string | FindPredicate): MaybeElement {
  const results = findAll(el, { ...normalizeOptions(options), limit: 1 });
  return results[0] ?? null;
}
