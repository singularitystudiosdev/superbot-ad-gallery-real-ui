// The three files Claude Opus 5.5 writes, and a small TSX highlighter for the editor.
export const FILES = {
  'Checkout.tsx': `import { Img, staticFile } from "remotion";

export function Checkout({ paid }: { paid: boolean }) {
  return (
    <Page className="grid place-items-center bg-[#f4f3ef]">
      <Card className="w-[420px] rounded-3xl p-7 shadow-2xl">
        <Img src={staticFile("stills/nb2.jpg")} className="h-36" />
        <h1 className="font-serif text-3xl">Lightroom Presets Vol. 3</h1>
        <Price code="LAUNCH20" was={29} now={23.2} />
        <Button dark>{paid ? "Payment complete" : "Pay $23.20"}</Button>
        <Fine>Tax and VAT handled by Pocketsflow</Fine>
      </Card>
    </Page>
  );
}`,
  'Payouts.tsx': `const week = [180, 240, 210, 420, 380, 510, 540]; // = $2,480

export function Payouts({ t }: { t: number }) {
  const total = Math.round(2480 * Math.min(1, t));
  return (
    <Card className="w-[520px] rounded-3xl p-8">
      <Label>This week</Label>
      <Big>\${total.toLocaleString("en-US")}</Big>
      <Delta>63 orders · +18%</Delta>
      <Bars data={week} grow={t} />
    </Card>
  );
}`,
  'LaunchFilm.tsx': `import { AbsoluteFill, Audio, Sequence, staticFile } from "remotion";
import { bar } from "./beats"; // 120 BPM, 1 bar = 60 frames

export const LaunchFilm = () => (
  <AbsoluteFill className="bg-black">
    <Audio src={staticFile("score.mp3")} />
    <Sequence from={bar(0)}><Hook /></Sequence>
    <Sequence from={bar(2)}><Turntable frames={60} /></Sequence>
    <Sequence from={bar(2) + 30}><Line>Pocketsflow keeps $5.</Line></Sequence>
    <Sequence from={bar(3)}><Stills a="nb1.jpg" b="nb2.jpg" /></Sequence>
    <Sequence from={bar(4)}><Checkout /></Sequence>
    <Sequence from={bar(5)}><Payouts /></Sequence>
    <Sequence from={bar(6)}><Poster src="nb4.jpg" /></Sequence>
  </AbsoluteFill>
);`,
};

const RULES = [
  ['cm', /^\/\/.*/],
  ['st', /^"[^"]*"/],
  ['kw', /^(import|export|from|function|return|const|true|false)\b/],
  ['tg', /^<\/?[A-Za-z][\w.]*|^\/?>/],
  ['at', /^[a-zA-Z]+(?==)/],
  ['nu', /^\d[\d.]*/],
  ['id', /^[A-Za-z_$][\w$]*/],
  ['pl', /^\s+|^./],
];

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** One line of TSX as highlighted HTML spans. */
export function highlight(line) {
  let out = '', rest = line;
  while (rest.length) {
    for (const [cls, re] of RULES) {
      const m = rest.match(re);
      if (!m) continue;
      out += cls === 'pl' || cls === 'id' ? esc(m[0]) : `<i class="${cls}">${esc(m[0])}</i>`;
      rest = rest.slice(m[0].length);
      break;
    }
  }
  return out || ' ';
}
