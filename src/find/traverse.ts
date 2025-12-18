import type { Element, FindOptions, FindPredicate, MaybeElement } from '../types';
import { normalizeOptions, matchesOptions } from './find';

export function* walkElements(el: Element): Generator<Element> {
  for (const child of el.children) {
    if (child.type === 'element') {
      yield child as Element;
      yield* walkElements(child as Element);
    }
  }
}

function getRoot(el: Element): Element {
  let root = el;
  while (root.parent && root.parent.tagName !== '#document') {
    root = root.parent;
  }
  return root.parent ?? root;
}

export function findNext(el: Element, match?: FindOptions | string | FindPredicate): MaybeElement {
  const root = getRoot(el);
  let found = false;
  const opts = match ? normalizeOptions(match) : null;

  for (const candidate of walkElements(root)) {
    if (candidate === el) { found = true; continue; }
    if (found && (!opts || matchesOptions(candidate, opts))) return candidate;
  }
  return null;
}

export function findPrev(el: Element, match?: FindOptions | string | FindPredicate): MaybeElement {
  const root = getRoot(el);
  const opts = match ? normalizeOptions(match) : null;
  let result: Element | null = null;

  for (const candidate of walkElements(root)) {
    if (candidate === el) break;
    if (!opts || matchesOptions(candidate, opts)) result = candidate;
  }
  return result;
}

export function findAllNext(el: Element, match?: FindOptions | string | FindPredicate): Element[] {
  const root = getRoot(el);
  const opts = match ? normalizeOptions(match) : null;
  const results: Element[] = [];
  let found = false;

  for (const candidate of walkElements(root)) {
    if (candidate === el) { found = true; continue; }
    if (found && (!opts || matchesOptions(candidate, opts))) results.push(candidate);
  }
  return results;
}

export function findAllPrev(el: Element, match?: FindOptions | string | FindPredicate): Element[] {
  const root = getRoot(el);
  const opts = match ? normalizeOptions(match) : null;
  const results: Element[] = [];

  for (const candidate of walkElements(root)) {
    if (candidate === el) break;
    if (!opts || matchesOptions(candidate, opts)) results.push(candidate);
  }
  return results.reverse();
}
