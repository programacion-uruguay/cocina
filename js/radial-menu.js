/**
 * Motor SVG del Menú Circular Multinivel (hasta 4 anillos concéntricos).
 * Inspirado en un menú radial de sectores oscuros con divisores blancos,
 * centro blanco e iconos circulares de colores con etiqueta.
 */

class RadialMenu {
  constructor(container, levels, options = {}) {
    this.container = container;
    this.levels = levels;
    this.onSelect = options.onSelect || (() => {});
    this.onCenterClick = options.onCenterClick || (() => {});
    this.getItemCount = options.getItemCount || (() => null);
    this.selectedPath = {}; // { metodo: 'freidora', momento: 'almuerzo', ... }

    this.ringRadii = [
      { rIn: 72, rOut: 148, fullCircle: true, spanDeg: 360, badgeR: 13.5, fontSize: 10, baseFill: "#24272b", selectedFill: "#3b4046" },
      { rIn: 154, rOut: 228, fullCircle: false, spanDeg: 205, badgeR: 13, fontSize: 9.5, baseFill: "#2c3035", selectedFill: "#434950" },
      { rIn: 234, rOut: 308, fullCircle: false, spanDeg: 216, badgeR: 13, fontSize: 9.5, baseFill: "#343940", selectedFill: "#4b525a" },
      { rIn: 314, rOut: 386, fullCircle: false, spanDeg: 160, badgeR: 13, fontSize: 9.5, baseFill: "#3c424a", selectedFill: "#535b64" }
    ];

    this.svgNS = "http://www.w3.org/2000/svg";
    this.render();
  }

  setSelectedPath(path) {
    this.selectedPath = { ...path };
    this.render();
  }

  polarToCartesian(cx, cy, radius, angleDeg) {
    const rad = ((angleDeg - 90) * Math.PI) / 180;
    return {
      x: cx + radius * Math.cos(rad),
      y: cy + radius * Math.sin(rad)
    };
  }

  describeAnnularSector(cx, cy, rIn, rOut, startAngle, endAngle) {
    const outerStart = this.polarToCartesian(cx, cy, rOut, startAngle);
    const outerEnd = this.polarToCartesian(cx, cy, rOut, endAngle);
    const innerEnd = this.polarToCartesian(cx, cy, rIn, endAngle);
    const innerStart = this.polarToCartesian(cx, cy, rIn, startAngle);
    const largeArc = endAngle - startAngle <= 180 ? "0" : "1";

    return [
      `M ${outerStart.x.toFixed(2)} ${outerStart.y.toFixed(2)}`,
      `A ${rOut} ${rOut} 0 ${largeArc} 1 ${outerEnd.x.toFixed(2)} ${outerEnd.y.toFixed(2)}`,
      `L ${innerEnd.x.toFixed(2)} ${innerEnd.y.toFixed(2)}`,
      `A ${rIn} ${rIn} 0 ${largeArc} 0 ${innerStart.x.toFixed(2)} ${innerStart.y.toFixed(2)}`,
      "Z"
    ].join(" ");
  }

  createEl(tag, attrs = {}) {
    const el = document.createElementNS(this.svgNS, tag);
    for (const [k, v] of Object.entries(attrs)) {
      el.setAttribute(k, String(v));
    }
    return el;
  }

