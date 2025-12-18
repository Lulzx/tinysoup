import type { Element } from '../types';

export function setAttr(el: Element, name: string, value: string): Element {
  el.attributes.set(name, value);
  if (name === 'id') el.id = value;
  if (name === 'class') el.classList = new Set(value.split(/\s+/).filter(Boolean));
  return el;
}

export function removeAttr(el: Element, name: string): Element {
  el.attributes.delete(name);
  if (name === 'id') delete el.id;
  if (name === 'class') delete el.classList;
  return el;
}

export function addClass(el: Element, className: string): Element {
  if (!el.classList) el.classList = new Set();
  className.split(/\s+/).filter(Boolean).forEach(c => el.classList!.add(c));
  el.attributes.set('class', [...el.classList].join(' '));
  return el;
}

export function removeClass(el: Element, className: string): Element {
  if (!el.classList) return el;
  className.split(/\s+/).filter(Boolean).forEach(c => el.classList!.delete(c));
  if (el.classList.size === 0) {
    el.attributes.delete('class');
    delete el.classList;
  } else {
    el.attributes.set('class', [...el.classList].join(' '));
  }
  return el;
}

export function toggleClass(el: Element, className: string, force?: boolean): Element {
  if (!el.classList) el.classList = new Set();
  for (const c of className.split(/\s+/).filter(Boolean)) {
    const shouldAdd = force ?? !el.classList.has(c);
    shouldAdd ? el.classList.add(c) : el.classList.delete(c);
  }
  if (el.classList.size === 0) {
    el.attributes.delete('class');
    delete el.classList;
  } else {
    el.attributes.set('class', [...el.classList].join(' '));
  }
  return el;
}

export function attr(el: Element, name: string): string | undefined {
  return el.attributes.get(name);
}

export function attrs(el: Element): Record<string, string> {
  return Object.fromEntries(el.attributes);
}

export function data(el: Element): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of el.attributes) {
    if (key.startsWith('data-')) result[key.slice(5)] = value;
  }
  return result;
}

export function hasClass(el: Element, className: string): boolean {
  return el.classList?.has(className) ?? false;
}

export function classes(el: Element): string[] {
  return el.classList ? [...el.classList] : [];
}
