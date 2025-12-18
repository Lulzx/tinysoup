export interface SourceLocation {
  line: number;
  column: number;
  offset: number;
}

export interface Node {
  type: 'element' | 'text' | 'comment' | 'doctype';
  parent: Element | null;
  sourceLocation?: SourceLocation;
}

export interface TextNode extends Node {
  type: 'text';
  content: string;
}

export interface CommentNode extends Node {
  type: 'comment';
  content: string;
}

export interface DoctypeNode extends Node {
  type: 'doctype';
  content: string;
}

export interface Element extends Node {
  type: 'element';
  tagName: string;
  attributes: Map<string, string>;
  children: Node[];
  id?: string;
  classList?: Set<string>;
}

export type AnyNode = Element | TextNode | CommentNode | DoctypeNode;
export type MaybeElement = Element | null;
export type FindPredicate = (el: Element) => boolean;
export type TextMatch = string | RegExp | ((text: string) => boolean);
export type TagMatch = string | RegExp | string[] | ((tag: string) => boolean);

export interface FindOptions {
  name?: TagMatch;
  string?: TextMatch;
  attrs?: Record<string, string | RegExp | boolean>;
  predicate?: FindPredicate;
  recursive?: boolean;
  limit?: number;
}

export interface GetTextOptions {
  separator?: string;
  strip?: boolean;
}

export interface SoupStrainer {
  name?: TagMatch;
  attrs?: Record<string, string | RegExp | boolean>;
  string?: TextMatch;
}

export interface ParseOptions {
  lowerCaseTags?: boolean;
  lowerCaseAttributes?: boolean;
  strainer?: SoupStrainer;
  trackSourceLocations?: boolean;
  xmlMode?: boolean;
}

export type OutputFormat = 'default' | 'minimal' | 'html5' | 'xhtml';

export interface SerializeOptions {
  format?: OutputFormat;
  selfClosingTags?: boolean;
  emptyAttributes?: boolean;
}

export interface PrettifyOptions {
  indent?: string;
  newline?: string;
  format?: OutputFormat;
}

export interface SanitizeOptions {
  allowedTags?: string[];
  allowedAttrs?: Record<string, string[]>;
  allowDataAttrs?: boolean;
  allowClasses?: boolean;
  stripAll?: boolean;
  sanitizeUrl?: (url: string) => string | null;
}

export interface ExtractionField {
  select: string;
  attr?: string;
  all?: boolean;
  transform?: (value: string) => unknown;
  children?: ExtractionSpec;
}

export type ExtractionSpec = Record<string, string | ExtractionField>;

export type ExtractResult<T extends ExtractionSpec> = {
  [K in keyof T]: T[K] extends string
    ? string
    : T[K] extends { all: true; children: ExtractionSpec }
      ? ExtractResult<NonNullable<T[K]['children']>>[]
      : T[K] extends { all: true }
        ? string[]
        : T[K] extends { children: ExtractionSpec }
          ? ExtractResult<NonNullable<T[K]['children']>>
          : T[K] extends { transform: (v: string) => infer R }
            ? R
            : string;
};

export interface SelectOptions {
  limit?: number;
}

export interface NewTagOptions {
  attrs?: Record<string, string>;
  children?: (Element | string)[];
}
