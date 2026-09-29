// phrase-data.js: everything static the Phrase TMS desk (phrase.js) shows, plus its UI icon set.
// The translation content is REAL and sourced: US federal publications (public domain, 17 U.S.C. 105) that their
// agency also publishes in Spanish; every source segment is the English publication verbatim and every target is
// the agency's own official Spanish, verbatim. Term base entries come from official glossaries and the style rules
// are quoted from real Spanish style references. Each record carries `src`, the URL it was taken from; every URL
// is also listed in ../../img/CREDITS.txt.
// The block between the GENERATED CONTENT markers is written by gen-data.mjs (kept with the reference material
// outside the repo, /tmp/phraseref-e60f1bcc) from /tmp/translator-ref-e60f1bcc/content.json; do not hand-edit it.
// The tIn / tAns / tRes timings on JOBS are the call-center queue's, copied exactly: they are motion, not content.
// The icons are UI chrome drawn by hand in the outline style of Phrase's editor toolbar (round stroke), not marks
// of any product; the only third-party artwork is the Phrase logo in ../../img.
// Copy rules: no em or en dashes in on-screen text; U+00A0 between a number and its unit.

const NB = ' ';

const sol = (dd) => `<svg class="ph-i ph-s" viewBox="0 0 24 24" aria-hidden="true"><path fill-rule="evenodd" d="${dd}"/></svg>`;
const ico = (inner, w = 1.8) => `<svg class="ph-i" viewBox="0 0 24 24" aria-hidden="true" style="--sw:${w}">${inner}</svg>`;

