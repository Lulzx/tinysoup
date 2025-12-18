import type {
  Element, MaybeElement, FindOptions, FindPredicate,
  GetTextOptions, ExtractionSpec, ExtractResult, SanitizeOptions, PrettifyOptions,
  ParseOptions, SerializeOptions, SelectOptions
} from './types';
import { parse, serialize } from './parser';
import { querySelectorAll, querySelector, selectParents, selectParent } from './selector';
import { Elements } from './elements';
import { getText, strippedStrings } from './text';
import { findAll, find } from './find';
import { extractFrom } from './extract';
import { sanitize } from './sanitize';
import { prettify } from './prettify';
import { smooth } from './mutate';

export class Document {
  readonly root: Element;

  constructor(html: string, options?: ParseOptions) {
    this.root = parse(html, options);
  }

  select(selector: string, options?: SelectOptions): Elements {
    return new Elements(querySelectorAll(this.root, selector, options));
  }

  selectOne(selector: string): MaybeElement {
    return querySelector(this.root, selector);
  }

  exists(selector: string): boolean {
    return querySelector(this.root, selector) !== null;
  }

  count(selector: string): number {
    return querySelectorAll(this.root, selector).length;
  }

  findAll(options: FindOptions | string | FindPredicate): Element[] {
    return findAll(this.root, options);
  }

  find(options: FindOptions | string | FindPredicate): MaybeElement {
    return find(this.root, options);
  }

  getText(options?: GetTextOptions): string {
    return getText(this.root, options);
  }

  get strippedStrings(): Generator<string> {
    return strippedStrings(this.root);
  }

  toHtml(options?: SerializeOptions): string {
    return serialize(this.root, options);
  }

  prettify(options?: PrettifyOptions): string {
    return prettify(this.root, options);
  }

  extract<T extends ExtractionSpec>(spec: T): ExtractResult<T> {
    return extractFrom(this.root, spec);
  }

  sanitize(options?: SanitizeOptions): this {
    sanitize(this.root, options);
    return this;
  }

  smooth(): this {
    smooth(this.root);
    return this;
  }
}

export function parseHtml(html: string, options?: ParseOptions): Document {
  return new Document(html, options);
}

export { selectParents, selectParent };
