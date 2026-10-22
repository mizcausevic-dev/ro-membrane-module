import { readFileSync } from "node:fs";
import {
  ACTS,
  CAPTIONS,
  DISCLAIMER,
  FRAME_COUNT,
  LAST_FRAME,
  SAFEGUARDS,
  assertTimeline,
  frameState,
  pictureSignature,
  visibleStrings,
} from "./model-Cursor.js";

const errors = [];

errors.push(...assertTimeline());

if (ACTS.length !== 5) errors.push("act count");
if (CAPTIONS[0].start !== 0 || CAPTIONS[CAPTIONS.length - 1].end !== LAST_FRAME) {
  errors.push("caption span");
}
for (let i = 1; i < CAPTIONS.length; i += 1) {
  if (CAPTIONS[i].start !== CAPTIONS[i - 1].end + 1) {
    errors.push(`caption gap before ${CAPTIONS[i].start}`);
  }
}

const strings = visibleStrings();
strings.push(...SAFEGUARDS.map((item) => item.text));
const html = readFileSync(new URL("./index.html", import.meta.url), "utf8").replace(
  /<style[\s\S]*?<\/style>/g,
  "",
);
strings.push(html);
if (!strings.includes(DISCLAIMER)) errors.push("disclaimer missing");

for (const text of strings) {
  if (text.includes("\u2014") || text.includes("\u2013")) errors.push(`dash: ${text}`);
  if (/\b\d+(?:\.\d+)?\s*%/.test(text)) errors.push(`percent: ${text}`);
  if (/\bpsi\b/i.test(text)) errors.push(`psi: ${text}`);
  if (/\bguaranteed\b/i.test(text)) errors.push(`guaranteed: ${text}`);
  if (/zero[-\s]?contaminant/i.test(text)) errors.push(`zero contaminant: ${text}`);
  if (/\b(?:completely|perfectly)\s+pure\b/i.test(text)) errors.push(`pure: ${text}`);
  const sterile = /sterile/gi;
  let match;
  while ((match = sterile.exec(text))) {
    const before = text.slice(Math.max(0, match.index - 56), match.index).toLowerCase();
    if (!before.includes("not")) errors.push(`sterile without negation: ${text}`);
  }
}

const required = [
  "not a size sieve",
  "Qualitative balance",
  "does not disappear",
  "Slow motion",
  "Enlarged scale",
  "Time compressed",
  "not taken apart",
  "does not unwind",
];
const blob = strings.join("\n").toLowerCase();
for (const phrase of required) {
  if (!blob.includes(phrase.toLowerCase())) errors.push(`missing phrase: ${phrase}`);
}

const early = frameState(40);
if (early.flow.inlet.length !== 10) errors.push("inlet ticks");
if (early.flow.concentrate.length !== 8) errors.push("concentrate ticks");
if (early.balance.numericRecovery !== null) errors.push("numeric recovery");

const mid = frameState(450);
const packed = mid.solutes.filter((item) => item.id < 10);
const meanX = packed.reduce((sum, item) => sum + item.x, 0) / packed.length;
const earlyMem = frameState(320).solutes.filter((item) => item.id < 10);
const earlyMean = earlyMem.reduce((sum, item) => sum + item.x, 0) / earlyMem.length;
if (!(meanX > earlyMean)) errors.push("solutes did not move downstream");

if (pictureSignature(12) !== pictureSignature(12)) errors.push("repeat");

if (errors.length) {
  console.error(errors.slice(0, 30).join("\n"));
  console.error(`${errors.length} invariant failure(s)`);
  process.exit(1);
}

console.log(
  `ok ${FRAME_COUNT} frames, ${CAPTIONS.length} captions, ${SAFEGUARDS.length} safeguards, end hold matches`,
);
