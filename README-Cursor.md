# Reverse-Osmosis Membrane Module

Frame-locked schematic film of a spiral-wound reverse-osmosis membrane module and the treatment train around it. 34 seconds, 30 fps, frames 0 through 1019.

This is a conceptual, source-informed working picture. It is not a certified engineering design, not a product drawing, and not a performance guarantee.

## Watch it

Open `index.html` in a browser, or serve this folder and open the root. Playback is frame-locked. Space plays and pauses. Arrow keys step one frame. The act buttons open stills. If the browser asks for reduced motion, the film stays paused until you play it.

`index.html` is the site entry GitHub Pages expects. The other authored files use a `-Cursor` suffix.

The Medium draft is `medium-article-Cursor.md`. Publishing notes sit above the article. The piece explains the mechanism and points back to EPA WaterSense. It does not rate the drawing.

## What the five acts show

| Frames | Time | Picture |
| --- | --- | --- |
| 0–149 | 0–5s | Pretreatment, pressure supply, spiral-wound vessel, product outlet, concentrate outlet |
| 150–299 | 5–10s | Section window, then an enlarged plate: leaves, feed spacer, permeate collection layer, central tube |
| 300–509 | 10–17s | Feed along the selective layer. Some water crosses. Dissolved marks that remain pack downstream |
| 510–749 | 17–25s | Permeate toward the tube and product. Concentrate toward its own outlet |
| 750–1019 | 25–34s | Full train held still: feed, product, concentrate, pump energy, monitors, managed concentrate |

Frame 900 and frame 1019 draw the same system.

## Accuracy boundary

U.S. EPA WaterSense describes point-of-use reverse osmosis as pressure forcing water through a semipermeable membrane, making a permeate stream and a concentrate (brine) stream that still carries material that did not pass. In a typical under-sink system that concentrate goes to the drain and becomes wastewater.

- Page: https://www.epa.gov/watersense/point-use-reverse-osmosis-systems
- Supporting statement, November 2024: https://www.epa.gov/system/files/documents/2024-11/ws-products-ro-systems-spec-supporting-statement_508.pdf

That source supports the process. It does not specify this staging, this timing, or the spiral-wound plate. The plate is a labeled schematic of a common element form: a central collection tube, membrane leaves, a feed spacer, and a permeate carrier. Leaf count, materials, pressure, and recovery are not stated because they are not universal.

The selective layer is drawn as a continuous dense band. Dissolved species are not sorted by one shared hole size. Pretreatment can hold larger particulates. That is a different mechanism, and the film says so. Product water is not shown as sterile or empty of every contaminant. Two dissolved marks stay with the product. Ten finish in the concentrate collector. None are deleted.

No recovery percentage and no pressure setpoint are drawn. Widths in the balance graphic are labeled as explanatory.

## Safeguards

The page lists them in the Safeguards panel. In short: on-screen status, no invented rating, no sieve model for dissolved material, no sterility claim, conserved marks, section drawings instead of a fake disassembly, labeled enlarged scale, slow motion, and time compression, separate colors for hardware, transport, energy, and sensing, energy and concentrate that stay visible, conceptual monitors, reduced-motion pause, no form and no analytics, and a picture that is a function of the frame index.

Hardware is muted metal. Cyan is the transport overlay. Gold is energy or actuation. Violet is sensing or the section state. Those colors are not literal emissions.

The brief locks this palette, so a multi-theme dashboard picker is not part of this film.

## Check the timeline

```bash
node test-Cursor.mjs
```

The test walks all 1,020 frames. It checks act bounds, caption coverage, solute conservation, the held ending, and banned claim language.

## GitHub

About: Frame-locked schematic film of a spiral-wound reverse-osmosis membrane module and its treatment train.

Topics: `reverse-osmosis` `water-treatment` `membrane` `spiral-wound` `science-visualization` `educational-animation` `environmental-engineering` `schematic`

GitHub Pages should serve the `pages` branch from the repository root.

## What this page is for

It teaches the mechanism to engineers, operators, students, and buyers who need the flow paths without a fake rating. The page itself does not collect leads and does not sell a membrane. The same frame-locked pattern can be reused for another separation train by swapping the geometry module and keeping the claim checks.
