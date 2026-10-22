/**
 * Reverse-osmosis membrane module.
 * Deterministic picture state for frames 0 through 1019 at 30 fps.
 * Rendering reads this module. It does not invent a second timeline.
 */

export const FPS = 30;
export const FRAME_COUNT = 1020;
export const LAST_FRAME = 1019;
export const FREEZE_FRAME = 900;
export const CAMERA_HOLD = 860;

export const SOURCE = {
  title: "Point-of-Use Reverse Osmosis Systems",
  publisher: "U.S. Environmental Protection Agency, WaterSense",
  url: "https://www.epa.gov/watersense/point-use-reverse-osmosis-systems",
  supporting:
    "WaterSense Specification for Point-of-Use Reverse Osmosis Systems, Supporting Statement, November 2024",
  supportingUrl:
    "https://www.epa.gov/system/files/documents/2024-11/ws-products-ro-systems-spec-supporting-statement_508.pdf",
  boundary:
    "EPA WaterSense supports the process used here: applied pressure, a semipermeable membrane, a permeate stream, and a concentrate stream that still contains the rejected material. The spiral-wound section is a labeled schematic of a common element form. It is not an EPA figure, not a product drawing, and not a certified design.",
};

export const LAYOUT = {
  feedY: 604,
  pretreat: [
    { id: "particulate", x: 214, y: 604, r: 64 },
    { id: "conditioning", x: 408, y: 604, r: 64 },
  ],
  pump: { x: 598, y: 604, r: 56 },
  vessel: { x: 760, y: 516, w: 610, h: 176 },
  productPort: { x: 1370, y: 552 },
  concentratePort: { x: 1370, y: 676 },
  nodes: {
    product: { x: 1716, y: 292, r: 52 },
    concentrate: { x: 1716, y: 932, r: 58 },
  },
  monitors: [
    { id: "feed", x: 704, y: 548 },
    { id: "product", x: 1488, y: 392 },
    { id: "concentrate", x: 1504, y: 808 },
  ],
};

export const PLATE = { x: 848, y: 156, w: 600, h: 316 };

export const INLET_PATH = [
  [72, 604],
  [214, 604],
  [408, 604],
  [598, 604],
  [748, 604],
];

export const CONCENTRATE_PATH = [
  [1370, 676],
  [1524, 804],
  [1716, 932],
];

export const PRODUCT_PATH = [
  [1370, 552],
  [1512, 424],
  [1716, 292],
];

export function plateGeometry() {
  const pad = 18;
  const feedH = 58;
  const memH = 46;
  const permH = 72;
  const top = PLATE.y + pad;
  const feedTop = { x: PLATE.x + 8, y: top, w: PLATE.w - 16, h: feedH };
  const memTop = { x: PLATE.x + 8, y: top + feedH, w: PLATE.w - 16, h: memH };
  const perm = {
    x: PLATE.x + 52,
    y: top + feedH + memH,
    w: PLATE.w - 68,
    h: permH,
  };
  const tube = { x: PLATE.x + 8, y: perm.y, w: 44, h: permH };
  const memBot = { x: PLATE.x + 8, y: perm.y + permH, w: PLATE.w - 16, h: memH };
  const feedBot = { x: PLATE.x + 8, y: memBot.y + memH, w: PLATE.w - 16, h: feedH };
  const selective = { x: memTop.x, y: memTop.y, w: memTop.w, h: 15 };
  const support = {
    x: memTop.x,
    y: memTop.y + 15,
    w: memTop.w,
    h: memH - 15,
  };
  return {
    feedTop,
    memTop,
    perm,
    tube,
    memBot,
    feedBot,
    selective,
    support,
    permY: perm.y + permH / 2,
    selectiveY: selective.y + selective.h / 2,
  };
}

export const ACTS = [
  { id: 1, start: 0, end: 149, title: "Establish the train" },
  { id: 2, start: 150, end: 299, title: "Schematic section" },
  { id: 3, start: 300, end: 509, title: "Along the membrane" },
  { id: 4, start: 510, end: 749, title: "Two continuous paths" },
  { id: 5, start: 750, end: 1019, title: "Full train" },
];

