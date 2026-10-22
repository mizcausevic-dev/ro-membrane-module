import {
  ACTS,
  CAMERA_HOLD,
  CAM_KEYS,
  CAPTIONS,
  CONCENTRATE_PATH,
  DISCLAIMER,
  FPS,
  FRAME_COUNT,
  FREEZE_FRAME,
  INLET_PATH,
  LAST_FRAME,
  LAYOUT,
  PLATE,
  PRODUCT_PATH,
  SAFEGUARDS,
  SOURCE,
  plateGeometry,
} from "./model-data-Cursor.js";

export {
  ACTS,
  CAMERA_HOLD,
  CAM_KEYS,
  CAPTIONS,
  DISCLAIMER,
  FPS,
  FRAME_COUNT,
  FREEZE_FRAME,
  LAST_FRAME,
  LAYOUT,
  SAFEGUARDS,
  SOURCE,
  plateGeometry,
};
export {
  CONCENTRATE_PATH,
  INLET_PATH,
  PLATE,
  PRODUCT_PATH,
} from "./model-data-Cursor.js";

function clamp(v, a, b) {
  return Math.min(b, Math.max(a, v));
}

function clamp01(t) {
  return clamp(t, 0, 1);
}

export function clampFrame(frame) {
  if (!Number.isFinite(frame)) return 0;
  return clamp(Math.round(frame), 0, LAST_FRAME);
}

function seg(frame, a, b) {
  if (b === a) return frame >= b ? 1 : 0;
  return clamp01((frame - a) / (b - a));
}

function smoother(t) {
  const u = clamp01(t);
  return u * u * u * (u * (u * 6 - 15) + 10);
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

export function ramp(frame, a, b) {
  return smoother(seg(frame, a, b));
}

function windowFade(frame, inA, inB, outA, outB) {
  return Math.min(ramp(frame, inA, inB), 1 - ramp(frame, outA, outB));
}

export function actFor(frame) {
  const f = clampFrame(frame);
  return ACTS.find((act) => f >= act.start && f <= act.end);
}

export function captionFor(frame) {
  const f = clampFrame(frame);
  const hits = CAPTIONS.filter((c) => f >= c.start && f <= c.end);
  if (hits.length !== 1) {
    throw new Error(`Caption coverage broken at frame ${f}`);
  }
  return hits[0];
}

function camera(frame) {
  const f = Math.min(clampFrame(frame), CAMERA_HOLD);
  let i = 0;
  while (i < CAM_KEYS.length - 2 && f > CAM_KEYS[i + 1].f) i += 1;
  const a = CAM_KEYS[i];
  const b = CAM_KEYS[i + 1];
  const t = smoother(seg(f, a.f, b.f));
  return {
    x: lerp(a.x, b.x, t),
    y: lerp(a.y, b.y, t),
    z: lerp(a.z, b.z, t),
  };
}

function pathLength(points) {
  let total = 0;
  for (let i = 0; i < points.length - 1; i += 1) {
    total += Math.hypot(points[i + 1][0] - points[i][0], points[i + 1][1] - points[i][1]);
  }
  return total;
}

export function pointOnPath(points, t) {
  const u = clamp01(t);
  const total = pathLength(points);
  let dist = u * total;
  for (let i = 0; i < points.length - 1; i += 1) {
    const a = points[i];
    const b = points[i + 1];
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (dist <= len || i === points.length - 2) {
      const k = len === 0 ? 0 : clamp01(dist / len);
      return { x: lerp(a[0], b[0], k), y: lerp(a[1], b[1], k) };
    }
    dist -= len;
  }
  const last = points[points.length - 1];
  return { x: last[0], y: last[1] };
}

function membraneX(id, frame) {
  const u = smoother(seg(frame, 300, 520));
  const slot = id / 11;
  const start = 0.08 + slot * 0.78;
  const end = 0.58 + slot * 0.4;
  const along = lerp(start, end, u);
  return lerp(990, 1368, along);
}

function membraneY(id) {
  const g = plateGeometry();
  return g.selective.y - 10 - (id % 4) * 4.5;
}

function cluster(id, cx, cy, salt) {
  const angle = ((id * 137.508 + salt) * Math.PI) / 180;
  const rad = 16 + (id % 4) * 9;
  return {
    x: cx + Math.cos(angle) * rad,
    y: cy + Math.sin(angle) * rad * 0.62,
  };
}

function poseOnKeys(keys, frame) {
  if (frame <= keys[0].f) return { x: keys[0].x, y: keys[0].y };
  if (frame >= keys[keys.length - 1].f) {
    const last = keys[keys.length - 1];
    return { x: last.x, y: last.y };
  }
  let i = 0;
  while (i < keys.length - 2 && frame > keys[i + 1].f) i += 1;
  const a = keys[i];
  const b = keys[i + 1];
  const t = smoother(seg(frame, a.f, b.f));
  return { x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t) };
}

