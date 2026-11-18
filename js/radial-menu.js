/**
 * Motor SVG del Menú Circular de Escala Constante (Enfoque Dinámico 360°):
 * - Corona 1 (Centro, r=70): Hub de acción "Ver recetas" y vista previa al pasar el cursor.
 * - Corona 2 (Anillo de ruta, r=78..122): 4 cuadrantes permanentes con el progreso de los pasos.
 * - Corona 3 (Anillo principal, r=128..250): Despliega siempre a 360° las opciones del nivel activo.
 * - viewBox constante (-265 -265 530 530) para que ningún nivel se vea más chico al avanzar.
 */

class RadialMenu {
  constructor(container, levels, options = {}) {
    this.container = container;
    this.levels = levels;
    this.onSelect = options.onSelect || (() => {});
    this.onCenterClick = options.onCenterClick || (() => {});
    this.onStepClick = options.onStepClick || (() => {});
    this.getItemCount = options.getItemCount || (() => null);
    this.selectedPath = {};
    this.lastActiveLevelKey = null;

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

  describeStepTextArc(cx, cy, radius, startAngle, endAngle, isBottomHalf) {
    const padAngle = 6;
    const a0 = startAngle + padAngle;
    const a1 = endAngle - padAngle;

    if (isBottomHalf) {
      // Invertir sentido en cuadrantes inferiores para que el texto se lea derecho de izquierda a derecha
      const pStart = this.polarToCartesian(cx, cy, radius, a1);
      const pEnd = this.polarToCartesian(cx, cy, radius, a0);
      return `M ${pStart.x.toFixed(2)} ${pStart.y.toFixed(2)} A ${radius} ${radius} 0 0 0 ${pEnd.x.toFixed(2)} ${pEnd.y.toFixed(2)}`;
    }

    const pStart = this.polarToCartesian(cx, cy, radius, a0);
    const pEnd = this.polarToCartesian(cx, cy, radius, a1);
    return `M ${pStart.x.toFixed(2)} ${pStart.y.toFixed(2)} A ${radius} ${radius} 0 0 1 ${pEnd.x.toFixed(2)} ${pEnd.y.toFixed(2)}`;
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

    const firstUnselectedIdx = this.levels.findIndex((l) => !this.selectedPath[l.key]);
    const allSelected = firstUnselectedIdx === -1;
    const activeLevelIdx = allSelected ? this.levels.length - 1 : firstUnselectedIdx;
    const activeLevel = this.levels[activeLevelIdx];
    const levelChanged = this.lastActiveLevelKey !== activeLevel.key;
    this.lastActiveLevelKey = activeLevel.key;

    const svg = this.createEl("svg", {
      viewBox: "-265 -265 530 530",
      class: "radial-svg",
      role: "navigation",
      "aria-label": `Menú circular de categorías de recetas: paso ${activeLevelIdx + 1}, ${activeLevel.title}`
    });

    const defs = this.createEl("defs");
    const defsParts = [
      `<filter id="hub-shadow" x="-30%" y="-30%" width="160%" height="160%">
        <feDropShadow dx="0" dy="6" stdDeviation="8" flood-color="#0f172a" flood-opacity="0.16"/>
      </filter>`,
      `<filter id="wheel-shadow" x="-15%" y="-15%" width="130%" height="130%">
        <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#0f172a" flood-opacity="0.12"/>
      </filter>`
    ];

    // Gradientes radiales para los sectores del anillo activo
    activeLevel.items.forEach((item) => {
      const gradId = `sector-grad-${activeLevel.key}-${item.id}`;
      const gradHoverId = `sector-grad-active-${activeLevel.key}-${item.id}`;
      defsParts.push(`
        <radialGradient id="${gradId}" cx="0" cy="0" r="250" gradientUnits="userSpaceOnUse">
          <stop offset="50%" stop-color="${item.color}" stop-opacity="0.06"/>
          <stop offset="100%" stop-color="${item.color}" stop-opacity="0.20"/>
        </radialGradient>
        <radialGradient id="${gradHoverId}" cx="0" cy="0" r="250" gradientUnits="userSpaceOnUse">
          <stop offset="50%" stop-color="${item.color}" stop-opacity="0.14"/>
          <stop offset="100%" stop-color="${item.color}" stop-opacity="0.34"/>
        </radialGradient>
      `);
    });

    // Trazados curvos de texto para los 4 cuadrantes de ruta (Corona 2)
    const stepRIn = 78;
    const stepROut = 122;
    const stepRMid = (stepRIn + stepROut) / 2;
    this.levels.forEach((lvl, idx) => {
      const startAngle = -90 + idx * 90;
      const endAngle = startAngle + 90;
      const isBottomHalf = idx >= 2;
      const arcD = this.describeStepTextArc(0, 0, stepRMid, startAngle, endAngle, isBottomHalf);
      defsParts.push(`<path id="step-arc-${idx}" d="${arcD}"/>`);
    });

    defs.innerHTML = defsParts.join("");
    svg.appendChild(defs);

    const totalCount = this.getItemCount(null, null);
    const defaultHubIcon =
      '<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>';
    const defaultStepText = allSelected
      ? "4 pasos completos"
      : `Paso ${activeLevelIdx + 1} · ${activeLevel.title}`;

    let hubCircle = null;
    let hubStepLabel = null;
    let hubIcon = null;
    let hubTitle = null;
    let hubSub = null;

    const showHubPreview = (item, count, stepLabel) => {
      if (!hubCircle) return;
      hubCircle.style.stroke = item.color;
      hubCircle.setAttribute("stroke-width", "3.5");
      hubIcon.style.stroke = item.color;
      hubIcon.innerHTML = item.icon;
      if (hubStepLabel) {
        hubStepLabel.textContent = stepLabel || activeLevel.title;
        hubStepLabel.style.fill = item.color;
      }
      hubTitle.textContent = item.shortLabel;
      if (hubSub) {
        hubSub.textContent = `${count ?? 0} ${count === 1 ? "receta" : "recetas"}`;
        hubSub.style.fill = item.color;
      }
    };

    const showStepBackPreview = (lvl, selectedItem) => {
      if (!hubCircle) return;
      hubCircle.style.stroke = selectedItem.color;
      hubCircle.setAttribute("stroke-width", "3");
      hubIcon.style.stroke = selectedItem.color;
      hubIcon.innerHTML = '<polyline points="15 18 9 12 15 6"/>';
      if (hubStepLabel) {
        hubStepLabel.textContent = `Elegido: ${selectedItem.shortLabel}`;
        hubStepLabel.style.fill = selectedItem.color;
      }
      hubTitle.textContent = `Cambiar ${lvl.title}`;
      if (hubSub) {
        hubSub.textContent = "Clic para volver";
        hubSub.style.fill = selectedItem.color;
      }
    };

    const resetHubPreview = () => {
      if (!hubCircle) return;
      hubCircle.style.stroke = "";
      hubCircle.setAttribute("stroke-width", "2");
      hubIcon.style.stroke = "";
      hubIcon.innerHTML = defaultHubIcon;
      if (hubStepLabel) {
        hubStepLabel.textContent = defaultStepText;
        hubStepLabel.style.fill = "";
      }
      hubTitle.textContent = "Ver recetas";
      if (hubSub) {
        hubSub.textContent = `${totalCount ?? 0} ${totalCount === 1 ? "receta" : "recetas"}`;
        hubSub.style.fill = "";
      }
    };

    // =====================================================
    // CORONA 3: Anillo Principal Activo (360° completos)
    // =====================================================
    const mainRIn = 128;
    const mainROut = 250;
    const mainRMid = (mainRIn + mainROut) / 2;
    const items = activeLevel.items;
    const stepDeg = 360 / items.length;
    const startOffset = -90;
    const selectedId = this.selectedPath[activeLevel.key];

    const mainRingGroup = this.createEl("g", {
      class: `radial-ring-main${levelChanged ? " is-entering" : ""}`,
      filter: "url(#wheel-shadow)"
    });

    // Aro base circular continuo detrás de los sectores para dar unidad limpia
    const backingRing = this.createEl("circle", {
      cx: "0",
      cy: "0",
      r: mainRMid,
      fill: "none",
      "stroke-width": mainROut - mainRIn,
      class: "main-ring-backdrop"
    });
    mainRingGroup.appendChild(backingRing);

    items.forEach((item, idx) => {
      const startAngle = startOffset + idx * stepDeg;
      const endAngle = startAngle + stepDeg;
      const midAngle = (startAngle + endAngle) / 2;
      const isSelected = selectedId === item.id;
      const recipeCount = this.getItemCount(activeLevel.key, item.id);
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
        "aria-label": `${activeLevel.title}: ${item.label}${recipeCount !== null ? ` (${recipeCount} recetas)` : ""}`,
        "aria-pressed": isSelected ? "true" : "false"
      });

      const sectorD = this.describeAnnularSector(0, 0, mainRIn, mainROut, startAngle, endAngle);

      // Base sólida adaptable al tema (Claro / Cálido / Oscuro)
      const wedge = this.createEl("path", {
        d: sectorD,
        class: "sector-wedge",
        "stroke-width": "2.4"
      });
      sectorGroup.appendChild(wedge);

      // Tinte gradual con el color propio de la categoría
      const gradName = isSelected
        ? `sector-grad-active-${activeLevel.key}-${item.id}`
        : `sector-grad-${activeLevel.key}-${item.id}`;
      const tint = this.createEl("path", {
        d: sectorD,
        fill: `url(#${gradName})`,
        class: "sector-tint"
      });
      sectorGroup.appendChild(tint);

      // Borde exterior de color vibrante
      const accentArc = this.createEl("path", {
        d: this.describeAnnularSector(
          0,
          0,
          mainROut - (isSelected ? 7 : 5),
          mainROut,
          startAngle + 0.6,
          endAngle - 0.6
        ),
        fill: item.color,
        class: "sector-accent"
      });
      sectorGroup.appendChild(accentArc);

      // Centro visual del sector en coordenadas de pantalla
      const sectorCenter = this.polarToCartesian(0, 0, mainRMid, midAngle);
      const badgePos = { x: sectorCenter.x, y: sectorCenter.y - 20 };

      // Halo suave detrás del icono
      const halo = this.createEl("circle", {
        cx: badgePos.x.toFixed(2),
        cy: badgePos.y.toFixed(2),
        r: "26.5",
        fill: item.color,
        class: "sector-halo"
      });
      sectorGroup.appendChild(halo);

      // Badge circular del icono
      const badgeR = 21;
      const badgeCircle = this.createEl("circle", {
        cx: badgePos.x.toFixed(2),
        cy: badgePos.y.toFixed(2),
        r: badgeR,
        fill: item.color,
        class: "sector-badge"
      });
      sectorGroup.appendChild(badgeCircle);

      // Icono SVG centrado dentro del badge
      const iconSize = 22;
      const iconSvg = this.createEl("svg", {
        x: (badgePos.x - iconSize / 2).toFixed(2),
        y: (badgePos.y - iconSize / 2).toFixed(2),
        width: iconSize,
        height: iconSize,
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "#ffffff",
        "stroke-width": "2.1",
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        class: "sector-icon"
      });
      iconSvg.innerHTML = item.icon;
      sectorGroup.appendChild(iconSvg);

      // Nombre de categoría claro y grande
      const labelPos = { x: sectorCenter.x, y: sectorCenter.y + 13 };
      const text = this.createEl("text", {
        x: labelPos.x.toFixed(2),
        y: labelPos.y.toFixed(2),
        "text-anchor": "middle",
        "dominant-baseline": "central",
        "font-size": "14.5",
        "font-weight": "700",
        class: "sector-label"
      });
      text.textContent = item.shortLabel;
      sectorGroup.appendChild(text);

      // Píldora inferior de conteo de recetas
      if (recipeCount !== null) {
        const pillPos = { x: sectorCenter.x, y: sectorCenter.y + 34 };
        const pillGroup = this.createEl("g", { class: "sector-count-pill" });
        const pillW = 64;
        const pillH = 18;
        const pillRect = this.createEl("rect", {
          x: (pillPos.x - pillW / 2).toFixed(2),
          y: (pillPos.y - pillH / 2).toFixed(2),
          width: pillW,
          height: pillH,
          rx: "9",
          class: "sector-pill-bg"
        });
        pillGroup.appendChild(pillRect);

        const countText = this.createEl("text", {
          x: pillPos.x.toFixed(2),
          y: pillPos.y.toFixed(2),
          "text-anchor": "middle",
          "dominant-baseline": "central",
          "font-size": "10.5",
          "font-weight": "700",
          class: "sector-pill-text"
        });
        countText.textContent = recipeCount > 0 ? `${recipeCount} rec.` : "Sin rec.";
        pillGroup.appendChild(countText);
        sectorGroup.appendChild(pillGroup);
      }

      const handleActivate = (e) => {
        e.preventDefault();
        this.onSelect(activeLevel.key, item.id);
      };

      sectorGroup.addEventListener("click", handleActivate);
      sectorGroup.addEventListener("mouseenter", () => showHubPreview(item, recipeCount, activeLevel.title));
      sectorGroup.addEventListener("mouseleave", resetHubPreview);
      sectorGroup.addEventListener("focus", () => showHubPreview(item, recipeCount, activeLevel.title));
      sectorGroup.addEventListener("blur", resetHubPreview);
      sectorGroup.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          handleActivate(e);
        }
      });

      mainRingGroup.appendChild(sectorGroup);
    });

    svg.appendChild(mainRingGroup);

    // =====================================================
    // CORONA 2: Anillo Interior de Niveles / Ruta (4 cuadrantes de 90°)
    // =====================================================
    const stepRingGroup = this.createEl("g", { class: "radial-step-ring" });

    this.levels.forEach((lvl, idx) => {
      const startAngle = -90 + idx * 90;
      const endAngle = startAngle + 90;
      const selectedStepId = this.selectedPath[lvl.key];
      const selectedItem = selectedStepId ? lvl.items.find((i) => i.id === selectedStepId) : null;
      const isDone = Boolean(selectedItem);
      const isActive = (!allSelected && idx === activeLevelIdx) || (allSelected && idx === this.levels.length - 1);

      const stepGroup = this.createEl("g", {
        class: [
          "inner-step-sector",
          isDone ? "is-done" : "",
          isActive ? "is-active-step" : "",
          !isDone && !isActive ? "is-pending" : ""
        ]
          .filter(Boolean)
          .join(" "),
        style: selectedItem ? `--step-color: ${selectedItem.color}` : "",
        tabindex: isDone ? "0" : "-1",
        role: isDone ? "button" : "presentation",
        "aria-label": isDone
          ? `Paso ${idx + 1}: ${lvl.title} (${selectedItem.label}). Clic para cambiar`
          : `Paso ${idx + 1}: ${lvl.title}`
      });

      const wedge = this.createEl("path", {
        d: this.describeAnnularSector(0, 0, stepRIn, stepROut, startAngle, endAngle),
        class: "inner-step-wedge",
        "stroke-width": "2"
      });
      stepGroup.appendChild(wedge);

      // Arco exterior indicador en el cuadrante completado o activo
      if (isDone && selectedItem) {
        const stepAccent = this.createEl("path", {
          d: this.describeAnnularSector(0, 0, stepROut - 4, stepROut, startAngle + 1.2, endAngle - 1.2),
          fill: selectedItem.color,
          class: "inner-step-accent"
        });
        stepGroup.appendChild(stepAccent);
      } else if (isActive) {
        const activeArc = this.createEl("path", {
          d: this.describeAnnularSector(0, 0, stepROut - 4, stepROut, startAngle + 1.2, endAngle - 1.2),
          class: "inner-step-accent-primary"
        });
        stepGroup.appendChild(activeArc);
      }

      const stepLabelEl = this.createEl("text", {
        class: "inner-step-label",
        "font-size": "11",
        "font-weight": isActive || isDone ? "700" : "600",
        dy: "0.35em"
      });
      const textPathEl = this.createEl("textPath", {
        href: `#step-arc-${idx}`,
        startOffset: "50%",
        "text-anchor": "middle"
      });
      textPathEl.textContent = isDone
        ? `${idx + 1} · ${selectedItem.shortLabel}`
        : `${idx + 1} · ${lvl.title}`;
      stepLabelEl.appendChild(textPathEl);
      stepGroup.appendChild(stepLabelEl);

      if (isDone) {
        const handleStepJump = (e) => {
          e.preventDefault();
          this.onStepClick(idx);
        };
        stepGroup.addEventListener("click", handleStepJump);
        stepGroup.addEventListener("mouseenter", () => showStepBackPreview(lvl, selectedItem));
        stepGroup.addEventListener("mouseleave", resetHubPreview);
        stepGroup.addEventListener("focus", () => showStepBackPreview(lvl, selectedItem));
        stepGroup.addEventListener("blur", resetHubPreview);
        stepGroup.addEventListener("keydown", (e) => {
          if (e.key === "Enter" || e.key === " ") {
            handleStepJump(e);
          }
        });
      }

      stepRingGroup.appendChild(stepGroup);
    });

    svg.appendChild(stepRingGroup);

    // =====================================================
    // CORONA 1: Centro (Hub) "Ver recetas"
    // =====================================================
    const hubGroup = this.createEl("g", {
      class: "radial-hub",
      tabindex: "0",
      role: "button",
      "aria-label": `Ver ${totalCount ?? ""} recetas en modal`
    });

    hubCircle = this.createEl("circle", {
      cx: "0",
      cy: "0",
      r: "70",
      class: "hub-circle",
      "stroke-width": "2",
      filter: "url(#hub-shadow)"
    });
    hubGroup.appendChild(hubCircle);

    hubStepLabel = this.createEl("text", {
      x: "0",
      y: "-36",
      "text-anchor": "middle",
      "dominant-baseline": "central",
      "font-size": "9.5",
      "font-weight": "700",
      class: "hub-step-label"
    });
    hubStepLabel.textContent = defaultStepText;
    hubGroup.appendChild(hubStepLabel);

    hubIcon = this.createEl("svg", {
      x: "-13",
      y: "-23",
      width: "26",
      height: "26",
      viewBox: "0 0 24 24",
      fill: "none",
      "stroke-width": "2.2",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
      class: "hub-icon"
    });
    hubIcon.innerHTML = defaultHubIcon;
    hubGroup.appendChild(hubIcon);

    hubTitle = this.createEl("text", {
      x: "0",
      y: "17",
      "text-anchor": "middle",
      "dominant-baseline": "central",
      "font-size": "14.5",
      "font-weight": "800",
      class: "hub-title"
    });
    hubTitle.textContent = "Ver recetas";
    hubGroup.appendChild(hubTitle);

    if (totalCount !== null) {
      hubSub = this.createEl("text", {
        x: "0",
        y: "37",
        "text-anchor": "middle",
        "dominant-baseline": "central",
        "font-size": "12",
        "font-weight": "700",
        class: "hub-sub"
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
