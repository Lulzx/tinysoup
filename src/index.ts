export type {
  Node, Element, TextNode, CommentNode, DoctypeNode, AnyNode,
  MaybeElement, FindPredicate, TextMatch, TagMatch, FindOptions,
  GetTextOptions, ParseOptions, PrettifyOptions, SanitizeOptions,
  ExtractionField, ExtractionSpec, ExtractResult,
  SoupStrainer, SourceLocation, OutputFormat, SerializeOptions,
  SelectOptions, NewTagOptions
} from './types';

export { Document, parseHtml, selectParents, selectParent } from './document';
export { Elements, children, siblings } from './elements';

export { parse, serialize, escapeHtml, escapeAttr, detectEncoding } from './parser';

export { querySelectorAll, querySelector, matches, clearSelectorCache } from './selector';

export { getText, getString, strippedStrings, strings } from './text';

export {
  findAll, find,
  findNext, findPrev, findAllNext, findAllPrev,
  findNextSibling, findPrevSibling, findNextSiblings, findPrevSiblings,
  findParent, findParents, closest, walkElements
} from './find';

export {
  setAttr, removeAttr, addClass, removeClass, toggleClass,
  attr, attrs, data, hasClass, classes,
  newTag, createTextNode, createComment,
  setText, setInnerHtml, append, prepend, insert, remove, empty, clone, decompose, smooth,
  replaceWith, wrap, unwrap, insertBefore, insertAfter
} from './mutate';

export { extractFrom } from './extract';

export { sanitize, sanitizeHtml, escapeHtmlText } from './sanitize';

export { prettify } from './prettify';

export { text, texts, selectAttr, selectAttrs, extract } from './convenience';

export { parseHtml as default } from './document';