function solutes(frame) {
  const f = Math.min(clampFrame(frame), FREEZE_FRAME);
  const g = plateGeometry();
  const items = [];
  for (let id = 0; id < 12; id += 1) {
    const crosses = id >= 10;
    const yMem = membraneY(id);
    const approach = poseOnKeys(
      [
        { f: 0, x: 96 + id * 28, y: 590 + (id % 3) * 8 },
        { f: 230, x: 720 + (id % 6) * 12, y: 590 + (id % 4) * 4 },
        { f: 330, x: membraneX(id, 330), y: yMem },
      ],
      Math.min(f, 330),
    );
    let x = approach.x;
    let y = approach.y;
    let stream = "feed";
    if (f >= 330 && f < 520) {
      x = membraneX(id, f);
      y = yMem;
      if (crosses && f >= 430) {
        const u = smoother(seg(f, 430, 545));
        x = membraneX(id, 430);
        y = lerp(yMem, g.permY, u);
        stream = u > 0.55 ? "crossing" : "feed";
      }
    } else if (f >= 520) {
      if (crosses) {
        const startX = membraneX(id, 430);
        const end = cluster(id, LAYOUT.nodes.product.x, LAYOUT.nodes.product.y, 12);
        const pose = poseOnKeys(
          [
            { f: 520, x: startX, y: lerp(yMem, g.permY, smoother(seg(520, 430, 545))) },
            { f: 600, x: g.tube.x + 20, y: g.permY },
            { f: 700, x: LAYOUT.productPort.x, y: LAYOUT.productPort.y },
            { f: 860, x: end.x, y: end.y },
          ],
          f,
        );
        x = pose.x;
        y = pose.y;
        stream = f >= 600 ? "product" : "crossing";
      } else {
        const end = cluster(id, LAYOUT.nodes.concentrate.x, LAYOUT.nodes.concentrate.y, 4);
        const pose = poseOnKeys(
          [
            { f: 520, x: membraneX(id, 520), y: yMem },
            { f: 640, x: LAYOUT.concentratePort.x, y: LAYOUT.concentratePort.y - (id % 3) * 6 },
            { f: 860, x: end.x, y: end.y },
          ],
          f,
        );
        x = pose.x;
        y = pose.y;
        stream = f >= 640 ? "concentrate" : "feed";
      }
    }
    items.push({
      id,
      glyph: id % 3,
      x,
      y,
      stream,
      crosses,
    });
  }
  return items;
}

function particulates(frame) {
  const f = Math.min(clampFrame(frame), FREEZE_FRAME);
  const host = LAYOUT.pretreat[0];
  const items = [];
  for (let id = 0; id < 4; id += 1) {
    const u = smoother(seg(f, 12 + id * 10, 78 + id * 8));
    const home = cluster(id, host.x, host.y + 30, 28);
    items.push({
      id,
      x: lerp(78 + id * 22, home.x, u),
      y: lerp(586 + id * 7, home.y, u),
      captured: u > 0.98,
    });
  }
  return items;
}