// ---------- icons (editor toolbar, panels, status) ----------
export const I = {
  caret: '<svg class="ph-caret" viewBox="0 0 10 6" aria-hidden="true"><path d="M0 0h10L5 6z" fill="currentColor"/></svg>',
  chevron: ico('<path d="m6 9 6 6 6-6"/>', 2),
  chevronR: ico('<path d="m9 6 6 6-6 6"/>', 2),
  search: ico('<circle cx="11" cy="11" r="6.6"/><path d="m20.5 20.5-4.4-4.4"/>', 2),
  check: ico('<path d="M4.8 12.6 9 16.8 19.2 6.6"/>', 2.6),
  checkC: ico('<circle cx="12" cy="12" r="8.6"/><path d="m8.2 12.3 2.6 2.6 5-5.2"/>', 1.9),
  undo: ico('<path d="M9 7 4.5 11.5 9 16"/><path d="M4.5 11.5H15a4.5 4.5 0 0 1 0 9h-3"/>'),
  redo: ico('<path d="m15 7 4.5 4.5L15 16"/><path d="M19.5 11.5H9a4.5 4.5 0 0 0 0 9h3"/>'),
  copySrc: ico('<rect x="8.5" y="8.5" width="11" height="11" rx="1.6"/><path d="M15.5 8.5V6.1a1.6 1.6 0 0 0-1.6-1.6H6.1a1.6 1.6 0 0 0-1.6 1.6v7.8a1.6 1.6 0 0 0 1.6 1.6h2.4"/>'),
  join: ico('<path d="M3.5 12h6"/><path d="m7 9 3 3-3 3"/><path d="M20.5 12h-6"/><path d="m17 9-3 3 3 3"/><path d="M12 4.5v15"/>'),
  split: ico('<path d="M9.5 12h-6"/><path d="m6.5 9-3 3 3 3"/><path d="M14.5 12h6"/><path d="m17.5 9 3 3-3 3"/><path d="M12 4.5v15"/>'),
  filter: ico('<path d="M4 5.5h16l-6.2 7.3v5.4l-3.6 1.8v-7.2Z"/>'),
  qa: ico('<path d="M12 3.5 20 7v5.2c0 4.3-3.3 7.5-8 8.8-4.7-1.3-8-4.5-8-8.8V7Z"/><path d="m8.6 12.2 2.4 2.4 4.4-4.6"/>'),
  comment: ico('<path d="M4.5 5.5h15v10.2h-8.4l-4.4 3.6v-3.6H4.5Z"/>'),
  preview: ico('<path d="M2.8 12s3.4-6.3 9.2-6.3 9.2 6.3 9.2 6.3-3.4 6.3-9.2 6.3S2.8 12 2.8 12Z"/><circle cx="12" cy="12" r="2.8"/>'),
  settings: ico('<circle cx="12" cy="12" r="3"/><path d="M12 2.8v2.6M12 18.6v2.6M2.8 12h2.6M18.6 12h2.6M5.5 5.5l1.9 1.9M16.6 16.6l1.9 1.9M5.5 18.5l1.9-1.9M16.6 7.4l1.9-1.9"/>'),
  tag: ico('<path d="M3.8 12.4V4.6a.8.8 0 0 1 .8-.8h7.8l8 8-8.6 8.6Z"/><circle cx="8.4" cy="8.4" r="1.4"/>'),
  book: ico('<path d="M4.5 5.2A1.7 1.7 0 0 1 6.2 3.5h13.3v14H6.2a1.7 1.7 0 0 0-1.7 1.7Z"/><path d="M4.5 19.2a1.7 1.7 0 0 0 1.7 1.7h13.3v-3.4"/>'),
  doc: ico('<path d="M6 3.5h8.4L19 8v12.5H6z"/><path d="M14.2 3.5V8H19"/><path d="M9 12.4h6"/><path d="M9 16h4"/>'),
  db: ico('<ellipse cx="12" cy="6" rx="7.5" ry="2.8"/><path d="M4.5 6v12c0 1.6 3.4 2.8 7.5 2.8s7.5-1.2 7.5-2.8V6"/><path d="M4.5 12c0 1.6 3.4 2.8 7.5 2.8s7.5-1.2 7.5-2.8"/>'),
  lock: ico('<rect x="5" y="10.5" width="14" height="10" rx="1.6"/><path d="M8 10.5V7.8a4 4 0 0 1 8 0v2.7"/>'),
  more: ico('<circle cx="5.5" cy="12" r="1.1" fill="currentColor"/><circle cx="12" cy="12" r="1.1" fill="currentColor"/><circle cx="18.5" cy="12" r="1.1" fill="currentColor"/>'),
  bell: sol('M12 2.5a1.4 1.4 0 0 1 1.4 1.4v.8A6.3 6.3 0 0 1 18.3 11v3.6l2 2.6v1.3H3.7v-1.3l2-2.6V11a6.3 6.3 0 0 1 4.9-6.3v-.8A1.4 1.4 0 0 1 12 2.5ZM9.6 19.8h4.8a2.4 2.4 0 0 1-4.8 0Z'),
  help: ico('<circle cx="12" cy="12" r="8.6"/><path d="M9.6 9.4a2.5 2.5 0 0 1 4.8.9c0 1.7-2.4 2.2-2.4 3.6"/><path d="M12 17v.1"/>'),
  avatar: ico('<circle cx="12" cy="8.6" r="3.9"/><path d="M4.6 20.4a7.6 7.6 0 0 1 14.8 0"/>'),
  arrow: ico('<path d="M5 12h14"/><path d="m13.5 6.5 5.5 5.5-5.5 5.5"/>', 2),
  menu: ico('<path d="M4 7h16M4 12h16M4 17h16"/>', 2),
  bold: '<svg class="ph-i ph-glyph" viewBox="0 0 24 24" aria-hidden="true"><text x="12" y="17.5" text-anchor="middle" font-size="16" font-weight="700" fill="currentColor">B</text></svg>',
  italic: '<svg class="ph-i ph-glyph" viewBox="0 0 24 24" aria-hidden="true"><text x="12" y="17.5" text-anchor="middle" font-size="16" font-style="italic" fill="currentColor">I</text></svg>',
  underline: '<svg class="ph-i ph-glyph" viewBox="0 0 24 24" aria-hidden="true"><text x="12" y="16" text-anchor="middle" font-size="15" fill="currentColor">U</text><path d="M6.5 20h11" stroke="currentColor" stroke-width="1.6"/></svg>',
  sub: '<svg class="ph-i ph-glyph" viewBox="0 0 24 24" aria-hidden="true"><text x="9" y="16" text-anchor="middle" font-size="14" fill="currentColor">X</text><text x="18" y="20" text-anchor="middle" font-size="8" fill="currentColor">2</text></svg>',
  sup: '<svg class="ph-i ph-glyph" viewBox="0 0 24 24" aria-hidden="true"><text x="9" y="18" text-anchor="middle" font-size="14" fill="currentColor">X</text><text x="18" y="10" text-anchor="middle" font-size="8" fill="currentColor">2</text></svg>',
  pilcrow: ico('<path d="M13.5 4.5v15M17.5 4.5v15"/><path d="M19.5 4.5h-9a4 4 0 0 0 0 8h3"/>'),
  sliders: ico('<path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/>'),
  info: ico('<circle cx="12" cy="12" r="8.6"/><path d="M12 11v5.2"/><path d="M12 7.6v.1"/>', 2),
  cat: ico('<path d="M5 9.5 6.4 4l3.8 3.1h3.6L17.6 4 19 9.5v3.2a7 7 0 0 1-14 0Z"/><path d="M9.5 12.4v.1M14.5 12.4v.1"/>', 1.9),
  spell: ico('<path d="M4 16.5 8 5.5l4 11"/><path d="M5.5 12.5h5"/><path d="m12.5 16 3 3 5.5-7"/>'),
  globe: ico('<circle cx="12" cy="12" r="8.6"/><path d="M3.4 12h17.2"/><path d="M12 3.4c2.4 2.6 3.6 5.5 3.6 8.6s-1.2 6-3.6 8.6c-2.4-2.6-3.6-5.5-3.6-8.6s1.2-6 3.6-8.6Z"/>'),
  flag: ico('<path d="M5.5 21V4.5"/><path d="M5.5 4.8h12l-2.6 4.3 2.6 4.3h-12"/>'),
  grid: sol('M4 4h6.5v6.5H4Zm9.5 0H20v6.5h-6.5ZM4 13.5h6.5V20H4Zm9.5 0H20V20h-6.5Z'),
};

