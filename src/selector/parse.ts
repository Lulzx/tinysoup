import { LRUCache } from './cache';

export interface SelectorPart {
  tag?: string;
  id?: string;
  classes?: string[];
  attributes?: AttributeMatcher[];
  pseudos?: PseudoMatcher[];
}

export interface AttributeMatcher {
  name: string;
  op?: '=' | '^=' | '$=' | '*=' | '~=' | '|=';
  value?: string;
}

export interface PseudoMatcher {
  name: string;
  arg?: string;
}

export interface CompiledSelector {
  parts: SelectorPart[];
  combinators: ('' | '>' | '+' | '~')[];
}

const selectorCache = new LRUCache<string, CompiledSelector[]>(100);

export function clearSelectorCache(): void {
  selectorCache.clear();
}

export function parseSelector(selector: string): CompiledSelector[] {
  const cached = selectorCache.get(selector);
  if (cached) return cached;

  const selectors: CompiledSelector[] = [];
  const groups = splitByComma(selector);

  for (const group of groups) {
    selectors.push(parseSelectorGroup(group.trim()));
  }

  selectorCache.set(selector, selectors);
  return selectors;
}

function splitByComma(str: string): string[] {
  const parts: string[] = [];
  let parenDepth = 0;
  let bracketDepth = 0;
  let quote: '"' | "'" | null = null;
  let start = 0;

  for (let i = 0; i < str.length; i++) {
    const ch = str[i];

    if (quote) {
      if (ch === '\\') {
        i++;
        continue;
      }
      if (ch === quote) quote = null;
      continue;
    }

    if (ch === '"' || ch === "'") {
      quote = ch;
      continue;
    }

    if (ch === '(') parenDepth++;
    else if (ch === ')') parenDepth = Math.max(0, parenDepth - 1);
    else if (ch === '[') bracketDepth++;
    else if (ch === ']') bracketDepth = Math.max(0, bracketDepth - 1);
    else if (ch === ',' && parenDepth === 0 && bracketDepth === 0) {
      parts.push(str.slice(start, i));
      start = i + 1;
    }
  }
  parts.push(str.slice(start));
  return parts;
}

function parseSelectorGroup(selector: string): CompiledSelector {
  const parts: SelectorPart[] = [];
  const combinators: ('' | '>' | '+' | '~')[] = [];
  let pos = 0;
  const len = selector.length;

  function skipWhitespace(): boolean {
    let skipped = false;
    while (pos < len && /\s/.test(selector[pos])) {
      pos++;
      skipped = true;
    }
    return skipped;
  }

  function parsePart(): SelectorPart {
    const part: SelectorPart = {};

    while (pos < len) {
      const ch = selector[pos];

      if (ch === '#') {
        pos++;
        const start = pos;
        while (pos < len && /[\w-]/.test(selector[pos])) pos++;
        part.id = selector.slice(start, pos);
      } else if (ch === '.') {
        pos++;
        const start = pos;
        while (pos < len && /[\w-]/.test(selector[pos])) pos++;
        part.classes = part.classes || [];
        part.classes.push(selector.slice(start, pos));
      } else if (ch === '[') {
        pos++;
        part.attributes = part.attributes || [];

        const attrStart = pos;
        while (pos < len && !/[\^$*~|=\]]/.test(selector[pos])) pos++;
        const name = selector.slice(attrStart, pos).trim();

        if (selector[pos] === ']') {
          pos++;
          part.attributes.push({ name });
        } else {
          let op: string = '';
          if (selector[pos] === '=') {
            op = '=';
            pos++;
          } else if (selector[pos + 1] === '=') {
            op = selector[pos] + '=';
            pos += 2;
          } else {
            while (pos < len && selector[pos] !== ']') pos++;
            pos++;
            continue;
          }

          while (pos < len && /\s/.test(selector[pos])) pos++;

          let value: string;
          const quote = selector[pos];
          if (quote === '"' || quote === "'") {
            pos++;
            const valueStart = pos;
            while (pos < len && selector[pos] !== quote) pos++;
            value = selector.slice(valueStart, pos);
            pos++;
          } else {
            const valueStart = pos;
            while (pos < len && selector[pos] !== ']') pos++;
            value = selector.slice(valueStart, pos).trim();
          }

          while (pos < len && selector[pos] !== ']') pos++;
          pos++;

          part.attributes.push({ name, op: op as AttributeMatcher['op'], value });
        }
      } else if (ch === ':') {
        pos++;
        const start = pos;
        while (pos < len && /[\w-]/.test(selector[pos])) pos++;
        const name = selector.slice(start, pos);

        let arg: string | undefined;
        if (selector[pos] === '(') {
          pos++;
          let depth = 1;
          const argStart = pos;
          while (pos < len && depth > 0) {
            if (selector[pos] === '(') depth++;
            else if (selector[pos] === ')') depth--;
            pos++;
          }
          arg = selector.slice(argStart, pos - 1);
        }

        part.pseudos = part.pseudos || [];
        part.pseudos.push({ name, arg });
      } else if (/[a-zA-Z*]/.test(ch)) {
        const start = pos;
        while (pos < len && /[\w-]/.test(selector[pos])) pos++;
        part.tag = selector.slice(start, pos).toLowerCase();
      } else {
        break;
      }
    }

    return part;
  }

  skipWhitespace();
  if (pos < len) {
    parts.push(parsePart());
  }

  while (pos < len) {
    const hadSpace = skipWhitespace();
    if (pos >= len) break;

    const ch = selector[pos];
    let combinator: '' | '>' | '+' | '~' = '';

    if (ch === '>') {
      combinator = '>';
      pos++;
      skipWhitespace();
    } else if (ch === '+') {
      combinator = '+';
      pos++;
      skipWhitespace();
    } else if (ch === '~') {
      combinator = '~';
      pos++;
      skipWhitespace();
    } else if (hadSpace) {
      combinator = '';
    } else {
      break;
    }

    if (pos < len && /[#.\[:a-zA-Z*]/.test(selector[pos])) {
      combinators.push(combinator);
      parts.push(parsePart());
    }
  }

  return { parts, combinators };
}
