// Pixel art drawn as SVG rects. One char = one pixel; "." = transparent.
const PALETTE = {
  k: "#1f3b36", // ink
  g: "#4f7d6b", // pine dark
  G: "#7aa892", // pine mid
  l: "#a9cdb9", // pine light
  t: "#7a5a43", // trunk
  n: "#9a7353", // dirt / dock
  N: "#6e5038", // dirt dark
  w: "#ffffff",
  c: "#e6f1f1", // cloud shade
  o: "#e8665a", // coral
  O: "#eaa75e", // cat orange
  p: "#f3b6a8", // pink / milk tea
  y: "#f2c66d", // moon
  b: "#8fbcd0", // water
  B: "#6fa3b8", // water dark
  D: "#2f4f6b", // night screen
  s: "#c9d6d3", // grey
};

const SPRITES = {
  tree: [
    ".....g.....",
    "....gGg....",
    "...gGlGg...",
    "....gGg....",
    "...gGGGg...",
    "..gGlGGGg..",
    "...gGGGg...",
    "..gGGlGGg..",
    ".gGlGGGGGg.",
    "..gGGGGGg..",
    ".gGGGlGGGg.",
    "gGGlGGGGGGg",
    ".ggggggggg.",
    ".....t.....",
    ".....t.....",
    ".....t.....",
  ],
  sitcat: [
    "k...k.....",
    "kk.kk.....",
    "kOOOk.....",
    "OkOkO.....",
    "OOpOO...k.",
    ".OOOO..kO.",
    "OOOOOO.O..",
    "OOOOOOOO..",
    ".k..k.....",
  ],
  phone: [
    "................",
    "....kkkkkkkk....",
    "....kDDDDDDk....",
    "....kDDDDDDk....",
    "....kDDyyDDk....",
    "....kDyyDDDk....",
    "....kDyyDDDk....",
    "....kDDyyDDk....",
    "....kDDDDDwk....",
    "....kDwDDDDk....",
    "....kDDDDDDk....",
    "....kDDDDDDk....",
    "....kkkkkkkk....",
    "....kkkwwkkk....",
    "....kkkkkkkk....",
    "................",
  ],
  cat: [
    "................",
    "..k.........k...",
    "..kk.......kk...",
    "..kOk.....kOk...",
    "..kOOkkkkkOOk...",
    "..kOOOOOOOOOk...",
    ".kOOOOOOOOOOOk..",
    ".kOOkOOOOOkOOk..",
    ".kOOkOOOOOkOOk..",
    ".kOOOOOpOOOOOk..",
    ".kOppOkkkOppOk..",
    "..kOOOOOOOOOk...",
    "...kkkkkkkkk....",
    "................",
    "................",
    "................",
  ],
  vr: [
    "................",
    "................",
    "................",
    "................",
    "..kkkkkkkkkkkk..",
    ".kGGGGGGGGGGGGk.",
    ".kGbbbGGGGbbbGk.",
    ".kGbwbGGGGbwbGk.",
    ".kGbbbGGGGbbbGk.",
    ".kGGGGGkkGGGGGk.",
    "..kkkkk..kkkkk..",
    "................",
    "................",
    "................",
    "................",
    "................",
  ],
  chat: [
    "................",
    "................",
    "................",
    ".kkkkkkkkkkkkkk.",
    "kwwwwwwwwwwwwwwk",
    "kwwwwwwwwwwwwwwk",
    "kwwoowwoowwoowwk",
    "kwwoowwoowwoowwk",
    "kwwwwwwwwwwwwwwk",
    "kwwwwwwwwwwwwwwk",
    ".kkkkwwkkkkkkkk.",
    "....kwk.........",
    "....kk..........",
    "................",
    "................",
    "................",
  ],
  // F = body, f = fin/tail, e = eye; recoloured per fish
  fish: [
    "f...FFF.",
    "ff.FFFFFF",
    "fFFFFFFeF",
    "ff.FFFFFF",
    "f...FFF.",
  ],
  tea: [
    "........kk......",
    ".......kk.......",
    "......kk........",
    "...kkkkkkkkkk...",
    "...kwwwwwwwwk...",
    "....kppppppk....",
    "....kppppppk....",
    "....kppppppk....",
    "....kppppppk....",
    "....kpkppkpk....",
    "....kkpkkpkk....",
    ".....kkkkkk.....",
    "................",
    "................",
    "................",
    "................",
  ],
};

const SVGNS = "http://www.w3.org/2000/svg";

function rect(parent, x, y, w, h, fill) {
  const r = document.createElementNS(SVGNS, "rect");
  r.setAttribute("x", x);
  r.setAttribute("y", y);
  r.setAttribute("width", w);
  r.setAttribute("height", h);
  r.setAttribute("fill", fill);
  parent.appendChild(r);
}