function demoWater(frame) {
  const f = Math.min(clampFrame(frame), FREEZE_FRAME);
  const g = plateGeometry();
  const items = [];
  for (let id = 0; id < 4; id += 1) {
    const x0 = 1060 + id * 78;
    const yFeed = g.feedTop.y + g.feedTop.h - 18;
    const yPerm = g.perm.y + 22;
    const cross0 = 348 + id * 26;
    const cross1 = cross0 + 64;
    let x;
    let y;
    let phase;
    if (f <= cross0) {
      const u = seg(Math.max(f, 300), 300, cross0);
      x = lerp(x0 - 36, x0, clamp01(u));
      y = yFeed;
      phase = "feed";
    } else if (f <= cross1) {
      const u = smoother(seg(f, cross0, cross1));
      x = x0;
      y = lerp(yFeed, yPerm, u);
      phase = "crossing";
    } else {
      const end = {
        x: LAYOUT.nodes.product.x - 8 + (id - 1.5) * 10,
        y: LAYOUT.nodes.product.y + 8,
      };
      const pose = poseOnKeys(
        [
          { f: cross1, x: x0, y: yPerm },
          { f: Math.min(cross1 + 50, 640), x: g.tube.x + 18, y: g.permY },
          { f: 730, x: LAYOUT.productPort.x, y: LAYOUT.productPort.y },
          { f: 860, x: end.x, y: end.y },
        ],
        f,
      );
      x = pose.x;
      y = pose.y;
      phase = "product";
    }
    items.push({ id, x, y, phase, example: true });
  }
  return items;
}

function edgeFade(t) {
  return Math.min(clamp01(t / 0.08), clamp01((1 - t) / 0.12));
}

function flowMarks(frame) {
  const f = Math.min(clampFrame(frame), FREEZE_FRAME);
  const inlet = [];
  for (let i = 0; i < 10; i += 1) {
    const t = (i / 10 + f * 0.0015) % 1;
    const p = pointOnPath(INLET_PATH, t);
    inlet.push({ id: i, x: p.x, y: p.y, t, opacity: edgeFade(t), loop: "inlet" });
  }
  const concentrate = [];
  const concentrateAlpha = 0.35 + 0.65 * ramp(f, 40, 110);
  for (let i = 0; i < 8; i += 1) {
    const t = (i / 8 + f * 0.0012) % 1;
    const p = pointOnPath(CONCENTRATE_PATH, t);
    concentrate.push({
      id: i,
      x: p.x,
      y: p.y,
      t,
      opacity: edgeFade(t) * concentrateAlpha,
      loop: "concentrate",
    });
  }
  const product = [];
  const productAlpha = 0.28 + 0.72 * ramp(f, 520, 640);
  for (let i = 0; i < 6; i += 1) {
    const t = (i / 6 + f * 0.0011) % 1;
    const p = pointOnPath(PRODUCT_PATH, t);
    product.push({
      id: i,
      x: p.x,
      y: p.y,
      t,
      opacity: edgeFade(t) * productAlpha,
      loop: "product",
    });
  }
  return { inlet, concentrate, product };
}

function alphas(frame) {
  const f = clampFrame(frame);
  const wideOut = ramp(f, 150, 188);
  const wideBack = ramp(f, 800, 870);
  return {
    spiral: windowFade(f, 164, 200, 300, 345),
    leaf: ramp(f, 250, 315) * (1 - ramp(f, 700, 790)),
    micro: windowFade(f, 360, 410, 500, 560),
    wideLabels: Math.max(1 - wideOut, wideBack),
    section: ramp(f, 150, 200) * (1 - ramp(f, 700, 790)),
    balance: ramp(f, 650, 730),
    endNotes: ramp(f, 800, 880),
    energy: 0.45 + 0.55 * ramp(f, 24, 80),
    monitors: 0.35 + 0.65 * ramp(f, 770, 860),
    guide: windowFade(f, 520, 570, 740, 810),
  };
}

function badges(frame) {
  const f = clampFrame(frame);
  return [
    { id: "schematic", text: "Schematic", on: true },
    { id: "enlarged", text: "Enlarged scale", on: f >= 164 && f < 800 },
    { id: "slow", text: "Slow motion", on: f >= 300 && f < 510 },
    { id: "time", text: "Time compressed", on: f < 300 || f >= 510 },
    { id: "section", text: "Section view", on: f >= 150 && f < 800 },
    { id: "balance", text: "Qualitative balance", on: f >= 650 },
    { id: "stable", text: "Stable system view", on: f >= FREEZE_FRAME },
  ];
}