// ---------- the desk's own lines (UI copy, not content) ----------
// the language pair as Phrase writes locale codes, and the display names its language pickers use
export const PAIR = { src: 'en_us', tgt: 'es_us', srcName: 'English (United States)', tgtName: 'Spanish (United States)' };

// the four HUD checklist rows
export const STEPS = ['Connected to Phrase', 'Translation style matched', 'Read your style guides', 'Working your queue'];

// ---------- BEGIN GENERATED CONTENT (gen-data.mjs) ----------
// Source: /tmp/translator-ref-e60f1bcc/content.json (generated 2026-09-29); All en/es strings verified verbatim (line wraps joined with one space) against pdftotext output of the saved files by build.py. Page numbers are 1-based PDF page indexes, not printed folios.
export const PLACEHOLDER = false;
// the 12 jobs of the queue, in the order they arrive; rows 0-2 carry `main` (the jobs worked in the editor).
// tIn / tAns / tRes are the call-center queue's timings, copied exactly: motion, not content.
export const JOBS = [
 {"id":"dol-whd-wh1088","fileName":"minwagep.pdf","agency":"DOL-WHD","words":552,"tIn":8.7,"tAns":8.9,"tRes":11.06,"src":"https://www.dol.gov/sites/dolgov/files/WHD/legacy/files/minwagep.pdf","main":0},
 {"id":"irs-pub1","fileName":"p1.pdf","agency":"IRS","words":1881,"tIn":9.3,"tAns":11.6,"tRes":13.52,"src":"https://www.irs.gov/pub/irs-pdf/p1.pdf","main":1},
 {"id":"cms-10050","fileName":"10050-medicare-and-you.pdf","agency":"CMS","words":48617,"tIn":9.9,"tAns":14,"tRes":15.68,"src":"https://www.medicare.gov/publications/10050-medicare-and-you.pdf","main":2},
 {"id":"osha-3165","fileName":"osha3165.pdf","agency":"OSHA","words":89,"tIn":10.4,"tAns":10.95,"tRes":12.6,"src":"https://www.osha.gov/sites/default/files/publications/osha3165.pdf"},
 {"id":"eeoc-kyr","fileName":"22-088_EEOC_KnowYourRights6.12.pdf","agency":"EEOC","words":1096,"tIn":10.9,"tAns":11.35,"tRes":13.1,"src":"https://www.eeoc.gov/sites/default/files/2023-06/22-088_EEOC_KnowYourRights6.12.pdf"},
 {"id":"hud-928-1","fileName":"928-1.pdf","agency":"HUD","words":136,"tIn":11.4,"tAns":11.8,"tRes":13.45,"src":"https://www.hud.gov/sites/dfiles/FHEO/documents/928-1.pdf"},
 {"id":"irs-pub594","fileName":"p594.pdf","agency":"IRS","words":9205,"tIn":11.9,"tAns":12.3,"tRes":14.2,"src":"https://www.irs.gov/pub/irs-pdf/p594.pdf"},
 {"id":"ssa-05-10035","fileName":"EN-05-10035.pdf","agency":"SSA","words":4493,"tIn":12.4,"tAns":12.85,"tRes":14.55,"src":"https://www.ssa.gov/pubs/EN-05-10035.pdf"},
 {"id":"uscis-m618","fileName":"M-618.pdf","agency":"USCIS","words":27926,"tIn":12.9,"tAns":13.35,"tRes":15.2,"src":"https://www.uscis.gov/sites/default/files/document/guides/M-618.pdf"},
 {"id":"cfpb-fcra-summary","fileName":"bcfp_consumer-rights-summary_2018-09.pdf","agency":"CFPB","words":1496,"tIn":13.4,"tAns":13.85,"tRes":15.6,"src":"https://files.consumerfinance.gov/f/documents/bcfp_consumer-rights-summary_2018-09.pdf"},
 {"id":"cfpb-home-loan-toolkit","fileName":"201503_cfpb_your-home-loan-toolkit-web.pdf","agency":"CFPB","words":9734,"tIn":13.9,"tAns":14.35,"tRes":15.92,"src":"https://files.consumerfinance.gov/f/201503_cfpb_your-home-loan-toolkit-web.pdf"},
 {"id":"cms-10116","fileName":"10116-your-medicare-benefits.pdf","agency":"CMS","words":33449,"tIn":14.4,"tAns":14.75,"tRes":16.02,"src":"https://www.medicare.gov/publications/10116-your-medicare-benefits.pdf"},
];
// the three jobs the editor works through, segment by segment: EN source verbatim, the agency's official ES verbatim.
// tb / rules index TERMS / RULES; tm is a real 100% source match from another publication; qa is a rule the
// official Spanish breaks, with the substring the desk corrects (FIX in gen-data.mjs)
export const MAIN = [
 {"id":"dol-whd-wh1088","fileName":"minwagep.pdf","agency":"DOL-WHD","agencyFull":"U.S. Department of Labor, Wage and Hour Division","titleEn":"Employee Rights Under the Fair Labor Standards Act","titleEs":"Derechos de los trabajadores bajo la Ley de Normas Justas de Trabajo","pubNoEn":"WH1088","pubNoEs":"WH1088 SPA","words":552,"pages":1,"revision":"WH1088 REV 04/23","src":"https://www.dol.gov/sites/dolgov/files/WHD/legacy/files/minwagep.pdf","srcEs":"https://www.dol.gov/sites/dolgov/files/WHD/legacy/files/minwagesp.pdf","segs":[{"id":"dol-whd-wh1088#1","en":"FEDERAL MINIMUM WAGE $7.25 PER HOUR BEGINNING JULY 24, 2009","es":"SALARIO MÍNIMO FEDERAL $7.25 POR HORA A PARTIR DEL 24 DE JULIO DE 2009","pageEn":1,"pageEs":1,"tb":[5],"rules":[],"qa":null,"tm":null},{"id":"dol-whd-wh1088#2","en":"The law requires employers to display this poster where employees can readily see it.","es":"La ley exige que los empleadores exhiban este cartel donde sea visible por los empleados.","pageEn":1,"pageEs":1,"tb":[7],"rules":[],"qa":null,"tm":null},{"id":"dol-whd-wh1088#3","en":"At least 1½ times the regular rate of pay for all hours worked over 40 in a workweek.","es":"Por lo menos tiempo y medio (1½) de la tasa regular de pago por todas las horas trabajadas en exceso de 40 en una semana laboral.","pageEn":1,"pageEs":1,"tb":[],"rules":[],"qa":null,"tm":null},{"id":"dol-whd-wh1088#4","en":"Employers must pay tipped employees a cash wage of at least $2.13 per hour if they claim a tip credit against their minimum wage obligation.","es":"Los empleadores les tienen que pagar a los empleados que reciben propinas un salario en efectivo de por lo menos $2.13 por hora si ellos reclaman un crédito de propinas contra su obligación de pagar el salario mínimo.","pageEn":1,"pageEs":1,"tb":[6,5,7],"rules":[],"qa":null,"tm":null},{"id":"dol-whd-wh1088#5","en":"The Department has authority to recover back wages and an equal amount in liquidated damages in instances of minimum wage, overtime, and other violations.","es":"El Departamento tiene la autoridad de recuperar salarios retroactivos y una cantidad igual en daños y perjuicios en casos de incumplimientos con el salario mínimo, sobretiempo y otros incumplimientos.","pageEn":1,"pageEs":1,"tb":[5],"rules":[],"qa":null,"tm":null},{"id":"dol-whd-wh1088#6","en":"UNITED STATES DEPARTMENT OF LABOR","es":"DEPARTAMENTO DE TRABAJO DE LOS EE.UU.","pageEn":1,"pageEs":1,"tb":[],"rules":[2],"qa":{"rule":2,"from":"EE.UU.","to":"EE. UU."},"tm":null}]},
 {"id":"irs-pub1","fileName":"p1.pdf","agency":"IRS","agencyFull":"Department of the Treasury, Internal Revenue Service","titleEn":"Your Rights as a Taxpayer","titleEs":"Derechos del Contribuyente","pubNoEn":"Publication 1","pubNoEs":"Publicación 1SP","words":1881,"pages":2,"revision":"Publication 1 (Rev. 9-2017)","src":"https://www.irs.gov/pub/irs-pdf/p1.pdf","srcEs":"https://www.irs.gov/pub/irs-pdf/p1sp.pdf","segs":[{"id":"irs-pub1#1","en":"Your Rights as a Taxpayer","es":"Derechos del Contribuyente","pageEn":1,"pageEs":1,"tb":[0],"rules":[],"qa":null,"tm":null},{"id":"irs-pub1#2","en":"1. The Right to Be Informed","es":"1. El Derecho de Estar Informado","pageEn":1,"pageEs":1,"tb":[],"rules":[4],"qa":null,"tm":null},{"id":"irs-pub1#3","en":"Taxpayers have the right to pay only the amount of tax legally due, including interest and penalties, and to have the IRS apply all tax payments properly.","es":"Los contribuyentes tienen el derecho de pagar sólo la cantidad de impuestos que se adeuda conforme a la ley, incluyendo intereses y multas, además de que el IRS acredite correctamente los pagos de impuestos.","pageEn":1,"pageEs":1,"tb":[0,4,3],"rules":[3],"qa":{"rule":3,"from":"sólo","to":"solo"},"tm":null},{"id":"irs-pub1#4","en":"We accept most taxpayers’ returns as filed.","es":"Aceptamos la mayoría de las declaraciones de impuestos tal como los contribuyentes las presentan.","pageEn":2,"pageEs":2,"tb":[2,0],"rules":[],"qa":null,"tm":null},{"id":"irs-pub1#5","en":"You may file a claim for refund if you think you paid too much tax.","es":"Usted puede presentar una reclamación de reembolso si cree que ha pagado demasiado impuesto.","pageEn":2,"pageEs":2,"tb":[1],"rules":[],"qa":null,"tm":null},{"id":"irs-pub1#6","en":"Tax Questions: 1-800-829-1040 (1-800-829-4059 for TTY/TDD)","es":"Preguntas Tributarias: 1-800-829-1040 (1-800-829-4059, si es usuario de equipo TTY/TDD para personas sordas, con problemas auditivos o con incapacidad del habla)","pageEn":2,"pageEs":2,"tb":[],"rules":[5],"qa":null,"tm":null}]},
 {"id":"cms-10050","fileName":"10050-medicare-and-you.pdf","agency":"CMS","agencyFull":"U.S. Department of Health and Human Services, Centers for Medicare & Medicaid Services","titleEn":"Medicare & You 2027","titleEs":"Medicare Y Usted 2027","pubNoEn":"CMS Product No. 10050","pubNoEs":"CMS Producto No. 10050-S","words":48617,"pages":128,"revision":"September 2026","src":"https://www.medicare.gov/publications/10050-medicare-and-you.pdf","srcEs":"https://www.medicare.gov/publications/10050-S-medicare-and-you.pdf","segs":[{"id":"cms-10050#1","en":"Medicare & You 2027","es":"Medicare Y Usted 2027","pageEn":1,"pageEs":1,"tb":[9],"rules":[],"qa":null,"tm":null},{"id":"cms-10050#2","en":"Go digital!","es":"¡Vuélvase digital!","pageEn":1,"pageEs":1,"tb":[],"rules":[1],"qa":null,"tm":null},{"id":"cms-10050#3","en":"How much does Part B coverage cost?","es":"¿Cuánto cuesta la cobertura de la Parte B?","pageEn":23,"pageEs":23,"tb":[],"rules":[1],"qa":null,"tm":null},{"id":"cms-10050#4","en":"The standard Part B premium amount in 2026 is $202.90.","es":"En 2026, la cantidad estándar de la prima mensual para la Parte B es $202.90.","pageEn":23,"pageEs":23,"tb":[10,8,13],"rules":[],"qa":null,"tm":null},{"id":"cms-10050#5","en":"Your coverage starts on January 1 (as long as the plan gets your enrollment request by December 7).","es":"Su cobertura comienza el 1 de enero (siempre y cuando el plan reciba la solicitud antes del 7 de diciembre).","pageEn":75,"pageEs":74,"tb":[],"rules":[0],"qa":null,"tm":null},{"id":"cms-10050#6","en":"Call 1-800-MEDICARE (1-800-633-4227). TTY users can call 1-877-486-2048.","es":"Llame al 1-800-MEDICARE (1-800-633-4227) (TTY: 1-877-486-2048).","pageEn":14,"pageEs":14,"tb":[],"rules":[],"qa":null,"tm":{"score":100,"en":"Call 1-800-MEDICARE (1-800-633-4227). TTY users can call 1-877-486-2048.","es":"Llame al 1-800-MEDICARE (1-800-633-4227). Los usuarios de TTY pueden llamar al 1-877-486-2048.","from":"Your Medicare Benefits","page":98,"src":"https://www.medicare.gov/publications/10116-S-your-medicare-benefits.pdf"}}]},
];
// the term base entries (official glossaries)
export const TERMS = [
 {"id":"irs850-taxpayer","en":"taxpayer","es":"contribuyente","source":"IRS Publication 850 (en-sp) (Rev. September 2023), English-Spanish Glossary of Tax Words and Phrases","sourceShort":"IRS Publication 850","page":23,"src":"https://www.irs.gov/pub/irs-pdf/p850.pdf"},
 {"id":"irs850-refund","en":"refund of tax","es":"reembolso de impuesto","source":"IRS Publication 850 (en-sp) (Rev. September 2023), English-Spanish Glossary of Tax Words and Phrases","sourceShort":"IRS Publication 850","page":19,"src":"https://www.irs.gov/pub/irs-pdf/p850.pdf"},
 {"id":"irs850-tax-return","en":"tax return","es":"declaración de impuestos","source":"IRS Publication 850 (en-sp) (Rev. September 2023), English-Spanish Glossary of Tax Words and Phrases","sourceShort":"IRS Publication 850","page":23,"src":"https://www.irs.gov/pub/irs-pdf/p850.pdf"},
 {"id":"irs850-penalty","en":"penalty","es":"multa; penalidad","source":"IRS Publication 850 (en-sp) (Rev. September 2023), English-Spanish Glossary of Tax Words and Phrases","sourceShort":"IRS Publication 850","page":17,"src":"https://www.irs.gov/pub/irs-pdf/p850.pdf"},
 {"id":"irs850-interest","en":"interest","es":"interés; intereses","source":"IRS Publication 850 (en-sp) (Rev. September 2023), English-Spanish Glossary of Tax Words and Phrases","sourceShort":"IRS Publication 850","page":14,"src":"https://www.irs.gov/pub/irs-pdf/p850.pdf"},
 {"id":"irs850-minimum-wage","en":"minimum wage","es":"paga mínima; salario mínimo","source":"IRS Publication 850 (en-sp) (Rev. September 2023), English-Spanish Glossary of Tax Words and Phrases","sourceShort":"IRS Publication 850","page":16,"src":"https://www.irs.gov/pub/irs-pdf/p850.pdf"},
 {"id":"irs850-tip","en":"tip (gratuity)","es":"propina (gratificación)","source":"IRS Publication 850 (en-sp) (Rev. September 2023), English-Spanish Glossary of Tax Words and Phrases","sourceShort":"IRS Publication 850","page":23,"src":"https://www.irs.gov/pub/irs-pdf/p850.pdf"},
 {"id":"irs850-employer","en":"employer (noun)","es":"empleador (sustantivo)","source":"IRS Publication 850 (en-sp) (Rev. September 2023), English-Spanish Glossary of Tax Words and Phrases","sourceShort":"IRS Publication 850","page":9,"src":"https://www.irs.gov/pub/irs-pdf/p850.pdf"},
 {"id":"irs850-premium","en":"premium","es":"prima","source":"IRS Publication 850 (en-sp) (Rev. September 2023), English-Spanish Glossary of Tax Words and Phrases","sourceShort":"IRS Publication 850","page":18,"src":"https://www.irs.gov/pub/irs-pdf/p850.pdf"},
 {"id":"irs850-medicare","en":"Medicare","es":"Medicare (atención médico-hospitalaria)","source":"IRS Publication 850 (en-sp) (Rev. September 2023), English-Spanish Glossary of Tax Words and Phrases","sourceShort":"IRS Publication 850","page":16,"src":"https://www.irs.gov/pub/irs-pdf/p850.pdf"},
 {"id":"cuidadodesalud-premium","en":"Premium","es":"Prima","source":"HealthCare.gov / CuidadoDeSalud.gov glossary (CMS)","sourceShort":"CuidadoDeSalud.gov glossary","page":null,"src":"https://www.cuidadodesalud.gov/es/glossary/premium/"},
 {"id":"cuidadodesalud-oep","en":"Open Enrollment Period","es":"Período de Inscripción Abierta","source":"HealthCare.gov / CuidadoDeSalud.gov glossary (CMS)","sourceShort":"CuidadoDeSalud.gov glossary","page":null,"src":"https://www.cuidadodesalud.gov/es/glossary/open-enrollment-period/"},
 {"id":"cfpb-fcra","en":"Fair Credit Reporting Act","es":"Ley de Informes de Crédito Justos","source":"CFPB, Spanish-English glossary of financial terms (March 2024)","sourceShort":"CFPB glossary","page":32,"src":"https://files.consumerfinance.gov/f/documents/cfpb_adult-fin-ed_spanish-style-guide-glossary.pdf"},
 {"id":"cfpb-premium","en":"Premium (insurance premium)","es":"Prima (prima de seguro)","source":"CFPB, Spanish-English glossary of financial terms (March 2024)","sourceShort":"CFPB glossary","page":62,"src":"https://files.consumerfinance.gov/f/documents/cfpb_adult-fin-ed_spanish-style-guide-glossary.pdf"},
];
// the style rules superbot reads on the LEARN beat (quote verbatim; gloss in English; chip is the HUD's short form)
export const RULES = [
 {"id":"rae-mayusculas-meses","source":"RAE y ASALE, Diccionario panhispánico de dudas (DPD), 2.ª edición [en línea]","sourceShort":"RAE y ASALE, DPD","section":"mayúsculas, 5.4.12 (se escriben con minúscula)","quote":"Los nombres de los días de la semana, así como de los meses y las estaciones del año: Hoy es lunes, 23 de mayo; Estoy deseando que llegue el verano.","gloss":"Days of the week, months and seasons are written lowercase in Spanish (unlike English January/December).","chip":"Months in lowercase","src":"https://www.rae.es/dpd/mayúsculas"},
 {"id":"rae-signos-apertura","source":"RAE y ASALE, Diccionario panhispánico de dudas (DPD), 2.ª edición [en línea]","sourceShort":"RAE y ASALE, DPD","section":"signos de interrogación y exclamación, 2.1","quote":"Los signos de apertura (¿, ¡) son característicos del español y no deben suprimirse por imitación de otras lenguas en las que únicamente se coloca el signo de cierre","gloss":"Spanish questions and exclamations need the opening ¿ / ¡; do not drop them in imitation of English.","chip":"Opening ¿ and ¡","src":"https://www.rae.es/dpd/signos de interrogación y exclamación"},
 {"id":"rae-ee-uu","source":"RAE y ASALE, Diccionario panhispánico de dudas (DPD), 2.ª edición [en línea]","sourceShort":"RAE y ASALE, DPD","section":"Estados Unidos, 2","quote":"Es frecuente referirse a este país a través de su abreviatura: EE. UU. Al ser una abreviatura, y no una sigla, debe escribirse con puntos y con un espacio de separación entre los dos pares de letras.","gloss":"The abbreviation for the United States is \"EE. UU.\": periods plus a space between the two letter pairs.","chip":"EE. UU. with a space","src":"https://www.rae.es/dpd/Estados Unidos"},
 {"id":"rae-solo","source":"RAE y ASALE, Diccionario panhispánico de dudas (DPD), 2.ª edición [en línea]","sourceShort":"RAE y ASALE, DPD","section":"tilde, 3.3 (Tilde diacrítica en el adverbio solo), a)","quote":"a) Es obligatorio escribir sin tilde el adverbio solo en contextos donde su empleo no entrañe riesgo de ambigüedad.","gloss":"Write the adverb \"solo\" (= only) without an accent where there is no ambiguity.","chip":"solo without an accent","src":"https://www.rae.es/dpd/tilde"},
 {"id":"rae-mayusculas-titulos","source":"RAE y ASALE, Diccionario panhispánico de dudas (DPD), 2.ª edición [en línea]","sourceShort":"RAE y ASALE, DPD","section":"mayúsculas, 5.2.25","quote":"La primera palabra del título de las subdivisiones o secciones internas de una publicación o un documento (capítulos de un libro, titulares de prensa, columnas de opinión, etc.).","gloss":"In section headings only the first word takes a capital (no English-style Title Case).","chip":"Headings: first word capitalized","src":"https://www.rae.es/dpd/mayúsculas"},
 {"id":"rae-sigla-7","source":"RAE y ASALE, Diccionario panhispánico de dudas (DPD), 2.ª edición [en línea]","sourceShort":"RAE y ASALE, DPD","section":"sigla, 7 (Hispanización de las siglas)","quote":"La primera vez que se emplea una sigla en un texto, y salvo que sea de difusión tan generalizada que sea fácilmente interpretable por la inmensa mayoría de los lectores, es conveniente poner a continuación, y entre paréntesis, el nombre completo al que reemplaza y, si es una sigla extranjera, su traducción o equivalencia","gloss":"On first use, pair an acronym with its full name; for a foreign acronym, give its translation or equivalent.","chip":"Acronyms: full name first","src":"https://www.rae.es/dpd/sigla"},
];
// ---------- END GENERATED CONTENT ----------

export const NBSP = NB;
