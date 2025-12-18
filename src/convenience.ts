import type { GetTextOptions, ExtractionSpec, ExtractResult } from './types';
import { parse } from './parser';
import { querySelector, querySelectorAll } from './selector';
import { getText } from './text';
import { extractFrom } from './extract';

export function text(html: string, selector: string, options?: GetTextOptions): string {
  const doc = parse(html);
  const el = querySelector(doc, selector);
  return el ? getText(el, options) : '';
}

export function texts(html: string, selector: string, options?: GetTextOptions): string[] {
  const doc = parse(html);
  return querySelectorAll(doc, selector).map(el => getText(el, options));
}

export function selectAttr(html: string, selector: string, attribute: string): string | undefined {
  const doc = parse(html);
  const el = querySelector(doc, selector);
  return el?.attributes.get(attribute);
}

export function selectAttrs(html: string, selector: string, attribute: string): string[] {
  const doc = parse(html);
  return querySelectorAll(doc, selector)
    .map(el => el.attributes.get(attribute))
    .filter((v): v is string => v !== undefined);
}

export function extract<T extends ExtractionSpec>(html: string, spec: T): ExtractResult<T> {
  const doc = parse(html);
  return extractFrom(doc, spec);
}