function annotations(frame) {
  const f = clampFrame(frame);
  const a = alphas(f);
  const g = plateGeometry();
  const v = LAYOUT.vessel;
  return [
    { space: "world", x: 96, y: 500, text: "Feed", opacity: a.wideLabels, role: "hardware" },
    {
      space: "world",
      x: LAYOUT.pretreat[0].x,
      y: 470,
      text: "Particulate stage",
      opacity: a.wideLabels,
      role: "hardware",
    },
    {
      space: "world",
      x: LAYOUT.pretreat[1].x,
      y: 470,
      text: "Conditioning",
      opacity: a.wideLabels,
      role: "hardware",
    },
    {
      space: "world",
      x: LAYOUT.pump.x,
      y: 470,
      text: "Pressure supply",
      opacity: a.wideLabels,
      role: "energy",
    },
    {
      space: "world",
      x: v.x + v.w / 2,
      y: 458,
      text: "Spiral-wound module",
      opacity: a.wideLabels,
      role: "hardware",
    },
    {
      space: "world",
      x: LAYOUT.nodes.product.x - 150,
      y: 210,
      text: "Product",
      opacity: a.wideLabels,
      role: "overlay",
    },
    {
      space: "world",
      x: LAYOUT.nodes.product.x - 188,
      y: 246,
      text: "Not a sterile claim",
      opacity: a.endNotes,
      role: "overlay",
    },
    {
      space: "world",
      x: LAYOUT.nodes.concentrate.x - 210,
      y: 860,
      text: "Concentrate",
      opacity: a.wideLabels,
      role: "hardware",
    },
    {
      space: "world",
      x: LAYOUT.nodes.concentrate.x - 250,
      y: 1010,
      text: "To drain, or other permitted handling",
      opacity: a.endNotes,
      role: "hardware",
    },
    {
      space: "world",
      x: LAYOUT.pump.x,
      y: 748,
      text: "Energy in. Magnitude not shown.",
      opacity: a.endNotes,
      role: "energy",
    },
    {
      space: "world",
      x: g.tube.x + 18,
      y: g.tube.y - 28,
      text: "Central tube",
      opacity: a.leaf,
      role: "schematic",
    },
    {
      space: "world",
      x: g.feedTop.x + 280,
      y: g.feedTop.y - 22,
      text: "Feed spacer",
      opacity: a.leaf * (1 - a.micro * 0.85),
      role: "schematic",
    },
    {
      space: "world",
      x: g.perm.x + 220,
      y: g.perm.y + g.perm.h + 22,
      text: "Permeate collection layer",
      opacity: a.leaf * (1 - a.micro * 0.7),
      role: "schematic",
    },
    {
      space: "world",
      x: g.selective.x + 300,
      y: g.selective.y + 8,
      text: "Selective layer",
      opacity: a.leaf * (1 - a.micro) * 0.9,
      role: "schematic",
    },
    {
      space: "screen",
      x: 64,
      y: 148,
      text: "Section window. The housing is not disassembled.",
      opacity: a.spiral * (1 - a.leaf),
      role: "schematic",
    },
    {
      space: "screen",
      x: 64,
      y: 148,
      text: "Enlarged plate. Thickness exaggerated. The leaf does not unwind in operation.",
      opacity: a.leaf * (1 - a.micro) * (1 - a.guide),
      role: "schematic",
    },
    {
      space: "screen",
      x: 64,
      y: 148,
      text: "Dense selective layer. Not a size sieve for dissolved species.",
      opacity: a.micro,
      role: "schematic",
    },
    {
      space: "screen",
      x: 64,
      y: 190,
      text: "Porous support is drawn under the selective layer. It is not the selective step.",
      opacity: a.micro,
      role: "schematic",
    },
    {
      space: "screen",
      x: 1100,
      y: 148,
      text: "Pressure direction. No setpoint.",
      opacity: a.leaf * (1 - a.guide),
      role: "energy",
    },
    {
      space: "screen",
      x: 760,
      y: 148,
      text: "Example water paths only. They are not a recovery ratio.",
      opacity: a.guide,
      role: "overlay",
    },
  ];
}

function levels(frame) {
  const f = clampFrame(frame);
  return {
    product: ramp(f, 700, 870),
    concentrate: ramp(f, 680, 870),
  };
}

export function frameState(frame) {
  const f = clampFrame(frame);
  const live = Math.min(f, FREEZE_FRAME);
  return {
    frame: f,
    fps: FPS,
    act: actFor(f),
    caption: captionFor(f),
    camera: camera(f),
    solutes: solutes(f),
    particulates: particulates(f),
    demoWater: demoWater(f),
    flow: flowMarks(f),
    alphas: alphas(f),
    badges: badges(f),
    annotations: annotations(f),
    levels: levels(f),
    impeller: live * 0.018,
    stable: f >= FREEZE_FRAME,
    balance: {
      visible: alphas(f).balance,
      numericRecovery: null,
      pressureSetpoint: null,
    },
    disclaimer: DISCLAIMER,
  };
}

