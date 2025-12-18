import type { Element, Node, SelectOptions } from '../types';
import { parseSelector } from './parse';
import { matchesSelector, matches } from './match';

export function querySelectorAll(root: Element, selector: string, options: SelectOptions = {}): Element[] {
  const compiled = parseSelector(selector);
  const results: Element[] = [];
  const limit = options.limit ?? Infinity;

  function walk(node: Node): boolean {
    if (node.type !== 'element') return false;
    const el = node as Element;

    if (compiled.some(sel => matchesSelector(el, sel))) {
      results.push(el);
      if (results.length >= limit) return true;
    }

    for (const child of el.children) {
      if (walk(child)) return true;
    }

    return false;
  }

  for (const child of root.children) {
    if (walk(child)) break;
  }

  return results;
}

export function querySelector(root: Element, selector: string): Element | null {
  const results = querySelectorAll(root, selector, { limit: 1 });
  return results[0] ?? null;
}

export function selectParents(el: Element, selector: string): Element[] {
  const results: Element[] = [];
  let current = el.parent;

  while (current && current.tagName !== '#document') {
    if (matches(current, selector)) {
      results.push(current);
    }
    current = current.parent;
  }

  return results;
}

export function selectParent(el: Element, selector: string): Element | null {
  let current = el.parent;

  while (current && current.tagName !== '#document') {
    if (matches(current, selector)) {
      return current;
    }
    current = current.parent;
  }

  return null;
}
