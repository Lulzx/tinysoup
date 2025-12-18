import type { Element } from '../types';
import { parse } from '../parser';
import { remove } from './content';

export function replaceWith(el: Element, replacement: string | Element): Element {
  if (!el.parent) return el;
  const parent = el.parent;
  const idx = parent.children.indexOf(el);
  if (idx === -1) return el;

  if (typeof replacement === 'string') {
    const doc = parse(replacement);
    for (const child of doc.children) child.parent = parent;
    parent.children.splice(idx, 1, ...doc.children);
    el.parent = null;
    return (doc.children[0] as Element) ?? el;
  } else {
    if (replacement.parent) remove(replacement);
    replacement.parent = parent;
    parent.children.splice(idx, 1, replacement);
    el.parent = null;
    return replacement;
  }
}

export function wrap(el: Element, wrapper: string | Element): Element {
  const wrapperEl = typeof wrapper === 'string'
    ? (parse(wrapper).children[0] as Element)
    : wrapper;
  if (!wrapperEl || wrapperEl.type !== 'element') return el;

  if (el.parent) {
    const parent = el.parent;
    const idx = parent.children.indexOf(el);
    if (idx !== -1) {
      wrapperEl.parent = parent;
      parent.children[idx] = wrapperEl;
    }
  }

  el.parent = wrapperEl;
  wrapperEl.children.push(el);
  return el;
}

export function unwrap(el: Element): Element {
  const parent = el.parent;
  if (!parent || parent.tagName === '#document') return el;

  const grandparent = parent.parent;
  if (!grandparent) return el;

  const idx = grandparent.children.indexOf(parent);
  if (idx === -1) return el;

  for (const child of parent.children) child.parent = grandparent;
  grandparent.children.splice(idx, 1, ...parent.children);
  parent.parent = null;
  parent.children = [];
  return el;
}

export function insertBefore(el: Element, reference: Element): Element {
  if (!reference.parent) return el;
  const parent = reference.parent;
  const idx = parent.children.indexOf(reference);
  if (idx === -1) return el;

  if (el.parent) remove(el);
  el.parent = parent;
  parent.children.splice(idx, 0, el);
  return el;
}

export function insertAfter(el: Element, reference: Element): Element {
  if (!reference.parent) return el;
  const parent = reference.parent;
  const idx = parent.children.indexOf(reference);
  if (idx === -1) return el;

  if (el.parent) remove(el);
  el.parent = parent;
  parent.children.splice(idx + 1, 0, el);
  return el;
}
