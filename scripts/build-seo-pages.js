const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const recipesPath = path.join(root, 'data', 'recipes.json');
const recetasDir = path.join(root, 'recetas');

const siteArg = process.argv.find((a) => a.startsWith('--site='));
const SITE_ORIGIN = (siteArg ? siteArg.slice('--site='.length) : 'https://que-cocino-hoy-4lz.pages.dev').replace(/\/+$/, '');
const ASSET_VER = '20261127b';

const recipes = JSON.parse(fs.readFileSync(recipesPath, 'utf8'));

const CAT_LABELS = {
  pollo: 'Pollo',
  carnes: 'Carnes',
  pescados: 'Pescados y Mariscos',
  pastas: 'Pastas y Masas',
  dulces: 'Dulces y Postres',
  verduras: 'Verduras y Panes'
};

function escapeHtml(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function safeJsonLd(obj) {
  return JSON.stringify(obj).replace(/</g, '\\u003c');
}

function toIsoDuration(mins) {
  const m = Math.max(1, Math.round(Number(mins) || 0));
  return `PT${m}M`;
}

function getYtId(url) {
  if (!url || typeof url !== 'string') return '';
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : '';
}

function getAbsoluteImage(r) {
  if (r.imageUrl) {
    if (/^https?:\/\//i.test(r.imageUrl)) return r.imageUrl;
    return `${SITE_ORIGIN}/${r.imageUrl.replace(/^\/+/, '')}`;
  }
  const ytId = getYtId(r.videoUrl);
  if (ytId) return `https://i.ytimg.com/vi/${ytId}/hqdefault.jpg`;
  return `${SITE_ORIGIN}/img/recetas/pastas-fettuccinis-carbonara.webp`;
}

function formatIngredientLine(ing) {
  if (!ing) return '';
  if (typeof ing === 'string') return ing;
  const amt = ing.amount !== undefined && ing.amount !== null ? String(ing.amount) : '';
  const unit = ing.unit ? ` ${ing.unit}` : '';
  return `${amt}${unit} ${ing.item || ''}`.trim();
}

function buildRecipeSchema(r, canonicalUrl, imageUrl) {
  const prep = Math.max(0, Number(r.prepMinutes) || 0);
  const cook = Math.max(0, Number(r.cookMinutes) || 0);
  const total = Math.max(1, prep + cook || 20);
  const servings = Math.max(1, Number(r.servings) || 2);
  const ingredients = (r.ingredients || []).map(formatIngredientLine).filter(Boolean);
  const instructions = (r.steps || [])
    .map((st, idx) => {
      const text = typeof st === 'string' ? st : (st && st.text) || '';
      if (!text.trim()) return null;
      return {
        '@type': 'HowToStep',
        position: idx + 1,
        text: text.trim()
      };
    })
    .filter(Boolean);

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Recipe',
    name: r.title,
    description: r.description || `${r.title} lista en ${total} minutos para ${servings} porciones.`,
    image: [imageUrl],
    url: canonicalUrl,
    inLanguage: 'es-UY',
    author: {
      '@type': 'Organization',
      name: '¿Qué Cocino Hoy?'
    },
    datePublished: '2026-11-26',
    prepTime: toIsoDuration(prep || Math.max(5, Math.round(total * 0.4))),
    cookTime: toIsoDuration(cook || Math.max(5, total - Math.round(total * 0.4))),
    totalTime: toIsoDuration(total),
    recipeYield: `${servings} ${servings === 1 ? 'porción' : 'porciones'}`,
    recipeCategory: CAT_LABELS[r.categoria] || r.categoria || 'Receta',
    recipeCuisine: 'Uruguaya',
    keywords: [r.categoria, r.metodo, r.momento, r.estilo, 'receta casera', 'Uruguay'].filter(Boolean).join(', '),
    recipeIngredient: ingredients,
    recipeInstructions: instructions
  };

  if (typeof r.calories === 'number' && r.calories > 0) {
    schema.nutrition = {
      '@type': 'NutritionInformation',
      calories: `${Math.round(r.calories)} calories`
    };
  }

  const ytId = getYtId(r.videoUrl);
  if (ytId) {
    schema.video = {
      '@type': 'VideoObject',
      name: r.videoTitle || r.title,
      description: schema.description,
      thumbnailUrl: [`https://i.ytimg.com/vi/${ytId}/hqdefault.jpg`],
      uploadDate: '2026-11-26T12:00:00-03:00',
      embedUrl: `https://www.youtube.com/embed/${ytId}`,
      contentUrl: r.videoUrl
    };
  }

  return schema;
}

function buildRecipeHtml(r) {
  const canonicalUrl = `${SITE_ORIGIN}/recetas/${encodeURIComponent(r.id)}/`;
  const imageUrl = getAbsoluteImage(r);
  const prep = Math.max(0, Number(r.prepMinutes) || 0);
  const cook = Math.max(0, Number(r.cookMinutes) || 0);
  const total = Math.max(1, prep + cook || 20);
  const servings = Math.max(1, Number(r.servings) || 2);
  const desc = (r.description || `${r.title}: receta paso a paso lista en ${total} min para ${servings} porciones.`).trim();
  const metaDesc = `${desc} Listo en ${total} min · ${servings} ${servings === 1 ? 'porción' : 'porciones'} · Ingredientes, pasos y precios en supermercados de Uruguay.`.slice(0, 160);
  const schema = buildRecipeSchema(r, canonicalUrl, imageUrl);

  const ingLis = (r.ingredients || [])
    .map(formatIngredientLine)
    .filter(Boolean)
    .map((line) => `<li>${escapeHtml(line)}</li>`)
    .join('');

  const stepLis = (r.steps || [])
    .map((st) => (typeof st === 'string' ? st : (st && st.text) || ''))
    .filter(Boolean)
    .map((text) => `<li>${escapeHtml(text)}</li>`)
    .join('');

  return `<!DOCTYPE html>
<html lang="es" data-theme="warm">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
  <meta name="theme-color" content="#fbf7f1" />
  <title>${escapeHtml(r.title)} — ¿Qué Cocino Hoy?</title>
  <meta name="description" content="${escapeHtml(metaDesc)}" />
  <link rel="canonical" href="${escapeHtml(canonicalUrl)}" />
  <meta property="og:type" content="article" />
  <meta property="og:site_name" content="¿Qué Cocino Hoy?" />
  <meta property="og:title" content="${escapeHtml(r.title)} — ¿Qué Cocino Hoy?" />
  <meta property="og:description" content="${escapeHtml(metaDesc)}" />
  <meta property="og:url" content="${escapeHtml(canonicalUrl)}" />
  <meta property="og:image" content="${escapeHtml(imageUrl)}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(r.title)} — ¿Qué Cocino Hoy?" />
  <meta name="twitter:description" content="${escapeHtml(metaDesc)}" />
  <meta name="twitter:image" content="${escapeHtml(imageUrl)}" />
  <script type="application/ld+json">${safeJsonLd(schema)}</script>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,700&family=Inter:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@600;700;800&display=swap" rel="stylesheet" />
  <link rel="icon" type="image/png" href="../../img/favicon.png" />
  <link rel="apple-touch-icon" href="../../img/logo-avatar.webp" />
  <link rel="stylesheet" href="../../css/styles.css?v=${ASSET_VER}" />
  <link rel="stylesheet" href="../../css/comer-bien.css?v=${ASSET_VER}" />
  <script>window.SITE_BASE="../../";window.PRESET_RECIPE_ID=${JSON.stringify(r.id)};</script>
</head>
<body>
  <header class="topbar">
    <div class="topbar-inner studio-topbar-inner">
      <div class="studio-nav-left">
        <a href="../../index.html" class="btn-back-menu">← Menú Circular</a>
        <img src="../../img/logo-avatar.webp" alt="¿Qué Cocino Hoy?" class="brand-logo-img brand-logo-sm" width="36" height="36" />
        <div class="brand-compact">
          <strong>¿Qué Cocino Hoy?</strong>
          <span id="studio-breadcrumb-meta" class="brand-sub">${escapeHtml(CAT_LABELS[r.categoria] || r.categoria || 'Receta')} · ${total} min</span>
        </div>
      </div>
      <div class="topbar-controls studio-topbar-controls">
        <div class="theme-switcher" role="group" aria-label="Estilo visual">
          <button type="button" class="theme-btn" data-theme-btn="light" aria-pressed="false" title="Tema claro">☀️ Claro</button>
          <button type="button" class="theme-btn" data-theme-btn="warm" aria-pressed="false" title="Tema cálido">🔥 Cálido</button>
          <button type="button" class="theme-btn" data-theme-btn="dark" aria-pressed="false" title="Tema oscuro">🌙 Oscuro</button>
        </div>
        <button type="button" id="theme-cycle-btn" class="theme-cycle-btn" aria-label="Cambiar tema visual" title="Cambiar tema">🔥</button>
        <button type="button" id="page-fav-btn" class="btn-fav-header" aria-pressed="false">♡ Guardar</button>
      </div>
    </div>
  </header>

  <main id="recipe-studio" class="recipe-studio" aria-live="polite">
    <article class="studio-card" style="max-width:820px;margin:1rem auto;padding:1.5rem;">
      <h1>${escapeHtml(r.title)}</h1>
      <p>${escapeHtml(desc)}</p>
      <p><strong>Tiempo total:</strong> ${total} min · <strong>Porciones:</strong> ${servings}</p>
      <h2>Ingredientes</h2>
      <ul>${ingLis}</ul>
      <h2>Preparación</h2>
      <ol>${stepLis}</ol>
    </article>
  </main>

  <aside id="floating-timer" class="floating-timer" hidden aria-live="polite">
    <div class="timer-info">
      <span class="timer-label" id="timer-label">Temporizador</span>
      <span class="timer-display" id="timer-display">00:00</span>
    </div>
    <div class="timer-actions">
      <button type="button" id="timer-play-pause" class="timer-btn" aria-label="Pausar o reanudar">⏸</button>
      <button type="button" id="timer-reset" class="timer-btn" aria-label="Reiniciar">↺</button>
      <button type="button" id="timer-close" class="timer-btn" aria-label="Cerrar temporizador">✕</button>
    </div>
  </aside>

  <script src="../../js/menu-data.js?v=${ASSET_VER}"></script>
  <script src="../../js/timer.js?v=${ASSET_VER}"></script>
  <script src="../../js/supermarkets-mdeo.js?v=${ASSET_VER}"></script>
  <script src="../../js/nutrition-media.js?v=${ASSET_VER}"></script>
  <script src="../../js/data.js?v=${ASSET_VER}"></script>
  <script src="../../js/storage.js?v=${ASSET_VER}"></script>
  <script src="../../js/engine.js?v=${ASSET_VER}"></script>
  <script src="../../js/recipe-page.js?v=${ASSET_VER}"></script>
</body>
</html>
`;
}

fs.mkdirSync(recetasDir, { recursive: true });
const today = new Date().toISOString().slice(0, 10);
const urls = [
  `  <url>\n    <loc>${SITE_ORIGIN}/</loc>\n    <lastmod>${today}</lastmod>\n    <priority>1.0</priority>\n  </url>`
];

let generated = 0;
for (const r of recipes) {
  const dir = path.join(recetasDir, r.id);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), buildRecipeHtml(r), 'utf8');
  urls.push(
    `  <url>\n    <loc>${SITE_ORIGIN}/recetas/${encodeURIComponent(r.id)}/</loc>\n    <lastmod>${today}</lastmod>\n    <priority>0.8</priority>\n  </url>`
  );
  generated++;
}

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`;
fs.writeFileSync(path.join(root, 'sitemap.xml'), sitemap, 'utf8');

const robots = `User-agent: *\nAllow: /\n\nSitemap: ${SITE_ORIGIN}/sitemap.xml\n`;
fs.writeFileSync(path.join(root, 'robots.txt'), robots, 'utf8');

console.log(JSON.stringify({
  siteOrigin: SITE_ORIGIN,
  generatedPages: generated,
  sitemapUrls: urls.length,
  robotsPath: 'robots.txt'
}, null, 2));
