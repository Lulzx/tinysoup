import type { Element } from '../types';
import { parseSelector, type SelectorPart, type PseudoMatcher, type CompiledSelector } from './parse';

export function matches(el: Element, selector: string): boolean {
  const compiled = parseSelector(selector);
  return compiled.some(sel => matchesSelector(el, sel));
}

export function matchesSelector(el: Element, selector: CompiledSelector): boolean {
  const { parts, combinators } = selector;

  if (parts.length === 0) return false;
  if (!matchesPart(el, parts[parts.length - 1])) return false;

  let current: Element | null = el;

  for (let i = parts.length - 2; i >= 0; i--) {
    const part = parts[i];
    const combinator = combinators[i];

    switch (combinator) {
      case '':
        current = findAncestor(current, part);
        if (!current) return false;
        break;
      case '>':
        current = current.parent;
        if (!current || current.tagName === '#document' || !matchesPart(current, part)) {
          return false;
        }
        break;
      case '+':
        current = getPreviousSibling(current);
        if (!current || !matchesPart(current, part)) return false;
        break;
      case '~':
        current = findPreviousSibling(current, part);
        if (!current) return false;
        break;
    }
  }

  return true;
}

export function matchesPart(el: Element, part: SelectorPart): boolean {
  if (part.tag && part.tag !== '*' && el.tagName !== part.tag) return false;
  if (part.id && el.id !== part.id) return false;

  if (part.classes) {
    for (const cls of part.classes) {
      if (!el.classList?.has(cls)) return false;
    }
  }

  if (part.attributes) {
    for (const attr of part.attributes) {
      const value = el.attributes.get(attr.name);
      if (value === undefined) return false;

      if (attr.op && attr.value !== undefined) {
        switch (attr.op) {
          case '=': if (value !== attr.value) return false; break;
          case '^=': if (!value.startsWith(attr.value)) return false; break;
          case '$=': if (!value.endsWith(attr.value)) return false; break;
          case '*=': if (!value.includes(attr.value)) return false; break;
          case '~=': if (!value.split(/\s+/).includes(attr.value)) return false; break;
          case '|=': if (value !== attr.value && !value.startsWith(attr.value + '-')) return false; break;
        }
      }
    }
  }

  if (part.pseudos) {
    for (const pseudo of part.pseudos) {
      if (!matchesPseudo(el, pseudo)) return false;
    }
  }

  return true;
}

function getLangAttribute(el: Element): string | null {
  let current: Element | null = el;
  while (current && current.tagName !== '#document') {
    const lang = current.attributes.get('lang') || current.attributes.get('xml:lang');
    if (lang) return lang.toLowerCase();
    current = current.parent;
  }
  return null;
}