  render() {
    this.container.innerHTML = "";

    // Contamos cuántos anillos están abiertos para ajustar el viewBox dinámicamente
    let openRings = 1;
    for (let i = 1; i < this.levels.length; i++) {
      if (this.selectedPath[this.levels[i - 1].key]) {
        openRings = i + 1;
      } else {
        break;
      }
    }
    const maxR = this.ringRadii[openRings - 1].rOut + 16;

    const svg = this.createEl("svg", {
      viewBox: `${-maxR} ${-maxR} ${maxR * 2} ${maxR * 2}`,
      class: "radial-svg",
      role: "navigation",
      "aria-label": "Menú circular de categorías de recetas"
    });

    // Definición de sombra suave para anillos exteriores y centro
    const defs = this.createEl("defs");
    defs.innerHTML = `
      <filter id="hub-shadow" x="-30%" y="-30%" width="160%" height="160%">
        <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#000000" flood-opacity="0.22"/>
      </filter>
      <filter id="ring-shadow" x="-15%" y="-15%" width="130%" height="130%">
        <feDropShadow dx="0" dy="3" stdDeviation="5" flood-color="#000000" flood-opacity="0.18"/>
      </filter>
    `;
    svg.appendChild(defs);

    let parentMidAngle = -45; // Ángulo inicial por defecto
    let parentColor = null;
    const defaultHubIcon =
      '<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>';

    const totalCount = this.getItemCount(null, null);
    let hubCircle = null;
    let hubIcon = null;
    let hubTitle = null;
    let hubSub = null;

    const showHubPreview = (item, count) => {
      if (!hubCircle) return;
      hubCircle.setAttribute("stroke", item.color);
      hubCircle.setAttribute("stroke-width", "3.5");
      hubIcon.setAttribute("stroke", item.color);
      hubIcon.innerHTML = item.icon;
      hubTitle.textContent = item.shortLabel;
      if (hubSub) {
        hubSub.textContent = `${count ?? 0} ${count === 1 ? "receta" : "recetas"}`;
        hubSub.setAttribute("fill", item.color);
      }
    };

    const resetHubPreview = () => {
      if (!hubCircle) return;
      hubCircle.setAttribute("stroke", "#e5e7eb");
      hubCircle.setAttribute("stroke-width", "2");
      hubIcon.setAttribute("stroke", "#2563eb");
      hubIcon.innerHTML = defaultHubIcon;
      hubTitle.textContent = "Ver recetas";
      if (hubSub) {
        hubSub.textContent = `${totalCount ?? 0} ${totalCount === 1 ? "receta" : "recetas"}`;
        hubSub.setAttribute("fill", "#2563eb");
      }
    };

    for (let levelIdx = 0; levelIdx < this.levels.length; levelIdx++) {
      const level = this.levels[levelIdx];
      // Solo renderizamos el nivel N si todos los niveles anteriores tienen selección
      if (levelIdx > 0) {
        const prevKey = this.levels[levelIdx - 1].key;
        if (!this.selectedPath[prevKey]) break;
      }

      const cfg = this.ringRadii[levelIdx];
      const items = level.items;
      const count = items.length;
      const stepDeg = cfg.spanDeg / count;
      const startOffset = cfg.fullCircle ? -90 : parentMidAngle - cfg.spanDeg / 2;

      const ringGroup = this.createEl("g", {
        class: `radial-ring radial-ring-${levelIdx}`,
        filter: levelIdx > 0 ? "url(#ring-shadow)" : ""
      });

      const selectedId = this.selectedPath[level.key];
      let nextParentColor = null;

      items.forEach((item, idx) => {
        const startAngle = startOffset + idx * stepDeg;
        const endAngle = startAngle + stepDeg;
        const midAngle = (startAngle + endAngle) / 2;
        const isSelected = selectedId === item.id;

        if (isSelected) {
          parentMidAngle = midAngle;
          nextParentColor = item.color;
        }

        const recipeCount = this.getItemCount(level.key, item.id);
        const isEmpty = recipeCount === 0;

        const sectorGroup = this.createEl("g", {
          class: [
            "radial-sector",
            isSelected ? "is-selected" : "",
            isEmpty ? "is-empty" : ""
          ]
            .filter(Boolean)
            .join(" "),
          style: `--sector-color: ${item.color}`,
          tabindex: "0",
          role: "button",
          "aria-label": `${level.title}: ${item.label}${recipeCount !== null ? ` (${recipeCount} recetas)` : ""}`,
          "aria-pressed": isSelected ? "true" : "false"
        });

        const pathD = this.describeAnnularSector(0, 0, cfg.rIn, cfg.rOut, startAngle, endAngle);
        const wedge = this.createEl("path", {
          d: pathD,
          class: "sector-wedge",
          fill: isSelected ? cfg.selectedFill : cfg.baseFill,
          stroke: "#ffffff",
          "stroke-width": "2"
        });
        sectorGroup.appendChild(wedge);

        // Si está seleccionado, agregamos un arco de acento de color en el borde exterior
        if (isSelected) {
          const accentArc = this.createEl("path", {
            d: this.describeAnnularSector(0, 0, cfg.rOut - 4, cfg.rOut, startAngle + 0.5, endAngle - 0.5),
            fill: item.color,
            class: "sector-accent"
          });
          sectorGroup.appendChild(accentArc);
        }

        // Posición del contenido (badge arriba + texto abajo en coordenadas de pantalla)
        const rMid = (cfg.rIn + cfg.rOut) / 2;
        const sectorCenter = this.polarToCartesian(0, 0, rMid, midAngle);
        const badgePos = { x: sectorCenter.x, y: sectorCenter.y - 9 };

        // Círculo de color del icono
        const badgeCircle = this.createEl("circle", {
          cx: badgePos.x.toFixed(2),
          cy: badgePos.y.toFixed(2),
          r: cfg.badgeR,
          fill: item.color,
          class: "sector-badge"
        });
        sectorGroup.appendChild(badgeCircle);

        // Icono SVG blanco centrado dentro del badge
        const iconSize = cfg.badgeR * 1.15;
        const iconSvg = this.createEl("svg", {
          x: (badgePos.x - iconSize / 2).toFixed(2),
          y: (badgePos.y - iconSize / 2).toFixed(2),
          width: iconSize.toFixed(2),
          height: iconSize.toFixed(2),
          viewBox: "0 0 24 24",
          fill: "none",
          stroke: "#ffffff",
          "stroke-width": "2",
          "stroke-linecap": "round",
          "stroke-linejoin": "round",
          class: "sector-icon"
        });
        iconSvg.innerHTML = item.icon;
        sectorGroup.appendChild(iconSvg);

        // Etiqueta debajo del badge
        const labelPos = { x: sectorCenter.x, y: sectorCenter.y + 15 };
        const text = this.createEl("text", {
          x: labelPos.x.toFixed(2),
          y: labelPos.y.toFixed(2),
          "text-anchor": "middle",
          "dominant-baseline": "central",
          fill: "#f3f4f6",
          "font-size": cfg.fontSize,
          "font-weight": isSelected ? "700" : "500",
          class: "sector-label"
        });
        text.textContent = item.shortLabel;
        sectorGroup.appendChild(text);

        // Contador discreto si hay recetas
        if (recipeCount !== null && recipeCount > 0) {
          const countPos = this.polarToCartesian(0, 0, cfg.rOut - 11, midAngle + stepDeg * 0.28);
          const countText = this.createEl("text", {
            x: countPos.x.toFixed(2),
            y: countPos.y.toFixed(2),
            "text-anchor": "middle",
            "dominant-baseline": "central",
            fill: "rgba(255,255,255,0.65)",
            "font-size": "8.5",
            "font-weight": "600",
            class: "sector-count"
          });
          countText.textContent = recipeCount;
          sectorGroup.appendChild(countText);
        }

        // Muesca/flecha conectora triangular en el borde exterior del sector seleccionado
        if (isSelected && levelIdx < this.levels.length - 1) {
          const tip = this.polarToCartesian(0, 0, cfg.rOut + 7, midAngle);
          const base1 = this.polarToCartesian(0, 0, cfg.rOut - 2, midAngle - 4.5);
          const base2 = this.polarToCartesian(0, 0, cfg.rOut - 2, midAngle + 4.5);
          const notch = this.createEl("polygon", {
            points: `${tip.x.toFixed(2)},${tip.y.toFixed(2)} ${base1.x.toFixed(2)},${base1.y.toFixed(2)} ${base2.x.toFixed(2)},${base2.y.toFixed(2)}`,
            fill: item.color,
            stroke: "#ffffff",
            "stroke-width": "1.5",
            class: "sector-connector"
          });
          sectorGroup.appendChild(notch);
        }

        const handleActivate = (e) => {
          e.preventDefault();
          this.onSelect(level.key, item.id);
        };

        sectorGroup.addEventListener("click", handleActivate);
        sectorGroup.addEventListener("mouseenter", () => showHubPreview(item, recipeCount));
        sectorGroup.addEventListener("mouseleave", resetHubPreview);
        sectorGroup.addEventListener("focus", () => showHubPreview(item, recipeCount));
        sectorGroup.addEventListener("blur", resetHubPreview);
        sectorGroup.addEventListener("keydown", (e) => {
          if (e.key === "Enter" || e.key === " ") {
            handleActivate(e);
          }
        });

        ringGroup.appendChild(sectorGroup);
      });

      // Arco interior de acento con el color de la categoría padre seleccionada
      if (levelIdx > 0 && parentColor) {
        const parentTintArc = this.createEl("path", {
          d: this.describeAnnularSector(0, 0, cfg.rIn, cfg.rIn + 3.5, startOffset + 0.4, startOffset + cfg.spanDeg - 0.4),
          fill: parentColor,
          class: "ring-parent-tint"
        });
        ringGroup.appendChild(parentTintArc);
      }

      parentColor = nextParentColor;
      svg.appendChild(ringGroup);
    }

    // Centro blanco (Hub): abre el modal con todas las recetas de la selección actual
    const hubGroup = this.createEl("g", {
      class: "radial-hub",
      tabindex: "0",
      role: "button",
      "aria-label": `Ver ${totalCount ?? ""} recetas en modal`
    });

    hubCircle = this.createEl("circle", {
      cx: "0",
      cy: "0",
      r: "66",
      fill: "#ffffff",
      stroke: "#e5e7eb",
      "stroke-width": "2",
      filter: "url(#hub-shadow)"
    });
    hubGroup.appendChild(hubCircle);

    hubIcon = this.createEl("svg", {
      x: "-13",
      y: "-28",
      width: "26",
      height: "26",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "#2563eb",
      "stroke-width": "2.2",
      "stroke-linecap": "round",
      "stroke-linejoin": "round"
    });
    hubIcon.innerHTML = defaultHubIcon;
    hubGroup.appendChild(hubIcon);

    hubTitle = this.createEl("text", {
      x: "0",
      y: "11",
      "text-anchor": "middle",
      "dominant-baseline": "central",
      fill: "#111827",
      "font-size": "11.5",
      "font-weight": "800"
    });
    hubTitle.textContent = "Ver recetas";
    hubGroup.appendChild(hubTitle);

    if (totalCount !== null) {
      hubSub = this.createEl("text", {
        x: "0",
        y: "28",
        "text-anchor": "middle",
        "dominant-baseline": "central",
        fill: "#2563eb",
        "font-size": "10",
        "font-weight": "700"
      });
      hubSub.textContent = `${totalCount} ${totalCount === 1 ? "receta" : "recetas"}`;
      hubGroup.appendChild(hubSub);
    }

    hubGroup.addEventListener("click", () => this.onCenterClick());
    hubGroup.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        this.onCenterClick();
      }
    });

    svg.appendChild(hubGroup);
    this.container.appendChild(svg);
  }
}