export const CAPTIONS = [
  {
    start: 0,
    end: 79,
    text: "Pretreatment, a pressure supply, and a spiral-wound module. Product and concentrate leave through separate outlets. No pressure setting is shown.",
  },
  {
    start: 80,
    end: 149,
    text: "The first stage holds larger particulates. That size separation is not how the membrane treats dissolved material. Conditioning is indicated only. The media is not specified.",
  },
  {
    start: 150,
    end: 229,
    text: "A section window opens in the housing. This is a drawing convention. The vessel stays one piece. It is not taken apart.",
  },
  {
    start: 230,
    end: 299,
    text: "The enlarged plate shows leaves, feed spacers, permeate collection layers, and the central tube. The leaf is drawn unrolled so the paths can be read. It does not unwind in operation.",
  },
  {
    start: 300,
    end: 419,
    text: "Pressurized feed moves along the membrane. Some water crosses a dense selective layer. Dissolved material is not drawn as if every species met the same hole.",
  },
  {
    start: 420,
    end: 509,
    text: "Marks that remain in the feed pack closer together, so the remaining stream is more concentrated. Rejection depends on the solute, the membrane, and the conditions. Slow motion.",
  },
  {
    start: 510,
    end: 649,
    text: "Permeate moves toward the collection tube and then the product outlet. Concentrate stays on its own path. Both streams continue. Example paths are not a yield.",
  },
  {
    start: 650,
    end: 749,
    text: "Qualitative balance: water that enters leaves as product or as concentrate. The widths are not a recovery rating. The product stream still carries a few dissolved marks.",
  },
  {
    start: 750,
    end: 899,
    text: "The view returns to the full train. Pumping energy stays on the machine. Violet marks are conceptual monitors, not a named instrument.",
  },
  {
    start: 900,
    end: 1019,
    text: "Concentrate still holds rejected material and needs a responsible destination. It does not disappear. Product water is not shown as sterile. This held frame is a system view, not a performance claim.",
  },
];

export const SAFEGUARDS = [
  {
    id: "status",
    text: "On-screen status: conceptual, source-informed working schematic. Not a certified engineering design, not installation advice, and not a drinking-water clearance.",
  },
  {
    id: "no-rating",
    text: "No recovery percentage, efficiency rating, or pressure setpoint is drawn. Published label criteria are not applied to this picture.",
  },
  {
    id: "not-a-sieve",
    text: "The selective layer is drawn as a continuous dense band. Dissolved species are not sorted by one shared hole size. Pretreatment particulates use a different, labeled mechanism.",
  },
  {
    id: "not-sterile",
    text: "Product water is not labeled sterile, pure, or free of every contaminant. Two dissolved marks stay with the product on purpose.",
  },
  {
    id: "conserve",
    text: "Twelve dissolved marks enter with the feed. Ten finish in the concentrate collector and two finish with the product. None are deleted. Looping ticks show direction only.",
  },
  {
    id: "section",
    text: "The housing is cut with a section window. The unrolled leaf is an enlarged schematic plate. The hardware is not shown exploding or unwinding in operation.",
  },
  {
    id: "time-scale",
    text: "Badges name enlarged scale, slow motion, and time compression on the frames where each one applies.",
  },
  {
    id: "layers",
    text: "Hardware stays in muted metal. Cyan is the transport overlay. Gold is energy or actuation. Violet is sensing or section state. Those colors are not literal emissions.",
  },
  {
    id: "energy",
    text: "Pump energy remains visible at the end. The film does not turn it into an invented efficiency or make it vanish.",
  },
  {
    id: "concentrate",
    text: "Concentrate ends in a labeled collector. A destination is required. The stream is not poured off the edge of the picture.",
  },
  {
    id: "monitors",
    text: "Monitors have no model numbers, setpoints, or alarm behavior. They mark where a real train would be watched.",
  },
  {
    id: "motion",
    text: "If the viewer asks for reduced motion, the film does not autoplay. Act stills still open. Nothing flashes or strobes.",
  },
  {
    id: "privacy",
    text: "The page collects no form data, has no account, and loads no analytics tag.",
  },
  {
    id: "source",
    text: "EPA WaterSense is linked for the process. The spiral-wound plate is identified as our schematic, not as an agency or manufacturer drawing.",
  },
  {
    id: "determinism",
    text: "The picture is a function of the frame index. There is no clock noise and no random placement. Frame 900 and frame 1019 draw the same system.",
  },
];

export const DISCLAIMER =
  "Conceptual source-informed schematic. Not a certified engineering design, not installation advice, and not a claim that the water is sterile or free of contaminants.";

export const CAM_KEYS = [
  { f: 0, x: 1020, y: 640, z: 0.86 },
  { f: 149, x: 1060, y: 620, z: 1.02 },
  { f: 236, x: 1064, y: 604, z: 2.22 },
  { f: 330, x: 1160, y: 336, z: 1.9 },
  { f: 430, x: 1188, y: 240, z: 4.7 },
  { f: 520, x: 1210, y: 268, z: 4.15 },
  { f: 610, x: 1180, y: 430, z: 2.25 },
  { f: 700, x: 1260, y: 590, z: 1.42 },
  { f: 749, x: 1188, y: 640, z: 1.16 },
  { f: CAMERA_HOLD, x: 1040, y: 640, z: 0.86 },
];