function matchesPseudo(el: Element, pseudo: PseudoMatcher): boolean {
  const siblings = el.parent?.children.filter(n => n.type === 'element') as Element[] || [];
  const index = siblings.indexOf(el);

  switch (pseudo.name) {
    case 'first-child': return index === 0;
    case 'last-child': return index === siblings.length - 1;
    case 'only-child': return siblings.length === 1;
    case 'nth-child': return pseudo.arg ? matchesNth(index + 1, pseudo.arg) : false;
    case 'nth-last-child': return pseudo.arg ? matchesNth(siblings.length - index, pseudo.arg) : false;
    case 'first-of-type': {
      const sameType = siblings.filter(s => s.tagName === el.tagName);
      return sameType[0] === el;
    }
    case 'last-of-type': {
      const sameType = siblings.filter(s => s.tagName === el.tagName);
      return sameType[sameType.length - 1] === el;
    }
    case 'nth-of-type': {
      if (!pseudo.arg) return false;
      const sameType = siblings.filter(s => s.tagName === el.tagName);
      return matchesNth(sameType.indexOf(el) + 1, pseudo.arg);
    }
    case 'nth-last-of-type': {
      if (!pseudo.arg) return false;
      const sameType = siblings.filter(s => s.tagName === el.tagName);
      return matchesNth(sameType.length - sameType.indexOf(el), pseudo.arg);
    }
    case 'only-of-type': {
      return siblings.filter(s => s.tagName === el.tagName).length === 1;
    }
    case 'empty':
      return el.children.length === 0 ||
        el.children.every(c => c.type === 'text' && !(c as any).content.trim());
    case 'not': {
      if (!pseudo.arg) return true;
      const notSelectors = parseSelector(pseudo.arg);
      return !notSelectors.some(sel => matchesSelector(el, sel));
    }
    case 'has': {
      if (!pseudo.arg) return false;
      return matchesHas(el, pseudo.arg);
    }
    case 'is':
    case 'where': {
      if (!pseudo.arg) return false;
      const isSelectors = parseSelector(pseudo.arg);
      return isSelectors.some(sel => matchesSelector(el, sel));
    }
    case 'contains': {
      if (!pseudo.arg) return false;
      return getTextInternal(el).includes(pseudo.arg);
    }
    case 'lang': {
      if (!pseudo.arg) return false;
      const lang = getLangAttribute(el);
      if (!lang) return false;
      const target = pseudo.arg.toLowerCase().replace(/["']/g, '');
      return lang === target || lang.startsWith(target + '-');
    }
    case 'root': return el.parent?.tagName === '#document';
    case 'scope': return el.parent?.tagName === '#document';
    case 'enabled': return !el.attributes.has('disabled');
    case 'disabled': return el.attributes.has('disabled');
    case 'checked': return el.attributes.has('checked');
    case 'indeterminate': return false;
    case 'required': return el.attributes.has('required');
    case 'optional': return !el.attributes.has('required');
    case 'read-only': return el.attributes.has('readonly');
    case 'read-write': return !el.attributes.has('readonly');
    case 'placeholder-shown': return el.attributes.has('placeholder') && !getTextInternal(el).trim();
    case 'default': return el.attributes.has('checked') || el.attributes.has('selected');
    case 'valid': return true;
    case 'invalid': return false;
    case 'in-range': return true;
    case 'out-of-range': return false;
    case 'focus':
    case 'focus-within':
    case 'focus-visible':
    case 'hover':
    case 'active':
    case 'visited':
    case 'link':
    case 'any-link':
    case 'local-link':
    case 'target':
    case 'target-within':
    case 'current':
    case 'past':
    case 'future':
    case 'playing':
    case 'paused':
    case 'seeking':
    case 'buffering':
    case 'stalled':
    case 'muted':
    case 'volume-locked':
    case 'fullscreen':
    case 'picture-in-picture':
    case 'autofill':
    case 'modal':
    case 'user-invalid':
    case 'user-valid':
      return false;
    case 'blank':
      return el.children.length === 0 ||
        el.children.every(c => c.type === 'text' && !(c as any).content.trim());
    case 'dir': {
      if (!pseudo.arg) return false;
      const dir = pseudo.arg.toLowerCase();
      let current: Element | null = el;
      while (current && current.tagName !== '#document') {
        const elDir = current.attributes.get('dir')?.toLowerCase();
        if (elDir === 'ltr' || elDir === 'rtl') return elDir === dir;
        current = current.parent;
      }
      return dir === 'ltr';
    }
    default: return false;
  }
}

function matchesHas(el: Element, selectorArg: string): boolean {
  const trimmed = selectorArg.trim();

  if (trimmed.startsWith('+') || trimmed.startsWith('~')) {
    const combinator = trimmed[0];
    const rest = trimmed.slice(1).trim();
    const selectors = parseSelector(rest || '*');

    if (!el.parent) return false;
    const siblings = el.parent.children;
    const idx = siblings.indexOf(el);

    if (combinator === '+') {
      for (let i = idx + 1; i < siblings.length; i++) {
        if (siblings[i].type === 'element') {
          const sibling = siblings[i] as Element;
          return selectors.some(sel => matchesSelector(sibling, sel));
        }
      }
      return false;
    } else {
      for (let i = idx + 1; i < siblings.length; i++) {
        if (siblings[i].type === 'element') {
          const sibling = siblings[i] as Element;
          if (selectors.some(sel => matchesSelector(sibling, sel))) return true;
        }
      }
      return false;
    }
  }

  if (trimmed.startsWith('>')) {
    const rest = trimmed.slice(1).trim();
    const selectors = parseSelector(rest || '*');
    for (const child of el.children) {
      if (child.type === 'element') {
        if (selectors.some(sel => matchesSelector(child as Element, sel))) return true;
      }
    }
    return false;
  }

  return querySelectorAllInternal(el, trimmed).length > 0;
}

function matchesNth(n: number, formula: string): boolean {
  formula = formula.trim().toLowerCase();

  if (formula === 'odd') return n % 2 === 1;
  if (formula === 'even') return n % 2 === 0;

  const match = formula.match(/^([+-]?\d*)?n?([+-]\d+)?$/);
  if (!match) return parseInt(formula, 10) === n;

  let a = 0, b = 0;

  if (formula.includes('n')) {
    a = match[1] === '' || match[1] === '+' ? 1 :
        match[1] === '-' ? -1 : parseInt(match[1], 10);
    b = match[2] ? parseInt(match[2], 10) : 0;
  } else {
    b = parseInt(formula, 10);
  }

  if (a === 0) return n === b;
  return (n - b) % a === 0 && (n - b) / a >= 0;
}

function findAncestor(el: Element, part: SelectorPart): Element | null {
  let current = el.parent;
  while (current && current.tagName !== '#document') {
    if (matchesPart(current, part)) return current;
    current = current.parent;
  }
  return null;
}

function getPreviousSibling(el: Element): Element | null {
  if (!el.parent) return null;
  const siblings = el.parent.children;
  const idx = siblings.indexOf(el);
  for (let i = idx - 1; i >= 0; i--) {
    if (siblings[i].type === 'element') return siblings[i] as Element;
  }
  return null;
}

function findPreviousSibling(el: Element, part: SelectorPart): Element | null {
  if (!el.parent) return null;
  const siblings = el.parent.children;
  const idx = siblings.indexOf(el);
  for (let i = idx - 1; i >= 0; i--) {
    if (siblings[i].type === 'element' && matchesPart(siblings[i] as Element, part)) {
      return siblings[i] as Element;
    }
  }
  return null;
}

function querySelectorAllInternal(root: Element, selector: string): Element[] {
  const compiled = parseSelector(selector);
  const results: Element[] = [];

  function walk(node: Element): void {
    for (const child of node.children) {
      if (child.type !== 'element') continue;
      const el = child as Element;
      if (compiled.some(sel => matchesSelector(el, sel))) results.push(el);
      walk(el);
    }
  }

  walk(root);
  return results;
}

function getTextInternal(el: Element): string {
  let text = '';
  for (const child of el.children) {
    if (child.type === 'text') text += (child as any).content;
    else if (child.type === 'element') text += getTextInternal(child as Element);
  }
  return text;
}
