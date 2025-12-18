const ENTITIES: Record<string, string> = {
  '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"',
  '&#39;': "'", '&apos;': "'", '&nbsp;': '\u00A0',
  '&copy;': '©', '&reg;': '®', '&trade;': '™',
  '&mdash;': '—', '&ndash;': '–',
  '&lsquo;': '\u2018', '&rsquo;': '\u2019', '&ldquo;': '\u201C', '&rdquo;': '\u201D',
  '&hellip;': '…', '&bull;': '•', '&middot;': '·',
  '&para;': '¶', '&sect;': '§', '&dagger;': '†', '&Dagger;': '‡',
  '&permil;': '‰', '&prime;': '′', '&Prime;': '″',
  '&laquo;': '«', '&raquo;': '»', '&lsaquo;': '‹', '&rsaquo;': '›',
  '&cent;': '¢', '&pound;': '£', '&yen;': '¥', '&euro;': '€', '&curren;': '¤',
  '&times;': '×', '&divide;': '÷', '&plusmn;': '±', '&minus;': '−',
  '&le;': '≤', '&ge;': '≥', '&ne;': '≠', '&asymp;': '≈', '&equiv;': '≡',
  '&sum;': '∑', '&prod;': '∏', '&radic;': '√', '&infin;': '∞', '&int;': '∫',
  '&part;': '∂', '&nabla;': '∇', '&isin;': '∈', '&notin;': '∉', '&ni;': '∋',
  '&sub;': '⊂', '&sup;': '⊃', '&sube;': '⊆', '&supe;': '⊇',
  '&cup;': '∪', '&cap;': '∩', '&empty;': '∅',
  '&forall;': '∀', '&exist;': '∃', '&and;': '∧', '&or;': '∨', '&not;': '¬',
  '&ang;': '∠', '&perp;': '⊥', '&there4;': '∴',
  '&sim;': '∼', '&cong;': '≅', '&prop;': '∝',
  '&deg;': '°', '&frac14;': '¼', '&frac12;': '½', '&frac34;': '¾',
  '&sup1;': '¹', '&sup2;': '²', '&sup3;': '³', '&micro;': 'µ',
  '&larr;': '←', '&uarr;': '↑', '&rarr;': '→', '&darr;': '↓', '&harr;': '↔',
  '&lArr;': '⇐', '&uArr;': '⇑', '&rArr;': '⇒', '&dArr;': '⇓', '&hArr;': '⇔',
  '&Alpha;': 'Α', '&alpha;': 'α', '&Beta;': 'Β', '&beta;': 'β',
  '&Gamma;': 'Γ', '&gamma;': 'γ', '&Delta;': 'Δ', '&delta;': 'δ',
  '&Epsilon;': 'Ε', '&epsilon;': 'ε', '&Zeta;': 'Ζ', '&zeta;': 'ζ',
  '&Eta;': 'Η', '&eta;': 'η', '&Theta;': 'Θ', '&theta;': 'θ',
  '&Iota;': 'Ι', '&iota;': 'ι', '&Kappa;': 'Κ', '&kappa;': 'κ',
  '&Lambda;': 'Λ', '&lambda;': 'λ', '&Mu;': 'Μ', '&mu;': 'μ',
  '&Nu;': 'Ν', '&nu;': 'ν', '&Xi;': 'Ξ', '&xi;': 'ξ',
  '&Omicron;': 'Ο', '&omicron;': 'ο', '&Pi;': 'Π', '&pi;': 'π',
  '&Rho;': 'Ρ', '&rho;': 'ρ', '&Sigma;': 'Σ', '&sigma;': 'σ', '&sigmaf;': 'ς',
  '&Tau;': 'Τ', '&tau;': 'τ', '&Upsilon;': 'Υ', '&upsilon;': 'υ',
  '&Phi;': 'Φ', '&phi;': 'φ', '&Chi;': 'Χ', '&chi;': 'χ',
  '&Psi;': 'Ψ', '&psi;': 'ψ', '&Omega;': 'Ω', '&omega;': 'ω',
  '&iexcl;': '¡', '&iquest;': '¿', '&ordf;': 'ª', '&ordm;': 'º',
  '&acute;': '´', '&cedil;': '¸', '&uml;': '¨', '&macr;': '¯',
  '&shy;': '\u00AD', '&brvbar;': '¦',
  '&spades;': '♠', '&clubs;': '♣', '&hearts;': '♥', '&diams;': '♦', '&loz;': '◊',
  '&zwj;': '\u200D', '&zwnj;': '\u200C',
};

export function decodeEntities(text: string): string {
  return text
    .replace(/&[a-zA-Z][a-zA-Z0-9]*;/g, m => ENTITIES[m] ?? m)
    .replace(/&#(\d+);/g, (_, n) => {
      const code = parseInt(n, 10);
      return code > 0 && code <= 0x10FFFF ? String.fromCodePoint(code) : '';
    })
    .replace(/&#x([0-9a-fA-F]+);/g, (_, n) => {
      const code = parseInt(n, 16);
      return code > 0 && code <= 0x10FFFF ? String.fromCodePoint(code) : '';
    });
}

export function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function escapeAttr(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
