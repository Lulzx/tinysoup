import type { Element, MaybeElement, GetTextOptions } from './types';
import { querySelectorAll, matches } from './selector';
import { getText } from './text';

export class Elements implements Iterable<Element> {
  constructor(private readonly items: Element[]) {}

  get length(): number { return this.items.length; }
  get isEmpty(): boolean { return this.items.length === 0; }
  get first(): MaybeElement { return this.items[0] ?? null; }
  get last(): MaybeElement { return this.items[this.items.length - 1] ?? null; }

  at(index: number): MaybeElement {
    const i = index < 0 ? this.items.length + index : index;
    return this.items[i] ?? null;
  }

  [Symbol.iterator](): Iterator<Element> {
    return this.items[Symbol.iterator]();
  }

  toArray(): Element[] {
    return [...this.items];
  }

  map<T>(fn: (el: Element, index: number) => T): T[] {
    return this.items.map(fn);
  }

  filter(predicate: (el: Element, index: number) => boolean): Elements {
    return new Elements(this.items.filter(predicate));
  }

  matching(selector: string): Elements {
    return new Elements(this.items.filter(el => matches(el, selector)));
  }

  find(predicate: (el: Element) => boolean): MaybeElement {
    return this.items.find(predicate) ?? null;
  }

  some(predicate: (el: Element) => boolean): boolean {
    return this.items.some(predicate);
  }

  every(predicate: (el: Element) => boolean): boolean {
    return this.items.every(predicate);
  }

  texts(options?: GetTextOptions): string[] {
    return this.items.map(el => getText(el, options));
  }

  attrs(name: string): (string | undefined)[] {
    return this.items.map(el => el.attributes.get(name));
  }

  select(selector: string): Elements {
    const results: Element[] = [];
    for (const el of this.items) {
      results.push(...querySelectorAll(el, selector));
    }
    return new Elements(results);
  }

  unique(): Elements {
    return new Elements([...new Set(this.items)]);
  }
}

export function children(el: Element): Elements {
  return new Elements(el.children.filter((c): c is Element => c.type === 'element'));
}

export function siblings(el: Element): Elements {
  if (!el.parent) return new Elements([]);
  return new Elements(
    el.parent.children.filter((c): c is Element => c.type === 'element' && c !== el)
  );
}
