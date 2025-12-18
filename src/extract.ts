import type { Element, ExtractionSpec, ExtractResult } from './types';
import { querySelector, querySelectorAll } from './selector';
import { getText } from './text';

export function extractFrom<T extends ExtractionSpec>(el: Element, spec: T): ExtractResult<T> {
  const result: Record<string, unknown> = {};

  for (const [key, fieldSpec] of Object.entries(spec)) {
    if (typeof fieldSpec === 'string') {
      const found = querySelector(el, fieldSpec);
      result[key] = found ? getText(found) : '';
    } else {
      const { select, attr: attrName, all, transform, children: childSpec } = fieldSpec;

      if (all) {
        const elements = querySelectorAll(el, select);
        if (childSpec) {
          result[key] = elements.map(e => extractFrom(e, childSpec));
        } else {
          const values = elements.map(e => attrName ? (e.attributes.get(attrName) ?? '') : getText(e));
          result[key] = transform ? values.map(transform) : values;
        }
      } else {
        const found = querySelector(el, select);
        if (childSpec && found) {
          result[key] = extractFrom(found, childSpec);
        } else {
          const value = found ? (attrName ? (found.attributes.get(attrName) ?? '') : getText(found)) : '';
          result[key] = transform ? transform(value) : value;
        }
      }
    }
  }

  return result as ExtractResult<T>;
}