function drawSprite(parent, rows, ox = 0, oy = 0, s = 1) {
  rows.forEach((row, y) => {
    [...row].forEach((ch, x) => {
      if (PALETTE[ch]) rect(parent, ox + x * s, oy + y * s, s, s, PALETTE[ch]);
    });
  });
}

function group(parent, cls) {
  const g = document.createElementNS(SVGNS, "g");
  if (cls) g.setAttribute("class", cls);
  parent.appendChild(g);
  return g;
}

// Small seeded RNG so the scene looks the same on every visit
let seed = 7;
const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

// Rasterize a union of circles into a flat-bottomed pixel cloud, shaded on the bottom edge
function cloud(parent, cx, cy, circles, s = 1) {
  const cs = circles.map(([dx, dy, r]) => [dx * s, dy * s, r * s]);
  const base = Math.round(3 * s);
  const inside = (x, y) => y <= base && cs.some(([dx, dy, r]) => (x - dx) ** 2 + (y - dy) ** 2 <= r * r);
  const reach = Math.ceil(Math.max(...cs.map(([dx, dy, r]) => Math.max(Math.abs(dx), Math.abs(dy)) + r)));
  // Merge horizontal runs of the same colour into one rect to keep the DOM small
  for (let y = -reach; y <= base; y++) {
    let runStart = null, runColor = null;
    for (let x = -reach; x <= reach + 1; x++) {
      const color = x <= reach && inside(x, y) ? (inside(x, y + 1) ? PALETTE.w : PALETTE.c) : null;
      if (color === runColor) continue;
      if (runColor) rect(parent, cx + runStart, cy + y, x - runStart, 1, runColor);
      runStart = x;
      runColor = color;
    }
  }
}

// A cloud layer is drawn twice, one scene-width apart, and slides left by
// exactly that width, so the loop is seamless.
function cloudLayer(svg, W, cls, { spacing, scale, y, jitter }) {
  const layer = group(svg, `cloud-layer ${cls}`);
  layer.style.setProperty("--w", `${W}px`);
  const n = Math.max(1, Math.round(W / spacing));
  const spots = Array.from({ length: n }, (_, i) => [
    Math.round((i + 0.3 + rand() * 0.4) * W / n),
    y + Math.round((rand() - 0.5) * jitter),
    CLOUD_SHAPES[i % CLOUD_SHAPES.length],
  ]);
  [0, W].forEach((off) => spots.forEach(([x, cy, shape]) => cloud(layer, x + off, cy, shape, scale)));
}

const CLOUD_SHAPES = [
  [[0, 0, 9], [10, 2, 7], [-9, 3, 6], [4, -6, 7]],
  [[0, 0, 11], [13, 3, 8], [-12, 3, 7], [3, -8, 8], [-6, -4, 6]],
  [[0, 0, 8], [9, 2, 6], [-8, 2, 6], [2, -5, 6]],
];

