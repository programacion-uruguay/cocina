/**
 * Comparador de Supermercados en Montevideo (Uruguay):
 * - Cadenas: Ta-Ta, Frog, Devoto, Disco, Tienda Inglesa
 * - Cálculo de sucursal más cercana en Montevideo (GPS o selector de barrio)
 * - Precios estimados por ingrediente en Pesos Uruguayos ($ UYU) y enlace directo a cada góndola online
 */

const MDEO_BARRIOS = [
  { id: "cordon", label: "Cordón / Tres Cruces", lat: -34.9005, lng: -56.1706 },
  { id: "centro", label: "Centro / Ciudad Vieja", lat: -34.9058, lng: -56.1913 },
  { id: "pocitos", label: "Pocitos / Punta Carretas", lat: -34.9145, lng: -56.1538 },
  { id: "buceo", label: "Buceo / Malvín", lat: -34.8965, lng: -56.1215 },
  { id: "carrasco", label: "Carrasco / Punta Gorda", lat: -34.8856, lng: -56.0592 },
  { id: "prado", label: "Prado / Aguada", lat: -34.8692, lng: -56.1956 },
  { id: "union", label: "Unión / Maroñas", lat: -34.8788, lng: -56.1385 },
  { id: "paso_molino", label: "Paso Molino / Belvedere", lat: -34.8555, lng: -56.2238 }
];

const MDEO_SUPERMARKETS = [
  {
    id: "tata",
    name: "Ta-Ta",
    color: "#e11d48",
    priceFactor: 0.94,
    buildSearchUrl: (q) => `https://www.tata.com.uy/buscar?text=${encodeURIComponent(q)}`,
    branches: [
      { name: "Ta-Ta Centro (18 de Julio)", address: "Av. 18 de Julio 1236", lat: -34.9061, lng: -56.1897 },
      { name: "Ta-Ta Tres Cruces", address: "Bv. Artigas 1825", lat: -34.8942, lng: -56.1662 },
      { name: "Ta-Ta Unión", address: "Av. 8 de Octubre 3726", lat: -34.8794, lng: -56.1408 },
      { name: "Ta-Ta Paso Molino", address: "Av. Agraciada 4111", lat: -34.8588, lng: -56.2211 },
      { name: "Ta-Ta Pocitos", address: "Av. Brasil 2714", lat: -34.9098, lng: -56.1534 }
    ]
  },
  {
    id: "frog",
    name: "Frog Maxiconsumo",
    color: "#16a34a",
    priceFactor: 0.96,
    buildSearchUrl: (q) => `https://www.frog.com.uy/buscar?q=${encodeURIComponent(q)}`,
    branches: [
      { name: "Frog Cordón", address: "Av. 18 de Julio 1875", lat: -34.9023, lng: -56.1765 },
      { name: "Frog Pocitos", address: "26 de Marzo 1238", lat: -34.9087, lng: -56.1502 },
      { name: "Frog Centro", address: "Colonia 1319", lat: -34.9045, lng: -56.1869 },
      { name: "Frog Malvín", address: "Av. Italia 4240", lat: -34.8891, lng: -56.1154 },
      { name: "Frog Prado", address: "Av. Millán 3560", lat: -34.8648, lng: -56.1951 }
    ]
  },
  {
    id: "devoto",
    name: "Devoto",
    color: "#2563eb",
    priceFactor: 1.01,
    buildSearchUrl: (q) => `https://www.devoto.com.uy/productos/keyword/${encodeURIComponent(q)}`,
    branches: [
      { name: "Devoto 26 de Marzo", address: "26 de Marzo 3421", lat: -34.9052, lng: -56.1401 },
      { name: "Devoto Sayago", address: "Cno. Ariel 4725", lat: -34.8396, lng: -56.2128 },
      { name: "Devoto Malvín", address: "Av. Rivera 4250", lat: -34.8944, lng: -56.1135 },
      { name: "Devoto Agraciada", address: "Av. Agraciada 3655", lat: -34.8655, lng: -56.2089 },
      { name: "Devoto Carrasco", address: "Av. Italia 6958", lat: -34.8781, lng: -56.0598 }
    ]
  },
  {
    id: "disco",
    name: "Disco",
    color: "#dc2626",
    priceFactor: 1.03,
    buildSearchUrl: (q) => `https://www.disco.com.uy/productos/keyword/${encodeURIComponent(q)}`,
    branches: [
      { name: "Disco Punta Carretas", address: "José Ellauri 350", lat: -34.9241, lng: -56.1586 },
      { name: "Disco Parque Rodó", address: "Av. Gonzalo Ramírez 2145", lat: -34.9125, lng: -56.1695 },
      { name: "Disco Av. Italia", address: "Av. Italia 2841", lat: -34.8925, lng: -56.1544 },
      { name: "Disco Unión", address: "Av. 8 de Octubre 3615", lat: -34.8809, lng: -56.1436 },
      { name: "Disco Aguada", address: "Av. Gral. Flores 2350", lat: -34.8861, lng: -56.1859 }
    ]
  },
  {
    id: "tienda_inglesa",
    name: "Tienda Inglesa",
    color: "#0284c7",
    priceFactor: 1.08,
    buildSearchUrl: (q) => `https://www.tiendainglesa.com.uy/supermercado/busqueda?0,0,${encodeURIComponent(q)},0`,
    branches: [
      { name: "Tienda Inglesa Montevideo Shopping", address: "Luis Alberto de Herrera 1290", lat: -34.9032, lng: -56.1361 },
      { name: "Tienda Inglesa Central (Propios)", address: "Bv. José Batlle y Ordóñez 3751", lat: -34.8712, lng: -56.1592 },
      { name: "Tienda Inglesa Pocitos", address: "Benito Blanco 965", lat: -34.9126, lng: -56.1489 },
      { name: "Tienda Inglesa Carrasco", address: "Av. Arocena 1690", lat: -34.8884, lng: -56.0581 },
      { name: "Tienda Inglesa Cordón", address: "Av. 18 de Julio 1785", lat: -34.9029, lng: -56.1786 }
    ]
  }
];

