    import {
      ACTS,
      CAPTIONS,
      CONCENTRATE_PATH,
      DISCLAIMER,
      FPS,
      INLET_PATH,
      LAST_FRAME,
      LAYOUT,
      PLATE,
      PRODUCT_PATH,
      SAFEGUARDS,
      SOURCE,
      clampFrame,
      frameState,
      plateGeometry,
    } from "./model-Cursor.js";

    const canvas = document.getElementById("film");
    const ctx = canvas.getContext("2d");
    const playBtn = document.getElementById("play");
    const scrub = document.getElementById("scrub");
    const captionLive = document.getElementById("captionLive");
    const geom = plateGeometry();

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const params = new URLSearchParams(location.search);
    let frame = params.has("frame") ? clampFrame(Number(params.get("frame"))) : 0;
    let playing = false;
    let acc = 0;
    let lastTick = 0;

    document.getElementById("motionNote").hidden = !reduced;
    document.getElementById("statusLine").textContent = DISCLAIMER;
    document.getElementById("sourceCopy").textContent =
      `${SOURCE.publisher}. ${SOURCE.title}. ${SOURCE.boundary} ${SOURCE.supporting}.`;
    const sourceLink = document.createElement("a");
    sourceLink.href = SOURCE.url;
    sourceLink.textContent = " EPA WaterSense page.";
    document.getElementById("sourceCopy").append(" ", sourceLink);

    const safeguardList = document.getElementById("safeguardList");
    SAFEGUARDS.forEach((item) => {
      const li = document.createElement("li");
      li.textContent = item.text;
      safeguardList.append(li);
    });
    const transcript = document.getElementById("transcript");
    CAPTIONS.forEach((item) => {
      const li = document.createElement("li");
      const start = (item.start / FPS).toFixed(1);
      const end = ((item.end + 1) / FPS).toFixed(1);
      li.textContent = `${start}s to ${end}s. ${item.text}`;
      transcript.append(li);
    });
    const acts = document.getElementById("acts");
    ACTS.forEach((act) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "act";
      btn.textContent = `${act.id}. ${act.title}`;
      btn.addEventListener("click", () => seek(act.start, true));
      acts.append(btn);
    });

    function seek(next, pause) {
      frame = clampFrame(next);
      acc = 0;
      if (pause) setPlaying(false);
      paint();
    }

    function setPlaying(next) {
      playing = next && frame < LAST_FRAME;
      playBtn.setAttribute("aria-pressed", playing ? "true" : "false");
      playBtn.textContent = playing ? "Pause" : "Play";
      if (!playing) lastTick = 0;
    }

    playBtn.addEventListener("click", () => {
      if (frame >= LAST_FRAME) frame = 0;
      setPlaying(!playing);
    });
    document.getElementById("restart").addEventListener("click", () => {
      frame = 0;
      setPlaying(!reduced);
      paint();
    });
    document.getElementById("prev").addEventListener("click", () => {
      const idx = Math.max(0, ACTS.findIndex((act) => frame >= act.start && frame <= act.end) - 1);
      seek(ACTS[idx].start, true);
    });
    document.getElementById("next").addEventListener("click", () => {
      const idx = ACTS.findIndex((act) => frame >= act.start && frame <= act.end);
      seek(ACTS[Math.min(ACTS.length - 1, idx + 1)].start, true);
    });
    document.getElementById("back").addEventListener("click", () => seek(frame - 1, true));
    document.getElementById("forward").addEventListener("click", () => seek(frame + 1, true));
    scrub.addEventListener("input", () => seek(Number(scrub.value), true));

    window.addEventListener("keydown", (event) => {
      const tag = document.activeElement && document.activeElement.tagName;
      if (tag === "INPUT" || tag === "SUMMARY") return;
      if (event.code === "Space") {
        event.preventDefault();
        if (frame >= LAST_FRAME) frame = 0;
        setPlaying(!playing);
      } else if (event.code === "ArrowRight") {
        seek(frame + 1, true);
      } else if (event.code === "ArrowLeft") {
        seek(frame - 1, true);
      } else if (event.code === "Home") {
        seek(0, true);
      } else if (event.code === "End") {
        seek(LAST_FRAME, true);
      }
    });

    function loop(now) {
      if (playing) {
        if (!lastTick) lastTick = now;
        acc += now - lastTick;
        lastTick = now;
        const step = 1000 / FPS;
        while (acc >= step) {
          acc -= step;
          if (frame >= LAST_FRAME) {
            setPlaying(false);
            break;
          }
          frame += 1;
        }
      } else {
        lastTick = 0;
      }
      paint();
      requestAnimationFrame(loop);
    }

    function roundRect(x, y, w, h, r) {
      const radius = Math.min(r, w / 2, h / 2);
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.arcTo(x + w, y, x + w, y + h, radius);
      ctx.arcTo(x + w, y + h, x, y + h, radius);
      ctx.arcTo(x, y + h, x, y, radius);
      ctx.arcTo(x, y, x + w, y, radius);
      ctx.closePath();
    }

    function capsule(x, y, w, h) {
      const r = h / 2;
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
    }

    function trace(points) {
      ctx.beginPath();
      ctx.moveTo(points[0][0], points[0][1]);
      for (let i = 1; i < points.length; i += 1) ctx.lineTo(points[i][0], points[i][1]);
    }

    function metalPipe(points, outer, inner) {
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      trace(points);
      ctx.strokeStyle = "#243140";
      ctx.lineWidth = outer;
      ctx.stroke();
      trace(points);
      ctx.strokeStyle = "#3c4e63";
      ctx.lineWidth = outer - 6;
      ctx.stroke();
      trace(points);
      ctx.strokeStyle = inner;
      ctx.lineWidth = Math.max(2, outer - 14);
      ctx.stroke();
    }

    function roleColor(role) {
      if (role === "overlay") return "#00e5ff";
      if (role === "energy") return "#ffd166";
      if (role === "schematic") return "#d5dde6";
      if (role === "sensing") return "#9d4edd";
      return "#8ea0b5";
    }

    function drawGrid() {
      ctx.save();
      ctx.strokeStyle = "rgba(231,238,246,0.035)";
      ctx.lineWidth = 1;
      for (let x = 0; x <= 1920; x += 64) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, 1080);
        ctx.stroke();
      }
      for (let y = 0; y <= 1080; y += 64) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(1920, y);
        ctx.stroke();
      }
      ctx.restore();
    }

    function drawCanister(unit, media) {
      const { x, y, r } = unit;
      const w = r * 1.45;
      const top = y - r * 1.28;
      const h = r * 2.55;
      ctx.save();
      const body = ctx.createLinearGradient(x - w / 2, y, x + w / 2, y);
      body.addColorStop(0, "#2a384a");
      body.addColorStop(0.4, "#51647c");
      body.addColorStop(1, "#243244");
      ctx.fillStyle = body;
      roundRect(x - w / 2, top, w, h, 16);
      ctx.beginPath();
      roundRect(x - w / 2, top, w, h, 16);
      ctx.rect(x - w / 2 - 4, y - 14, w + 8, 28);
      ctx.fill("evenodd");
      ctx.strokeStyle = "#1a2330";
      ctx.lineWidth = 2;
      roundRect(x - w / 2, top, w, h, 16);
      ctx.stroke();
      ctx.fillStyle = media;
      roundRect(x - w * 0.28, y + 22, w * 0.56, r * 0.72, 6);
      ctx.fill();
      ctx.restore();
    }

    function drawPump(state) {
      const { x, y, r } = LAYOUT.pump;
      ctx.save();
      ctx.translate(x, y);
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      const g = ctx.createRadialGradient(-8, -10, 8, 0, 0, r);
      g.addColorStop(0, "#51647c");
      g.addColorStop(1, "#2a3848");
      ctx.fillStyle = g;
      ctx.fill();
      ctx.strokeStyle = "#18212c";
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.rotate(state.impeller);
      ctx.strokeStyle = "#ffd166";
      ctx.lineWidth = 3;
      ctx.globalAlpha = state.alphas.energy;
      for (let i = 0; i < 6; i += 1) {
        ctx.rotate(Math.PI / 3);
        ctx.beginPath();
        ctx.moveTo(8, 0);
        ctx.quadraticCurveTo(r * 0.45, 8, r * 0.72, 0);
        ctx.stroke();
      }
      ctx.restore();
      ctx.save();
      ctx.translate(x, y);
      ctx.strokeStyle = "#ffd166";
      ctx.globalAlpha = state.alphas.energy;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, r + 10, -2.4, -0.7);
      ctx.stroke();
      ctx.restore();
    }

    function drawVessel(state) {
      const v = LAYOUT.vessel;
      ctx.save();
      capsule(v.x, v.y, v.w, v.h);
      const g = ctx.createLinearGradient(0, v.y, 0, v.y + v.h);
      g.addColorStop(0, "#526680");
      g.addColorStop(0.42, "#344257");
      g.addColorStop(1, "#222b39");
      ctx.fillStyle = g;
      ctx.fill();
      ctx.strokeStyle = "#151c27";
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.fillStyle = "rgba(255,255,255,0.08)";
      capsule(v.x + 18, v.y + 10, v.w - 36, 18);
      ctx.fill();
      for (const bx of [v.x + 70, v.x + v.w - 70]) {
        ctx.fillStyle = "#1a2330";
        ctx.fillRect(bx, v.y + v.h - 8, 46, 16);
      }
      const cx = v.x + v.w * 0.5;
      const cy = v.y + v.h * 0.5;
      const radius = v.h * 0.34;
      if (state.alphas.spiral > 0.02) {
        ctx.save();
        ctx.globalAlpha = state.alphas.spiral;
        ctx.beginPath();
        ctx.arc(cx, cy, radius + 8, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(157,78,221,0.85)";
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fillStyle = "#101720";
        ctx.fill();
        ctx.restore();
        drawSpiral(cx, cy, radius - 6, state.alphas.spiral);
      }
      ctx.restore();
    }

    function drawSpiral(cx, cy, radius, alpha) {
      if (alpha < 0.02) return;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.clip();
      const turns = 3.2;
      const strokeSpiral = (r0, r1, width, color, phase) => {
        ctx.beginPath();
        const n = 520;
        for (let i = 0; i <= n; i += 1) {
          const t = i / n;
          const a = phase + t * turns * Math.PI * 2;
          const rr = r0 + (r1 - r0) * t;
          const x = cx + Math.cos(a) * rr;
          const y = cy + Math.sin(a) * rr;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.lineCap = "round";
        ctx.stroke();
      };
      strokeSpiral(radius * 0.28, radius * 0.94, radius * 0.12, "#3e5168", 0.15);
      strokeSpiral(radius * 0.28, radius * 0.94, 1.5, "#d7e0ea", 0.15);
      strokeSpiral(radius * 0.34, radius * 0.86, 2, "rgba(0,229,255,0.35)", 0.7);
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 0.2, 0, Math.PI * 2);
      ctx.fillStyle = "#d5dde6";
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#1c2633";
      ctx.stroke();
      for (let i = 0; i < 4; i += 1) {
        const a = (i / 4) * Math.PI * 2 + 0.5;
        ctx.beginPath();
        ctx.arc(cx + Math.cos(a) * radius * 0.11, cy + Math.sin(a) * radius * 0.11, 2.1, 0, Math.PI * 2);
        ctx.fillStyle = "#101720";
        ctx.fill();
      }
      ctx.restore();
    }

    function mesh(rect) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(rect.x, rect.y, rect.w, rect.h);
      ctx.clip();
      ctx.strokeStyle = "rgba(231,238,246,0.18)";
      ctx.lineWidth = 1;
      const gap = 16;
      for (let x = rect.x - rect.h; x < rect.x + rect.w; x += gap) {
        ctx.beginPath();
        ctx.moveTo(x, rect.y);
        ctx.lineTo(x + rect.h, rect.y + rect.h);
        ctx.moveTo(x, rect.y + rect.h);
        ctx.lineTo(x + rect.h, rect.y);
        ctx.stroke();
      }
      ctx.restore();
    }

    function drawPlate(state) {
      const alpha = state.alphas.leaf;
      if (alpha < 0.02) return;
      ctx.save();
      ctx.globalAlpha = alpha;
      roundRect(PLATE.x, PLATE.y, PLATE.w, PLATE.h, 16);
      ctx.fillStyle = "rgba(16,22,32,0.94)";
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = "rgba(213,221,230,0.85)";
      ctx.stroke();
      const feedPaint = "rgba(0,229,255,0.08)";
      for (const feed of [geom.feedTop, geom.feedBot]) {
        ctx.fillStyle = "#1c2836";
        ctx.fillRect(feed.x, feed.y, feed.w, feed.h);
        ctx.fillStyle = feedPaint;
        ctx.fillRect(feed.x, feed.y, feed.w, feed.h);
        mesh(feed);
      }

      const selectiveGrad = ctx.createLinearGradient(0, geom.selective.y, 0, geom.selective.y + geom.selective.h);
      selectiveGrad.addColorStop(0, "#f4f7fb");
      selectiveGrad.addColorStop(1, "#c5d0dc");
      ctx.fillStyle = selectiveGrad;
      ctx.fillRect(geom.selective.x, geom.selective.y, geom.selective.w, geom.selective.h);

      ctx.save();
      ctx.beginPath();
      ctx.rect(geom.support.x, geom.support.y, geom.support.w, geom.support.h);
      ctx.clip();
      ctx.fillStyle = "#8ea0b4";
      ctx.fillRect(geom.support.x, geom.support.y, geom.support.w, geom.support.h);
      ctx.fillStyle = "#243244";
      for (let i = 0; i < 18; i += 1) {
        const x = geom.support.x + 18 + ((i * 97) % (geom.support.w - 30));
        const y = geom.support.y + 4 + ((i * 13) % Math.max(8, geom.support.h - 8));
        ctx.beginPath();
        ctx.ellipse(x, y, 7, 3.2, (i % 5) * 0.3, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      ctx.fillStyle = "#b7c3d1";
      ctx.fillRect(geom.memBot.x, geom.memBot.y, geom.memBot.w, 12);
      ctx.fillStyle = "#7d8fa3";
      ctx.fillRect(geom.memBot.x, geom.memBot.y + 12, geom.memBot.w, geom.memBot.h - 12);

      ctx.fillStyle = "#243447";
      ctx.fillRect(geom.perm.x, geom.perm.y, geom.perm.w, geom.perm.h);
      ctx.strokeStyle = "rgba(231,238,246,0.18)";
      ctx.lineWidth = 1;
      for (let y = geom.perm.y + 6; y < geom.perm.y + geom.perm.h; y += 7) {
        ctx.beginPath();
        ctx.moveTo(geom.perm.x, y);
        ctx.lineTo(geom.perm.x + geom.perm.w, y);
        ctx.stroke();
      }

      roundRect(geom.tube.x, geom.tube.y + 6, geom.tube.w, geom.tube.h - 12, 8);
      ctx.fillStyle = "#d5dde6";
      ctx.fill();
      ctx.fillStyle = "#101720";
      for (let i = 0; i < 3; i += 1) {
        ctx.beginPath();
        ctx.arc(geom.tube.x + geom.tube.w - 6, geom.tube.y + 22 + i * 16, 2.3, 0, Math.PI * 2);
        ctx.fill();
      }

      const phase = state.impeller * 18;
      ctx.strokeStyle = "#ffd166";
      ctx.globalAlpha = alpha * 0.85;
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 6; i += 1) {
        const x = geom.feedTop.x + 30 + ((i * 86 + phase) % (geom.feedTop.w - 50));
        const y = geom.feedTop.y + geom.feedTop.h * 0.45;
        ctx.beginPath();
        ctx.moveTo(x, y - 7);
        ctx.lineTo(x + 10, y);
        ctx.lineTo(x, y + 7);
        ctx.stroke();
      }
      ctx.restore();
    }

    function drawGuides(state) {
      const alpha = state.alphas.guide;
      if (alpha < 0.02) return;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.setLineDash([6, 6]);
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = "rgba(0,229,255,0.7)";
      ctx.beginPath();
      ctx.moveTo(geom.tube.x + 20, geom.permY);
      ctx.lineTo(LAYOUT.productPort.x, LAYOUT.productPort.y);
      ctx.stroke();
      ctx.strokeStyle = "rgba(228,201,138,0.75)";
      ctx.beginPath();
      ctx.moveTo(PLATE.x + PLATE.w - 24, geom.selective.y - 8);
      ctx.lineTo(LAYOUT.concentratePort.x, LAYOUT.concentratePort.y);
      ctx.stroke();
      ctx.restore();
    }

    function drawLeaders(state) {
      const alpha = Math.min(state.alphas.section, state.alphas.leaf);
      if (alpha < 0.08) return;
      const v = LAYOUT.vessel;
      const cx = v.x + v.w * 0.5;
      const cy = v.y + v.h * 0.5 - v.h * 0.34;
      ctx.save();
      ctx.globalAlpha = alpha * 0.8;
      ctx.strokeStyle = "rgba(157,78,221,0.8)";
      ctx.lineWidth = 1.25;
      ctx.beginPath();
      ctx.moveTo(cx - 30, cy);
      ctx.lineTo(PLATE.x + 48, PLATE.y + PLATE.h);
      ctx.moveTo(cx + 50, cy + 20);
      ctx.lineTo(PLATE.x + PLATE.w - 48, PLATE.y + PLATE.h);
      ctx.stroke();
      ctx.restore();
    }

    function drawNode(node, level, tint) {
      const w = 78;
      const h = 118;
      const x = node.x - w / 2;
      const y = node.y - h / 2;
      const shell = ctx.createLinearGradient(x, y, x + w, y);
      shell.addColorStop(0, "#2c3b4e");
      shell.addColorStop(0.45, "#5c718a");
      shell.addColorStop(1, "#243244");
      roundRect(x, y, w, h, 14);
      ctx.fillStyle = shell;
      ctx.fill();
      ctx.strokeStyle = "#141b26";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = "rgba(255,255,255,0.14)";
      roundRect(x + 8, y + 8, w - 16, 10, 5);
      ctx.fill();
      const liquidH = Math.max(0, (h - 22) * level);
      if (liquidH > 1) {
        roundRect(x + 8, y + h - 10 - liquidH, w - 16, liquidH, 8);
        ctx.fillStyle = tint;
        ctx.fill();
      }
    }

    function drawMonitors(state) {
      ctx.save();
      ctx.globalAlpha = state.alphas.monitors;
      LAYOUT.monitors.forEach((monitor) => {
        ctx.beginPath();
        for (let i = 0; i < 6; i += 1) {
          const a = (Math.PI / 3) * i - Math.PI / 6;
          const x = monitor.x + Math.cos(a) * 8;
          const y = monitor.y + Math.sin(a) * 8;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.strokeStyle = "#9d4edd";
        ctx.lineWidth = 1.6;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(monitor.x, monitor.y, 2.2, 0, Math.PI * 2);
        ctx.fillStyle = "#9d4edd";
        ctx.fill();
      });
      ctx.restore();
    }

    function drawSolute(mark) {
      ctx.save();
      ctx.translate(mark.x, mark.y);
      ctx.fillStyle = "#e4c98a";
      ctx.strokeStyle = "#2a2112";
      ctx.lineWidth = 1.15;
      if (mark.glyph === 0) {
        ctx.beginPath();
        ctx.arc(0, 0, 5.2, 0, Math.PI * 2);
        ctx.stroke();
      } else if (mark.glyph === 1) {
        ctx.beginPath();
        ctx.moveTo(0, -6);
        ctx.lineTo(5.4, 0);
        ctx.lineTo(0, 6);
        ctx.lineTo(-5.4, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else {
        roundRect(-4.4, -4.4, 8.8, 8.8, 2);
        ctx.fill();
        ctx.stroke();
      }
      ctx.restore();
    }

    function drawParticulate(mark) {
      ctx.save();
      ctx.translate(mark.x, mark.y);
      ctx.beginPath();
      for (let i = 0; i < 7; i += 1) {
        const a = (i / 7) * Math.PI * 2;
        const rad = 6 + ((i * 3 + mark.id * 5) % 4);
        const x = Math.cos(a) * rad;
        const y = Math.sin(a) * rad * 0.78;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fillStyle = "#7b8796";
      ctx.fill();
      ctx.strokeStyle = "#1b2430";
      ctx.stroke();
      ctx.restore();
    }

    function drawFlow(mark) {
      if (mark.opacity < 0.03) return;
      ctx.save();
      ctx.globalAlpha = mark.opacity;
      ctx.translate(mark.x, mark.y);
      ctx.fillStyle = mark.loop === "concentrate" ? "rgba(228,201,138,0.9)" : "#00e5ff";
      ctx.beginPath();
      ctx.moveTo(5, 0);
      ctx.lineTo(-4, 3.2);
      ctx.lineTo(-4, -3.2);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    function drawDemo(mark, alpha) {
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(mark.x, mark.y, 4.3, 0, Math.PI * 2);
      ctx.fillStyle = "#00e5ff";
      ctx.fill();
      ctx.lineWidth = 1;
      ctx.strokeStyle = "#06262c";
      ctx.stroke();
      ctx.restore();
    }

    function drawWorldNotes(state) {
      state.annotations.filter((note) => note.space === "world").forEach((note) => {
        if (note.opacity < 0.04) return;
        ctx.save();
        ctx.translate(note.x, note.y);
        ctx.scale(1 / state.camera.z, 1 / state.camera.z);
        ctx.globalAlpha = note.opacity;
        ctx.font = "600 15px Space Grotesk, Segoe UI, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        const width = ctx.measureText(note.text).width;
        roundRect(-width / 2 - 8, -13, width + 16, 26, 6);
        ctx.fillStyle = "rgba(11,16,25,0.84)";
        ctx.fill();
        ctx.lineWidth = 1;
        ctx.strokeStyle = roleColor(note.role);
        ctx.stroke();
        ctx.fillStyle = "#e7eef6";
        ctx.fillText(note.text, 0, 0);
        ctx.restore();
      });
    }

    function drawScreenNotes(state) {
      state.annotations.filter((note) => note.space === "screen" && note.opacity > 0.04).forEach((note) => {
        ctx.save();
        ctx.globalAlpha = note.opacity;
        ctx.font = "600 18px Space Grotesk, Segoe UI, sans-serif";
        const width = ctx.measureText(note.text).width;
        roundRect(note.x - 10, note.y - 16, width + 20, 30, 7);
        ctx.fillStyle = "rgba(11,16,25,0.88)";
        ctx.fill();
        ctx.strokeStyle = roleColor(note.role);
        ctx.stroke();
        ctx.fillStyle = "#e7eef6";
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillText(note.text, note.x, note.y);
        ctx.restore();
      });
    }

    function drawSankey(alpha) {
      if (alpha < 0.02) return;
      ctx.save();
      ctx.globalAlpha = alpha;
      const x = 48;
      const y = 792;
      roundRect(x, y, 470, 132, 12);
      ctx.fillStyle = "rgba(11,16,25,0.88)";
      ctx.fill();
      ctx.strokeStyle = "#344257";
      ctx.stroke();
      ctx.fillStyle = "#9aa8b8";
      ctx.font = "600 12px JetBrains Mono, ui-monospace, monospace";
      ctx.textAlign = "left";
      ctx.fillText("QUALITATIVE WATER BALANCE", x + 14, y + 20);
      ctx.fillStyle = "rgba(0,229,255,0.35)";
      roundRect(x + 16, y + 36, 120, 64, 8);
      ctx.fill();
      ctx.fillStyle = "rgba(0,229,255,0.85)";
      roundRect(x + 210, y + 36, 230, 20, 6);
      ctx.fill();
      ctx.fillStyle = "rgba(228,201,138,0.8)";
      roundRect(x + 210, y + 68, 230, 32, 6);
      ctx.fill();
      ctx.strokeStyle = "rgba(0,229,255,0.55)";
      ctx.beginPath();
      ctx.moveTo(x + 136, y + 52);
      ctx.lineTo(x + 210, y + 46);
      ctx.moveTo(x + 136, y + 84);
      ctx.lineTo(x + 210, y + 84);
      ctx.stroke();
      ctx.fillStyle = "#e7eef6";
      ctx.font = "600 13px Space Grotesk, Segoe UI, sans-serif";
      ctx.fillText("Feed", x + 28, y + 72);
      ctx.fillText("Product", x + 224, y + 51);
      ctx.fillText("Concentrate", x + 224, y + 88);
      ctx.fillStyle = "#9aa8b8";
      ctx.font = "12px Space Grotesk, Segoe UI, sans-serif";
      ctx.fillText("Widths are explanatory, not a recovery rating.", x + 14, y + 116);
      ctx.restore();
    }

    function drawChrome(state) {
      ctx.save();
      ctx.fillStyle = "rgba(11,16,25,0.92)";
      ctx.fillRect(0, 0, 1920, 78);
      ctx.fillRect(0, 956, 1920, 124);
      ctx.fillStyle = "#9aa8b8";
      ctx.font = "600 12px JetBrains Mono, ui-monospace, monospace";
      ctx.textAlign = "left";
      ctx.fillText("WATER & ENVIRONMENTAL SYSTEMS", 36, 28);
      ctx.fillStyle = "#e7eef6";
      ctx.font = "600 26px Space Grotesk, Segoe UI, sans-serif";
      ctx.fillText("Reverse-Osmosis Membrane Module", 36, 56);
      ctx.textAlign = "right";
      ctx.fillStyle = "#c9b6e6";
      ctx.font = "600 16px Space Grotesk, Segoe UI, sans-serif";
      ctx.fillText(`Act ${state.act.id}. ${state.act.title}`, 1884, 34);
      const seconds = state.frame / FPS;
      const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
      const ss = (seconds % 60).toFixed(1).padStart(4, "0");
      ctx.fillStyle = "#00e5ff";
      ctx.font = "600 16px JetBrains Mono, ui-monospace, monospace";
      ctx.fillText(`${mm}:${ss}   frame ${String(state.frame).padStart(4, "0")}`, 1884, 58);

      let x = 36;
      state.badges.filter((badge) => badge.on).forEach((badge) => {
        ctx.font = "600 13px Space Grotesk, Segoe UI, sans-serif";
        const w = ctx.measureText(badge.text).width + 16;
        if (x < 980) {
          roundRect(x, 84, w, 24, 99);
          ctx.fillStyle = "rgba(11,16,25,0.8)";
          ctx.fill();
          ctx.strokeStyle = badge.id === "stable" ? "#ffd166" : "#344257";
          ctx.stroke();
          ctx.fillStyle = "#e7eef6";
          ctx.textAlign = "left";
          ctx.fillText(badge.text, x + 8, 100);
          x += w + 8;
        }
      });

      ctx.fillStyle = "#e7eef6";
      ctx.font = "500 22px Space Grotesk, Segoe UI, sans-serif";
      ctx.textAlign = "left";
      wrapText(state.caption.text, 36, 986, 1840, 26);
      ctx.fillStyle = "#9aa8b8";
      ctx.font = "13px Space Grotesk, Segoe UI, sans-serif";
      ctx.fillText("Metal is hardware. The plate is a schematic. Cyan is transport. Gold is energy. Violet is sensing.", 36, 1040);
      ctx.fillText("Conceptual schematic. Not a certified design, and not a claim that product water is sterile.", 36, 1062);
      ctx.restore();
    }

    function wrapText(text, x, y, max, lineHeight) {
      const words = text.split(" ");
      let line = "";
      let yy = y;
      words.forEach((word) => {
        const trial = line ? `${line} ${word}` : word;
        if (ctx.measureText(trial).width > max) {
          ctx.fillText(line, x, yy);
          line = word;
          yy += lineHeight;
        } else {
          line = trial;
        }
      });
      ctx.fillText(line, x, yy);
    }

    function paint() {
      const state = frameState(frame);
      ctx.clearRect(0, 0, 1920, 1080);
      ctx.fillStyle = "#0b1019";
      ctx.fillRect(0, 0, 1920, 1080);
      drawGrid();
      ctx.save();
      ctx.translate(960, 540);
      ctx.scale(state.camera.z, state.camera.z);
      ctx.translate(-state.camera.x, -state.camera.y);

      metalPipe(INLET_PATH, 22, "rgba(0,229,255,0.28)");
      metalPipe(PRODUCT_PATH, 16, "rgba(0,229,255,0.45)");
      metalPipe(CONCENTRATE_PATH, 18, "rgba(228,201,138,0.28)");
      drawCanister(LAYOUT.pretreat[0], "#6d7886");
      drawCanister(LAYOUT.pretreat[1], "#3d5c68");
      drawPump(state);
      drawVessel(state);
      drawLeaders(state);
      drawPlate(state);
      drawGuides(state);
      drawNode(LAYOUT.nodes.product, state.levels.product, "rgba(0,229,255,0.5)");
      drawNode(LAYOUT.nodes.concentrate, state.levels.concentrate, "rgba(228,201,138,0.62)");
      state.flow.inlet.forEach(drawFlow);
      state.flow.product.forEach(drawFlow);
      state.flow.concentrate.forEach(drawFlow);
      state.particulates.forEach(drawParticulate);
      const demoAlpha = Math.max(state.alphas.leaf, state.alphas.guide, state.alphas.endNotes);
      state.demoWater.forEach((mark) => {
        if (state.alphas.leaf > 0.05 || mark.phase === "product") drawDemo(mark, demoAlpha);
      });
      state.solutes.forEach(drawSolute);
      drawMonitors(state);
      drawWorldNotes(state);
      ctx.restore();

      drawSankey(state.alphas.balance);
      drawScreenNotes(state);
      drawChrome(state);

      const seconds = state.frame / FPS;
      const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
      const ss = (seconds % 60).toFixed(1).padStart(4, "0");
      document.getElementById("timeReadout").textContent = `${mm}:${ss}`;
      document.getElementById("frameReadout").textContent = `frame ${state.frame} / ${LAST_FRAME}`;
      if (captionLive.textContent !== state.caption.text) captionLive.textContent = state.caption.text;
      if (Number(scrub.value) !== state.frame) scrub.value = String(state.frame);
      document.querySelectorAll("#acts button").forEach((btn, index) => {
        btn.setAttribute("aria-current", ACTS[index].id === state.act.id ? "true" : "false");
      });
    }

    window.__ro = {
      seek: (value) => seek(value, true),
      play: () => setPlaying(true),
      pause: () => setPlaying(false),
      frame: () => frame,
      state: () => frameState(frame),
    };

    paint();
    if (!reduced && params.get("play") !== "0" && !params.has("frame")) setPlaying(true);
    if (params.get("play") === "1") setPlaying(true);
    requestAnimationFrame(loop);
  
