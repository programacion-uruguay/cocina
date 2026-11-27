/* =========================================================
   ¿Qué Cocino Hoy? — Planes Gratis vs PRO (Modo Lanzamiento)
   Configuración centralizada: editá PLANS_CONFIG cuando
   tengas tu link de Mercado Pago o número de WhatsApp.
   ========================================================= */
(function () {
  "use strict";

  const STORAGE_KEY = "qch_plan_state_v1";

  const PLANS_CONFIG = {
    launchMode: true,
    trialDays: 7,
    // Pegá tu link de suscripción de Mercado Pago cuando lo tengas (ej: "https://www.mercadopago.com.uy/subscriptions/checkout?preapproval_plan_id=...")
    mercadoPagoUrl: "",
    // Pegá tu número de WhatsApp en formato internacional sin + ni espacios (ej: "59899123456")
    whatsappNumber: "",
    whatsappMessage: "Hola! Quiero consultar por el Plan PRO de ¿Qué Cocino Hoy?"
  };

  function readState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { tier: "free", trialStartedAt: null, trialExpiresAt: null, waitlistContact: "" };
      const parsed = JSON.parse(raw);
      return {
        tier: parsed.tier || "free",
        trialStartedAt: parsed.trialStartedAt || null,
        trialExpiresAt: parsed.trialExpiresAt || null,
        waitlistContact: parsed.waitlistContact || ""
      };
    } catch {
      return { tier: "free", trialStartedAt: null, trialExpiresAt: null, waitlistContact: "" };
    }
  }

  function writeState(next) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore quota/private mode errors
    }
  }

  function getTrialDaysLeft(state) {
    const s = state || readState();
    if (!s.trialExpiresAt) return 0;
    const diffMs = new Date(s.trialExpiresAt).getTime() - Date.now();
    if (diffMs <= 0) return 0;
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  }

  function isProActive() {
    const s = readState();
    if (s.tier === "pro") return true;
    if (s.tier === "pro_trial" && getTrialDaysLeft(s) > 0) return true;
    return false;
  }

  function activateTrial() {
    const now = Date.now();
    const expires = now + PLANS_CONFIG.trialDays * 24 * 60 * 60 * 1000;
    const current = readState();
    const next = {
      ...current,
      tier: "pro_trial",
      trialStartedAt: new Date(now).toISOString(),
      trialExpiresAt: new Date(expires).toISOString()
    };
    writeState(next);
    if (window.QCHCloud?.syncUserData) {
      window.QCHCloud.syncUserData({
        plan: {
          tier: "pro_trial",
          trialStartedAt: next.trialStartedAt,
          trialExpiresAt: next.trialExpiresAt
        }
      });
    }
    syncUI();
    renderModalContent();
    return next;
  }

  function saveWaitlistContact(contact) {
    const trimmed = String(contact || "").trim();
    if (!trimmed) return false;
    const current = readState();
    writeState({ ...current, waitlistContact: trimmed, waitlistJoinedAt: new Date().toISOString() });
    if (window.QCHCloud?.submitWaitlist) {
      window.QCHCloud.submitWaitlist(trimmed);
    }
    renderModalContent();
    return true;
  }

  function getWhatsappHref() {
    if (!PLANS_CONFIG.whatsappNumber) return "";
    const num = PLANS_CONFIG.whatsappNumber.replace(/\D/g, "");
    if (!num) return "";
    return `https://wa.me/${num}?text=${encodeURIComponent(PLANS_CONFIG.whatsappMessage)}`;
  }

  function ensureModalElement() {
    let overlay = document.getElementById("plans-modal");
    if (overlay) return overlay;

    overlay = document.createElement("div");
    overlay.id = "plans-modal";
    overlay.className = "modal-overlay plans-modal-overlay";
    overlay.hidden = true;
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-labelledby", "plans-modal-title");
    overlay.innerHTML = `
      <div class="modal-card plans-modal-card">
        <button type="button" id="plans-modal-close" class="modal-close" aria-label="Cerrar planes">✕</button>
        <div id="plans-modal-body" class="plans-modal-body"></div>
      </div>
    `;
    document.body.appendChild(overlay);

    overlay.addEventListener("click", (e) => {
      if (e.target === overlay || e.target.closest("#plans-modal-close")) {
        closeModal();
      }
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !overlay.hidden) {
        closeModal();
      }
    });

    return overlay;
  }

  function renderModalContent() {
    const body = document.getElementById("plans-modal-body");
    if (!body) return;

    const state = readState();
    const proActive = isProActive();
    const daysLeft = getTrialDaysLeft(state);
    const waHref = getWhatsappHref();
    const mpHref = PLANS_CONFIG.mercadoPagoUrl;

    const proStatusBanner = proActive
      ? `<div class="plans-status-banner is-active">
           <strong>⭐ Prueba PRO activa</strong> · Te quedan ${daysLeft} ${daysLeft === 1 ? "día" : "días"} de acceso anticipado sin costo.
         </div>`
      : `<div class="plans-status-banner">
           <strong>🚀 Lanzamiento:</strong> Todo abierto para probar. Activá tus ${PLANS_CONFIG.trialDays} días PRO gratis o anotate para precio fundador.
         </div>`;

    let secondaryActionsHtml = "";
    if (mpHref || waHref) {
      secondaryActionsHtml = `<div class="plan-secondary-links">
        ${mpHref ? `<a href="${mpHref}" target="_blank" rel="noopener noreferrer" class="plan-cta-secondary">💳 Mercado Pago</a>` : ""}
        ${waHref ? `<a href="${waHref}" target="_blank" rel="noopener noreferrer" class="plan-cta-secondary">💬 WhatsApp</a>` : ""}
      </div>`;
    } else {
      secondaryActionsHtml = state.waitlistContact
        ? `<div class="plan-waitlist-done">✅ Anotado con <strong>${escapeHtml(state.waitlistContact)}</strong> (beneficio fundador).</div>`
        : `<form id="plans-waitlist-form" class="plan-waitlist-form">
             <div class="plan-waitlist-row">
               <input type="text" id="plans-waitlist-input" class="plan-waitlist-input" placeholder="Tu WhatsApp o email para precio fundador..." required />
               <button type="submit" class="plan-cta-secondary">Anotarme</button>
             </div>
           </form>`;
    }

    body.innerHTML = `
      <div class="plans-header">
        <span class="plans-eyebrow">¿Qué Cocino Hoy? · Uruguay</span>
        <h2 id="plans-modal-title">Elegí cómo querés cocinar</h2>
        <p class="plans-subtitle">Las 942 recetas siempre son gratis. El Plan PRO suma salud, ahorro en el súper y planificación.</p>
      </div>

      ${proStatusBanner}

      <div class="plans-grid">
        <article class="plan-card plan-card-free">
          <div class="plan-card-head">
            <div class="plan-head-top">
              <span class="plan-tag">🆓 Plan Gratis</span>
              <span class="plan-price-inline"><strong>Gratis</strong> · para siempre</span>
            </div>
            <h3>Para todos los días</h3>
          </div>
          <ul class="plan-list">
            <li><span class="plan-check">✓</span><span>Acceso a las <strong>942 recetas</strong> con fotos y videos</span></li>
            <li><span class="plan-check">✓</span><span><strong>Menú Circular</strong>, Carrusel e Ideas por horario</span></li>
            <li><span class="plan-check">✓</span><span>Buscador por ingrediente, estación y calorías</span></li>
            <li><span class="plan-check">✓</span><span>Dietas básicas (<em>Sin TACC, Vegetariana, Fit</em>)</span></li>
            <li><span class="plan-check">✓</span><span>Favoritos guardados y temporizador de cocina</span></li>
          </ul>
          <div class="plan-card-foot">
            <button type="button" class="plan-cta-ghost" data-close-plans>Seguir usando Gratis</button>
          </div>
        </article>

        <article class="plan-card plan-card-pro">
          <div class="plan-card-head">
            <div class="plan-head-top">
              <span class="plan-tag plan-tag-pro">⭐ Plan PRO</span>
              <span class="plan-price-inline"><strong>Próximamente</strong> · Gratis en lanzamiento</span>
            </div>
            <h3>Salud, ahorro y semana resuelta</h3>
          </div>
          <ul class="plan-list">
            <li><span class="plan-check is-pro">★</span><span><strong>18 dietas completas</strong> (Diabética, Colesterol, Hígado graso, Gastritis, FODMAP y más)</span></li>
            <li><span class="plan-check is-pro">★</span><span><strong>Sustitución automática</strong> de ingredientes según tu dieta</span></li>
            <li><span class="plan-check is-pro">★</span><span><strong>Comparador de súperes</strong> (Tienda Inglesa, Disco, Devoto, Tata)</span></li>
            <li><span class="plan-check is-pro">★</span><span><strong>COMER BIEN completo:</strong> planificador semanal y control diario</span></li>
            <li><span class="plan-check is-pro">★</span><span>Favoritos ilimitados y experiencia <strong>100% sin publicidad</strong></span></li>
          </ul>
          <div class="plan-card-foot">
            ${
              proActive
                ? `<button type="button" class="plan-cta-primary is-active" disabled>✓ Prueba PRO activa (${daysLeft} ${daysLeft === 1 ? "día" : "días"} restantes)</button>`
                : `<button type="button" id="plans-activate-trial-btn" class="plan-cta-primary">✨ Activar ${PLANS_CONFIG.trialDays} días PRO gratis</button>`
            }
            ${secondaryActionsHtml}
            <p class="plan-footnote">Sin tarjeta · Próximamente suscripción<br />en pesos uruguayos por Mercado Pago.</p>
          </div>
        </article>
      </div>
    `;

    const activateBtn = body.querySelector("#plans-activate-trial-btn");
    if (activateBtn) {
      activateBtn.addEventListener("click", () => {
        activateTrial();
      });
    }

    body.querySelectorAll("[data-close-plans]").forEach((btn) => {
      btn.addEventListener("click", closeModal);
    });

    const waitlistForm = body.querySelector("#plans-waitlist-form");
    if (waitlistForm) {
      waitlistForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const input = body.querySelector("#plans-waitlist-input");
        if (input && input.value.trim()) {
          saveWaitlistContact(input.value.trim());
        }
      });
    }
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function openModal() {
    const overlay = ensureModalElement();
    renderModalContent();
    overlay.hidden = false;
    document.body.classList.add("modal-open");
  }

  function closeModal() {
    const overlay = document.getElementById("plans-modal");
    if (!overlay) return;
    overlay.hidden = true;
    const anyOtherOpen = Array.from(document.querySelectorAll(".modal-overlay")).some(
      (el) => el !== overlay && !el.hidden
    );
    if (!anyOtherOpen) {
      document.body.classList.remove("modal-open");
    }
  }

  function syncUI() {
    const navBtn = document.getElementById("plans-open-btn");
    if (!navBtn) return;
    const active = isProActive();
    const days = getTrialDaysLeft();
    navBtn.classList.toggle("is-pro-active", active);
    const label = navBtn.querySelector(".btn-pro-label");
    if (label) {
      label.textContent = active ? `PRO · ${days}d` : "PRO";
    }
    navBtn.title = active
      ? `Prueba PRO activa (${days} días restantes) — Ver beneficios`
      : "Ver planes Gratis y PRO (Acceso anticipado)";
  }

  function init() {
    syncUI();
    document.addEventListener("click", (e) => {
      const trigger = e.target.closest("#plans-open-btn, [data-open-plans]");
      if (trigger) {
        e.preventDefault();
        openModal();
      }
    });
  }

  window.QCHPlans = {
    config: PLANS_CONFIG,
    isProActive,
    getTrialDaysLeft,
    activateTrial,
    openModal,
    closeModal,
    syncUI
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