// Scene height is fixed at 90 px-units; width follows the element's aspect ratio
// so the whole height (tree tops included) is always visible.
function drawScene(svg) {
  const H = 90, GROUND = 70, WATER = 73;
  const box = svg.getBoundingClientRect();
  const W = Math.max(160, Math.round(H * box.width / box.height));
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  svg.replaceChildren();
  seed = 7;
  const mid = Math.round(W / 2);

  cloudLayer(svg, W, "back", { spacing: 90, scale: 1, y: 30, jitter: 10 });
  cloudLayer(svg, W, "front", { spacing: 150, scale: 1.7, y: 46, jitter: 8 });

  const land = group(svg);
  // water
  rect(land, 0, WATER, W, 90 - WATER, PALETTE.b);
  const ripples = group(svg, "ripples");
  for (let i = 0; i < 26; i++) {
    const x = Math.floor(rand() * W), y = WATER + 3 + Math.floor(rand() * 14);
    rect(ripples, x, y, 3 + Math.floor(rand() * 5), 1, i % 3 ? PALETTE.B : PALETTE.w);
  }
  // islands: grass on top, dirt edge below
  // islands: grass on top, dirt edge below; the pond in the middle stays open
  const islands = [[0, mid - 32], [mid + 44, W]];
  islands.forEach(([a, b], side) => {
    if (b <= a) return;
    rect(land, a, GROUND, b - a, 1, PALETTE.G);
    rect(land, a, GROUND + 1, b - a, 2, PALETTE.n);
    rect(land, a, GROUND + 3, b - a, 1, PALETTE.N);
    for (let x = a; x < b; x += 2) {
      if (rand() < 0.5) rect(land, x, GROUND - 1, 1, 1, PALETTE.g);
    }
    // trees: big/small mix, bases on the grass line; keep the dock side clear
    const from = side === 0 ? a + 2 : a + 8;
    const to = side === 0 ? b - 30 : b - 8;
    for (let x = from; x <= to; ) {
      const s = rand() < 0.45 ? 2 : 1;
      if (x + 11 * s > b) break;
      drawSprite(land, SPRITES.tree, x, GROUND - 16 * s, s);
      x += 11 * s + 2 + Math.floor(rand() * 10);
    }
    // flowers
    for (let x = a + 6; x < b - 4; x += 23 + Math.floor(rand() * 20)) {
      rect(land, x, GROUND - 2, 1, 1, PALETTE["oyp"[Math.floor(rand() * 3)]]);
      rect(land, x, GROUND - 1, 1, 1, PALETTE.g);
    }
  });
  // dock, cat and fishing line (relative to the scene centre)
  const d = mid - 160;
  rect(land, d + 118, GROUND, 22, 1, PALETTE.n);
  rect(land, d + 118, GROUND + 1, 22, 1, PALETTE.N);
  rect(land, d + 136, GROUND + 2, 1, 4, PALETTE.N);
  drawSprite(land, SPRITES.sitcat, d + 124, GROUND - 9);
  for (let i = 0; i < 12; i++) rect(land, d + 132 + i, GROUND - 6 - Math.floor(i * 0.9), 1, 1, PALETTE.N);
  rect(land, d + 143, GROUND - 16, 1, WATER - GROUND + 17, "#5d7570");
  rect(land, d + 142, WATER + 1, 3, 1, PALETTE.o);
  // little bucket
  rect(land, d + 119, GROUND - 3, 3, 3, PALETTE.s);
  rect(land, d + 119, GROUND - 3, 3, 1, PALETTE.k);
}

// Little pixel fish swimming behind the page, a nod to the fishing cat
const FISH_COLORS = [
  ["#e8665a", "#b94a40"], // coral
  ["#eaa75e", "#c07f3a"], // orange
  ["#f2c66d", "#c99a3e"], // yellow
  ["#6fa3b8", "#46788c"], // blue
  ["#f3b6a8", "#d4847a"], // pink
  ["#7aa892", "#4f7d6b"], // green
];

function drawFishSchool() {
  const school = document.createElement("div");
  school.className = "fish-school";
  school.setAttribute("aria-hidden", "true");
  const n = window.innerWidth < 700 ? 6 : 14;
  for (let i = 0; i < n; i++) {
    const [body, fin] = FISH_COLORS[i % FISH_COLORS.length];
    const lane = document.createElement("div");
    lane.className = "fish" + (i % 2 ? " left" : "");
    lane.style.top = `${8 + ((i * 37) % 86)}%`;
    lane.style.animationDuration = `${38 + ((i * 13) % 34)}s`;
    lane.style.animationDelay = `${-((i * 17) % 60)}s`;
    const svg = document.createElementNS(SVGNS, "svg");
    svg.setAttribute("viewBox", "0 0 9 5");
    svg.classList.add("px");
    const s = i % 3 === 0 ? 6 : 4;
    svg.style.width = `${9 * s}px`;
    svg.style.height = `${5 * s}px`;
    svg.style.animationDelay = `${-(i % 5) * 0.4}s`;
    SPRITES.fish.forEach((row, y) => [...row].forEach((ch, x) => {
      const fill = { F: body, f: fin, e: PALETTE.k }[ch];
      if (fill) rect(svg, x, y, 1, 1, fill);
    }));
    lane.appendChild(svg);
    school.appendChild(lane);
  }
  document.body.prepend(school);
}

// Deterministic barcode from the name
function drawBarcode(svg, text) {
  let x = 0, i = 0;
  while (x < 160) {
    const code = text.charCodeAt(i % text.length) + i;
    const w = 1 + (code % 3);
    if (i % 2 === 0) rect(svg, x, 0, w, 40, PALETTE.k);
    x += w + (code % 2);
    i++;
  }
}

document.querySelectorAll("svg[data-sprite]").forEach((svg) => {
  drawSprite(svg, SPRITES[svg.dataset.sprite]);
  svg.classList.add("px");
});
const scene = document.getElementById("scene");
if (scene) {
  scene.classList.add("px");
  drawScene(scene);
  let timer;
  window.addEventListener("resize", () => {
    clearTimeout(timer);
    timer = setTimeout(() => drawScene(scene), 150);
  });
}
drawFishSchool();
const barcode = document.getElementById("barcode");
if (barcode) drawBarcode(barcode, "WEITINGHUANG-NTU-HCI");
