import type { Element, FindOptions, FindPredicate, MaybeElement } from '../types';
import { matches } from '../selector';
import { normalizeOptions, matchesOptions } from './find';

export function findNextSibling(el: Element, match?: FindOptions | string | FindPredicate): MaybeElement {
  if (!el.parent) return null;
  const opts = match ? normalizeOptions(match) : null;
  const siblings = el.parent.children;
  const idx = siblings.indexOf(el);

  for (let i = idx + 1; i < siblings.length; i++) {
    if (siblings[i].type !== 'element') continue;
    const sibling = siblings[i] as Element;
    if (!opts || matchesOptions(sibling, opts)) return sibling;
  }
  return null;
}

export function findPrevSibling(el: Element, match?: FindOptions | string | FindPredicate): MaybeElement {
  if (!el.parent) return null;
  const opts = match ? normalizeOptions(match) : null;
  const siblings = el.parent.children;
  const idx = siblings.indexOf(el);

  for (let i = idx - 1; i >= 0; i--) {
    if (siblings[i].type !== 'element') continue;
    const sibling = siblings[i] as Element;
    if (!opts || matchesOptions(sibling, opts)) return sibling;
  }
  return null;
}

export function findNextSiblings(el: Element, match?: FindOptions | string | FindPredicate): Element[] {
  if (!el.parent) return [];
  const opts = match ? normalizeOptions(match) : null;
  const siblings = el.parent.children;
  const idx = siblings.indexOf(el);
  const results: Element[] = [];

  for (let i = idx + 1; i < siblings.length; i++) {
    if (siblings[i].type !== 'element') continue;
    const sibling = siblings[i] as Element;
    if (!opts || matchesOptions(sibling, opts)) results.push(sibling);
  }
  return results;
}

export function findPrevSiblings(el: Element, match?: FindOptions | string | FindPredicate): Element[] {
  if (!el.parent) return [];
  const opts = match ? normalizeOptions(match) : null;
  const siblings = el.parent.children;
  const idx = siblings.indexOf(el);
  const results: Element[] = [];

  for (let i = idx - 1; i >= 0; i--) {
    if (siblings[i].type !== 'element') continue;
    const sibling = siblings[i] as Element;
    if (!opts || matchesOptions(sibling, opts)) results.push(sibling);
  }
  return results;
}

export function findParent(el: Element, match?: FindOptions | string | FindPredicate): MaybeElement {
  const opts = match ? normalizeOptions(match) : null;
  let current = el.parent;

  while (current && current.tagName !== '#document') {
    if (!opts || matchesOptions(current, opts)) return current;
    current = current.parent;
  }
  return null;
}

export function findParents(el: Element, match?: FindOptions | string | FindPredicate): Element[] {
  const opts = match ? normalizeOptions(match) : null;
  const results: Element[] = [];
  let current = el.parent;

  while (current && current.tagName !== '#document') {
    if (!opts || matchesOptions(current, opts)) results.push(current);
    current = current.parent;
  }
  return results;
}

export function closest(el: Element, selector: string): MaybeElement {
  let current: Element | null = el;
  while (current && current.tagName !== '#document') {
    if (matches(current, selector)) return current;
    current = current.parent;
  }
  return null;
}