function getDistanceKm(lat1, lng1, lat2, lng2) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function findClosestBranch(chain, coords) {
  let best = null;
  let minDist = Infinity;
  for (const branch of chain.branches) {
    const dist = getDistanceKm(coords.lat, coords.lng, branch.lat, branch.lng);
    if (dist < minDist) {
      minDist = dist;
      best = {
        ...branch,
        distanceKm: Math.round(dist * 100) / 100,
        blocks: Math.max(1, Math.round(dist * 10)),
        mapsUrl: `https://www.google.com/maps/search/?api=1&query=${branch.lat},${branch.lng}`
      };
    }
  }
  return best;
}

function cleanSearchTerm(itemText) {
  return itemText
    .toLowerCase()
    .replace(/\([^)]*\)/g, "")
    .replace(/\b(en tiras|en cubos|en rodajas|en aros|en gajos|lavadas con cáscara|lavada|cocidos|cocida y escurrida|picado|picados|picada|machacados|laminados|batidos|escurrido|sin espinas|sin azúcar|abierta|rallado|rallada|maduras|madura|molida|fresco|fresca|opcional)\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function hashCode(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

function estimateIngredientBaseUYU(ing, multiplier) {
  const name = ing.item.toLowerCase();
  const unit = (ing.unit || "").toLowerCase();
  const qty = (Number(ing.amount) || 1) * multiplier;

  // Precio base estimado en $ UYU por unidad de medida habitual en Uruguay
  let unitPrice = 95;
  if (name.includes("salmón") || name.includes("salmon")) unitPrice = 490;
  else if (name.includes("colita") || name.includes("bife") || name.includes("carne")) unitPrice = 280;
  else if (name.includes("pollo") || name.includes("suprema") || name.includes("muslo")) unitPrice = 195;
  else if (name.includes("merluza") || name.includes("atún")) unitPrice = 185;
  else if (name.includes("queso") || name.includes("ricota") || name.includes("mozzarella") || name.includes("muzzarella")) unitPrice = 145;
  else if (name.includes("mantequilla de maní") || name.includes("aceite de oliva")) unitPrice = 110;
  else if (name.includes("palta")) unitPrice = 85;
  else if (name.includes("huevo")) unitPrice = 14;
  else if (name.includes("papa") || name.includes("cebolla") || name.includes("tomate") || name.includes("zapallito") || name.includes("manzana") || name.includes("banana")) unitPrice = 45;
  else if (name.includes("avena") || name.includes("arroz") || name.includes("spaghetti") || name.includes("lasaña") || name.includes("harina")) unitPrice = 68;
  else if (name.includes("sal") || name.includes("pimienta") || name.includes("orégano") || name.includes("pimentón") || name.includes("canela") || name.includes("romero") || name.includes("eneldo") || name.includes("perejil") || name.includes("ají") || name.includes("vainilla")) unitPrice = 18;

  // Ajuste según si la cantidad está en gramos/ml o por unidad
  if (unit === "g" || unit === "ml") {
    return Math.max(15, Math.round((qty / 250) * unitPrice));
  }
  if (unit === "kg" || unit === "l") {
    return Math.max(40, Math.round(qty * unitPrice * 2.1));
  }
  if (unit === "cda" || unit === "cdas" || unit === "cdta" || unit === "pizca" || unit === "dientes") {
    return Math.max(12, Math.round(Math.min(qty, 6) * 14));
  }
  return Math.max(20, Math.round(qty * unitPrice));
}

function compareRecipeInMontevideo(recipe, servingsMultiplier, userCoords, sortBy = "price", checkedMap = {}) {
  const results = MDEO_SUPERMARKETS.map((chain) => {
    const closestBranch = findClosestBranch(chain, userCoords);
    let totalUYU = 0;

    const items = recipe.ingredients.map((ing, idx) => {
      const checked = Boolean(checkedMap[idx]);
      const base = estimateIngredientBaseUYU(ing, servingsMultiplier);
      const variance = ((hashCode(`${chain.id}-${ing.item}`) % 13) - 6) / 100; // -6% a +6%
      const rawPrice = Math.max(10, Math.round(base * chain.priceFactor * (1 + variance)));
      const priceUYU = checked ? 0 : rawPrice;
      totalUYU += priceUYU;

      const searchTerm = cleanSearchTerm(ing.item) || ing.item;
      return {
        index: idx,
        item: ing.item,
        amount: ing.amount,
        unit: ing.unit,
        checked,
        priceUYU,
        estimatedFullPriceUYU: rawPrice,
        searchTerm,
        gondolaUrl: chain.buildSearchUrl(searchTerm)
      };
    });

    return {
      chainId: chain.id,
      chainName: chain.name,
      color: chain.color,
      totalUYU,
      closestBranch,
      items
    };
  });

  // Calculamos mínimos/máximos para el puntaje combinado "smart"
  const prices = results.map((r) => r.totalUYU);
  const dists = results.map((r) => r.closestBranch.distanceKm);
  const minP = Math.min(...prices);
  const maxP = Math.max(...prices) || 1;
  const minD = Math.min(...dists);
  const maxD = Math.max(...dists) || 1;

  results.forEach((r) => {
    const normP = maxP === minP ? 0 : (r.totalUYU - minP) / (maxP - minP);
    const normD = maxD === minD ? 0 : (r.closestBranch.distanceKm - minD) / (maxD - minD);
    r.smartScore = normP * 0.6 + normD * 0.4;
  });

  const sorted = [...results].sort((a, b) => {
    if (sortBy === "distance") return a.closestBranch.distanceKm - b.closestBranch.distanceKm;
    if (sortBy === "smart") return a.smartScore - b.smartScore;
    return a.totalUYU - b.totalUYU;
  });

  const cheapestId = [...results].sort((a, b) => a.totalUYU - b.totalUYU)[0]?.chainId;
  const nearestId = [...results].sort((a, b) => a.closestBranch.distanceKm - b.closestBranch.distanceKm)[0]?.chainId;
  const smartestId = [...results].sort((a, b) => a.smartScore - b.smartScore)[0]?.chainId;

  return sorted.map((r) => ({
    ...r,
    isCheapest: r.chainId === cheapestId,
    isNearest: r.chainId === nearestId,
    isSmartest: r.chainId === smartestId
  }));
}