export function pictureSignature(frame) {
  const s = frameState(frame);
  return JSON.stringify({
    camera: s.camera,
    solutes: s.solutes,
    particulates: s.particulates,
    demoWater: s.demoWater,
    flow: s.flow,
    alphas: s.alphas,
    badges: s.badges,
    annotations: s.annotations,
    levels: s.levels,
    impeller: s.impeller,
    stable: s.stable,
    balance: s.balance,
    caption: s.caption.text,
  });
}

export function visibleStrings() {
  const strings = [
    DISCLAIMER,
    SOURCE.boundary,
    SOURCE.title,
    ...CAPTIONS.map((c) => c.text),
    ...SAFEGUARDS.map((s) => s.text),
    ...ACTS.map((a) => a.title),
  ];
  for (let f = 0; f < FRAME_COUNT; f += 37) {
    const state = frameState(f);
    state.badges.forEach((b) => strings.push(b.text));
    state.annotations.forEach((note) => strings.push(note.text));
  }
  return strings;
}

export function assertTimeline() {
  const errors = [];
  if (FRAME_COUNT !== 1020) errors.push("frame count");
  if (LAST_FRAME !== 1019) errors.push("last frame");
  if (FPS * 34 !== FRAME_COUNT) errors.push("duration");
  if (ACTS[0].start !== 0 || ACTS[4].end !== 1019) errors.push("act span");
  const expected = [
    [0, 149],
    [150, 299],
    [300, 509],
    [510, 749],
    [750, 1019],
  ];
  expected.forEach((pair, i) => {
    if (ACTS[i].start !== pair[0] || ACTS[i].end !== pair[1]) {
      errors.push(`act ${i + 1} bounds`);
    }
  });
  for (let f = 0; f < FRAME_COUNT; f += 1) {
    const state = frameState(f);
    if (state.solutes.length !== 12) errors.push(`solute count ${f}`);
    if (state.particulates.length !== 4) errors.push(`particulate count ${f}`);
    if (state.demoWater.length !== 4) errors.push(`demo count ${f}`);
    const ids = new Set(state.solutes.map((s) => s.id));
    if (ids.size !== 12) errors.push(`solute ids ${f}`);
    for (const p of [...state.solutes, ...state.particulates, ...state.demoWater]) {
      if (!Number.isFinite(p.x) || !Number.isFinite(p.y)) errors.push(`nan ${f}`);
    }
    if (!(state.camera.z > 0.5 && state.camera.z < 6)) errors.push(`zoom ${f}`);
    if (state.balance.numericRecovery !== null) errors.push("recovery number");
    if (state.balance.pressureSetpoint !== null) errors.push("pressure number");
    if (f >= FREEZE_FRAME && !state.stable) errors.push(`stable flag ${f}`);
    if (f === 200) {
      const outside = state.solutes.filter((s) => s.stream !== "feed");
      if (outside.length !== 0) errors.push("early stream");
    }
    if (f === 1019) {
      const product = state.solutes.filter((s) => s.stream === "product");
      const conc = state.solutes.filter((s) => s.stream === "concentrate");
      if (product.length !== 2 || conc.length !== 10) errors.push("end split");
      for (const s of product) {
        const d = Math.hypot(s.x - LAYOUT.nodes.product.x, s.y - LAYOUT.nodes.product.y);
        if (d > 80) errors.push(`product distance ${s.id}`);
      }
      for (const s of conc) {
        const d = Math.hypot(
          s.x - LAYOUT.nodes.concentrate.x,
          s.y - LAYOUT.nodes.concentrate.y,
        );
        if (d > 80) errors.push(`concentrate distance ${s.id}`);
      }
      if (!state.particulates.every((p) => p.captured)) errors.push("particulates");
    }
    if (errors.length > 40) break;
  }
  if (pictureSignature(900) !== pictureSignature(1019)) {
    errors.push("end hold mismatch");
  }
  if (pictureSignature(450) !== pictureSignature(450)) errors.push("determinism");
  const first = pictureSignature(450);
  const second = pictureSignature(450);
  if (first !== second) errors.push("determinism repeat");
  return errors;
}
