/**
 * Comparador de Supermercados en Montevideo conectado a la Base de Datos de `precios` (precios.db / market-catalog.json):
 * - Cadenas sincronizadas con `precios.db`: Ta-Ta, Frog, El Dorado, Géant, Devoto, Disco, Tienda Inglesa
 * - Asociación directa Ingrediente de Receta -> Producto Real de Góndola (incluyendo Sin TACC, Sin lactosa,
 *   Sin azúcar / Stevia, Integrales, Veganos, Lácteos, Carnes, Pescados y Verdulería)
 * - Muestra producto específico, marca, envase, precio de góndola ($ UYU) y costo proporcional para la receta
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
    priceFactor: 0.95,
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
    id: "el_dorado",
    name: "El Dorado",
    color: "#d97706",
    priceFactor: 0.94,
    buildSearchUrl: (q) => `https://www.eldorado.com.uy/${encodeURIComponent(q)}?_q=${encodeURIComponent(q)}&map=ft`,
    branches: [
      { name: "El Dorado Cordón", address: "Av. 18 de Julio 1954", lat: -34.9012, lng: -56.1731 },
      { name: "El Dorado Centro", address: "Río Branco 1372", lat: -34.9041, lng: -56.1932 },
      { name: "El Dorado Unión", address: "Av. 8 de Octubre 3510", lat: -34.8819, lng: -56.1455 },
      { name: "El Dorado Paso Molino", address: "Av. Agraciada 3980", lat: -34.8605, lng: -56.2189 }
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
    id: "geant",
    name: "Géant",
    color: "#059669",
    priceFactor: 0.98,
    buildSearchUrl: (q) => `https://www.geant.com.uy/productos/keyword/${encodeURIComponent(q)}`,
    branches: [
      { name: "Géant Nuevocentro", address: "Av. Luis Alberto de Herrera 3365", lat: -34.8689, lng: -56.1695 },
      { name: "Géant Parque Roosevelt", address: "Av. Giannattasio Km 18", lat: -34.8615, lng: -56.0265 }
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
    priceFactor: 1.06,
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

// Catálogo sincronizado desde `c:\Users\Admin\Desktop\precios\data\precios.db`
let MDEO_CATALOG_BY_INGREDIENT = {
  "aceite_girasol": [
    {
      "id": 2012,
      "ean": "7730991007023",
      "name": "Aceite de Girasol Óptimo Sin TACC 900 ml",
      "brand": "Óptimo",
      "unit_size": "900 ml",
      "diet_tags": [
        "sin_tacc",
        "sin_lactosa",
        "vegano"
      ],
      "min_price": 102,
      "offers": {
        "tata": {
          "price": 102,
          "url": "https://www.tata.com.uy/buscar?text=aceite%20optimo"
        },
        "frog": {
          "price": 108,
          "url": "https://www.frog.com.uy/buscar?q=aceite%20optimo"
        },
        "el_dorado": {
          "price": 108,
          "url": "https://www.eldorado.com.uy/aceite%20optimo?_q=aceite%20optimo&map=ft"
        },
        "geant": {
          "price": 108,
          "url": "https://www.geant.com.uy/productos/keyword/aceite%20optimo"
        },
        "devoto": {
          "price": 115,
          "url": "https://www.devoto.com.uy/productos/keyword/aceite%20optimo"
        },
        "tienda_inglesa": {
          "price": 116,
          "url": "https://www.tiendainglesa.com.uy/supermercado/busqueda?0,0,aceite%20optimo,0"
        },
        "disco": {
          "price": 117,
          "url": "https://www.disco.com.uy/productos/keyword/aceite%20optimo"
        }
      }
    },
    {
      "id": 4,
      "ean": "7730789000014",
      "name": "Aceite de Girasol Óptimo 900 ml",
      "brand": "Óptimo",
      "unit_size": "900 ml",
      "diet_tags": [],
      "min_price": 98,
      "offers": {
        "el_clon": {
          "price": 98,
          "url": "https://www.elclon.com.uy/catalogo/aceite-girasol-optimo-900ml_12510_0"
        },
        "tata": {
          "price": 109,
          "url": "https://www.tata.com.uy"
        },
        "disco": {
          "price": 112,
          "url": "https://www.disco.com.uy"
        },
        "devoto": {
          "price": 114,
          "url": "https://www.devoto.com.uy"
        },
        "tienda_inglesa": {
          "price": 118,
          "url": "https://www.tiendainglesa.com.uy"
        },
        "frog": {
          "price": 119,
          "url": "https://www.frog.com.uy"
        }
      }
    }
  ],
  "aceite_oliva": [
    {
      "id": 1970,
      "ean": "7730991007001",
      "name": "Aceite de Oliva Virgen Extra Colinas de Garzón 500 ml",
      "brand": "Colinas de Garzón",
      "unit_size": "500 ml",
      "diet_tags": [
        "sin_tacc",
        "sin_lactosa",
        "vegano"
      ],
      "min_price": 266,
      "offers": {
        "frog": {
          "price": 266,
          "url": "https://www.frog.com.uy/buscar?q=aceite%20de%20oliva"
        },
        "el_dorado": {
          "price": 269,
          "url": "https://www.eldorado.com.uy/aceite%20de%20oliva?_q=aceite%20de%20oliva&map=ft"
        },
        "tata": {
          "price": 277,
          "url": "https://www.tata.com.uy/buscar?text=aceite%20de%20oliva"
        },
        "devoto": {
          "price": 286,
          "url": "https://www.devoto.com.uy/productos/keyword/aceite%20de%20oliva"
        },
        "disco": {
          "price": 289,
          "url": "https://www.disco.com.uy/productos/keyword/aceite%20de%20oliva"
        },
        "geant": {
          "price": 292,
          "url": "https://www.geant.com.uy/productos/keyword/aceite%20de%20oliva"
        },
        "tienda_inglesa": {
          "price": 316,
          "url": "https://www.tiendainglesa.com.uy/supermercado/busqueda?0,0,aceite%20de%20oliva,0"
        }
      }
    },
    {
      "id": 445,
      "ean": "",
      "name": "Mayonesa con aceite de oliva MAYOLIVA 250 cc",
      "brand": "Mayoliva",
      "unit_size": "250 cc",
      "diet_tags": [],
      "min_price": 131,
      "offers": {
        "geant": {
          "price": 131,
          "url": "https://www.geant.com.uy/product/mayonesa-con-aceite-de-oliva-mayoliva-250-cc/662532"
        },
        "disco": {
          "price": 132,
          "url": "https://www.disco.com.uy/product/mayonesa-con-aceite-de-oliva-mayoliva-250-cc/662532"
        },
        "devoto": {
          "price": 132,
          "url": "https://www.devoto.com.uy/product/mayonesa-con-aceite-de-oliva-mayoliva-250-cc/662532"
        }
      }
    }
  ],
  "aceitunas": [
    {
      "id": 1980,
      "ean": "7730991007011",
      "name": "Aceitunas Negras / Veradas Descarozadas 180 g",
      "brand": "Río de la Plata",
      "unit_size": "180 g",
      "diet_tags": [
        "sin_tacc",
        "sin_lactosa",
        "vegano"
      ],
      "min_price": 74,
      "offers": {
        "frog": {
          "price": 74,
          "url": "https://www.frog.com.uy/buscar?q=aceitunas"
        },
        "el_dorado": {
          "price": 74,
          "url": "https://www.eldorado.com.uy/aceitunas?_q=aceitunas&map=ft"
        },
        "tata": {
          "price": 77,
          "url": "https://www.tata.com.uy/buscar?text=aceitunas"
        },
        "devoto": {
          "price": 79,
          "url": "https://www.devoto.com.uy/productos/keyword/aceitunas"
        },
        "disco": {
          "price": 80,
          "url": "https://www.disco.com.uy/productos/keyword/aceitunas"
        },
        "geant": {
          "price": 81,
          "url": "https://www.geant.com.uy/productos/keyword/aceitunas"
        },
        "tienda_inglesa": {
          "price": 87,
          "url": "https://www.tiendainglesa.com.uy/supermercado/busqueda?0,0,aceitunas,0"
        }
      }
    }
  ],
  "acelga": [
    {
      "id": 1994,
      "ean": "7730991008012",
      "name": "Acelga Fresca de Feria Atado 500 g",
      "brand": "Feria / Frescos",
      "unit_size": "500 g",
      "diet_tags": [
        "sin_tacc",
        "sin_lactosa",
        "vegano"
      ],
      "min_price": 51,
      "offers": {
        "frog": {
          "price": 51,
          "url": "https://www.frog.com.uy/buscar?q=acelga"
        },
        "geant": {
          "price": 51,
          "url": "https://www.geant.com.uy/productos/keyword/acelga"
        },
        "el_dorado": {
          "price": 52,
          "url": "https://www.eldorado.com.uy/acelga?_q=acelga&map=ft"
        },
        "tata": {
          "price": 53,
          "url": "https://www.tata.com.uy/buscar?text=acelga"
        },
        "devoto": {
          "price": 55,
          "url": "https://www.devoto.com.uy/productos/keyword/acelga"
        },
        "disco": {
          "price": 56,
          "url": "https://www.disco.com.uy/productos/keyword/acelga"
        },
        "tienda_inglesa": {
          "price": 56,
          "url": "https://www.tiendainglesa.com.uy/supermercado/busqueda?0,0,acelga,0"
        }
      }
    }
  ],
  "aceto": [
    {
      "id": 1971,
      "ean": "7730991007002",
      "name": "Aceto Balsámico de Módena 250 ml",
      "brand": "Colinas de Garzón",
      "unit_size": "250 ml",
      "diet_tags": [
        "sin_tacc",
        "sin_lactosa",
        "vegano"
      ],
      "min_price": 120,
      "offers": {
        "frog": {
          "price": 120,
          "url": "https://www.frog.com.uy/buscar?q=aceto%20balsamico"
        },
        "el_dorado": {
          "price": 121,
          "url": "https://www.eldorado.com.uy/aceto%20balsamico?_q=aceto%20balsamico&map=ft"
        },
        "tata": {
          "price": 125,
          "url": "https://www.tata.com.uy/buscar?text=aceto%20balsamico"
        },
        "devoto": {
          "price": 129,
          "url": "https://www.devoto.com.uy/productos/keyword/aceto%20balsamico"
        },
        "disco": {
          "price": 130,
          "url": "https://www.disco.com.uy/productos/keyword/aceto%20balsamico"
        },
        "geant": {
          "price": 131,
          "url": "https://www.geant.com.uy/productos/keyword/aceto%20balsamico"
        },
        "tienda_inglesa": {
          "price": 142,
          "url": "https://www.tiendainglesa.com.uy/supermercado/busqueda?0,0,aceto%20balsamico,0"
        }
      }
    }
  ],
  "ajo": [
    {
      "id": 1988,
      "ean": "7730991008006",
      "name": "Ajo Blanco Cabeza x 2 un",
      "brand": "Feria / Frescos",
      "unit_size": "2 un",
      "diet_tags": [
        "sin_tacc",
        "sin_lactosa",
        "vegano"
      ],
      "min_price": 50,
      "offers": {
        "el_dorado": {
          "price": 50,
          "url": "https://www.eldorado.com.uy/ajo?_q=ajo&map=ft"
        },
        "tata": {
          "price": 51,
          "url": "https://www.tata.com.uy/buscar?text=ajo"
        },
        "frog": {
          "price": 54,
          "url": "https://www.frog.com.uy/buscar?q=ajo"
        },
        "geant": {
          "price": 54,
          "url": "https://www.geant.com.uy/productos/keyword/ajo"
        },
        "devoto": {
          "price": 58,
          "url": "https://www.devoto.com.uy/productos/keyword/ajo"
        },
        "disco": {
          "price": 58,
          "url": "https://www.disco.com.uy/productos/keyword/ajo"
        },
        "tienda_inglesa": {
          "price": 58,
          "url": "https://www.tiendainglesa.com.uy/supermercado/busqueda?0,0,ajo,0"
        }
      }
    },
    {
      "id": 1184,
      "ean": "7730902200033",
      "name": "Galletas Magicas Ajo Integrales 180gr",
      "brand": "Magicas",
      "unit_size": "180gr",
      "diet_tags": [
        "integral"
      ],
      "min_price": 104,
      "offers": {
        "el_dorado": {
          "price": 104,
          "url": "https://www.eldorado.com.uy/galletas-magicas-ajo-integrales-180gr/p"
        }
      }
    }
  ],
  "alcaparras": [
    {
      "id": 1981,
      "ean": "7730991007012",
      "name": "Alcaparras en Vinagre Frasco 100 g",
      "brand": "Río de la Plata",
      "unit_size": "100 g",
      "diet_tags": [
        "sin_tacc",
        "sin_lactosa",
        "vegano"
      ],
      "min_price": 108,
      "offers": {
        "frog": {
          "price": 108,
          "url": "https://www.frog.com.uy/buscar?q=alcaparras"
        },
        "geant": {
          "price": 108,
          "url": "https://www.geant.com.uy/productos/keyword/alcaparras"
        },
        "el_dorado": {
          "price": 109,
          "url": "https://www.eldorado.com.uy/alcaparras?_q=alcaparras&map=ft"
        },
        "tata": {
          "price": 113,
          "url": "https://www.tata.com.uy/buscar?text=alcaparras"
        },
        "devoto": {
          "price": 116,
          "url": "https://www.devoto.com.uy/productos/keyword/alcaparras"
        },
        "disco": {
          "price": 117,
          "url": "https://www.disco.com.uy/productos/keyword/alcaparras"
        },
        "tienda_inglesa": {
          "price": 117,
          "url": "https://www.tiendainglesa.com.uy/supermercado/busqueda?0,0,alcaparras,0"
        }
      }
    }
  ],
  "arroz": [
    {
      "id": 3,
      "ean": "7730456000013",
      "name": "Arroz Blanco Saman 1 kg",
      "brand": "Saman",
      "unit_size": "1 kg",
      "diet_tags": [],
      "min_price": 55,
      "offers": {
        "disco": {
          "price": 55,
          "url": "https://www.disco.com.uy/product/arroz-blanco-saman-1-kg/523035"
        },
        "devoto": {
          "price": 55,
          "url": "https://www.devoto.com.uy/product/arroz-blanco-saman-1-kg/523035"
        },
        "geant": {
          "price": 55,
          "url": "https://www.geant.com.uy/product/arroz-blanco-saman-1-kg/523035"
        },
        "el_dorado": {
          "price": 67,
          "url": "https://www.eldorado.com.uy"
        },
        "tienda_inglesa": {
          "price": 69,
          "url": "https://www.tiendainglesa.com.uy/supermercado/arroz-blanco-saman-1-kg.producto?3451,,42"
        },
        "tata": {
          "price": 69,
          "url": "https://www.tata.com.uy/arroz-blanco-saman-1-kg-299/p"
        },
        "frog": {
          "price": 84,
          "url": "https://frog.uy/arroz-saman-blanco-rojo-1kg"
        }
      }
    },
    {
      "id": 36,
      "ean": "",
      "name": "Arroz Parboiled SAMAN 1 kg",
      "brand": "Saman",
      "unit_size": "1 kg",
      "diet_tags": [],
      "min_price": 74,
      "offers": {
        "geant": {
          "price": 74,
          "url": "https://www.geant.com.uy/product/arroz-parboiled-saman-1-kg/523039"
        },
        "tienda_inglesa": {
          "price": 79,
          "url": "https://www.tiendainglesa.com.uy/supermercado/arroz-parboiled-saman-1-kg.producto?86,,42"
        },
        "tata": {
          "price": 79,
          "url": "https://www.tata.com.uy/arroz-parboiled-saman-1-kg-303/p"
        },
        "redmarket5": {
          "price": 79,
          "url": "https://redmarket5.com.uy/catalog"
        },
        "disco": {
          "price": 84,
          "url": "https://www.disco.com.uy/product/arroz-parboiled-saman-1-kg/523039"
        },
        "devoto": {
          "price": 84,
          "url": "https://www.devoto.com.uy/product/arroz-parboiled-saman-1-kg/523039"
        },
        "frog": {
          "price": 86,
          "url": "https://frog.uy/arroz-saman-parboiled-1kg"
        }
      }
    }
  ],
  "arroz_integral": [
    {
      "id": 38,
      "ean": "",
      "name": "Arroz Integral SAMAN 1 kg",
      "brand": "Saman",
      "unit_size": "1 kg",
      "diet_tags": [
        "integral"
      ],
      "min_price": 103,
      "offers": {
        "frog": {
          "price": 103,
          "url": "https://www.frog.com.uy/buscar?q=arroz%20integral%20saman"
        },
        "el_dorado": {
          "price": 104,
          "url": "https://www.eldorado.com.uy/arroz%20integral%20saman?_q=arroz%20integral%20saman&map=ft"
        },
        "tata": {
          "price": 107,
          "url": "https://www.tata.com.uy/buscar?text=arroz%20integral%20saman"
        },
        "devoto": {
          "price": 111,
          "url": "https://www.devoto.com.uy/productos/keyword/arroz%20integral%20saman"
        },
        "disco": {
          "price": 112,
          "url": "https://www.disco.com.uy/product/arroz-integral-saman-1-kg/523028"
        },
        "geant": {
          "price": 113,
          "url": "https://www.geant.com.uy/productos/keyword/arroz%20integral%20saman"
        },
        "tienda_inglesa": {
          "price": 117,
          "url": "https://www.tiendainglesa.com.uy/supermercado/arroz-integral-saman-1-kg.producto?711,,42"
        }
      }
    },
    {
      "id": 1032,
      "ean": "7730900890038",
      "name": "Arroz Mirokumai Integral 1kg",
      "brand": "Mirokumai",
      "unit_size": "1kg",
      "diet_tags": [
        "integral"
      ],
      "min_price": 165,
      "offers": {
        "el_dorado": {
          "price": 165,
          "url": "https://www.eldorado.com.uy/arroz-mirokumai-integral-1kg/p"
        },
        "tienda_inglesa": {
          "price": 166,
          "url": "https://www.tiendainglesa.com.uy/supermercado/arroz-integral-mirokumai-1-kg.producto?9442,,42"
        }
      }
    }
  ],
  "arvejas": [
    {
      "id": 1955,
      "ean": "7730991005016",
      "name": "Arvejas Congeladas / Lata Río de la Plata 300 g",
      "brand": "Río de la Plata",
      "unit_size": "300 g",
      "diet_tags": [
        "sin_tacc",
        "vegano"
      ],
      "min_price": 49,
      "offers": {
        "tata": {
          "price": 49,
          "url": "https://www.tata.com.uy/buscar?text=arvejas"
        },
        "frog": {
          "price": 52,
          "url": "https://www.frog.com.uy/buscar?q=arvejas"
        },
        "el_dorado": {
          "price": 52,
          "url": "https://www.eldorado.com.uy/arvejas?_q=arvejas&map=ft"
        },
        "geant": {
          "price": 52,
          "url": "https://www.geant.com.uy/productos/keyword/arvejas"
        },
        "devoto": {
          "price": 56,
          "url": "https://www.devoto.com.uy/productos/keyword/arvejas"
        },
        "disco": {
          "price": 56,
          "url": "https://www.disco.com.uy/productos/keyword/arvejas"
        },
        "tienda_inglesa": {
          "price": 56,
          "url": "https://www.tiendainglesa.com.uy/supermercado/busqueda?0,0,arvejas,0"
        }
      }
    },
    {
      "id": 1486,
      "ean": "",
      "name": "MAYONESA NATURA DOY PACK 500CC + ARVEJA OBS",
      "brand": "Mayonesa Natura Doy Pack",
      "unit_size": "500CC",
      "diet_tags": [],
      "min_price": 99,
      "offers": {
        "el_clon": {
          "price": 99,
          "url": "https://www.elclon.com.uy/catalogo/mayonesa-natura-doy-pack-500cc-arveja-obs_31917_0"
        }
      }
    }
  ],
  "atun": [
    {
      "id": 1968,
      "ean": "7730991006012",
      "name": "Atún al Natural Lomitos Río de la Plata 170 g",
      "brand": "Río de la Plata",
      "unit_size": "170 g",
      "diet_tags": [
        "sin_tacc",
        "sin_lactosa"
      ],
      "min_price": 83,
      "offers": {
        "frog": {
          "price": 83,
          "url": "https://www.frog.com.uy/buscar?q=atun%20al%20natural"
        },
        "el_dorado": {
          "price": 84,
          "url": "https://www.eldorado.com.uy/atun%20al%20natural?_q=atun%20al%20natural&map=ft"
        },
        "tata": {
          "price": 86,
          "url": "https://www.tata.com.uy/buscar?text=atun%20al%20natural"
        },
        "devoto": {
          "price": 89,
          "url": "https://www.devoto.com.uy/productos/keyword/atun%20al%20natural"
        },
        "disco": {
          "price": 90,
          "url": "https://www.disco.com.uy/productos/keyword/atun%20al%20natural"
        },
        "geant": {
          "price": 91,
          "url": "https://www.geant.com.uy/productos/keyword/atun%20al%20natural"
        },
        "tienda_inglesa": {
          "price": 98,
          "url": "https://www.tiendainglesa.com.uy/supermercado/busqueda?0,0,atun%20al%20natural,0"
        }
      }
    },
    {
      "id": 545,
      "ean": "",
      "name": "Atún en trozos al natural RIO DE LA PLATA pouch 120 g",
      "brand": "Rio De La Plata",
      "unit_size": "120 g",
      "diet_tags": [],
      "min_price": 120,
      "offers": {
        "frog": {
          "price": 120,
          "url": "https://frog.uy/rio-atun-trozonatural-120gr"
        },
        "geant": {
          "price": 121,
          "url": "https://www.geant.com.uy/product/atun-en-trozos-al-natural-rio-de-la-plata-pouch-120-g/472117"
        },
        "disco": {
          "price": 122,
          "url": "https://www.disco.com.uy/product/atun-en-trozos-al-natural-rio-de-la-plata-pouch-120-g/472117"
        },
        "devoto": {
          "price": 122,
          "url": "https://www.devoto.com.uy/product/atun-en-trozos-al-natural-rio-de-la-plata-pouch-120-g/472117"
        }
      }
    }
  ],
  "avena_sin_tacc": [
    {
      "id": 1911,
      "ean": "7730991001008",
      "name": "Avena Arrollada Sin Gluten Niter Sin TACC 500 g",
      "brand": "Niter",
      "unit_size": "500 g",
      "diet_tags": [
        "sin_tacc"
      ],
      "min_price": 184,
      "offers": {
        "frog": {
          "price": 184,
          "url": "https://www.frog.com.uy/buscar?q=avena%20sin%20gluten"
        },
        "el_dorado": {
          "price": 186,
          "url": "https://www.eldorado.com.uy/avena%20sin%20gluten?_q=avena%20sin%20gluten&map=ft"
        },
        "tata": {
          "price": 192,
          "url": "https://www.tata.com.uy/buscar?text=avena%20sin%20gluten"
        },
        "devoto": {
          "price": 198,
          "url": "https://www.devoto.com.uy/productos/keyword/avena%20sin%20gluten"
        },
        "disco": {
          "price": 200,
          "url": "https://www.disco.com.uy/productos/keyword/avena%20sin%20gluten"
        },
        "geant": {
          "price": 202,
          "url": "https://www.geant.com.uy/productos/keyword/avena%20sin%20gluten"
        },
        "tienda_inglesa": {
          "price": 218,
          "url": "https://www.tiendainglesa.com.uy/supermercado/busqueda?0,0,avena%20sin%20gluten,0"
        }
      }
    }
  ],
  "avena": [
    {
      "id": 1947,
      "ean": "7730991005008",
      "name": "Avena Laminada Puritas 500 g",
      "brand": "Puritas",
      "unit_size": "500 g",
      "diet_tags": [],
      "min_price": 76,
      "offers": {
        "tata": {
          "price": 76,
          "url": "https://www.tata.com.uy/buscar?text=avena%20puritas"
        },
        "frog": {
          "price": 80,
          "url": "https://www.frog.com.uy/buscar?q=avena%20puritas"
        },
        "el_dorado": {
          "price": 80,
          "url": "https://www.eldorado.com.uy/avena%20puritas?_q=avena%20puritas&map=ft"
        },
        "geant": {
          "price": 80,
          "url": "https://www.geant.com.uy/productos/keyword/avena%20puritas"
        },
        "devoto": {
          "price": 85,
          "url": "https://www.devoto.com.uy/productos/keyword/avena%20puritas"
        },
        "disco": {
          "price": 86,
          "url": "https://www.disco.com.uy/productos/keyword/avena%20puritas"
        },
        "tienda_inglesa": {
          "price": 86,
          "url": "https://www.tiendainglesa.com.uy/supermercado/busqueda?0,0,avena%20puritas,0"
        }
      }
    }
  ],
  "azucar": [
    {
      "id": 2003,
      "ean": "7730991007014",
      "name": "Azúcar Blanca Refinada Bella Unión 1 kg",
      "brand": "Bella Unión",
      "unit_size": "1 kg",
      "diet_tags": [
        "sin_tacc",
        "sin_lactosa",
        "vegano"
      ],
      "min_price": 47,
      "offers": {
        "tata": {
          "price": 47,
          "url": "https://www.tata.com.uy/buscar?text=azucar%20bella%20union"
        },
        "frog": {
          "price": 50,
          "url": "https://www.frog.com.uy/buscar?q=azucar%20bella%20union"
        },
        "el_dorado": {
          "price": 50,
          "url": "https://www.eldorado.com.uy/azucar%20bella%20union?_q=azucar%20bella%20union&map=ft"
        },
        "geant": {
          "price": 50,
          "url": "https://www.geant.com.uy/productos/keyword/azucar%20bella%20union"
        },
        "devoto": {
          "price": 54,
          "url": "https://www.devoto.com.uy/productos/keyword/azucar%20bella%20union"
        },
        "disco": {
          "price": 54,
          "url": "https://www.disco.com.uy/productos/keyword/azucar%20bella%20union"
        },
        "tienda_inglesa": {
          "price": 54,
          "url": "https://www.tiendainglesa.com.uy/supermercado/busqueda?0,0,azucar%20bella%20union,0"
        }
      }
    },
    {
      "id": 192,
      "ean": "",
      "name": "Azúcar blanca BELLA UNIÓN 1 kg",
      "brand": "Bella Unión",
      "unit_size": "1 kg",
      "diet_tags": [],
      "min_price": 52,
      "offers": {
        "disco": {
          "price": 52,
          "url": "https://www.disco.com.uy/product/azucar-blanca-bella-union-1-kg/530051"
        },
        "devoto": {
          "price": 52,
          "url": "https://www.devoto.com.uy/product/azucar-blanca-bella-union-1-kg/530051"
        },
        "geant": {
          "price": 52,
          "url": "https://www.geant.com.uy/product/azucar-blanca-bella-union-1-kg/530051"
        },
        "frog": {
          "price": 53,
          "url": "https://frog.uy/azucar-blanco-bunion-1kg"
        }
      }
    }
  ],
  "bebida_vegetal": [
    {
      "id": 1918,
      "ean": "7730991002004",
      "name": "Bebida Vegetal de Almendras Sin Azúcar Silk 1 L",
      "brand": "Silk",
      "unit_size": "1 L",
      "diet_tags": [
        "sin_lactosa",
        "vegano",
        "sin_azucar",
        "sin_tacc"
      ],
      "min_price": 145,
      "offers": {
        "el_dorado": {
          "price": 145,
          "url": "https://www.eldorado.com.uy/bebida%20de%20almendras?_q=bebida%20de%20almendras&map=ft"
        },
        "tata": {
          "price": 150,
          "url": "https://www.tata.com.uy/buscar?text=bebida%20de%20almendras"
        },
        "devoto": {
          "price": 154,
          "url": "https://www.devoto.com.uy/productos/keyword/bebida%20de%20almendras"
        },
        "frog": {
          "price": 157,
          "url": "https://www.frog.com.uy/buscar?q=bebida%20de%20almendras"
        },
        "geant": {
          "price": 157,
          "url": "https://www.geant.com.uy/productos/keyword/bebida%20de%20almendras"
        },
        "disco": {
          "price": 170,
          "url": "https://www.disco.com.uy/productos/keyword/bebida%20de%20almendras"
        },
        "tienda_inglesa": {
          "price": 170,
          "url": "https://www.tiendainglesa.com.uy/supermercado/busqueda?0,0,bebida%20de%20almendras,0"
        }
      }
    }
  ],
  "berenjena": [
    {
      "id": 1996,
      "ean": "7730991008014",
      "name": "Berenjena Fresca 500 g",
      "brand": "Feria / Frescos",
      "unit_size": "500 g",
      "diet_tags": [
        "sin_tacc",
        "sin_lactosa",
        "vegano"
      ],
      "min_price": 60,
      "offers": {
        "tata": {
          "price": 60,
          "url": "https://www.tata.com.uy/buscar?text=berenjena"
        },
        "frog": {
          "price": 63,
          "url": "https://www.frog.com.uy/buscar?q=berenjena"
        },
        "geant": {
          "price": 63,
          "url": "https://www.geant.com.uy/productos/keyword/berenjena"
        },
        "el_dorado": {
          "price": 64,
          "url": "https://www.eldorado.com.uy/berenjena?_q=berenjena&map=ft"
        },
        "devoto": {
          "price": 68,
          "url": "https://www.devoto.com.uy/productos/keyword/berenjena"
        },
        "disco": {
          "price": 68,
          "url": "https://www.disco.com.uy/productos/keyword/berenjena"
        },
        "tienda_inglesa": {
          "price": 68,
          "url": "https://www.tiendainglesa.com.uy/supermercado/busqueda?0,0,berenjena,0"
        }
      }
    }
  ],
  "carne_vacuna": [
    {
      "id": 1959,
      "ean": "7730991006003",
      "name": "Bife de Nalga / Colita de Cuadril Vacuna 500 g",
      "brand": "Frigorífico",
      "unit_size": "500 g",
      "diet_tags": [
        "sin_tacc",
        "sin_lactosa"
      ],
      "min_price": 247,
      "offers": {
        "frog": {
          "price": 247,
          "url": "https://www.frog.com.uy/buscar?q=colita%20de%20cuadril"
        },
        "el_dorado": {
          "price": 249,
          "url": "https://www.eldorado.com.uy/colita%20de%20cuadril?_q=colita%20de%20cuadril&map=ft"
        },
        "tata": {
          "price": 257,
          "url": "https://www.tata.com.uy/buscar?text=colita%20de%20cuadril"
        },
        "devoto": {
          "price": 265,
          "url": "https://www.devoto.com.uy/productos/keyword/colita%20de%20cuadril"
        },
        "disco": {
          "price": 267,
          "url": "https://www.disco.com.uy/productos/keyword/colita%20de%20cuadril"
        },
        "geant": {
          "price": 270,
          "url": "https://www.geant.com.uy/productos/keyword/colita%20de%20cuadril"
        },
        "tienda_inglesa": {
          "price": 292,
          "url": "https://www.tiendainglesa.com.uy/supermercado/busqueda?0,0,colita%20de%20cuadril,0"
        }
      }
    },
    {
      "id": 709,
      "ean": "",
      "name": "Mayonesa Hellmann's Asado 250 g",
      "brand": "Hellmann's",
      "unit_size": "250 g",
      "diet_tags": [],
      "min_price": 129,
      "offers": {
        "tata": {
          "price": 129,
          "url": "https://www.tata.com.uy/mayonesa-hellmann-s-asado-250-g-1000607642-174742/p"
        }
      }
    }
  ],
  "boniato": [
    {
      "id": 1984,
      "ean": "7730991008002",
      "name": "Boniato Criollo / Zanahoria 1 kg",
      "brand": "Feria / Frescos",
      "unit_size": "1 kg",
      "diet_tags": [
        "sin_tacc",
        "sin_lactosa",
        "vegano"
      ],
      "min_price": 64,
      "offers": {
        "frog": {
          "price": 64,
          "url": "https://www.frog.com.uy/buscar?q=boniato"
        },
        "geant": {
          "price": 64,
          "url": "https://www.geant.com.uy/productos/keyword/boniato"
        },
        "el_dorado": {
          "price": 65,
          "url": "https://www.eldorado.com.uy/boniato?_q=boniato&map=ft"
        },
        "tata": {
          "price": 67,
          "url": "https://www.tata.com.uy/buscar?text=boniato"
        },
        "devoto": {
          "price": 69,
          "url": "https://www.devoto.com.uy/productos/keyword/boniato"
        },
        "disco": {
          "price": 69,
          "url": "https://www.disco.com.uy/productos/keyword/boniato"
        },
        "tienda_inglesa": {
          "price": 69,
          "url": "https://www.tiendainglesa.com.uy/supermercado/busqueda?0,0,boniato,0"
        }
      }
    },
    {
      "id": 56,
      "ean": "",
      "name": "Boniato Zanahoria Granel (kg)",
      "brand": "",
      "unit_size": "",
      "diet_tags": [],
      "min_price": 169,
      "offers": {
        "tienda_inglesa": {
          "price": 169,
          "url": "https://www.tiendainglesa.com.uy/supermercado/boniato-zanahoria-granel-kg.producto?611,,42&campaign=search_facets"
        }
      }
    }
  ],
  "brocoli": [
    {
      "id": 1995,
      "ean": "7730991008013",
      "name": "Brócoli / Coliflor Fresco Unidad 450 g",
      "brand": "Feria / Frescos",
      "unit_size": "450 g",
      "diet_tags": [
        "sin_tacc",
        "sin_lactosa",
        "vegano"
      ],
      "min_price": 72,
      "offers": {
        "tata": {
          "price": 72,
          "url": "https://www.tata.com.uy/buscar?text=brocoli"
        },
        "frog": {
          "price": 76,
          "url": "https://www.frog.com.uy/buscar?q=brocoli"
        },
        "el_dorado": {
          "price": 76,
          "url": "https://www.eldorado.com.uy/brocoli?_q=brocoli&map=ft"
        },
        "geant": {
          "price": 76,
          "url": "https://www.geant.com.uy/productos/keyword/brocoli"
        },
        "devoto": {
          "price": 81,
          "url": "https://www.devoto.com.uy/productos/keyword/brocoli"
        },
        "disco": {
          "price": 82,
          "url": "https://www.disco.com.uy/productos/keyword/brocoli"
        },
        "tienda_inglesa": {
          "price": 82,
          "url": "https://www.tiendainglesa.com.uy/supermercado/busqueda?0,0,brocoli,0"
        }
      }
    }
  ],
  "cacao": [
    {
      "id": 1976,
      "ean": "7730991007007",
      "name": "Cacao Amargo en Polvo Sin Azúcar Niter 100 g",
      "brand": "Niter",
      "unit_size": "100 g",
      "diet_tags": [
        "sin_tacc",
        "sin_azucar",
        "vegano"
      ],
      "min_price": 108,
      "offers": {
        "el_dorado": {
          "price": 108,
          "url": "https://www.eldorado.com.uy/cacao%20amargo?_q=cacao%20amargo&map=ft"
        },
        "tata": {
          "price": 112,
          "url": "https://www.tata.com.uy/buscar?text=cacao%20amargo"
        },
        "frog": {
          "price": 118,
          "url": "https://www.frog.com.uy/buscar?q=cacao%20amargo"
        },
        "geant": {
          "price": 118,
          "url": "https://www.geant.com.uy/productos/keyword/cacao%20amargo"
        },
        "devoto": {
          "price": 126,
          "url": "https://www.devoto.com.uy/productos/keyword/cacao%20amargo"
        },
        "disco": {
          "price": 127,
          "url": "https://www.disco.com.uy/productos/keyword/cacao%20amargo"
        },
        "tienda_inglesa": {
          "price": 127,
          "url": "https://www.tiendainglesa.com.uy/supermercado/busqueda?0,0,cacao%20amargo,0"
        }
      }
    },
    {
      "id": 1185,
      "ean": "7896085085475",
      "name": "Galletas Nikito Wafle Chocolate 100gr",
      "brand": "Nikito",
      "unit_size": "100gr",
      "diet_tags": [],
      "min_price": 26,
      "offers": {
        "el_dorado": {
          "price": 26,
          "url": "https://www.eldorado.com.uy/galletas-nikito-wafle-chocolate-100gr/p"
        }
      }
    }
  ],
  "calabaza": [
    {
      "id": 1985,
      "ean": "7730991008003",
      "name": "Calabaza Cabutiá en Trozo 1 kg",
      "brand": "Feria / Frescos",
      "unit_size": "1 kg",
      "diet_tags": [
        "sin_tacc",
        "sin_lactosa",
        "vegano"
      ],
      "min_price": 62,
      "offers": {
        "frog": {
          "price": 62,
          "url": "https://www.frog.com.uy/buscar?q=calabaza%20cabutia"
        },
        "el_dorado": {
          "price": 62,
          "url": "https://www.eldorado.com.uy/calabaza%20cabutia?_q=calabaza%20cabutia&map=ft"
        },
        "geant": {
          "price": 62,
          "url": "https://www.geant.com.uy/productos/keyword/calabaza%20cabutia"
        },
        "tata": {
          "price": 64,
          "url": "https://www.tata.com.uy/buscar?text=calabaza%20cabutia"
        },
        "devoto": {
          "price": 66,
          "url": "https://www.devoto.com.uy/productos/keyword/calabaza%20cabutia"
        },
        "disco": {
          "price": 67,
          "url": "https://www.disco.com.uy/productos/keyword/calabaza%20cabutia"
        },
        "tienda_inglesa": {
          "price": 67,
          "url": "https://www.tiendainglesa.com.uy/supermercado/busqueda?0,0,calabaza%20cabutia,0"
        }
      }
    }
  ],
  "caldo": [
    {
      "id": 2009,
      "ean": "7730991007020",
      "name": "Caldo de Verduras / Carne Knorr Sin TACC x 12 cubos",
      "brand": "Knorr",
      "unit_size": "",
      "diet_tags": [
        "sin_tacc"
      ],
      "min_price": 73,
      "offers": {
        "frog": {
          "price": 73,
          "url": "https://www.frog.com.uy/buscar?q=caldo%20knorr"
        },
        "el_dorado": {
          "price": 73,
          "url": "https://www.eldorado.com.uy/caldo%20knorr?_q=caldo%20knorr&map=ft"
        },
        "tata": {
          "price": 76,
          "url": "https://www.tata.com.uy/buscar?text=caldo%20knorr"
        },
        "devoto": {
          "price": 78,
          "url": "https://www.devoto.com.uy/productos/keyword/caldo%20knorr"
        },
        "geant": {
          "price": 79,
          "url": "https://www.geant.com.uy/productos/keyword/caldo%20knorr"
        },
        "disco": {
          "price": 79,
          "url": "https://www.disco.com.uy/productos/keyword/caldo%20knorr"
        },
        "tienda_inglesa": {
          "price": 86,
          "url": "https://www.tiendainglesa.com.uy/supermercado/busqueda?0,0,caldo%20knorr,0"
        }
      }
    },
    {
      "id": 491,
      "ean": "",
      "name": "Caldo verduras KNORR 12 un.",
      "brand": "Knorr",
      "unit_size": "12 un",
      "diet_tags": [],
      "min_price": 112,
      "offers": {
        "frog": {
          "price": 112,
          "url": "https://frog.uy/knorr-caldo-verdura-x-12"
        },
        "geant": {
          "price": 118,
          "url": "https://www.geant.com.uy/product/caldo-verduras-knorr-12-un/630393"
        },
        "disco": {
          "price": 119,
          "url": "https://www.disco.com.uy/product/caldo-verduras-knorr-12-un/630393"
        },
        "devoto": {
          "price": 119,
          "url": "https://www.devoto.com.uy/product/caldo-verduras-knorr-12-un/630393"
        },
        "tienda_inglesa": {
          "price": 142,
          "url": "https://www.tiendainglesa.com.uy/supermercado/caldo-knorr-verduras-12-un..producto?5571,,42"
        }
      }
    }
  ],
  "camarones": [
    {
      "id": 1967,
      "ean": "7730991006011",
      "name": "Camarones Pelados Congelados 250 g",
      "brand": "Pescadería",
      "unit_size": "250 g",
      "diet_tags": [
        "sin_tacc",
        "sin_lactosa"
      ],
      "min_price": 257,
      "offers": {
        "frog": {
          "price": 257,
          "url": "https://www.frog.com.uy/buscar?q=camarones"
        },
        "el_dorado": {
          "price": 260,
          "url": "https://www.eldorado.com.uy/camarones?_q=camarones&map=ft"
        },
        "tata": {
          "price": 268,
          "url": "https://www.tata.com.uy/buscar?text=camarones"
        },
        "devoto": {
          "price": 276,
          "url": "https://www.devoto.com.uy/productos/keyword/camarones"
        },
        "disco": {
          "price": 279,
          "url": "https://www.disco.com.uy/productos/keyword/camarones"
        },
        "geant": {
          "price": 282,
          "url": "https://www.geant.com.uy/productos/keyword/camarones"
        },
        "tienda_inglesa": {
          "price": 305,
          "url": "https://www.tiendainglesa.com.uy/supermercado/busqueda?0,0,camarones,0"
        }
      }
    }
  ],
  "carne_picada": [
    {
      "id": 1958,
      "ean": "7730991006002",
      "name": "Carne Vacuna Picada Magra Especial 500 g",
      "brand": "Frigorífico",
      "unit_size": "500 g",
      "diet_tags": [
        "sin_tacc",
        "sin_lactosa"
      ],
      "min_price": 198,
      "offers": {
        "frog": {
          "price": 198,
          "url": "https://www.frog.com.uy/buscar?q=carne%20picada%20magra"
        },
        "el_dorado": {
          "price": 200,
          "url": "https://www.eldorado.com.uy/carne%20picada%20magra?_q=carne%20picada%20magra&map=ft"
        },
        "tata": {
          "price": 206,
          "url": "https://www.tata.com.uy/buscar?text=carne%20picada%20magra"
        },
        "devoto": {
          "price": 213,
          "url": "https://www.devoto.com.uy/productos/keyword/carne%20picada%20magra"
        },
        "disco": {
          "price": 215,
          "url": "https://www.disco.com.uy/productos/keyword/carne%20picada%20magra"
        },
        "geant": {
          "price": 217,
          "url": "https://www.geant.com.uy/productos/keyword/carne%20picada%20magra"
        },
        "tienda_inglesa": {
          "price": 235,
          "url": "https://www.tiendainglesa.com.uy/supermercado/busqueda?0,0,carne%20picada%20magra,0"
        }
      }
    }
  ],
  "cerdo": [
    {
      "id": 1960,
      "ean": "7730991006004",
      "name": "Carne de Cerdo Magra / Bondiola 500 g",
      "brand": "Cattivelli",
      "unit_size": "500 g",
      "diet_tags": [
        "sin_tacc",
        "sin_lactosa"
      ],
      "min_price": 186,
      "offers": {
        "frog": {
          "price": 186,
          "url": "https://www.frog.com.uy/buscar?q=bondiola%20de%20cerdo"
        },
        "geant": {
          "price": 186,
          "url": "https://www.geant.com.uy/productos/keyword/bondiola%20de%20cerdo"
        },
        "el_dorado": {
          "price": 188,
          "url": "https://www.eldorado.com.uy/bondiola%20de%20cerdo?_q=bondiola%20de%20cerdo&map=ft"
        },
        "tata": {
          "price": 194,
          "url": "https://www.tata.com.uy/buscar?text=bondiola%20de%20cerdo"
        },
        "devoto": {
          "price": 200,
          "url": "https://www.devoto.com.uy/productos/keyword/bondiola%20de%20cerdo"
        },
        "tienda_inglesa": {
          "price": 201,
          "url": "https://www.tiendainglesa.com.uy/supermercado/busqueda?0,0,bondiola%20de%20cerdo,0"
        },
        "disco": {
          "price": 202,
          "url": "https://www.disco.com.uy/productos/keyword/bondiola%20de%20cerdo"
        }
      }
    },
    {
      "id": 496,
      "ean": "",
      "name": "Caldo de costilla APTI x 6 un.",
      "brand": "Apti",
      "unit_size": "6 un",
      "diet_tags": [],
      "min_price": 37,
      "offers": {
        "disco": {
          "price": 37,
          "url": "https://www.disco.com.uy/product/caldo-de-costilla-apti-x-6-un/472449"
        },
        "devoto": {
          "price": 37,
          "url": "https://www.devoto.com.uy/product/caldo-de-costilla-apti-x-6-un/472449"
        },
        "geant": {
          "price": 37,
          "url": "https://www.geant.com.uy/product/caldo-de-costilla-apti-x-6-un/472449"
        }
      }
    }
  ],
  "cebolla": [
    {
      "id": 1986,
      "ean": "7730991008004",
      "name": "Cebolla Blanca o Morada 500 g",
      "brand": "Feria / Frescos",
      "unit_size": "500 g",
      "diet_tags": [
        "sin_tacc",
        "sin_lactosa",
        "vegano"
      ],
      "min_price": 42,
      "offers": {
        "tata": {
          "price": 42,
          "url": "https://www.tata.com.uy/buscar?text=cebolla"
        },
        "frog": {
          "price": 44,
          "url": "https://www.frog.com.uy/buscar?q=cebolla"
        },
        "geant": {
          "price": 44,
          "url": "https://www.geant.com.uy/productos/keyword/cebolla"
        },
        "el_dorado": {
          "price": 45,
          "url": "https://www.eldorado.com.uy/cebolla?_q=cebolla&map=ft"
        },
        "devoto": {
          "price": 47,
          "url": "https://www.devoto.com.uy/productos/keyword/cebolla"
        },
        "disco": {
          "price": 48,
          "url": "https://www.disco.com.uy/productos/keyword/cebolla"
        },
        "tienda_inglesa": {
          "price": 48,
          "url": "https://www.tiendainglesa.com.uy/supermercado/busqueda?0,0,cebolla,0"
        }
      }
    }
  ],
  "cebolla_verdeo": [
    {
      "id": 1987,
      "ean": "7730991008005",
      "name": "Cebolla de Verdeo / Puerro Atado Fresco",
      "brand": "Feria / Frescos",
      "unit_size": "",
      "diet_tags": [
        "sin_tacc",
        "sin_lactosa",
        "vegano"
      ],
      "min_price": 45,
      "offers": {
        "tata": {
          "price": 45,
          "url": "https://www.tata.com.uy/buscar?text=cebolla%20de%20verdeo"
        },
        "frog": {
          "price": 48,
          "url": "https://www.frog.com.uy/buscar?q=cebolla%20de%20verdeo"
        },
        "el_dorado": {
          "price": 48,
          "url": "https://www.eldorado.com.uy/cebolla%20de%20verdeo?_q=cebolla%20de%20verdeo&map=ft"
        },
        "geant": {
          "price": 48,
          "url": "https://www.geant.com.uy/productos/keyword/cebolla%20de%20verdeo"
        },
        "devoto": {
          "price": 51,
          "url": "https://www.devoto.com.uy/productos/keyword/cebolla%20de%20verdeo"
        },
        "disco": {
          "price": 51,
          "url": "https://www.disco.com.uy/productos/keyword/cebolla%20de%20verdeo"
        },
        "tienda_inglesa": {
          "price": 51,
          "url": "https://www.tiendainglesa.com.uy/supermercado/busqueda?0,0,cebolla%20de%20verdeo,0"
        }
      }
    }
  ],
  "champinones": [
    {
      "id": 1998,
      "ean": "7730991008016",
      "name": "Champiñones Frescos Fileteados Bandeja 200 g",
      "brand": "Feria / Frescos",
      "unit_size": "200 g",
      "diet_tags": [
        "sin_tacc",
        "sin_lactosa",
        "vegano"
      ],
      "min_price": 132,
      "offers": {
        "el_dorado": {
          "price": 132,
          "url": "https://www.eldorado.com.uy/champinones?_q=champinones&map=ft"
        },
        "tata": {
          "price": 136,
          "url": "https://www.tata.com.uy/buscar?text=champinones"
        },
        "devoto": {
          "price": 141,
          "url": "https://www.devoto.com.uy/productos/keyword/champinones"
        },
        "frog": {
          "price": 143,
          "url": "https://www.frog.com.uy/buscar?q=champinones"
        },
        "geant": {
          "price": 144,
          "url": "https://www.geant.com.uy/productos/keyword/champinones"
        },
        "disco": {
          "price": 155,
          "url": "https://www.disco.com.uy/productos/keyword/champinones"
        },
        "tienda_inglesa": {
          "price": 155,
          "url": "https://www.tiendainglesa.com.uy/supermercado/busqueda?0,0,champinones,0"
        }
      }
    }
  ],
  "choclo": [
    {
      "id": 1956,
      "ean": "7730991005017",
      "name": "Choclo Amarillo en Grano Arcor 300 g",
      "brand": "Arcor",
      "unit_size": "300 g",
      "diet_tags": [
        "sin_tacc",
        "vegano"
      ],
      "min_price": 54,
      "offers": {
        "tata": {
          "price": 54,
          "url": "https://www.tata.com.uy/buscar?text=choclo%20en%20grano"
        },
        "frog": {
          "price": 57,
          "url": "https://www.frog.com.uy/buscar?q=choclo%20en%20grano"
        },
        "geant": {
          "price": 57,
          "url": "https://www.geant.com.uy/productos/keyword/choclo%20en%20grano"
        },
        "el_dorado": {
          "price": 58,
          "url": "https://www.eldorado.com.uy/choclo%20en%20grano?_q=choclo%20en%20grano&map=ft"
        },
        "devoto": {
          "price": 61,
          "url": "https://www.devoto.com.uy/productos/keyword/choclo%20en%20grano"
        },
        "disco": {
          "price": 62,
          "url": "https://www.disco.com.uy/productos/keyword/choclo%20en%20grano"
        },
        "tienda_inglesa": {
          "price": 62,
          "url": "https://www.tiendainglesa.com.uy/supermercado/busqueda?0,0,choclo%20en%20grano,0"
        }
      }
    }
  ],
  "chorizo": [
    {
      "id": 1961,
      "ean": "7730991006005",
      "name": "Chorizo de Cerdo Extra Cattivelli Pack x 2 un",
      "brand": "Cattivelli",
      "unit_size": "2 un",
      "diet_tags": [
        "sin_tacc",
        "sin_lactosa"
      ],
      "min_price": 141,
      "offers": {
        "frog": {
          "price": 141,
          "url": "https://www.frog.com.uy/buscar?q=chorizo%20cattivelli"
        },
        "geant": {
          "price": 141,
          "url": "https://www.geant.com.uy/productos/keyword/chorizo%20cattivelli"
        },
        "el_dorado": {
          "price": 142,
          "url": "https://www.eldorado.com.uy/chorizo%20cattivelli?_q=chorizo%20cattivelli&map=ft"
        },
        "tata": {
          "price": 146,
          "url": "https://www.tata.com.uy/buscar?text=chorizo%20cattivelli"
        },
        "devoto": {
          "price": 151,
          "url": "https://www.devoto.com.uy/productos/keyword/chorizo%20cattivelli"
        },
        "disco": {
          "price": 152,
          "url": "https://www.disco.com.uy/productos/keyword/chorizo%20cattivelli"
        },
        "tienda_inglesa": {
          "price": 152,
          "url": "https://www.tiendainglesa.com.uy/supermercado/busqueda?0,0,chorizo%20cattivelli,0"
        }
      }
    },
    {
      "id": 526,
      "ean": "",
      "name": "Lentejas con chorizo listo para comer 300 g",
      "brand": "",
      "unit_size": "300 g",
      "diet_tags": [],
      "min_price": 249,
      "offers": {
        "devoto": {
          "price": 249,
          "url": "https://www.devoto.com.uy/product/lentejas-con-chorizo-listo-para-comer-300-g/981079"
        }
      }
    }
  ],
  "coco_rallado": [
    {
      "id": 2006,
      "ean": "7730991007017",
      "name": "Coco Rallado Niter Sin TACC 100 g",
      "brand": "Niter",
      "unit_size": "100 g",
      "diet_tags": [
        "sin_tacc",
        "sin_lactosa",
        "vegano"
      ],
      "min_price": 71,
      "offers": {
        "el_dorado": {
          "price": 71,
          "url": "https://www.eldorado.com.uy/coco%20rallado?_q=coco%20rallado&map=ft"
        },
        "tata": {
          "price": 73,
          "url": "https://www.tata.com.uy/buscar?text=coco%20rallado"
        },
        "devoto": {
          "price": 76,
          "url": "https://www.devoto.com.uy/productos/keyword/coco%20rallado"
        },
        "frog": {
          "price": 77,
          "url": "https://www.frog.com.uy/buscar?q=coco%20rallado"
        },
        "geant": {
          "price": 77,
          "url": "https://www.geant.com.uy/productos/keyword/coco%20rallado"
        },
        "disco": {
          "price": 84,
          "url": "https://www.disco.com.uy/productos/keyword/coco%20rallado"
        },
        "tienda_inglesa": {
          "price": 84,
          "url": "https://www.tiendainglesa.com.uy/supermercado/busqueda?0,0,coco%20rallado,0"
        }
      }
    },
    {
      "id": 1188,
      "ean": "7896274113941",
      "name": "Galletas Dulces Germani Rosquita Coco 300gr",
      "brand": "Germani",
      "unit_size": "300gr",
      "diet_tags": [],
      "min_price": 38,
      "offers": {
        "el_dorado": {
          "price": 38,
          "url": "https://www.eldorado.com.uy/galletas-dulces-germani-rosquita-coco-300gr/p"
        }
      }
    }
  ],
  "especias": [
    {
      "id": 1982,
      "ean": "7730991007013",
      "name": "Condimento Orégano / Pimentón / Nuez Moscada Monte Cudine 25 g",
      "brand": "Monte Cudine",
      "unit_size": "25 g",
      "diet_tags": [
        "sin_tacc",
        "sin_lactosa",
        "vegano"
      ],
      "min_price": 46,
      "offers": {
        "frog": {
          "price": 46,
          "url": "https://www.frog.com.uy/buscar?q=oregano%20monte%20cudine"
        },
        "el_dorado": {
          "price": 46,
          "url": "https://www.eldorado.com.uy/oregano%20monte%20cudine?_q=oregano%20monte%20cudine&map=ft"
        },
        "geant": {
          "price": 46,
          "url": "https://www.geant.com.uy/productos/keyword/oregano%20monte%20cudine"
        },
        "tata": {
          "price": 47,
          "url": "https://www.tata.com.uy/buscar?text=oregano%20monte%20cudine"
        },
        "devoto": {
          "price": 49,
          "url": "https://www.devoto.com.uy/productos/keyword/oregano%20monte%20cudine"
        },
        "disco": {
          "price": 49,
          "url": "https://www.disco.com.uy/productos/keyword/oregano%20monte%20cudine"
        },
        "tienda_inglesa": {
          "price": 49,
          "url": "https://www.tiendainglesa.com.uy/supermercado/busqueda?0,0,oregano%20monte%20cudine,0"
        }
      }
    }
  ],
  "crema_vegetal": [
    {
      "id": 1919,
      "ean": "7730991002005",
      "name": "Crema Vegetal de Avena para Cocinar 200 ml",
      "brand": "Silk",
      "unit_size": "200 ml",
      "diet_tags": [
        "sin_lactosa",
        "vegano"
      ],
      "min_price": 122,
      "offers": {
        "el_dorado": {
          "price": 122,
          "url": "https://www.eldorado.com.uy/crema%20vegetal?_q=crema%20vegetal&map=ft"
        },
        "tata": {
          "price": 125,
          "url": "https://www.tata.com.uy/buscar?text=crema%20vegetal"
        },
        "devoto": {
          "price": 129,
          "url": "https://www.devoto.com.uy/productos/keyword/crema%20vegetal"
        },
        "disco": {
          "price": 131,
          "url": "https://www.disco.com.uy/productos/keyword/crema%20vegetal"
        },
        "frog": {
          "price": 132,
          "url": "https://www.frog.com.uy/buscar?q=crema%20vegetal"
        },
        "geant": {
          "price": 132,
          "url": "https://www.geant.com.uy/productos/keyword/crema%20vegetal"
        },
        "tienda_inglesa": {
          "price": 143,
          "url": "https://www.tiendainglesa.com.uy/supermercado/busqueda?0,0,crema%20vegetal,0"
        }
      }
    }
  ],
  "crema_deslactosada": [
    {
      "id": 1916,
      "ean": "7730991002002",
      "name": "Crema de Leche Deslactosada Conaprole 250 ml",
      "brand": "Conaprole",
      "unit_size": "250 ml",
      "diet_tags": [
        "sin_lactosa"
      ],
      "min_price": 109,
      "offers": {
        "tata": {
          "price": 109,
          "url": "https://www.tata.com.uy/buscar?text=crema%20de%20leche%20deslactosada"
        },
        "frog": {
          "price": 114,
          "url": "https://www.frog.com.uy/buscar?q=crema%20de%20leche%20deslactosada"
        },
        "geant": {
          "price": 114,
          "url": "https://www.geant.com.uy/productos/keyword/crema%20de%20leche%20deslactosada"
        },
        "el_dorado": {
          "price": 115,
          "url": "https://www.eldorado.com.uy/crema%20de%20leche%20deslactosada?_q=crema%20de%20leche%20deslactosada&map=ft"
        },
        "devoto": {
          "price": 123,
          "url": "https://www.devoto.com.uy/productos/keyword/crema%20de%20leche%20deslactosada"
        },
        "disco": {
          "price": 124,
          "url": "https://www.disco.com.uy/productos/keyword/crema%20de%20leche%20deslactosada"
        },
        "tienda_inglesa": {
          "price": 124,
          "url": "https://www.tiendainglesa.com.uy/supermercado/busqueda?0,0,crema%20de%20leche%20deslactosada,0"
        }
      }
    }
  ],
  "crema_de_leche": [
    {
      "id": 1935,
      "ean": "7730991004007",
      "name": "Crema de Leche Fresca Conaprole 250 ml",
      "brand": "Conaprole",
      "unit_size": "250 ml",
      "diet_tags": [
        "sin_tacc"
      ],
      "min_price": 94,
      "offers": {
        "frog": {
          "price": 94,
          "url": "https://www.frog.com.uy/buscar?q=crema%20de%20leche%20conaprole"
        },
        "geant": {
          "price": 94,
          "url": "https://www.geant.com.uy/productos/keyword/crema%20de%20leche%20conaprole"
        },
        "el_dorado": {
          "price": 95,
          "url": "https://www.eldorado.com.uy/crema%20de%20leche%20conaprole?_q=crema%20de%20leche%20conaprole&map=ft"
        },
        "tata": {
          "price": 98,
          "url": "https://www.tata.com.uy/buscar?text=crema%20de%20leche%20conaprole"
        },
        "devoto": {
          "price": 101,
          "url": "https://www.devoto.com.uy/productos/keyword/crema%20de%20leche%20conaprole"
        },
        "disco": {
          "price": 102,
          "url": "https://www.disco.com.uy/productos/keyword/crema%20de%20leche%20conaprole"
        },
        "tienda_inglesa": {
          "price": 102,
          "url": "https://www.tiendainglesa.com.uy/supermercado/busqueda?0,0,crema%20de%20leche%20conaprole,0"
        }
      }
    },
    {
      "id": 1679,
      "ean": "7730901250299",
      "name": "Crema De Leche Calcar 250Cc",
      "brand": "Calcar",
      "unit_size": "250Cc",
      "diet_tags": [],
      "min_price": 100,
      "offers": {
        "el_dorado": {
          "price": 100,
          "url": "https://www.eldorado.com.uy/crema-de-leche-calcar-250cc/p"
        }
      }
    }
  ],
  "dulce_de_leche": [
    {
      "id": 2004,
      "ean": "7730991007015",
      "name": "Dulce de Leche Clásico Conaprole Sin TACC 500 g",
      "brand": "Conaprole",
      "unit_size": "500 g",
      "diet_tags": [
        "sin_tacc"
      ],
      "min_price": 120,
      "offers": {
        "tata": {
          "price": 120,
          "url": "https://www.tata.com.uy/buscar?text=dulce%20de%20leche%20conaprole"
        },
        "frog": {
          "price": 126,
          "url": "https://www.frog.com.uy/buscar?q=dulce%20de%20leche%20conaprole"
        },
        "geant": {
          "price": 126,
          "url": "https://www.geant.com.uy/productos/keyword/dulce%20de%20leche%20conaprole"
        },
        "el_dorado": {
          "price": 127,
          "url": "https://www.eldorado.com.uy/dulce%20de%20leche%20conaprole?_q=dulce%20de%20leche%20conaprole&map=ft"
        },
        "devoto": {
          "price": 135,
          "url": "https://www.devoto.com.uy/productos/keyword/dulce%20de%20leche%20conaprole"
        },
        "tienda_inglesa": {
          "price": 136,
          "url": "https://www.tiendainglesa.com.uy/supermercado/busqueda?0,0,dulce%20de%20leche%20conaprole,0"
        },
        "disco": {
          "price": 137,
          "url": "https://www.disco.com.uy/productos/keyword/dulce%20de%20leche%20conaprole"
        }
      }
    },
    {
      "id": 152,
      "ean": "",
      "name": "Dulce crema de leche CONAPROLE 500 g",
      "brand": "Conaprole",
      "unit_size": "500 g",
      "diet_tags": [],
      "min_price": 130,
      "offers": {
        "tata": {
          "price": 130,
          "url": "https://www.tata.com.uy/dulce-de-leche-crema-conaprole-500-g-377/p"
        },
        "geant": {
          "price": 133,
          "url": "https://www.geant.com.uy/product/dulce-crema-de-leche-conaprole-500-g/220375"
        },
        "disco": {
          "price": 135,
          "url": "https://www.disco.com.uy/product/dulce-crema-de-leche-conaprole-500-g/220375"
        },
        "devoto": {
          "price": 135,
          "url": "https://www.devoto.com.uy/product/dulce-crema-de-leche-conaprole-500-g/220375"
        },
        "tienda_inglesa": {
          "price": 140,
          "url": "https://www.tiendainglesa.com.uy/supermercado/dulce-crema-de-leche-conaprole-500-g.producto?1157,,42"
        }
      }
    }
  ],
  "membrillo": [
    {
      "id": 2005,
      "ean": "7730991007016",
      "name": "Dulce de Membrillo Los Nietitos Sin TACC 400 g",
      "brand": "Los Nietitos",
      "unit_size": "400 g",
      "diet_tags": [
        "sin_tacc",
        "sin_lactosa",
        "vegano"
      ],
      "min_price": 104,
      "offers": {
        "el_dorado": {
          "price": 104,
          "url": "https://www.eldorado.com.uy/dulce%20de%20membrillo?_q=dulce%20de%20membrillo&map=ft"
        },
        "tata": {
          "price": 107,
          "url": "https://www.tata.com.uy/buscar?text=dulce%20de%20membrillo"
        },
        "frog": {
          "price": 113,
          "url": "https://www.frog.com.uy/buscar?q=dulce%20de%20membrillo"
        },
        "geant": {
          "price": 113,
          "url": "https://www.geant.com.uy/productos/keyword/dulce%20de%20membrillo"
        },
        "devoto": {
          "price": 121,
          "url": "https://www.devoto.com.uy/productos/keyword/dulce%20de%20membrillo"
        },
        "disco": {
          "price": 122,
          "url": "https://www.disco.com.uy/productos/keyword/dulce%20de%20membrillo"
        },
        "tienda_inglesa": {
          "price": 122,
          "url": "https://www.tiendainglesa.com.uy/supermercado/busqueda?0,0,dulce%20de%20membrillo,0"
        }
      }
    }
  ],
  "edulcorante": [
    {
      "id": 1923,
      "ean": "7730991003001",
      "name": "Edulcorante Líquido Stevia Azucarlito 180 ml",
      "brand": "Azucarlito",
      "unit_size": "180 ml",
      "diet_tags": [
        "sin_azucar",
        "sin_tacc"
      ],
      "min_price": 124,
      "offers": {
        "tata": {
          "price": 124,
          "url": "https://www.tata.com.uy/buscar?text=edulcorante%20stevia"
        },
        "frog": {
          "price": 131,
          "url": "https://www.frog.com.uy/buscar?q=edulcorante%20stevia"
        },
        "geant": {
          "price": 131,
          "url": "https://www.geant.com.uy/productos/keyword/edulcorante%20stevia"
        },
        "el_dorado": {
          "price": 132,
          "url": "https://www.eldorado.com.uy/edulcorante%20stevia?_q=edulcorante%20stevia&map=ft"
        },
        "devoto": {
          "price": 140,
          "url": "https://www.devoto.com.uy/productos/keyword/edulcorante%20stevia"
        },
        "disco": {
          "price": 142,
          "url": "https://www.disco.com.uy/productos/keyword/edulcorante%20stevia"
        },
        "tienda_inglesa": {
          "price": 142,
          "url": "https://www.tiendainglesa.com.uy/supermercado/busqueda?0,0,edulcorante%20stevia,0"
        }
      }
    },
    {
      "id": 278,
      "ean": "",
      "name": "Azucar Stevia Azucarlito 500 G",
      "brand": "",
      "unit_size": "500 G",
      "diet_tags": [
        "sin_azucar"
      ],
      "min_price": 173,
      "offers": {
        "tata": {
          "price": 173,
          "url": "https://www.tata.com.uy/azucar-stevia-azucarlito-500-g-155098/p"
        }
      }
    }
  ],
  "espinaca": [
    {
      "id": 1993,
      "ean": "7730991008011",
      "name": "Espinaca Fresca Lavada Atado 300 g",
      "brand": "Feria / Frescos",
      "unit_size": "300 g",
      "diet_tags": [
        "sin_tacc",
        "sin_lactosa",
        "vegano"
      ],
      "min_price": 55,
      "offers": {
        "frog": {
          "price": 55,
          "url": "https://www.frog.com.uy/buscar?q=espinaca%20fresca"
        },
        "el_dorado": {
          "price": 55,
          "url": "https://www.eldorado.com.uy/espinaca%20fresca?_q=espinaca%20fresca&map=ft"
        },
        "geant": {
          "price": 55,
          "url": "https://www.geant.com.uy/productos/keyword/espinaca%20fresca"
        },
        "tata": {
          "price": 57,
          "url": "https://www.tata.com.uy/buscar?text=espinaca%20fresca"
        },
        "devoto": {
          "price": 59,
          "url": "https://www.devoto.com.uy/productos/keyword/espinaca%20fresca"
        },
        "disco": {
          "price": 59,
          "url": "https://www.disco.com.uy/productos/keyword/espinaca%20fresca"
        },
        "tienda_inglesa": {
          "price": 59,
          "url": "https://www.tiendainglesa.com.uy/supermercado/busqueda?0,0,espinaca%20fresca,0"
        }
      }
    },
    {
      "id": 586,
      "ean": "",
      "name": "Fideos Tallarines Espinaca Cololó 500 G",
      "brand": "",
      "unit_size": "500 G",
      "diet_tags": [],
      "min_price": 77,
      "offers": {
        "tata": {
          "price": 77,
          "url": "https://www.tata.com.uy/fideos-tallarines-espinaca-cololo-500-g-331/p"
        }
      }
    }
  ],
  "esparragos": [
    {
      "id": 1999,
      "ean": "7730991008017",
      "name": "Espárragos Tiernos Atado / Frasco 250 g",
      "brand": "Feria / Frescos",
      "unit_size": "250 g",
      "diet_tags": [
        "sin_tacc",
        "sin_lactosa",
        "vegano"
      ],
      "min_price": 146,
      "offers": {
        "el_dorado": {
          "price": 146,
          "url": "https://www.eldorado.com.uy/esparragos?_q=esparragos&map=ft"
        },
        "tata": {
          "price": 151,
          "url": "https://www.tata.com.uy/buscar?text=esparragos"
        },
        "devoto": {
          "price": 156,
          "url": "https://www.devoto.com.uy/productos/keyword/esparragos"
        },
        "disco": {
          "price": 157,
          "url": "https://www.disco.com.uy/productos/keyword/esparragos"
        },
        "frog": {
          "price": 159,
          "url": "https://www.frog.com.uy/buscar?q=esparragos"
        },
        "geant": {
          "price": 159,
          "url": "https://www.geant.com.uy/productos/keyword/esparragos"
        },
        "tienda_inglesa": {
          "price": 172,
          "url": "https://www.tiendainglesa.com.uy/supermercado/busqueda?0,0,esparragos,0"
        }
      }
    }
  ],
  "extracto_tomate": [
    {
      "id": 1973,
      "ean": "7730991007004",
      "name": "Extracto Doble de Tomate Gourmet 140 g",
      "brand": "Gourmet",
      "unit_size": "140 g",
      "diet_tags": [
        "sin_tacc",
        "sin_lactosa",
        "vegano"
      ],
      "min_price": 49,
      "offers": {
        "frog": {
          "price": 49,
          "url": "https://www.frog.com.uy/buscar?q=extracto%20de%20tomate"
        },
        "geant": {
          "price": 49,
          "url": "https://www.geant.com.uy/productos/keyword/extracto%20de%20tomate"
        },
        "el_dorado": {
          "price": 50,
          "url": "https://www.eldorado.com.uy/extracto%20de%20tomate?_q=extracto%20de%20tomate&map=ft"
        },
        "tata": {
          "price": 51,
          "url": "https://www.tata.com.uy/buscar?text=extracto%20de%20tomate"
        },
        "devoto": {
          "price": 53,
          "url": "https://www.devoto.com.uy/productos/keyword/extracto%20de%20tomate"
        },
        "tienda_inglesa": {
          "price": 53,
          "url": "https://www.tiendainglesa.com.uy/supermercado/busqueda?0,0,extracto%20de%20tomate,0"
        },
        "disco": {
          "price": 54,
          "url": "https://www.disco.com.uy/productos/keyword/extracto%20de%20tomate"
        }
      }
    },
    {
      "id": 420,
      "ean": "",
      "name": "Extracto de tomate PITZER sachet 60 g",
      "brand": "Pitzer",
      "unit_size": "60 g",
      "diet_tags": [],
      "min_price": 20,
      "offers": {
        "disco": {
          "price": 20,
          "url": "https://www.disco.com.uy/product/extracto-de-tomate-pitzer-sachet-60-g/703862"
        },
        "devoto": {
          "price": 20,
          "url": "https://www.devoto.com.uy/product/extracto-de-tomate-pitzer-sachet-60-g/703862"
        },
        "geant": {
          "price": 20,
          "url": "https://www.geant.com.uy/product/extracto-de-tomate-pitzer-sachet-60-g/703862"
        }
      }
    }
  ],
  "fideos": [
    {
      "id": 1941,
      "ean": "7730991005002",
      "name": "Fideos Penne Rigate / Mostachol Adria 500 g",
      "brand": "Adria",
      "unit_size": "500 g",
      "diet_tags": [],
      "min_price": 59,
      "offers": {
        "el_dorado": {
          "price": 59,
          "url": "https://www.eldorado.com.uy/fideos%20penne%20adria?_q=fideos%20penne%20adria&map=ft"
        },
        "tata": {
          "price": 61,
          "url": "https://www.tata.com.uy/buscar?text=fideos%20penne%20adria"
        },
        "devoto": {
          "price": 63,
          "url": "https://www.devoto.com.uy/productos/keyword/fideos%20penne%20adria"
        },
        "disco": {
          "price": 63,
          "url": "https://www.disco.com.uy/productos/keyword/fideos%20penne%20adria"
        },
        "frog": {
          "price": 64,
          "url": "https://www.frog.com.uy/buscar?q=fideos%20penne%20adria"
        },
        "geant": {
          "price": 64,
          "url": "https://www.geant.com.uy/productos/keyword/fideos%20penne%20adria"
        },
        "tienda_inglesa": {
          "price": 69,
          "url": "https://www.tiendainglesa.com.uy/supermercado/busqueda?0,0,fideos%20penne%20adria,0"
        }
      }
    },
    {
      "id": 1940,
      "ean": "7730991005001",
      "name": "Fideos al Huevo Las Acacias Spaghetti / Fettuccini 500 g",
      "brand": "Las Acacias",
      "unit_size": "500 g",
      "diet_tags": [],
      "min_price": 63,
      "offers": {
        "el_dorado": {
          "price": 63,
          "url": "https://www.eldorado.com.uy/fideos%20las%20acacias?_q=fideos%20las%20acacias&map=ft"
        },
        "tata": {
          "price": 65,
          "url": "https://www.tata.com.uy/buscar?text=fideos%20las%20acacias"
        },
        "devoto": {
          "price": 67,
          "url": "https://www.devoto.com.uy/productos/keyword/fideos%20las%20acacias"
        },
        "frog": {
          "price": 68,
          "url": "https://www.frog.com.uy/buscar?q=fideos%20las%20acacias"
        },
        "geant": {
          "price": 68,
          "url": "https://www.geant.com.uy/productos/keyword/fideos%20las%20acacias"
        },
        "disco": {
          "price": 74,
          "url": "https://www.disco.com.uy/productos/keyword/fideos%20las%20acacias"
        },
        "tienda_inglesa": {
          "price": 74,
          "url": "https://www.tiendainglesa.com.uy/supermercado/busqueda?0,0,fideos%20las%20acacias,0"
        }
      }
    }
  ],
  "fideos_sin_tacc": [
    {
      "id": 1906,
      "ean": "7730991001003",
      "name": "Fideos Spaghetti Sin Gluten Blue Patna Sin TACC 500 g",
      "brand": "Blue Patna",
      "unit_size": "500 g",
      "diet_tags": [
        "sin_tacc"
      ],
      "min_price": 128,
      "offers": {
        "tata": {
          "price": 128,
          "url": "https://www.tata.com.uy/buscar?text=spaghetti%20sin%20gluten"
        },
        "frog": {
          "price": 135,
          "url": "https://www.frog.com.uy/buscar?q=spaghetti%20sin%20gluten"
        },
        "geant": {
          "price": 135,
          "url": "https://www.geant.com.uy/productos/keyword/spaghetti%20sin%20gluten"
        },
        "el_dorado": {
          "price": 136,
          "url": "https://www.eldorado.com.uy/spaghetti%20sin%20gluten?_q=spaghetti%20sin%20gluten&map=ft"
        },
        "devoto": {
          "price": 145,
          "url": "https://www.devoto.com.uy/productos/keyword/spaghetti%20sin%20gluten"
        },
        "disco": {
          "price": 146,
          "url": "https://www.disco.com.uy/productos/keyword/spaghetti%20sin%20gluten"
        },
        "tienda_inglesa": {
          "price": 146,
          "url": "https://www.tiendainglesa.com.uy/supermercado/busqueda?0,0,spaghetti%20sin%20gluten,0"
        }
      }
    },
    {
      "id": 1905,
      "ean": "7730991001002",
      "name": "Fideos Tirabuzón de Maíz y Arroz Sin TACC Matarazzo 500 g",
      "brand": "Matarazzo",
      "unit_size": "500 g",
      "diet_tags": [
        "sin_tacc"
      ],
      "min_price": 132,
      "offers": {
        "tata": {
          "price": 132,
          "url": "https://www.tata.com.uy/buscar?text=fideos%20sin%20gluten"
        },
        "frog": {
          "price": 139,
          "url": "https://www.frog.com.uy/buscar?q=fideos%20sin%20gluten"
        },
        "geant": {
          "price": 139,
          "url": "https://www.geant.com.uy/productos/keyword/fideos%20sin%20gluten"
        },
        "el_dorado": {
          "price": 140,
          "url": "https://www.eldorado.com.uy/fideos%20sin%20gluten?_q=fideos%20sin%20gluten&map=ft"
        },
        "devoto": {
          "price": 149,
          "url": "https://www.devoto.com.uy/productos/keyword/fideos%20sin%20gluten"
        },
        "disco": {
          "price": 151,
          "url": "https://www.disco.com.uy/productos/keyword/fideos%20sin%20gluten"
        },
        "tienda_inglesa": {
          "price": 151,
          "url": "https://www.tiendainglesa.com.uy/supermercado/busqueda?0,0,fideos%20sin%20gluten,0"
        }
      }
    }
  ],
  "fideos_integrales": [
    {
      "id": 1926,
      "ean": "7730991003004",
      "name": "Fideos Tallarines Integrales Las Acacias 500 g",
      "brand": "Las Acacias",
      "unit_size": "500 g",
      "diet_tags": [
        "integral"
      ],
      "min_price": 73,
      "offers": {
        "el_dorado": {
          "price": 73,
          "url": "https://www.eldorado.com.uy/fideos%20integrales?_q=fideos%20integrales&map=ft"
        },
        "tata": {
          "price": 75,
          "url": "https://www.tata.com.uy/buscar?text=fideos%20integrales"
        },
        "devoto": {
          "price": 77,
          "url": "https://www.devoto.com.uy/productos/keyword/fideos%20integrales"
        },
        "disco": {
          "price": 78,
          "url": "https://www.disco.com.uy/productos/keyword/fideos%20integrales"
        },
        "frog": {
          "price": 79,
          "url": "https://www.frog.com.uy/buscar?q=fideos%20integrales"
        },
        "geant": {
          "price": 79,
          "url": "https://www.geant.com.uy/productos/keyword/fideos%20integrales"
        },
        "tienda_inglesa": {
          "price": 85,
          "url": "https://www.tiendainglesa.com.uy/supermercado/busqueda?0,0,fideos%20integrales,0"
        }
      }
    }
  ],
  "merluza": [
    {
      "id": 1965,
      "ean": "7730991006009",
      "name": "Filet de Merluza sin Espinas 500 g",
      "brand": "Pescadería",
      "unit_size": "500 g",
      "diet_tags": [
        "sin_tacc",
        "sin_lactosa"
      ],
      "min_price": 178,
      "offers": {
        "el_dorado": {
          "price": 178,
          "url": "https://www.eldorado.com.uy/filet%20de%20merluza?_q=filet%20de%20merluza&map=ft"
        },
        "tata": {
          "price": 183,
          "url": "https://www.tata.com.uy/buscar?text=filet%20de%20merluza"
        },
        "devoto": {
          "price": 189,
          "url": "https://www.devoto.com.uy/productos/keyword/filet%20de%20merluza"
        },
        "frog": {
          "price": 193,
          "url": "https://www.frog.com.uy/buscar?q=filet%20de%20merluza"
        },
        "geant": {
          "price": 193,
          "url": "https://www.geant.com.uy/productos/keyword/filet%20de%20merluza"
        },
        "disco": {
          "price": 209,
          "url": "https://www.disco.com.uy/productos/keyword/filet%20de%20merluza"
        },
        "tienda_inglesa": {
          "price": 209,
          "url": "https://www.tiendainglesa.com.uy/supermercado/busqueda?0,0,filet%20de%20merluza,0"
        }
      }
    },
    {
      "id": 617,
      "ean": "",
      "name": "Sal Ahumada Del Gaucho Para Condimentar Pescado 290 Gr",
      "brand": "",
      "unit_size": "290 Gr",
      "diet_tags": [],
      "min_price": 136,
      "offers": {
        "tata": {
          "price": 136,
          "url": "https://www.tata.com.uy/sal-ahumada-del-gaucho-para-condimentar-pescado-290-gr-1000569196-171058/p"
        }
      }
    }
  ],
  "salmon": [
    {
      "id": 1966,
      "ean": "7730991006010",
      "name": "Filet de Salmón Rosado Premium 300 g",
      "brand": "Pescadería",
      "unit_size": "300 g",
      "diet_tags": [
        "sin_tacc",
        "sin_lactosa"
      ],
      "min_price": 355,
      "offers": {
        "el_dorado": {
          "price": 355,
          "url": "https://www.eldorado.com.uy/salmon%20rosado?_q=salmon%20rosado&map=ft"
        },
        "tata": {
          "price": 366,
          "url": "https://www.tata.com.uy/buscar?text=salmon%20rosado"
        },
        "devoto": {
          "price": 377,
          "url": "https://www.devoto.com.uy/productos/keyword/salmon%20rosado"
        },
        "disco": {
          "price": 381,
          "url": "https://www.disco.com.uy/productos/keyword/salmon%20rosado"
        },
        "frog": {
          "price": 384,
          "url": "https://www.frog.com.uy/buscar?q=salmon%20rosado"
        },
        "geant": {
          "price": 385,
          "url": "https://www.geant.com.uy/productos/keyword/salmon%20rosado"
        },
        "tienda_inglesa": {
          "price": 416,
          "url": "https://www.tiendainglesa.com.uy/supermercado/busqueda?0,0,salmon%20rosado,0"
        }
      }
    }
  ],
  "anchoas": [
    {
      "id": 1969,
      "ean": "7730991006013",
      "name": "Filetes de Anchoa en Aceite 50 g",
      "brand": "Río de la Plata",
      "unit_size": "50 g",
      "diet_tags": [
        "sin_tacc",
        "sin_lactosa"
      ],
      "min_price": 111,
      "offers": {
        "frog": {
          "price": 111,
          "url": "https://www.frog.com.uy/buscar?q=anchoas"
        },
        "geant": {
          "price": 111,
          "url": "https://www.geant.com.uy/productos/keyword/anchoas"
        },
        "el_dorado": {
          "price": 112,
          "url": "https://www.eldorado.com.uy/anchoas?_q=anchoas&map=ft"
        },
        "tata": {
          "price": 115,
          "url": "https://www.tata.com.uy/buscar?text=anchoas"
        },
        "devoto": {
          "price": 119,
          "url": "https://www.devoto.com.uy/productos/keyword/anchoas"
        },
        "disco": {
          "price": 120,
          "url": "https://www.disco.com.uy/productos/keyword/anchoas"
        },
        "tienda_inglesa": {
          "price": 120,
          "url": "https://www.tiendainglesa.com.uy/supermercado/busqueda?0,0,anchoas,0"
        }
      }
    }
  ],
  "frutas": [
    {
      "id": 2002,
      "ean": "7730991008020",
      "name": "Fruta de Estación (Manzana / Banana / Naranja / Limón) 500 g",
      "brand": "Feria / Frescos",
      "unit_size": "500 g",
      "diet_tags": [
        "sin_tacc",
        "sin_lactosa",
        "vegano"
      ],
      "min_price": 52,
      "offers": {
        "frog": {
          "price": 52,
          "url": "https://www.frog.com.uy/buscar?q=manzana"
        },
        "el_dorado": {
          "price": 52,
          "url": "https://www.eldorado.com.uy/manzana?_q=manzana&map=ft"
        },
        "geant": {
          "price": 52,
          "url": "https://www.geant.com.uy/productos/keyword/manzana"
        },
        "tata": {
          "price": 54,
          "url": "https://www.tata.com.uy/buscar?text=manzana"
        },
        "devoto": {
          "price": 56,
          "url": "https://www.devoto.com.uy/productos/keyword/manzana"
        },
        "disco": {
          "price": 56,
          "url": "https://www.disco.com.uy/productos/keyword/manzana"
        },
        "tienda_inglesa": {
          "price": 56,
          "url": "https://www.tiendainglesa.com.uy/supermercado/busqueda?0,0,manzana,0"
        }
      }
    },
    {
      "id": 209,
      "ean": "",
      "name": "Caramelos CLIGHT Frambuesa 26,5 g",
      "brand": "Clight",
      "unit_size": "26,5 g",
      "diet_tags": [],
      "min_price": 36,
      "offers": {
        "devoto": {
          "price": 36,
          "url": "https://www.devoto.com.uy/product/caramelos-clight-frambuesa-26-5-g/669428"
        },
        "geant": {
          "price": 36,
          "url": "https://www.geant.com.uy/product/caramelos-clight-frambuesa-26-5-g/669428"
        },
        "disco": {
          "price": 36,
          "url": "https://www.disco.com.uy/product/caramelos-clight-frambuesa-26-5-g/669428"
        }
      }
    }
  ],
  "maicena": [
    {
      "id": 1913,
      "ean": "7730991001010",
      "name": "Fécula de Maíz Maizena Sin TACC 200 g",
      "brand": "Maizena",
      "unit_size": "200 g",
      "diet_tags": [
        "sin_tacc"
      ],
      "min_price": 80,
      "offers": {
        "frog": {
          "price": 80,
          "url": "https://www.frog.com.uy/buscar?q=maizena"
        },
        "geant": {
          "price": 80,
          "url": "https://www.geant.com.uy/productos/keyword/maizena"
        },
        "el_dorado": {
          "price": 81,
          "url": "https://www.eldorado.com.uy/maizena?_q=maizena&map=ft"
        },
        "tata": {
          "price": 83,
          "url": "https://www.tata.com.uy/buscar?text=maizena"
        },
        "devoto": {
          "price": 86,
          "url": "https://www.devoto.com.uy/productos/keyword/maizena"
        },
        "tienda_inglesa": {
          "price": 86,
          "url": "https://www.tiendainglesa.com.uy/supermercado/busqueda?0,0,maizena,0"
        },
        "disco": {
          "price": 87,
          "url": "https://www.disco.com.uy/productos/keyword/maizena"
        }
      }
    }
  ],
  "galletas_sin_tacc": [
    {
      "id": 1914,
      "ean": "7730991001011",
      "name": "Galletas de Arroz Saman Clásicas Sin TACC 140 g",
      "brand": "Saman",
      "unit_size": "140 g",
      "diet_tags": [
        "sin_tacc"
      ],
      "min_price": 70,
      "offers": {
        "tata": {
          "price": 70,
          "url": "https://www.tata.com.uy/buscar?text=galletas%20de%20arroz%20saman"
        },
        "frog": {
          "price": 74,
          "url": "https://www.frog.com.uy/buscar?q=galletas%20de%20arroz%20saman"
        },
        "geant": {
          "price": 74,
          "url": "https://www.geant.com.uy/productos/keyword/galletas%20de%20arroz%20saman"
        },
        "el_dorado": {
          "price": 75,
          "url": "https://www.eldorado.com.uy/galletas%20de%20arroz%20saman?_q=galletas%20de%20arroz%20saman&map=ft"
        },
        "devoto": {
          "price": 79,
          "url": "https://www.devoto.com.uy/productos/keyword/galletas%20de%20arroz%20saman"
        },
        "disco": {
          "price": 80,
          "url": "https://www.disco.com.uy/productos/keyword/galletas%20de%20arroz%20saman"
        },
        "tienda_inglesa": {
          "price": 80,
          "url": "https://www.tiendainglesa.com.uy/supermercado/busqueda?0,0,galletas%20de%20arroz%20saman,0"
        }
      }
    },
    {
      "id": 157,
      "ean": "",
      "name": "Galleta de arroz SAMAN Clásica 140 g",
      "brand": "Saman",
      "unit_size": "140 g",
      "diet_tags": [
        "sin_tacc"
      ],
      "min_price": 77,
      "offers": {
        "geant": {
          "price": 77,
          "url": "https://www.geant.com.uy/product/galleta-de-arroz-saman-clasica-140-g/744573"
        },
        "disco": {
          "price": 78,
          "url": "https://www.disco.com.uy/product/galleta-de-arroz-saman-clasica-140-g/744573"
        },
        "devoto": {
          "price": 78,
          "url": "https://www.devoto.com.uy/product/galleta-de-arroz-saman-clasica-140-g/744573"
        },
        "frog": {
          "price": 80,
          "url": "https://frog.uy/gallsaman-arroz-clasica-150gr"
        }
      }
    }
  ],
  "garbanzos": [
    {
      "id": 1952,
      "ean": "7730991005013",
      "name": "Garbanzos en Lata Río de la Plata 300 g",
      "brand": "Río de la Plata",
      "unit_size": "300 g",
      "diet_tags": [
        "sin_tacc",
        "vegano"
      ],
      "min_price": 54,
      "offers": {
        "frog": {
          "price": 54,
          "url": "https://www.frog.com.uy/buscar?q=garbanzos"
        },
        "el_dorado": {
          "price": 55,
          "url": "https://www.eldorado.com.uy/garbanzos?_q=garbanzos&map=ft"
        },
        "tata": {
          "price": 56,
          "url": "https://www.tata.com.uy/buscar?text=garbanzos"
        },
        "devoto": {
          "price": 58,
          "url": "https://www.devoto.com.uy/productos/keyword/garbanzos"
        },
        "geant": {
          "price": 59,
          "url": "https://www.geant.com.uy/productos/keyword/garbanzos"
        },
        "disco": {
          "price": 59,
          "url": "https://www.disco.com.uy/productos/keyword/garbanzos"
        },
        "tienda_inglesa": {
          "price": 64,
          "url": "https://www.tiendainglesa.com.uy/supermercado/busqueda?0,0,garbanzos,0"
        }
      }
    },
    {
      "id": 1118,
      "ean": "7730996170076",
      "name": "Hamburguesas Manducas Sin Gluten Mix Lentejas Garbanzo Mijo",
      "brand": "Manducas",
      "unit_size": "",
      "diet_tags": [
        "sin_tacc"
      ],
      "min_price": 473,
      "offers": {
        "el_dorado": {
          "price": 473,
          "url": "https://www.eldorado.com.uy/hamburguesas-manducas-sin-gluten-mix-lentejas-garbanzo-mijo/p"
        }
      }
    }
  ],
  "harina_trigo": [
    {
      "id": 1948,
      "ean": "7730991005009",
      "name": "Harina de Trigo 0000 Cañuelas 1 kg",
      "brand": "Cañuelas",
      "unit_size": "1 kg",
      "diet_tags": [],
      "min_price": 59,
      "offers": {
        "el_dorado": {
          "price": 59,
          "url": "https://www.eldorado.com.uy/harina%200000?_q=harina%200000&map=ft"
        },
        "tata": {
          "price": 61,
          "url": "https://www.tata.com.uy/buscar?text=harina%200000"
        },
        "frog": {
          "price": 64,
          "url": "https://www.frog.com.uy/buscar?q=harina%200000"
        },
        "geant": {
          "price": 64,
          "url": "https://www.geant.com.uy/productos/keyword/harina%200000"
        },
        "devoto": {
          "price": 68,
          "url": "https://www.devoto.com.uy/productos/keyword/harina%200000"
        },
        "disco": {
          "price": 69,
          "url": "https://www.disco.com.uy/productos/keyword/harina%200000"
        },
        "tienda_inglesa": {
          "price": 69,
          "url": "https://www.tiendainglesa.com.uy/supermercado/busqueda?0,0,harina%200000,0"
        }
      }
    },
    {
      "id": 384,
      "ean": "",
      "name": "Harina 000 CAÑUELAS 1 kg",
      "brand": "Cañuelas",
      "unit_size": "1 kg",
      "diet_tags": [],
      "min_price": 40,
      "offers": {
        "redmarket5": {
          "price": 40,
          "url": "https://redmarket5.com.uy/catalog"
        },
        "disco": {
          "price": 48,
          "url": "https://www.disco.com.uy/product/harina-000-canuelas-1-kg/631195"
        },
        "devoto": {
          "price": 48,
          "url": "https://www.devoto.com.uy/product/harina-000-canuelas-1-kg/631195"
        },
        "geant": {
          "price": 48,
          "url": "https://www.geant.com.uy/product/harina-000-canuelas-1-kg/631195"
        },
        "tata": {
          "price": 58,
          "url": "https://www.tata.com.uy/harina-000-canuelas-1-kg-3363/p"
        }
      }
    }
  ],
  "harina_integral": [
    {
      "id": 1927,
      "ean": "7730991003006",
      "name": "Harina de Trigo Integral Cañuelas 1 kg",
      "brand": "Cañuelas",
      "unit_size": "1 kg",
      "diet_tags": [
        "integral"
      ],
      "min_price": 82,
      "offers": {
        "frog": {
          "price": 82,
          "url": "https://www.frog.com.uy/buscar?q=harina%20integral"
        },
        "el_dorado": {
          "price": 83,
          "url": "https://www.eldorado.com.uy/harina%20integral?_q=harina%20integral&map=ft"
        },
        "tata": {
          "price": 85,
          "url": "https://www.tata.com.uy/buscar?text=harina%20integral"
        },
        "devoto": {
          "price": 88,
          "url": "https://www.devoto.com.uy/productos/keyword/harina%20integral"
        },
        "disco": {
          "price": 89,
          "url": "https://www.disco.com.uy/productos/keyword/harina%20integral"
        },
        "geant": {
          "price": 90,
          "url": "https://www.geant.com.uy/productos/keyword/harina%20integral"
        },
        "tienda_inglesa": {
          "price": 97,
          "url": "https://www.tiendainglesa.com.uy/supermercado/busqueda?0,0,harina%20integral,0"
        }
      }
    },
    {
      "id": 383,
      "ean": "",
      "name": "Harina integral CAÑUELAS 1 kg",
      "brand": "Cañuelas",
      "unit_size": "1 kg",
      "diet_tags": [
        "integral"
      ],
      "min_price": 89,
      "offers": {
        "disco": {
          "price": 89,
          "url": "https://www.disco.com.uy/product/harina-integral-canuelas-1-kg/472129"
        },
        "devoto": {
          "price": 89,
          "url": "https://www.devoto.com.uy/product/harina-integral-canuelas-1-kg/472129"
        },
        "geant": {
          "price": 102,
          "url": "https://www.geant.com.uy/product/harina-integral-canuelas-1-kg/472129"
        },
        "tienda_inglesa": {
          "price": 104,
          "url": "https://www.tiendainglesa.com.uy/supermercado/harina-integral-canuelas-1-kg.producto?407565,,42"
        },
        "tata": {
          "price": 109,
          "url": "https://www.tata.com.uy/harina-integral-cañuelas-1-kg-11984/p"
        }
      }
    }
  ],
  "huevos": [
    {
      "id": 1939,
      "ean": "7730991004011",
      "name": "Huevos Colorados Prodhin Maple x 6 un",
      "brand": "Prodhin",
      "unit_size": "6 un",
      "diet_tags": [
        "sin_tacc"
      ],
      "min_price": 81,
      "offers": {
        "el_dorado": {
          "price": 81,
          "url": "https://www.eldorado.com.uy/huevos?_q=huevos&map=ft"
        },
        "tata": {
          "price": 84,
          "url": "https://www.tata.com.uy/buscar?text=huevos"
        },
        "devoto": {
          "price": 86,
          "url": "https://www.devoto.com.uy/productos/keyword/huevos"
        },
        "frog": {
          "price": 88,
          "url": "https://www.frog.com.uy/buscar?q=huevos"
        },
        "geant": {
          "price": 88,
          "url": "https://www.geant.com.uy/productos/keyword/huevos"
        },
        "disco": {
          "price": 95,
          "url": "https://www.disco.com.uy/productos/keyword/huevos"
        },
        "tienda_inglesa": {
          "price": 95,
          "url": "https://www.tiendainglesa.com.uy/supermercado/busqueda?0,0,huevos,0"
        }
      }
    },
    {
      "id": 184,
      "ean": "",
      "name": "Fideos al huevo ADRIA moñas 500 g",
      "brand": "Adria",
      "unit_size": "500 g",
      "diet_tags": [],
      "min_price": 91,
      "offers": {
        "disco": {
          "price": 91,
          "url": "https://www.disco.com.uy/product/fideos-al-huevo-adria-monas-500-g/730050"
        },
        "devoto": {
          "price": 91,
          "url": "https://www.devoto.com.uy/product/fideos-al-huevo-adria-monas-500-g/730050"
        },
        "geant": {
          "price": 91,
          "url": "https://www.geant.com.uy/product/fideos-al-huevo-adria-monas-500-g/730050"
        },
        "tata": {
          "price": 92,
          "url": "https://www.tata.com.uy/fideos-moñas-al-huevo-adria-500-g-3392/p"
        }
      }
    }
  ],
  "jamon_cocido": [
    {
      "id": 1963,
      "ean": "7730991006007",
      "name": "Jamón Cocido Extra Magro Centenario 150 g",
      "brand": "Centenario",
      "unit_size": "150 g",
      "diet_tags": [
        "sin_tacc",
        "sin_lactosa"
      ],
      "min_price": 115,
      "offers": {
        "tata": {
          "price": 115,
          "url": "https://www.tata.com.uy/buscar?text=jamon%20cocido"
        },
        "frog": {
          "price": 121,
          "url": "https://www.frog.com.uy/buscar?q=jamon%20cocido"
        },
        "geant": {
          "price": 121,
          "url": "https://www.geant.com.uy/productos/keyword/jamon%20cocido"
        },
        "el_dorado": {
          "price": 122,
          "url": "https://www.eldorado.com.uy/jamon%20cocido?_q=jamon%20cocido&map=ft"
        },
        "devoto": {
          "price": 130,
          "url": "https://www.devoto.com.uy/productos/keyword/jamon%20cocido"
        },
        "disco": {
          "price": 131,
          "url": "https://www.disco.com.uy/productos/keyword/jamon%20cocido"
        },
        "tienda_inglesa": {
          "price": 131,
          "url": "https://www.tiendainglesa.com.uy/supermercado/busqueda?0,0,jamon%20cocido,0"
        }
      }
    },
    {
      "id": 431,
      "ean": "",
      "name": "Atún lomito al natural PRECIO LÍDER 160 g",
      "brand": "Precio Líder",
      "unit_size": "160 g",
      "diet_tags": [],
      "min_price": 95,
      "offers": {
        "devoto": {
          "price": 95,
          "url": "https://www.devoto.com.uy/product/atun-lomito-al-natural-precio-lider-160-g/345510"
        },
        "geant": {
          "price": 95,
          "url": "https://www.geant.com.uy/product/atun-lomito-al-natural-precio-lider-160-g/345510"
        },
        "disco": {
          "price": 112,
          "url": "https://www.disco.com.uy/product/atun-lomito-al-natural-precio-lider-160-g/345510"
        }
      }
    }
  ],
  "jamon_crudo": [
    {
      "id": 1964,
      "ean": "7730991006008",
      "name": "Jamón Crudo Feteado Centenario 100 g",
      "brand": "Centenario",
      "unit_size": "100 g",
      "diet_tags": [
        "sin_tacc",
        "sin_lactosa"
      ],
      "min_price": 153,
      "offers": {
        "el_dorado": {
          "price": 153,
          "url": "https://www.eldorado.com.uy/jamon%20crudo?_q=jamon%20crudo&map=ft"
        },
        "tata": {
          "price": 157,
          "url": "https://www.tata.com.uy/buscar?text=jamon%20crudo"
        },
        "frog": {
          "price": 165,
          "url": "https://www.frog.com.uy/buscar?q=jamon%20crudo"
        },
        "geant": {
          "price": 166,
          "url": "https://www.geant.com.uy/productos/keyword/jamon%20crudo"
        },
        "devoto": {
          "price": 178,
          "url": "https://www.devoto.com.uy/productos/keyword/jamon%20crudo"
        },
        "disco": {
          "price": 179,
          "url": "https://www.disco.com.uy/productos/keyword/jamon%20crudo"
        },
        "tienda_inglesa": {
          "price": 179,
          "url": "https://www.tiendainglesa.com.uy/supermercado/busqueda?0,0,jamon%20crudo,0"
        }
      }
    }
  ],
  "leche_descremada": [
    {
      "id": 1937,
      "ean": "7730991004009",
      "name": "Leche Descremada Conaprole 1 L",
      "brand": "Conaprole",
      "unit_size": "1 L",
      "diet_tags": [
        "descremado",
        "sin_tacc"
      ],
      "min_price": 44,
      "offers": {
        "tata": {
          "price": 44,
          "url": "https://www.tata.com.uy/buscar?text=leche%20descremada%20conaprole"
        },
        "frog": {
          "price": 47,
          "url": "https://www.frog.com.uy/buscar?q=leche%20descremada%20conaprole"
        },
        "el_dorado": {
          "price": 47,
          "url": "https://www.eldorado.com.uy/leche%20descremada%20conaprole?_q=leche%20descremada%20conaprole&map=ft"
        },
        "geant": {
          "price": 47,
          "url": "https://www.geant.com.uy/productos/keyword/leche%20descremada%20conaprole"
        },
        "devoto": {
          "price": 50,
          "url": "https://www.devoto.com.uy/productos/keyword/leche%20descremada%20conaprole"
        },
        "disco": {
          "price": 50,
          "url": "https://www.disco.com.uy/productos/keyword/leche%20descremada%20conaprole"
        },
        "tienda_inglesa": {
          "price": 50,
          "url": "https://www.tiendainglesa.com.uy/supermercado/busqueda?0,0,leche%20descremada%20conaprole,0"
        }
      }
    },
    {
      "id": 145,
      "ean": "",
      "name": "Leche ultra descremada CONAPROLE 1 L",
      "brand": "Conaprole",
      "unit_size": "1 L",
      "diet_tags": [
        "descremado"
      ],
      "min_price": 47,
      "offers": {
        "disco": {
          "price": 47,
          "url": "https://www.disco.com.uy/product/leche-ultra-descremada-conaprole-1-l/240518"
        },
        "devoto": {
          "price": 47,
          "url": "https://www.devoto.com.uy/product/leche-ultra-descremada-conaprole-1-l/240518"
        },
        "geant": {
          "price": 47,
          "url": "https://www.geant.com.uy/product/leche-ultra-descremada-conaprole-1-l/240518"
        },
        "tata": {
          "price": 47,
          "url": "https://www.tata.com.uy/leche-ultra-descremada-conaprole-1-l-2637/p"
        }
      }
    }
  ],
  "leche_deslactosada": [
    {
      "id": 1915,
      "ean": "7730991002001",
      "name": "Leche Descremada Deslactosada Conaprole 0% Lactosa 1 L",
      "brand": "Conaprole",
      "unit_size": "1 L",
      "diet_tags": [
        "sin_lactosa",
        "descremado"
      ],
      "min_price": 68,
      "offers": {
        "tata": {
          "price": 68,
          "url": "https://www.tata.com.uy/buscar?text=leche%20deslactosada%20conaprole"
        },
        "frog": {
          "price": 72,
          "url": "https://www.frog.com.uy/buscar?q=leche%20deslactosada%20conaprole"
        },
        "geant": {
          "price": 72,
          "url": "https://www.geant.com.uy/productos/keyword/leche%20deslactosada%20conaprole"
        },
        "el_dorado": {
          "price": 73,
          "url": "https://www.eldorado.com.uy/leche%20deslactosada%20conaprole?_q=leche%20deslactosada%20conaprole&map=ft"
        },
        "devoto": {
          "price": 77,
          "url": "https://www.devoto.com.uy/productos/keyword/leche%20deslactosada%20conaprole"
        },
        "disco": {
          "price": 78,
          "url": "https://www.disco.com.uy/productos/keyword/leche%20deslactosada%20conaprole"
        },
        "tienda_inglesa": {
          "price": 78,
          "url": "https://www.tiendainglesa.com.uy/supermercado/busqueda?0,0,leche%20deslactosada%20conaprole,0"
        }
      }
    },
    {
      "id": 215,
      "ean": "",
      "name": "Leche Conaprole UHT Descremada 0% Lactosa 1 L",
      "brand": "Conaprole",
      "unit_size": "1 L",
      "diet_tags": [
        "sin_lactosa",
        "descremado"
      ],
      "min_price": 75,
      "offers": {
        "tata": {
          "price": 75,
          "url": "https://www.tata.com.uy/leche-conaprole-uht-descremada-0-lactosa-1-l-1000047404-1282/p"
        }
      }
    }
  ],
  "lentejas": [
    {
      "id": 1954,
      "ean": "7730991005015",
      "name": "Lentejas Secas Seleccionadas Niter 400 g",
      "brand": "Niter",
      "unit_size": "400 g",
      "diet_tags": [
        "sin_tacc",
        "vegano"
      ],
      "min_price": 78,
      "offers": {
        "frog": {
          "price": 78,
          "url": "https://www.frog.com.uy/buscar?q=lentejas"
        },
        "geant": {
          "price": 78,
          "url": "https://www.geant.com.uy/productos/keyword/lentejas"
        },
        "el_dorado": {
          "price": 79,
          "url": "https://www.eldorado.com.uy/lentejas?_q=lentejas&map=ft"
        },
        "tata": {
          "price": 81,
          "url": "https://www.tata.com.uy/buscar?text=lentejas"
        },
        "devoto": {
          "price": 84,
          "url": "https://www.devoto.com.uy/productos/keyword/lentejas"
        },
        "disco": {
          "price": 84,
          "url": "https://www.disco.com.uy/productos/keyword/lentejas"
        },
        "tienda_inglesa": {
          "price": 84,
          "url": "https://www.tiendainglesa.com.uy/supermercado/busqueda?0,0,lentejas,0"
        }
      }
    },
    {
      "id": 1453,
      "ean": "",
      "name": "Lenteja 300 Grs. Inalpa",
      "brand": "",
      "unit_size": "",
      "diet_tags": [],
      "min_price": 30,
      "offers": {
        "el_clon": {
          "price": 30,
          "url": "https://www.elclon.com.uy/catalogo/lenteja-300-grs-inalpa_65152_0"
        }
      }
    }
  ],
  "levadura": [
    {
      "id": 1951,
      "ean": "7730991005012",
      "name": "Levadura Seca Instantánea Fleischmann 10 g",
      "brand": "Fleischmann",
      "unit_size": "10 g",
      "diet_tags": [
        "sin_tacc"
      ],
      "min_price": 27,
      "offers": {
        "frog": {
          "price": 27,
          "url": "https://www.frog.com.uy/buscar?q=levadura"
        },
        "el_dorado": {
          "price": 27,
          "url": "https://www.eldorado.com.uy/levadura?_q=levadura&map=ft"
        },
        "tata": {
          "price": 28,
          "url": "https://www.tata.com.uy/buscar?text=levadura"
        },
        "geant": {
          "price": 29,
          "url": "https://www.geant.com.uy/productos/keyword/levadura"
        },
        "devoto": {
          "price": 29,
          "url": "https://www.devoto.com.uy/productos/keyword/levadura"
        },
        "disco": {
          "price": 29,
          "url": "https://www.disco.com.uy/productos/keyword/levadura"
        },
        "tienda_inglesa": {
          "price": 32,
          "url": "https://www.tiendainglesa.com.uy/supermercado/busqueda?0,0,levadura,0"
        }
      }
    }
  ],
  "laminas_lasana": [
    {
      "id": 1942,
      "ean": "7730991005003",
      "name": "Láminas para Lasaña Directo al Horno Matarazzo 250 g",
      "brand": "Matarazzo",
      "unit_size": "250 g",
      "diet_tags": [],
      "min_price": 119,
      "offers": {
        "frog": {
          "price": 119,
          "url": "https://www.frog.com.uy/buscar?q=lasana%20matarazzo"
        },
        "el_dorado": {
          "price": 120,
          "url": "https://www.eldorado.com.uy/lasana%20matarazzo?_q=lasana%20matarazzo&map=ft"
        },
        "tata": {
          "price": 124,
          "url": "https://www.tata.com.uy/buscar?text=lasana%20matarazzo"
        },
        "devoto": {
          "price": 128,
          "url": "https://www.devoto.com.uy/productos/keyword/lasana%20matarazzo"
        },
        "disco": {
          "price": 129,
          "url": "https://www.disco.com.uy/productos/keyword/lasana%20matarazzo"
        },
        "geant": {
          "price": 130,
          "url": "https://www.geant.com.uy/productos/keyword/lasana%20matarazzo"
        },
        "tienda_inglesa": {
          "price": 141,
          "url": "https://www.tiendainglesa.com.uy/supermercado/busqueda?0,0,lasana%20matarazzo,0"
        }
      }
    }
  ],
  "lasana_sin_tacc": [
    {
      "id": 1907,
      "ean": "7730991001004",
      "name": "Láminas para Lasaña de Arroz Sin TACC 250 g",
      "brand": "Niter",
      "unit_size": "250 g",
      "diet_tags": [
        "sin_tacc"
      ],
      "min_price": 158,
      "offers": {
        "el_dorado": {
          "price": 158,
          "url": "https://www.eldorado.com.uy/lasana%20sin%20gluten?_q=lasana%20sin%20gluten&map=ft"
        },
        "tata": {
          "price": 163,
          "url": "https://www.tata.com.uy/buscar?text=lasana%20sin%20gluten"
        },
        "frog": {
          "price": 171,
          "url": "https://www.frog.com.uy/buscar?q=lasana%20sin%20gluten"
        },
        "geant": {
          "price": 172,
          "url": "https://www.geant.com.uy/productos/keyword/lasana%20sin%20gluten"
        },
        "devoto": {
          "price": 184,
          "url": "https://www.devoto.com.uy/productos/keyword/lasana%20sin%20gluten"
        },
        "disco": {
          "price": 186,
          "url": "https://www.disco.com.uy/productos/keyword/lasana%20sin%20gluten"
        },
        "tienda_inglesa": {
          "price": 186,
          "url": "https://www.tiendainglesa.com.uy/supermercado/busqueda?0,0,lasana%20sin%20gluten,0"
        }
      }
    }
  ],
  "manteca": [
    {
      "id": 1936,
      "ean": "7730991004008",
      "name": "Manteca sin Sal Conaprole 200 g",
      "brand": "Conaprole",
      "unit_size": "200 g",
      "diet_tags": [
        "sin_tacc"
      ],
      "min_price": 102,
      "offers": {
        "tata": {
          "price": 102,
          "url": "https://www.tata.com.uy/buscar?text=manteca%20conaprole"
        },
        "frog": {
          "price": 108,
          "url": "https://www.frog.com.uy/buscar?q=manteca%20conaprole"
        },
        "el_dorado": {
          "price": 108,
          "url": "https://www.eldorado.com.uy/manteca%20conaprole?_q=manteca%20conaprole&map=ft"
        },
        "geant": {
          "price": 108,
          "url": "https://www.geant.com.uy/productos/keyword/manteca%20conaprole"
        },
        "devoto": {
          "price": 115,
          "url": "https://www.devoto.com.uy/productos/keyword/manteca%20conaprole"
        },
        "tienda_inglesa": {
          "price": 116,
          "url": "https://www.tiendainglesa.com.uy/supermercado/busqueda?0,0,manteca%20conaprole,0"
        },
        "disco": {
          "price": 117,
          "url": "https://www.disco.com.uy/productos/keyword/manteca%20conaprole"
        }
      }
    },
    {
      "id": 1071,
      "ean": "77306210",
      "name": "Manteca Conaprole 100Gr Sin Sal.",
      "brand": "Conaprole",
      "unit_size": "100Gr",
      "diet_tags": [],
      "min_price": 65,
      "offers": {
        "el_dorado": {
          "price": 65,
          "url": "https://www.eldorado.com.uy/manteca-conaprole-100gr-sin-sal/p"
        },
        "redmarket5": {
          "price": 69,
          "url": "https://redmarket5.com.uy/catalog"
        }
      }
    }
  ],
  "mani": [
    {
      "id": 1978,
      "ean": "7730991007009",
      "name": "Maní Tostado sin Sal 200 g",
      "brand": "Niter",
      "unit_size": "200 g",
      "diet_tags": [
        "sin_tacc",
        "sin_lactosa",
        "vegano"
      ],
      "min_price": 72,
      "offers": {
        "el_dorado": {
          "price": 72,
          "url": "https://www.eldorado.com.uy/mani%20sin%20sal?_q=mani%20sin%20sal&map=ft"
        },
        "tata": {
          "price": 74,
          "url": "https://www.tata.com.uy/buscar?text=mani%20sin%20sal"
        },
        "devoto": {
          "price": 76,
          "url": "https://www.devoto.com.uy/productos/keyword/mani%20sin%20sal"
        },
        "disco": {
          "price": 77,
          "url": "https://www.disco.com.uy/productos/keyword/mani%20sin%20sal"
        },
        "frog": {
          "price": 78,
          "url": "https://www.frog.com.uy/buscar?q=mani%20sin%20sal"
        },
        "geant": {
          "price": 78,
          "url": "https://www.geant.com.uy/productos/keyword/mani%20sin%20sal"
        },
        "tienda_inglesa": {
          "price": 84,
          "url": "https://www.tiendainglesa.com.uy/supermercado/busqueda?0,0,mani%20sin%20sal,0"
        }
      }
    }
  ],
  "mayonesa": [
    {
      "id": 2011,
      "ean": "7730991007022",
      "name": "Mayonesa Clásica Hellmann's Sin TACC 500 g",
      "brand": "Hellmann's",
      "unit_size": "500 g",
      "diet_tags": [
        "sin_tacc",
        "sin_lactosa"
      ],
      "min_price": 122,
      "offers": {
        "frog": {
          "price": 122,
          "url": "https://www.frog.com.uy/buscar?q=mayonesa%20hellmanns"
        },
        "geant": {
          "price": 122,
          "url": "https://www.geant.com.uy/productos/keyword/mayonesa%20hellmanns"
        },
        "el_dorado": {
          "price": 123,
          "url": "https://www.eldorado.com.uy/mayonesa%20hellmanns?_q=mayonesa%20hellmanns&map=ft"
        },
        "tata": {
          "price": 126,
          "url": "https://www.tata.com.uy/buscar?text=mayonesa%20hellmanns"
        },
        "devoto": {
          "price": 131,
          "url": "https://www.devoto.com.uy/productos/keyword/mayonesa%20hellmanns"
        },
        "disco": {
          "price": 132,
          "url": "https://www.disco.com.uy/productos/keyword/mayonesa%20hellmanns"
        },
        "tienda_inglesa": {
          "price": 132,
          "url": "https://www.tiendainglesa.com.uy/supermercado/busqueda?0,0,mayonesa%20hellmanns,0"
        }
      }
    },
    {
      "id": 437,
      "ean": "",
      "name": "Mayonesa URUGUAY 500 cc",
      "brand": "Uruguay",
      "unit_size": "500 cc",
      "diet_tags": [],
      "min_price": 109,
      "offers": {
        "disco": {
          "price": 109,
          "url": "https://www.disco.com.uy/product/mayonesa-uruguay-500-cc/666715"
        },
        "devoto": {
          "price": 109,
          "url": "https://www.devoto.com.uy/product/mayonesa-uruguay-500-cc/666715"
        },
        "geant": {
          "price": 109,
          "url": "https://www.geant.com.uy/product/mayonesa-uruguay-500-cc/666715"
        },
        "tienda_inglesa": {
          "price": 119,
          "url": "https://www.tiendainglesa.com.uy/supermercado/mayonesa-uruguay-500-ml.producto?377978,,42"
        }
      }
    }
  ],
  "mermelada_sin_azucar": [
    {
      "id": 1925,
      "ean": "7730991003003",
      "name": "Mermelada de Frutilla Sin Azúcar El Trigal 300 g",
      "brand": "El Trigal",
      "unit_size": "300 g",
      "diet_tags": [
        "sin_azucar"
      ],
      "min_price": 141,
      "offers": {
        "el_dorado": {
          "price": 141,
          "url": "https://www.eldorado.com.uy/mermelada%20sin%20azucar?_q=mermelada%20sin%20azucar&map=ft"
        },
        "tata": {
          "price": 146,
          "url": "https://www.tata.com.uy/buscar?text=mermelada%20sin%20azucar"
        },
        "devoto": {
          "price": 150,
          "url": "https://www.devoto.com.uy/productos/keyword/mermelada%20sin%20azucar"
        },
        "frog": {
          "price": 153,
          "url": "https://www.frog.com.uy/buscar?q=mermelada%20sin%20azucar"
        },
        "geant": {
          "price": 153,
          "url": "https://www.geant.com.uy/productos/keyword/mermelada%20sin%20azucar"
        },
        "disco": {
          "price": 166,
          "url": "https://www.disco.com.uy/productos/keyword/mermelada%20sin%20azucar"
        },
        "tienda_inglesa": {
          "price": 166,
          "url": "https://www.tiendainglesa.com.uy/supermercado/busqueda?0,0,mermelada%20sin%20azucar,0"
        }
      }
    },
    {
      "id": 463,
      "ean": "",
      "name": "Mermelada de higo LOS NIETITOS 0% azúcar 400 g",
      "brand": "Los Nietitos",
      "unit_size": "400 g",
      "diet_tags": [
        "sin_azucar"
      ],
      "min_price": 159,
      "offers": {
        "tata": {
          "price": 159,
          "url": "https://www.tata.com.uy/mermelada-de-higo-0--azucar-los-nietitos-400-g-1000051088-3179/p"
        },
        "disco": {
          "price": 169,
          "url": "https://www.disco.com.uy/product/mermelada-de-higo-los-nietitos-0-azucar-400-g/661068"
        },
        "devoto": {
          "price": 169,
          "url": "https://www.devoto.com.uy/product/mermelada-de-higo-los-nietitos-0-azucar-400-g/661068"
        },
        "geant": {
          "price": 169,
          "url": "https://www.geant.com.uy/product/mermelada-de-higo-los-nietitos-0-azucar-400-g/661068"
        },
        "frog": {
          "price": 169,
          "url": "https://frog.uy/mermlniethigo-0-pt-400gr-adu"
        }
      }
    }
  ],
  "miel": [
    {
      "id": 1975,
      "ean": "7730991007006",
      "name": "Miel Pura de Abeja Granja San Francisco 500 g",
      "brand": "San Francisco",
      "unit_size": "500 g",
      "diet_tags": [
        "sin_tacc",
        "sin_lactosa"
      ],
      "min_price": 170,
      "offers": {
        "tata": {
          "price": 170,
          "url": "https://www.tata.com.uy/buscar?text=miel"
        },
        "frog": {
          "price": 179,
          "url": "https://www.frog.com.uy/buscar?q=miel"
        },
        "geant": {
          "price": 179,
          "url": "https://www.geant.com.uy/productos/keyword/miel"
        },
        "el_dorado": {
          "price": 181,
          "url": "https://www.eldorado.com.uy/miel?_q=miel&map=ft"
        },
        "devoto": {
          "price": 192,
          "url": "https://www.devoto.com.uy/productos/keyword/miel"
        },
        "disco": {
          "price": 194,
          "url": "https://www.disco.com.uy/productos/keyword/miel"
        },
        "tienda_inglesa": {
          "price": 194,
          "url": "https://www.tiendainglesa.com.uy/supermercado/busqueda?0,0,miel,0"
        }
      }
    }
  ],
  "semillas": [
    {
      "id": 1979,
      "ean": "7730991007010",
      "name": "Mix de Semillas (Chía, Lino y Sésamo) Niter 200 g",
      "brand": "Niter",
      "unit_size": "200 g",
      "diet_tags": [
        "sin_tacc",
        "sin_lactosa",
        "vegano"
      ],
      "min_price": 78,
      "offers": {
        "frog": {
          "price": 78,
          "url": "https://www.frog.com.uy/buscar?q=mix%20de%20semillas"
        },
        "el_dorado": {
          "price": 79,
          "url": "https://www.eldorado.com.uy/mix%20de%20semillas?_q=mix%20de%20semillas&map=ft"
        },
        "tata": {
          "price": 82,
          "url": "https://www.tata.com.uy/buscar?text=mix%20de%20semillas"
        },
        "devoto": {
          "price": 84,
          "url": "https://www.devoto.com.uy/productos/keyword/mix%20de%20semillas"
        },
        "disco": {
          "price": 85,
          "url": "https://www.disco.com.uy/productos/keyword/mix%20de%20semillas"
        },
        "geant": {
          "price": 86,
          "url": "https://www.geant.com.uy/productos/keyword/mix%20de%20semillas"
        },
        "tienda_inglesa": {
          "price": 93,
          "url": "https://www.tiendainglesa.com.uy/supermercado/busqueda?0,0,mix%20de%20semillas,0"
        }
      }
    },
    {
      "id": 1196,
      "ean": "3800233070064",
      "name": "Galletas Rice Up! De Arroz Girasol 120g",
      "brand": "Rice Up",
      "unit_size": "120g",
      "diet_tags": [],
      "min_price": 80,
      "offers": {
        "el_dorado": {
          "price": 80,
          "url": "https://www.eldorado.com.uy/galletas-rice-up-de-arroz-girasol-120g/p"
        }
      }
    }
  ],
  "morron": [
    {
      "id": 1991,
      "ean": "7730991008009",
      "name": "Morrón Rojo / Verde Fresco 500 g",
      "brand": "Feria / Frescos",
      "unit_size": "500 g",
      "diet_tags": [
        "sin_tacc",
        "sin_lactosa",
        "vegano"
      ],
      "min_price": 72,
      "offers": {
        "frog": {
          "price": 72,
          "url": "https://www.frog.com.uy/buscar?q=morron"
        },
        "el_dorado": {
          "price": 73,
          "url": "https://www.eldorado.com.uy/morron?_q=morron&map=ft"
        },
        "tata": {
          "price": 75,
          "url": "https://www.tata.com.uy/buscar?text=morron"
        },
        "devoto": {
          "price": 77,
          "url": "https://www.devoto.com.uy/productos/keyword/morron"
        },
        "disco": {
          "price": 78,
          "url": "https://www.disco.com.uy/productos/keyword/morron"
        },
        "geant": {
          "price": 79,
          "url": "https://www.geant.com.uy/productos/keyword/morron"
        },
        "tienda_inglesa": {
          "price": 85,
          "url": "https://www.tiendainglesa.com.uy/supermercado/busqueda?0,0,morron,0"
        }
      }
    }
  ],
  "mostaza": [
    {
      "id": 1974,
      "ean": "7730991007005",
      "name": "Mostaza Clásica Savora / Hellmann's 250 g",
      "brand": "Hellmann's",
      "unit_size": "250 g",
      "diet_tags": [
        "sin_tacc"
      ],
      "min_price": 77,
      "offers": {
        "tata": {
          "price": 77,
          "url": "https://www.tata.com.uy/buscar?text=mostaza"
        },
        "frog": {
          "price": 81,
          "url": "https://www.frog.com.uy/buscar?q=mostaza"
        },
        "el_dorado": {
          "price": 81,
          "url": "https://www.eldorado.com.uy/mostaza?_q=mostaza&map=ft"
        },
        "geant": {
          "price": 81,
          "url": "https://www.geant.com.uy/productos/keyword/mostaza"
        },
        "devoto": {
          "price": 87,
          "url": "https://www.devoto.com.uy/productos/keyword/mostaza"
        },
        "disco": {
          "price": 87,
          "url": "https://www.disco.com.uy/productos/keyword/mostaza"
        },
        "tienda_inglesa": {
          "price": 87,
          "url": "https://www.tiendainglesa.com.uy/supermercado/busqueda?0,0,mostaza,0"
        }
      }
    }
  ],
  "frutos_secos": [
    {
      "id": 1977,
      "ean": "7730991007008",
      "name": "Nueces Mariposa Peladas 100 g",
      "brand": "Niter",
      "unit_size": "100 g",
      "diet_tags": [
        "sin_tacc",
        "sin_lactosa",
        "vegano"
      ],
      "min_price": 118,
      "offers": {
        "el_dorado": {
          "price": 118,
          "url": "https://www.eldorado.com.uy/nueces%20peladas?_q=nueces%20peladas&map=ft"
        },
        "tata": {
          "price": 121,
          "url": "https://www.tata.com.uy/buscar?text=nueces%20peladas"
        },
        "devoto": {
          "price": 125,
          "url": "https://www.devoto.com.uy/productos/keyword/nueces%20peladas"
        },
        "frog": {
          "price": 128,
          "url": "https://www.frog.com.uy/buscar?q=nueces%20peladas"
        },
        "geant": {
          "price": 128,
          "url": "https://www.geant.com.uy/productos/keyword/nueces%20peladas"
        },
        "disco": {
          "price": 138,
          "url": "https://www.disco.com.uy/productos/keyword/nueces%20peladas"
        },
        "tienda_inglesa": {
          "price": 138,
          "url": "https://www.tiendainglesa.com.uy/supermercado/busqueda?0,0,nueces%20peladas,0"
        }
      }
    }
  ],
  "palta": [
    {
      "id": 2000,
      "ean": "7730991008018",
      "name": "Palta Hass Madura Unidad",
      "brand": "Feria / Frescos",
      "unit_size": "",
      "diet_tags": [
        "sin_tacc",
        "sin_lactosa",
        "vegano"
      ],
      "min_price": 73,
      "offers": {
        "frog": {
          "price": 73,
          "url": "https://www.frog.com.uy/buscar?q=palta"
        },
        "el_dorado": {
          "price": 74,
          "url": "https://www.eldorado.com.uy/palta?_q=palta&map=ft"
        },
        "tata": {
          "price": 76,
          "url": "https://www.tata.com.uy/buscar?text=palta"
        },
        "devoto": {
          "price": 78,
          "url": "https://www.devoto.com.uy/productos/keyword/palta"
        },
        "disco": {
          "price": 79,
          "url": "https://www.disco.com.uy/productos/keyword/palta"
        },
        "geant": {
          "price": 80,
          "url": "https://www.geant.com.uy/productos/keyword/palta"
        },
        "tienda_inglesa": {
          "price": 86,
          "url": "https://www.tiendainglesa.com.uy/supermercado/busqueda?0,0,palta,0"
        }
      }
    },
    {
      "id": 20,
      "ean": "",
      "name": "Palta Hass (1 un.)",
      "brand": "",
      "unit_size": "1 un",
      "diet_tags": [],
      "min_price": 49,
      "offers": {
        "tienda_inglesa": {
          "price": 49,
          "url": "https://www.tiendainglesa.com.uy/supermercado/palta-hass-1-un..producto?25213,,42&campaign=search_facets"
        }
      }
    }
  ],
  "pan_molde": [
    {
      "id": 1950,
      "ean": "7730991005011",
      "name": "Pan Lactal Blanco Pagnifique 400 g",
      "brand": "Pagnifique",
      "unit_size": "400 g",
      "diet_tags": [],
      "min_price": 106,
      "offers": {
        "el_dorado": {
          "price": 106,
          "url": "https://www.eldorado.com.uy/pan%20lactal?_q=pan%20lactal&map=ft"
        },
        "tata": {
          "price": 109,
          "url": "https://www.tata.com.uy/buscar?text=pan%20lactal"
        },
        "devoto": {
          "price": 113,
          "url": "https://www.devoto.com.uy/productos/keyword/pan%20lactal"
        },
        "disco": {
          "price": 114,
          "url": "https://www.disco.com.uy/productos/keyword/pan%20lactal"
        },
        "frog": {
          "price": 115,
          "url": "https://www.frog.com.uy/buscar?q=pan%20lactal"
        },
        "geant": {
          "price": 115,
          "url": "https://www.geant.com.uy/productos/keyword/pan%20lactal"
        },
        "tienda_inglesa": {
          "price": 124,
          "url": "https://www.tiendainglesa.com.uy/supermercado/busqueda?0,0,pan%20lactal,0"
        }
      }
    }
  ],
  "pan_rallado": [
    {
      "id": 1949,
      "ean": "7730991005010",
      "name": "Pan Rallado Clásico Adria 500 g",
      "brand": "Adria",
      "unit_size": "500 g",
      "diet_tags": [],
      "min_price": 66,
      "offers": {
        "el_dorado": {
          "price": 66,
          "url": "https://www.eldorado.com.uy/pan%20rallado?_q=pan%20rallado&map=ft"
        },
        "tata": {
          "price": 68,
          "url": "https://www.tata.com.uy/buscar?text=pan%20rallado"
        },
        "devoto": {
          "price": 70,
          "url": "https://www.devoto.com.uy/productos/keyword/pan%20rallado"
        },
        "frog": {
          "price": 71,
          "url": "https://www.frog.com.uy/buscar?q=pan%20rallado"
        },
        "geant": {
          "price": 71,
          "url": "https://www.geant.com.uy/productos/keyword/pan%20rallado"
        },
        "disco": {
          "price": 77,
          "url": "https://www.disco.com.uy/productos/keyword/pan%20rallado"
        },
        "tienda_inglesa": {
          "price": 77,
          "url": "https://www.tiendainglesa.com.uy/supermercado/busqueda?0,0,pan%20rallado,0"
        }
      }
    }
  ],
  "pan_sin_tacc": [
    {
      "id": 1909,
      "ean": "7730991001006",
      "name": "Pan de Molde Blanco Sin Gluten Sin TACC 400 g",
      "brand": "Pagnifique",
      "unit_size": "400 g",
      "diet_tags": [
        "sin_tacc"
      ],
      "min_price": 170,
      "offers": {
        "el_dorado": {
          "price": 170,
          "url": "https://www.eldorado.com.uy/pan%20sin%20gluten?_q=pan%20sin%20gluten&map=ft"
        },
        "tata": {
          "price": 176,
          "url": "https://www.tata.com.uy/buscar?text=pan%20sin%20gluten"
        },
        "devoto": {
          "price": 181,
          "url": "https://www.devoto.com.uy/productos/keyword/pan%20sin%20gluten"
        },
        "disco": {
          "price": 183,
          "url": "https://www.disco.com.uy/productos/keyword/pan%20sin%20gluten"
        },
        "frog": {
          "price": 185,
          "url": "https://www.frog.com.uy/buscar?q=pan%20sin%20gluten"
        },
        "geant": {
          "price": 185,
          "url": "https://www.geant.com.uy/productos/keyword/pan%20sin%20gluten"
        },
        "tienda_inglesa": {
          "price": 200,
          "url": "https://www.tiendainglesa.com.uy/supermercado/busqueda?0,0,pan%20sin%20gluten,0"
        }
      }
    }
  ],
  "pan_integral": [
    {
      "id": 1928,
      "ean": "7730991003007",
      "name": "Pan de Molde Integral Bimbo 400 g",
      "brand": "Bimbo",
      "unit_size": "400 g",
      "diet_tags": [
        "integral"
      ],
      "min_price": 120,
      "offers": {
        "frog": {
          "price": 120,
          "url": "https://www.frog.com.uy/buscar?q=pan%20integral"
        },
        "geant": {
          "price": 120,
          "url": "https://www.geant.com.uy/productos/keyword/pan%20integral"
        },
        "el_dorado": {
          "price": 122,
          "url": "https://www.eldorado.com.uy/pan%20integral?_q=pan%20integral&map=ft"
        },
        "tata": {
          "price": 125,
          "url": "https://www.tata.com.uy/buscar?text=pan%20integral"
        },
        "devoto": {
          "price": 129,
          "url": "https://www.devoto.com.uy/productos/keyword/pan%20integral"
        },
        "tienda_inglesa": {
          "price": 130,
          "url": "https://www.tiendainglesa.com.uy/supermercado/busqueda?0,0,pan%20integral,0"
        },
        "disco": {
          "price": 131,
          "url": "https://www.disco.com.uy/productos/keyword/pan%20integral"
        }
      }
    }
  ],
  "panceta": [
    {
      "id": 1962,
      "ean": "7730991006006",
      "name": "Panceta Ahumada en Fetas Cattivelli 150 g",
      "brand": "Cattivelli",
      "unit_size": "150 g",
      "diet_tags": [
        "sin_tacc",
        "sin_lactosa"
      ],
      "min_price": 132,
      "offers": {
        "tata": {
          "price": 132,
          "url": "https://www.tata.com.uy/buscar?text=panceta%20ahumada"
        },
        "frog": {
          "price": 139,
          "url": "https://www.frog.com.uy/buscar?q=panceta%20ahumada"
        },
        "geant": {
          "price": 139,
          "url": "https://www.geant.com.uy/productos/keyword/panceta%20ahumada"
        },
        "el_dorado": {
          "price": 140,
          "url": "https://www.eldorado.com.uy/panceta%20ahumada?_q=panceta%20ahumada&map=ft"
        },
        "devoto": {
          "price": 149,
          "url": "https://www.devoto.com.uy/productos/keyword/panceta%20ahumada"
        },
        "disco": {
          "price": 151,
          "url": "https://www.disco.com.uy/productos/keyword/panceta%20ahumada"
        },
        "tienda_inglesa": {
          "price": 151,
          "url": "https://www.tiendainglesa.com.uy/supermercado/busqueda?0,0,panceta%20ahumada,0"
        }
      }
    }
  ],
  "panqueques": [
    {
      "id": 1943,
      "ean": "7730991005004",
      "name": "Panqueques Frescos para Canelones Avanti x 12 un",
      "brand": "Avanti",
      "unit_size": "12 un",
      "diet_tags": [],
      "min_price": 110,
      "offers": {
        "frog": {
          "price": 110,
          "url": "https://www.frog.com.uy/buscar?q=panqueques%20canelones"
        },
        "el_dorado": {
          "price": 111,
          "url": "https://www.eldorado.com.uy/panqueques%20canelones?_q=panqueques%20canelones&map=ft"
        },
        "tata": {
          "price": 114,
          "url": "https://www.tata.com.uy/buscar?text=panqueques%20canelones"
        },
        "devoto": {
          "price": 118,
          "url": "https://www.devoto.com.uy/productos/keyword/panqueques%20canelones"
        },
        "disco": {
          "price": 119,
          "url": "https://www.disco.com.uy/productos/keyword/panqueques%20canelones"
        },
        "geant": {
          "price": 120,
          "url": "https://www.geant.com.uy/productos/keyword/panqueques%20canelones"
        },
        "tienda_inglesa": {
          "price": 130,
          "url": "https://www.tiendainglesa.com.uy/supermercado/busqueda?0,0,panqueques%20canelones,0"
        }
      }
    }
  ],
  "papa": [
    {
      "id": 1983,
      "ean": "7730991008001",
      "name": "Papas Blancas Lavadas 1 kg",
      "brand": "Feria / Frescos",
      "unit_size": "1 kg",
      "diet_tags": [
        "sin_tacc",
        "sin_lactosa",
        "vegano"
      ],
      "min_price": 64,
      "offers": {
        "frog": {
          "price": 64,
          "url": "https://www.frog.com.uy/buscar?q=papa%20blanca"
        },
        "el_dorado": {
          "price": 65,
          "url": "https://www.eldorado.com.uy/papa%20blanca?_q=papa%20blanca&map=ft"
        },
        "tata": {
          "price": 67,
          "url": "https://www.tata.com.uy/buscar?text=papa%20blanca"
        },
        "devoto": {
          "price": 69,
          "url": "https://www.devoto.com.uy/productos/keyword/papa%20blanca"
        },
        "geant": {
          "price": 70,
          "url": "https://www.geant.com.uy/productos/keyword/papa%20blanca"
        },
        "disco": {
          "price": 70,
          "url": "https://www.disco.com.uy/productos/keyword/papa%20blanca"
        },
        "tienda_inglesa": {
          "price": 76,
          "url": "https://www.tiendainglesa.com.uy/supermercado/busqueda?0,0,papa%20blanca,0"
        }
      }
    },
    {
      "id": 55,
      "ean": "",
      "name": "Papa Rosada Granel (kg)",
      "brand": "",
      "unit_size": "",
      "diet_tags": [],
      "min_price": 89,
      "offers": {
        "tienda_inglesa": {
          "price": 89,
          "url": "https://www.tiendainglesa.com.uy/supermercado/papa-rosada-granel-kg.producto?46567,,42&campaign=search_facets"
        }
      }
    }
  ],
  "polenta_sin_tacc": [
    {
      "id": 1912,
      "ean": "7730991001009",
      "name": "Polenta Instantánea Cañuelas Sin TACC 500 g",
      "brand": "Cañuelas",
      "unit_size": "500 g",
      "diet_tags": [
        "sin_tacc"
      ],
      "min_price": 64,
      "offers": {
        "frog": {
          "price": 64,
          "url": "https://www.frog.com.uy/buscar?q=polenta%20canuelas"
        },
        "geant": {
          "price": 64,
          "url": "https://www.geant.com.uy/productos/keyword/polenta%20canuelas"
        },
        "el_dorado": {
          "price": 65,
          "url": "https://www.eldorado.com.uy/polenta%20canuelas?_q=polenta%20canuelas&map=ft"
        },
        "tata": {
          "price": 67,
          "url": "https://www.tata.com.uy/buscar?text=polenta%20canuelas"
        },
        "devoto": {
          "price": 69,
          "url": "https://www.devoto.com.uy/productos/keyword/polenta%20canuelas"
        },
        "disco": {
          "price": 69,
          "url": "https://www.disco.com.uy/productos/keyword/polenta%20canuelas"
        },
        "tienda_inglesa": {
          "price": 69,
          "url": "https://www.tiendainglesa.com.uy/supermercado/busqueda?0,0,polenta%20canuelas,0"
        }
      }
    },
    {
      "id": 642,
      "ean": "",
      "name": "Polenta Instantanea Sin Gluten Cañuelas 500 G",
      "brand": "Cañuelas",
      "unit_size": "500 G",
      "diet_tags": [
        "sin_tacc"
      ],
      "min_price": 149,
      "offers": {
        "tata": {
          "price": 149,
          "url": "https://www.tata.com.uy/polenta-instantanea-sin-gluten-cañuelas-500-g-169714/p"
        }
      }
    }
  ],
  "porotos": [
    {
      "id": 1953,
      "ean": "7730991005014",
      "name": "Porotos Blancos / Colorados en Lata Inalpa 300 g",
      "brand": "Inalpa",
      "unit_size": "300 g",
      "diet_tags": [
        "sin_tacc",
        "vegano"
      ],
      "min_price": 53,
      "offers": {
        "frog": {
          "price": 53,
          "url": "https://www.frog.com.uy/buscar?q=porotos"
        },
        "el_dorado": {
          "price": 53,
          "url": "https://www.eldorado.com.uy/porotos?_q=porotos&map=ft"
        },
        "geant": {
          "price": 53,
          "url": "https://www.geant.com.uy/productos/keyword/porotos"
        },
        "tata": {
          "price": 55,
          "url": "https://www.tata.com.uy/buscar?text=porotos"
        },
        "devoto": {
          "price": 57,
          "url": "https://www.devoto.com.uy/productos/keyword/porotos"
        },
        "disco": {
          "price": 57,
          "url": "https://www.disco.com.uy/productos/keyword/porotos"
        },
        "tienda_inglesa": {
          "price": 57,
          "url": "https://www.tiendainglesa.com.uy/supermercado/busqueda?0,0,porotos,0"
        }
      }
    },
    {
      "id": 544,
      "ean": "",
      "name": "Poroto Frutilla 500 g",
      "brand": "",
      "unit_size": "500 g",
      "diet_tags": [],
      "min_price": 139,
      "offers": {
        "disco": {
          "price": 139,
          "url": "https://www.disco.com.uy/product/poroto-frutilla-500-g/427724"
        },
        "devoto": {
          "price": 139,
          "url": "https://www.devoto.com.uy/product/poroto-frutilla-500-g/427724"
        },
        "geant": {
          "price": 139,
          "url": "https://www.geant.com.uy/product/poroto-frutilla-500-g/427724"
        }
      }
    }
  ],
  "harina_sin_tacc": [
    {
      "id": 1904,
      "ean": "7730991001001",
      "name": "Premezcla Sin Gluten 3 Harinas Niter Sin TACC 800 g",
      "brand": "Niter",
      "unit_size": "800 g",
      "diet_tags": [
        "sin_tacc"
      ],
      "min_price": 161,
      "offers": {
        "frog": {
          "price": 161,
          "url": "https://www.frog.com.uy/buscar?q=premezcla%20sin%20gluten"
        },
        "geant": {
          "price": 161,
          "url": "https://www.geant.com.uy/productos/keyword/premezcla%20sin%20gluten"
        },
        "el_dorado": {
          "price": 162,
          "url": "https://www.eldorado.com.uy/premezcla%20sin%20gluten?_q=premezcla%20sin%20gluten&map=ft"
        },
        "tata": {
          "price": 167,
          "url": "https://www.tata.com.uy/buscar?text=premezcla%20sin%20gluten"
        },
        "devoto": {
          "price": 172,
          "url": "https://www.devoto.com.uy/productos/keyword/premezcla%20sin%20gluten"
        },
        "disco": {
          "price": 174,
          "url": "https://www.disco.com.uy/productos/keyword/premezcla%20sin%20gluten"
        },
        "tienda_inglesa": {
          "price": 174,
          "url": "https://www.tiendainglesa.com.uy/supermercado/busqueda?0,0,premezcla%20sin%20gluten,0"
        }
      }
    },
    {
      "id": 841,
      "ean": "",
      "name": "Harina de Arroz CAÑUELAS sin gluten 500 g",
      "brand": "Cañuelas",
      "unit_size": "500 g",
      "diet_tags": [
        "sin_tacc"
      ],
      "min_price": 108,
      "offers": {
        "tienda_inglesa": {
          "price": 108,
          "url": "https://www.tiendainglesa.com.uy/supermercado/harina-de-arroz-canuelas-sin-gluten-500-g.producto?1606222,,42"
        }
      }
    }
  ],
  "pulpa_tomate_sin_azucar": [
    {
      "id": 1924,
      "ean": "7730991003002",
      "name": "Pulpa de Tomate Gourmet Sin Azúcar Agregada 1 kg",
      "brand": "Gourmet",
      "unit_size": "1 kg",
      "diet_tags": [
        "sin_azucar",
        "sin_tacc"
      ],
      "min_price": 80,
      "offers": {
        "el_dorado": {
          "price": 80,
          "url": "https://www.eldorado.com.uy/pulpa%20de%20tomate%20gourmet%20sin%20azucar?_q=pulpa%20de%20tomate%20gourmet%20sin%20azucar&map=ft"
        },
        "tata": {
          "price": 83,
          "url": "https://www.tata.com.uy/buscar?text=pulpa%20de%20tomate%20gourmet%20sin%20azucar"
        },
        "frog": {
          "price": 87,
          "url": "https://www.frog.com.uy/buscar?q=pulpa%20de%20tomate%20gourmet%20sin%20azucar"
        },
        "geant": {
          "price": 87,
          "url": "https://www.geant.com.uy/productos/keyword/pulpa%20de%20tomate%20gourmet%20sin%20azucar"
        },
        "devoto": {
          "price": 93,
          "url": "https://www.devoto.com.uy/productos/keyword/pulpa%20de%20tomate%20gourmet%20sin%20azucar"
        },
        "disco": {
          "price": 94,
          "url": "https://www.disco.com.uy/productos/keyword/pulpa%20de%20tomate%20gourmet%20sin%20azucar"
        },
        "tienda_inglesa": {
          "price": 94,
          "url": "https://www.tiendainglesa.com.uy/supermercado/busqueda?0,0,pulpa%20de%20tomate%20gourmet%20sin%20azucar,0"
        }
      }
    },
    {
      "id": 1472,
      "ean": "",
      "name": "PULPA DE TOMATE GOURMET 1030G SIN AZUCAR",
      "brand": "Pulpa De Tomate Gourmet",
      "unit_size": "1030G",
      "diet_tags": [
        "sin_azucar"
      ],
      "min_price": 75,
      "offers": {
        "el_clon": {
          "price": 75,
          "url": "https://www.elclon.com.uy/catalogo/pulpa-de-tomate-gourmet-1030g-sin-azucar_946139_0"
        }
      }
    }
  ],
  "pulpa_tomate": [
    {
      "id": 1972,
      "ean": "7730991007003",
      "name": "Pulpa de Tomate Tamizada Conaprole / De Ley 1.02 kg",
      "brand": "De Ley",
      "unit_size": "1.02 kg",
      "diet_tags": [
        "sin_tacc",
        "sin_lactosa",
        "vegano"
      ],
      "min_price": 74,
      "offers": {
        "frog": {
          "price": 74,
          "url": "https://www.frog.com.uy/buscar?q=pulpa%20de%20tomate"
        },
        "geant": {
          "price": 74,
          "url": "https://www.geant.com.uy/productos/keyword/pulpa%20de%20tomate"
        },
        "el_dorado": {
          "price": 75,
          "url": "https://www.eldorado.com.uy/pulpa%20de%20tomate?_q=pulpa%20de%20tomate&map=ft"
        },
        "tata": {
          "price": 77,
          "url": "https://www.tata.com.uy/buscar?text=pulpa%20de%20tomate"
        },
        "devoto": {
          "price": 80,
          "url": "https://www.devoto.com.uy/productos/keyword/pulpa%20de%20tomate"
        },
        "tienda_inglesa": {
          "price": 80,
          "url": "https://www.tiendainglesa.com.uy/supermercado/busqueda?0,0,pulpa%20de%20tomate,0"
        },
        "disco": {
          "price": 81,
          "url": "https://www.disco.com.uy/productos/keyword/pulpa%20de%20tomate"
        }
      }
    },
    {
      "id": 419,
      "ean": "",
      "name": "Pulpa de tomate GOURMET 206 g",
      "brand": "Gourmet",
      "unit_size": "206 g",
      "diet_tags": [],
      "min_price": 34,
      "offers": {
        "frog": {
          "price": 34,
          "url": "https://frog.uy/gourmet-pulpa-206gr"
        },
        "tata": {
          "price": 40,
          "url": "https://www.tata.com.uy/pulpa-de-tomate-gourmet-206-g-16209/p"
        },
        "disco": {
          "price": 41,
          "url": "https://www.disco.com.uy/product/pulpa-de-tomate-gourmet-206-g/704199"
        },
        "devoto": {
          "price": 41,
          "url": "https://www.devoto.com.uy/product/pulpa-de-tomate-gourmet-206-g/704199"
        },
        "geant": {
          "price": 41,
          "url": "https://www.geant.com.uy/product/pulpa-de-tomate-gourmet-206-g/704199"
        }
      }
    }
  ],
  "queso_azul": [
    {
      "id": 1934,
      "ean": "7730991004006",
      "name": "Queso Azul Roquefort Calcar 150 g",
      "brand": "Calcar",
      "unit_size": "150 g",
      "diet_tags": [
        "sin_tacc"
      ],
      "min_price": 146,
      "offers": {
        "frog": {
          "price": 146,
          "url": "https://www.frog.com.uy/buscar?q=queso%20azul"
        },
        "geant": {
          "price": 146,
          "url": "https://www.geant.com.uy/productos/keyword/queso%20azul"
        },
        "el_dorado": {
          "price": 147,
          "url": "https://www.eldorado.com.uy/queso%20azul?_q=queso%20azul&map=ft"
        },
        "tata": {
          "price": 152,
          "url": "https://www.tata.com.uy/buscar?text=queso%20azul"
        },
        "devoto": {
          "price": 157,
          "url": "https://www.devoto.com.uy/productos/keyword/queso%20azul"
        },
        "disco": {
          "price": 158,
          "url": "https://www.disco.com.uy/productos/keyword/queso%20azul"
        },
        "tienda_inglesa": {
          "price": 158,
          "url": "https://www.tiendainglesa.com.uy/supermercado/busqueda?0,0,queso%20azul,0"
        }
      }
    }
  ],
  "queso_colonia": [
    {
      "id": 1933,
      "ean": "7730991004005",
      "name": "Queso Colonia / Dambo Feteado Conaprole 200 g",
      "brand": "Conaprole",
      "unit_size": "200 g",
      "diet_tags": [
        "sin_tacc"
      ],
      "min_price": 132,
      "offers": {
        "frog": {
          "price": 132,
          "url": "https://www.frog.com.uy/buscar?q=queso%20dambo%20conaprole"
        },
        "el_dorado": {
          "price": 133,
          "url": "https://www.eldorado.com.uy/queso%20dambo%20conaprole?_q=queso%20dambo%20conaprole&map=ft"
        },
        "tata": {
          "price": 138,
          "url": "https://www.tata.com.uy/buscar?text=queso%20dambo%20conaprole"
        },
        "devoto": {
          "price": 142,
          "url": "https://www.devoto.com.uy/productos/keyword/queso%20dambo%20conaprole"
        },
        "disco": {
          "price": 143,
          "url": "https://www.disco.com.uy/productos/keyword/queso%20dambo%20conaprole"
        },
        "geant": {
          "price": 145,
          "url": "https://www.geant.com.uy/productos/keyword/queso%20dambo%20conaprole"
        },
        "tienda_inglesa": {
          "price": 157,
          "url": "https://www.tiendainglesa.com.uy/supermercado/busqueda?0,0,queso%20dambo%20conaprole,0"
        }
      }
    },
    {
      "id": 397,
      "ean": "",
      "name": "Polenta GOURMET Queso 400 g",
      "brand": "Gourmet",
      "unit_size": "400 g",
      "diet_tags": [],
      "min_price": 59,
      "offers": {
        "disco": {
          "price": 59,
          "url": "https://www.disco.com.uy/product/polenta-gourmet-queso-400-g/373564"
        },
        "devoto": {
          "price": 59,
          "url": "https://www.devoto.com.uy/product/polenta-gourmet-queso-400-g/373564"
        },
        "geant": {
          "price": 59,
          "url": "https://www.geant.com.uy/product/polenta-gourmet-queso-400-g/373564"
        }
      }
    }
  ],
  "queso_crema": [
    {
      "id": 1932,
      "ean": "7730991004004",
      "name": "Queso Crema Blanco Conaprole 200 g",
      "brand": "Conaprole",
      "unit_size": "200 g",
      "diet_tags": [
        "sin_tacc"
      ],
      "min_price": 100,
      "offers": {
        "frog": {
          "price": 100,
          "url": "https://www.frog.com.uy/buscar?q=queso%20crema%20conaprole"
        },
        "el_dorado": {
          "price": 101,
          "url": "https://www.eldorado.com.uy/queso%20crema%20conaprole?_q=queso%20crema%20conaprole&map=ft"
        },
        "tata": {
          "price": 105,
          "url": "https://www.tata.com.uy/buscar?text=queso%20crema%20conaprole"
        },
        "devoto": {
          "price": 108,
          "url": "https://www.devoto.com.uy/productos/keyword/queso%20crema%20conaprole"
        },
        "disco": {
          "price": 109,
          "url": "https://www.disco.com.uy/productos/keyword/queso%20crema%20conaprole"
        },
        "geant": {
          "price": 110,
          "url": "https://www.geant.com.uy/productos/keyword/queso%20crema%20conaprole"
        },
        "tienda_inglesa": {
          "price": 119,
          "url": "https://www.tiendainglesa.com.uy/supermercado/busqueda?0,0,queso%20crema%20conaprole,0"
        }
      }
    }
  ],
  "queso_sin_lactosa": [
    {
      "id": 1917,
      "ean": "7730991002003",
      "name": "Queso Crema Untable Deslactosado Conaprole 200 g",
      "brand": "Conaprole",
      "unit_size": "200 g",
      "diet_tags": [
        "sin_lactosa"
      ],
      "min_price": 116,
      "offers": {
        "el_dorado": {
          "price": 116,
          "url": "https://www.eldorado.com.uy/queso%20untable%20deslactosado?_q=queso%20untable%20deslactosado&map=ft"
        },
        "tata": {
          "price": 120,
          "url": "https://www.tata.com.uy/buscar?text=queso%20untable%20deslactosado"
        },
        "frog": {
          "price": 126,
          "url": "https://www.frog.com.uy/buscar?q=queso%20untable%20deslactosado"
        },
        "geant": {
          "price": 126,
          "url": "https://www.geant.com.uy/productos/keyword/queso%20untable%20deslactosado"
        },
        "devoto": {
          "price": 136,
          "url": "https://www.devoto.com.uy/productos/keyword/queso%20untable%20deslactosado"
        },
        "disco": {
          "price": 137,
          "url": "https://www.disco.com.uy/productos/keyword/queso%20untable%20deslactosado"
        },
        "tienda_inglesa": {
          "price": 137,
          "url": "https://www.tiendainglesa.com.uy/supermercado/busqueda?0,0,queso%20untable%20deslactosado,0"
        }
      }
    }
  ],
  "mozzarella": [
    {
      "id": 1930,
      "ean": "7730991004002",
      "name": "Queso Mozzarella en Trozo Conaprole 250 g",
      "brand": "Conaprole",
      "unit_size": "250 g",
      "diet_tags": [
        "sin_tacc"
      ],
      "min_price": 136,
      "offers": {
        "el_dorado": {
          "price": 136,
          "url": "https://www.eldorado.com.uy/mozzarella%20conaprole?_q=mozzarella%20conaprole&map=ft"
        },
        "tata": {
          "price": 140,
          "url": "https://www.tata.com.uy/buscar?text=mozzarella%20conaprole"
        },
        "devoto": {
          "price": 144,
          "url": "https://www.devoto.com.uy/productos/keyword/mozzarella%20conaprole"
        },
        "frog": {
          "price": 147,
          "url": "https://www.frog.com.uy/buscar?q=mozzarella%20conaprole"
        },
        "geant": {
          "price": 147,
          "url": "https://www.geant.com.uy/productos/keyword/mozzarella%20conaprole"
        },
        "disco": {
          "price": 160,
          "url": "https://www.disco.com.uy/productos/keyword/mozzarella%20conaprole"
        },
        "tienda_inglesa": {
          "price": 160,
          "url": "https://www.tiendainglesa.com.uy/supermercado/busqueda?0,0,mozzarella%20conaprole,0"
        }
      }
    },
    {
      "id": 54,
      "ean": "",
      "name": "Queso Muzzarella CONAPROLE (kg)",
      "brand": "Conaprole",
      "unit_size": "",
      "diet_tags": [],
      "min_price": 630,
      "offers": {
        "tienda_inglesa": {
          "price": 630,
          "url": "https://www.tiendainglesa.com.uy/supermercado/queso-muzzarella-conaprole-kg.producto?1097368,,42&campaign=search_facets"
        }
      }
    }
  ],
  "queso_rallado": [
    {
      "id": 1931,
      "ean": "7730991004003",
      "name": "Queso Rallado Parmesano Conaprole 80 g",
      "brand": "Conaprole",
      "unit_size": "80 g",
      "diet_tags": [
        "sin_tacc"
      ],
      "min_price": 110,
      "offers": {
        "el_dorado": {
          "price": 110,
          "url": "https://www.eldorado.com.uy/queso%20rallado%20conaprole?_q=queso%20rallado%20conaprole&map=ft"
        },
        "tata": {
          "price": 113,
          "url": "https://www.tata.com.uy/buscar?text=queso%20rallado%20conaprole"
        },
        "devoto": {
          "price": 117,
          "url": "https://www.devoto.com.uy/productos/keyword/queso%20rallado%20conaprole"
        },
        "disco": {
          "price": 118,
          "url": "https://www.disco.com.uy/productos/keyword/queso%20rallado%20conaprole"
        },
        "frog": {
          "price": 119,
          "url": "https://www.frog.com.uy/buscar?q=queso%20rallado%20conaprole"
        },
        "geant": {
          "price": 119,
          "url": "https://www.geant.com.uy/productos/keyword/queso%20rallado%20conaprole"
        },
        "tienda_inglesa": {
          "price": 129,
          "url": "https://www.tiendainglesa.com.uy/supermercado/busqueda?0,0,queso%20rallado%20conaprole,0"
        }
      }
    },
    {
      "id": 1190,
      "ean": "7730233000692",
      "name": "Galletas Moly Rusticas Sabor Parmesano 120gr",
      "brand": "Moly",
      "unit_size": "120gr",
      "diet_tags": [],
      "min_price": 190,
      "offers": {
        "el_dorado": {
          "price": 190,
          "url": "https://www.eldorado.com.uy/galletas-moly-rusticas-sabor-parmesano-120gr/p"
        }
      }
    }
  ],
  "queso_vegetal": [
    {
      "id": 1920,
      "ean": "7730991002006",
      "name": "Queso Vegetal Fundible tipo Mozzarella 200 g",
      "brand": "NotCo",
      "unit_size": "200 g",
      "diet_tags": [
        "sin_lactosa",
        "vegano",
        "sin_tacc"
      ],
      "min_price": 180,
      "offers": {
        "frog": {
          "price": 180,
          "url": "https://www.frog.com.uy/buscar?q=queso%20vegetal"
        },
        "el_dorado": {
          "price": 181,
          "url": "https://www.eldorado.com.uy/queso%20vegetal?_q=queso%20vegetal&map=ft"
        },
        "tata": {
          "price": 187,
          "url": "https://www.tata.com.uy/buscar?text=queso%20vegetal"
        },
        "devoto": {
          "price": 193,
          "url": "https://www.devoto.com.uy/productos/keyword/queso%20vegetal"
        },
        "disco": {
          "price": 195,
          "url": "https://www.disco.com.uy/productos/keyword/queso%20vegetal"
        },
        "geant": {
          "price": 197,
          "url": "https://www.geant.com.uy/productos/keyword/queso%20vegetal"
        },
        "tienda_inglesa": {
          "price": 213,
          "url": "https://www.tiendainglesa.com.uy/supermercado/busqueda?0,0,queso%20vegetal,0"
        }
      }
    }
  ],
  "rebozador_sin_tacc": [
    {
      "id": 1910,
      "ean": "7730991001007",
      "name": "Rebozador / Pan Rallado de Arroz Sin TACC Niter 400 g",
      "brand": "Niter",
      "unit_size": "400 g",
      "diet_tags": [
        "sin_tacc"
      ],
      "min_price": 124,
      "offers": {
        "frog": {
          "price": 124,
          "url": "https://www.frog.com.uy/buscar?q=rebozador%20sin%20gluten"
        },
        "el_dorado": {
          "price": 126,
          "url": "https://www.eldorado.com.uy/rebozador%20sin%20gluten?_q=rebozador%20sin%20gluten&map=ft"
        },
        "tata": {
          "price": 130,
          "url": "https://www.tata.com.uy/buscar?text=rebozador%20sin%20gluten"
        },
        "devoto": {
          "price": 134,
          "url": "https://www.devoto.com.uy/productos/keyword/rebozador%20sin%20gluten"
        },
        "disco": {
          "price": 135,
          "url": "https://www.disco.com.uy/productos/keyword/rebozador%20sin%20gluten"
        },
        "geant": {
          "price": 136,
          "url": "https://www.geant.com.uy/productos/keyword/rebozador%20sin%20gluten"
        },
        "tienda_inglesa": {
          "price": 147,
          "url": "https://www.tiendainglesa.com.uy/supermercado/busqueda?0,0,rebozador%20sin%20gluten,0"
        }
      }
    }
  ],
  "ricota": [
    {
      "id": 1929,
      "ean": "7730991004001",
      "name": "Ricota Magra Conaprole 400 g",
      "brand": "Conaprole",
      "unit_size": "400 g",
      "diet_tags": [
        "descremado",
        "sin_tacc"
      ],
      "min_price": 125,
      "offers": {
        "el_dorado": {
          "price": 125,
          "url": "https://www.eldorado.com.uy/ricota%20conaprole?_q=ricota%20conaprole&map=ft"
        },
        "tata": {
          "price": 128,
          "url": "https://www.tata.com.uy/buscar?text=ricota%20conaprole"
        },
        "frog": {
          "price": 135,
          "url": "https://www.frog.com.uy/buscar?q=ricota%20conaprole"
        },
        "geant": {
          "price": 135,
          "url": "https://www.geant.com.uy/productos/keyword/ricota%20conaprole"
        },
        "devoto": {
          "price": 145,
          "url": "https://www.devoto.com.uy/productos/keyword/ricota%20conaprole"
        },
        "disco": {
          "price": 146,
          "url": "https://www.disco.com.uy/productos/keyword/ricota%20conaprole"
        },
        "tienda_inglesa": {
          "price": 146,
          "url": "https://www.tiendainglesa.com.uy/supermercado/busqueda?0,0,ricota%20conaprole,0"
        }
      }
    },
    {
      "id": 1708,
      "ean": "2468400000002",
      "name": "Queso Piamontes Ricotta Kg",
      "brand": "Piamontes",
      "unit_size": "",
      "diet_tags": [],
      "min_price": 229,
      "offers": {
        "el_dorado": {
          "price": 229,
          "url": "https://www.eldorado.com.uy/queso-piamontes-ricotta-kg/p"
        }
      }
    }
  ],
  "verduras_hoja": [
    {
      "id": 2001,
      "ean": "7730991008019",
      "name": "Rúcula / Lechuga / Repollo / Apio Fresco",
      "brand": "Feria / Frescos",
      "unit_size": "",
      "diet_tags": [
        "sin_tacc",
        "sin_lactosa",
        "vegano"
      ],
      "min_price": 48,
      "offers": {
        "frog": {
          "price": 48,
          "url": "https://www.frog.com.uy/buscar?q=rucula"
        },
        "el_dorado": {
          "price": 49,
          "url": "https://www.eldorado.com.uy/rucula?_q=rucula&map=ft"
        },
        "tata": {
          "price": 50,
          "url": "https://www.tata.com.uy/buscar?text=rucula"
        },
        "devoto": {
          "price": 52,
          "url": "https://www.devoto.com.uy/productos/keyword/rucula"
        },
        "disco": {
          "price": 52,
          "url": "https://www.disco.com.uy/productos/keyword/rucula"
        },
        "geant": {
          "price": 53,
          "url": "https://www.geant.com.uy/productos/keyword/rucula"
        },
        "tienda_inglesa": {
          "price": 57,
          "url": "https://www.tiendainglesa.com.uy/supermercado/busqueda?0,0,rucula,0"
        }
      }
    }
  ],
  "sal": [
    {
      "id": 2008,
      "ean": "7730991007019",
      "name": "Sal Fina Celusal / Sek 500 g",
      "brand": "Sek",
      "unit_size": "500 g",
      "diet_tags": [
        "sin_tacc",
        "sin_lactosa",
        "vegano"
      ],
      "min_price": 36,
      "offers": {
        "frog": {
          "price": 36,
          "url": "https://www.frog.com.uy/buscar?q=sal%20fina"
        },
        "el_dorado": {
          "price": 36,
          "url": "https://www.eldorado.com.uy/sal%20fina?_q=sal%20fina&map=ft"
        },
        "tata": {
          "price": 37,
          "url": "https://www.tata.com.uy/buscar?text=sal%20fina"
        },
        "geant": {
          "price": 39,
          "url": "https://www.geant.com.uy/productos/keyword/sal%20fina"
        },
        "devoto": {
          "price": 39,
          "url": "https://www.devoto.com.uy/productos/keyword/sal%20fina"
        },
        "disco": {
          "price": 39,
          "url": "https://www.disco.com.uy/productos/keyword/sal%20fina"
        },
        "tienda_inglesa": {
          "price": 43,
          "url": "https://www.tiendainglesa.com.uy/supermercado/busqueda?0,0,sal%20fina,0"
        }
      }
    },
    {
      "id": 509,
      "ean": "",
      "name": "Sal fina SAL SEK yodada 500 g",
      "brand": "Sal Sek",
      "unit_size": "500 g",
      "diet_tags": [],
      "min_price": 66,
      "offers": {
        "devoto": {
          "price": 66,
          "url": "https://www.devoto.com.uy/product/sal-fina-sal-sek-yodada-500-g/663040"
        },
        "geant": {
          "price": 66,
          "url": "https://www.geant.com.uy/product/sal-fina-sal-sek-yodada-500-g/663040"
        },
        "tienda_inglesa": {
          "price": 71,
          "url": "https://www.tiendainglesa.com.uy/supermercado/sal-fina-sek-yodada-500-g.producto?7785,,42"
        },
        "tata": {
          "price": 85,
          "url": "https://www.tata.com.uy/sal-fina-yodada-sek-500-g-3314/p"
        }
      }
    }
  ],
  "soja_texturizada": [
    {
      "id": 1922,
      "ean": "7730991002008",
      "name": "Soja Texturizada Fina Niter 300 g",
      "brand": "Niter",
      "unit_size": "300 g",
      "diet_tags": [
        "sin_lactosa",
        "vegano"
      ],
      "min_price": 92,
      "offers": {
        "frog": {
          "price": 92,
          "url": "https://www.frog.com.uy/buscar?q=soja%20texturizada"
        },
        "geant": {
          "price": 92,
          "url": "https://www.geant.com.uy/productos/keyword/soja%20texturizada"
        },
        "el_dorado": {
          "price": 93,
          "url": "https://www.eldorado.com.uy/soja%20texturizada?_q=soja%20texturizada&map=ft"
        },
        "tata": {
          "price": 96,
          "url": "https://www.tata.com.uy/buscar?text=soja%20texturizada"
        },
        "devoto": {
          "price": 99,
          "url": "https://www.devoto.com.uy/productos/keyword/soja%20texturizada"
        },
        "disco": {
          "price": 100,
          "url": "https://www.disco.com.uy/productos/keyword/soja%20texturizada"
        },
        "tienda_inglesa": {
          "price": 100,
          "url": "https://www.tiendainglesa.com.uy/supermercado/busqueda?0,0,soja%20texturizada,0"
        }
      }
    }
  ],
  "pechuga_pollo": [
    {
      "id": 1957,
      "ean": "7730991006001",
      "name": "Suprema / Pechuga de Pollo sin Piel 500 g",
      "brand": "Avícola del Oeste",
      "unit_size": "500 g",
      "diet_tags": [
        "sin_tacc",
        "sin_lactosa"
      ],
      "min_price": 165,
      "offers": {
        "el_dorado": {
          "price": 165,
          "url": "https://www.eldorado.com.uy/pechuga%20de%20pollo?_q=pechuga%20de%20pollo&map=ft"
        },
        "tata": {
          "price": 170,
          "url": "https://www.tata.com.uy/buscar?text=pechuga%20de%20pollo"
        },
        "devoto": {
          "price": 175,
          "url": "https://www.devoto.com.uy/productos/keyword/pechuga%20de%20pollo"
        },
        "disco": {
          "price": 177,
          "url": "https://www.disco.com.uy/productos/keyword/pechuga%20de%20pollo"
        },
        "frog": {
          "price": 179,
          "url": "https://www.frog.com.uy/buscar?q=pechuga%20de%20pollo"
        },
        "geant": {
          "price": 179,
          "url": "https://www.geant.com.uy/productos/keyword/pechuga%20de%20pollo"
        },
        "tienda_inglesa": {
          "price": 194,
          "url": "https://www.tiendainglesa.com.uy/supermercado/busqueda?0,0,pechuga%20de%20pollo,0"
        }
      }
    },
    {
      "id": 645,
      "ean": "",
      "name": "Milanesa De La Planta Sabor Pollo 230 g",
      "brand": "",
      "unit_size": "230 g",
      "diet_tags": [],
      "min_price": 273,
      "offers": {
        "tata": {
          "price": 273,
          "url": "https://www.tata.com.uy/milanesa-de-la-planta-sabor-pollo-230-g-1000582969-172730/p"
        }
      }
    }
  ],
  "semola": [
    {
      "id": 1945,
      "ean": "7730991005006",
      "name": "Sémola de Trigo Cañuelas 500 g",
      "brand": "Cañuelas",
      "unit_size": "500 g",
      "diet_tags": [],
      "min_price": 65,
      "offers": {
        "frog": {
          "price": 65,
          "url": "https://www.frog.com.uy/buscar?q=semola"
        },
        "el_dorado": {
          "price": 65,
          "url": "https://www.eldorado.com.uy/semola?_q=semola&map=ft"
        },
        "geant": {
          "price": 65,
          "url": "https://www.geant.com.uy/productos/keyword/semola"
        },
        "tata": {
          "price": 67,
          "url": "https://www.tata.com.uy/buscar?text=semola"
        },
        "devoto": {
          "price": 69,
          "url": "https://www.devoto.com.uy/productos/keyword/semola"
        },
        "disco": {
          "price": 70,
          "url": "https://www.disco.com.uy/productos/keyword/semola"
        },
        "tienda_inglesa": {
          "price": 70,
          "url": "https://www.tiendainglesa.com.uy/supermercado/busqueda?0,0,semola,0"
        }
      }
    }
  ],
  "tapas_empanadas": [
    {
      "id": 1944,
      "ean": "7730991005005",
      "name": "Tapas para Empanadas / Copetín Avanti 330 g",
      "brand": "Avanti",
      "unit_size": "330 g",
      "diet_tags": [],
      "min_price": 83,
      "offers": {
        "frog": {
          "price": 83,
          "url": "https://www.frog.com.uy/buscar?q=tapas%20de%20empanadas"
        },
        "geant": {
          "price": 83,
          "url": "https://www.geant.com.uy/productos/keyword/tapas%20de%20empanadas"
        },
        "el_dorado": {
          "price": 84,
          "url": "https://www.eldorado.com.uy/tapas%20de%20empanadas?_q=tapas%20de%20empanadas&map=ft"
        },
        "tata": {
          "price": 86,
          "url": "https://www.tata.com.uy/buscar?text=tapas%20de%20empanadas"
        },
        "devoto": {
          "price": 89,
          "url": "https://www.devoto.com.uy/productos/keyword/tapas%20de%20empanadas"
        },
        "disco": {
          "price": 90,
          "url": "https://www.disco.com.uy/productos/keyword/tapas%20de%20empanadas"
        },
        "tienda_inglesa": {
          "price": 90,
          "url": "https://www.tiendainglesa.com.uy/supermercado/busqueda?0,0,tapas%20de%20empanadas,0"
        }
      }
    },
    {
      "id": 1191,
      "ean": "7730233000708",
      "name": "Galletas Moly Rusticas Sabor Remolacha 120gr",
      "brand": "Moly",
      "unit_size": "120gr",
      "diet_tags": [],
      "min_price": 190,
      "offers": {
        "el_dorado": {
          "price": 190,
          "url": "https://www.eldorado.com.uy/galletas-moly-rusticas-sabor-remolacha-120gr/p"
        }
      }
    }
  ],
  "tapas_sin_tacc": [
    {
      "id": 1908,
      "ean": "7730991001005",
      "name": "Tapas para Empanadas Sin TACC Libre de Gluten 300 g",
      "brand": "La Abundancia",
      "unit_size": "300 g",
      "diet_tags": [
        "sin_tacc"
      ],
      "min_price": 144,
      "offers": {
        "el_dorado": {
          "price": 144,
          "url": "https://www.eldorado.com.uy/tapas%20empanadas%20sin%20gluten?_q=tapas%20empanadas%20sin%20gluten&map=ft"
        },
        "tata": {
          "price": 149,
          "url": "https://www.tata.com.uy/buscar?text=tapas%20empanadas%20sin%20gluten"
        },
        "devoto": {
          "price": 153,
          "url": "https://www.devoto.com.uy/productos/keyword/tapas%20empanadas%20sin%20gluten"
        },
        "frog": {
          "price": 156,
          "url": "https://www.frog.com.uy/buscar?q=tapas%20empanadas%20sin%20gluten"
        },
        "geant": {
          "price": 156,
          "url": "https://www.geant.com.uy/productos/keyword/tapas%20empanadas%20sin%20gluten"
        },
        "disco": {
          "price": 169,
          "url": "https://www.disco.com.uy/productos/keyword/tapas%20empanadas%20sin%20gluten"
        },
        "tienda_inglesa": {
          "price": 169,
          "url": "https://www.tiendainglesa.com.uy/supermercado/busqueda?0,0,tapas%20empanadas%20sin%20gluten,0"
        }
      }
    }
  ],
  "tofu": [
    {
      "id": 1921,
      "ean": "7730991002007",
      "name": "Tofu Firme Natural de Soja 250 g",
      "brand": "Manducas",
      "unit_size": "250 g",
      "diet_tags": [
        "sin_lactosa",
        "vegano",
        "sin_tacc"
      ],
      "min_price": 156,
      "offers": {
        "frog": {
          "price": 156,
          "url": "https://www.frog.com.uy/buscar?q=tofu"
        },
        "el_dorado": {
          "price": 158,
          "url": "https://www.eldorado.com.uy/tofu?_q=tofu&map=ft"
        },
        "tata": {
          "price": 163,
          "url": "https://www.tata.com.uy/buscar?text=tofu"
        },
        "devoto": {
          "price": 168,
          "url": "https://www.devoto.com.uy/productos/keyword/tofu"
        },
        "disco": {
          "price": 170,
          "url": "https://www.disco.com.uy/productos/keyword/tofu"
        },
        "geant": {
          "price": 171,
          "url": "https://www.geant.com.uy/productos/keyword/tofu"
        },
        "tienda_inglesa": {
          "price": 185,
          "url": "https://www.tiendainglesa.com.uy/supermercado/busqueda?0,0,tofu,0"
        }
      }
    }
  ],
  "tomate": [
    {
      "id": 1989,
      "ean": "7730991008007",
      "name": "Tomate Perita / Cherry Fresco 500 g",
      "brand": "Feria / Frescos",
      "unit_size": "500 g",
      "diet_tags": [
        "sin_tacc",
        "sin_lactosa",
        "vegano"
      ],
      "min_price": 63,
      "offers": {
        "el_dorado": {
          "price": 63,
          "url": "https://www.eldorado.com.uy/tomate%20perita?_q=tomate%20perita&map=ft"
        },
        "tata": {
          "price": 65,
          "url": "https://www.tata.com.uy/buscar?text=tomate%20perita"
        },
        "devoto": {
          "price": 67,
          "url": "https://www.devoto.com.uy/productos/keyword/tomate%20perita"
        },
        "frog": {
          "price": 68,
          "url": "https://www.frog.com.uy/buscar?q=tomate%20perita"
        },
        "geant": {
          "price": 68,
          "url": "https://www.geant.com.uy/productos/keyword/tomate%20perita"
        },
        "disco": {
          "price": 74,
          "url": "https://www.disco.com.uy/productos/keyword/tomate%20perita"
        },
        "tienda_inglesa": {
          "price": 74,
          "url": "https://www.tiendainglesa.com.uy/supermercado/busqueda?0,0,tomate%20perita,0"
        }
      }
    },
    {
      "id": 415,
      "ean": "",
      "name": "Tomate perita NOEL 400 g",
      "brand": "Noel",
      "unit_size": "400 g",
      "diet_tags": [],
      "min_price": 30,
      "offers": {
        "disco": {
          "price": 30,
          "url": "https://www.disco.com.uy/product/tomate-perita-noel-400-g/674945"
        },
        "devoto": {
          "price": 30,
          "url": "https://www.devoto.com.uy/product/tomate-perita-noel-400-g/674945"
        },
        "geant": {
          "price": 45,
          "url": "https://www.geant.com.uy/product/tomate-perita-noel-400-g/674945"
        }
      }
    }
  ],
  "tomates_secos": [
    {
      "id": 1990,
      "ean": "7730991008008",
      "name": "Tomates Secos Hidratados Bandeja 100 g",
      "brand": "Feria / Frescos",
      "unit_size": "100 g",
      "diet_tags": [
        "sin_tacc",
        "sin_lactosa",
        "vegano"
      ],
      "min_price": 90,
      "offers": {
        "el_dorado": {
          "price": 90,
          "url": "https://www.eldorado.com.uy/tomates%20secos?_q=tomates%20secos&map=ft"
        },
        "tata": {
          "price": 93,
          "url": "https://www.tata.com.uy/buscar?text=tomates%20secos"
        },
        "devoto": {
          "price": 96,
          "url": "https://www.devoto.com.uy/productos/keyword/tomates%20secos"
        },
        "disco": {
          "price": 97,
          "url": "https://www.disco.com.uy/productos/keyword/tomates%20secos"
        },
        "frog": {
          "price": 98,
          "url": "https://www.frog.com.uy/buscar?q=tomates%20secos"
        },
        "geant": {
          "price": 98,
          "url": "https://www.geant.com.uy/productos/keyword/tomates%20secos"
        },
        "tienda_inglesa": {
          "price": 106,
          "url": "https://www.tiendainglesa.com.uy/supermercado/busqueda?0,0,tomates%20secos,0"
        }
      }
    }
  ],
  "trigo_burgol": [
    {
      "id": 1946,
      "ean": "7730991005007",
      "name": "Trigo Burgol Fino Niter 500 g",
      "brand": "Niter",
      "unit_size": "500 g",
      "diet_tags": [],
      "min_price": 78,
      "offers": {
        "tata": {
          "price": 78,
          "url": "https://www.tata.com.uy/buscar?text=trigo%20burgol"
        },
        "frog": {
          "price": 82,
          "url": "https://www.frog.com.uy/buscar?q=trigo%20burgol"
        },
        "el_dorado": {
          "price": 82,
          "url": "https://www.eldorado.com.uy/trigo%20burgol?_q=trigo%20burgol&map=ft"
        },
        "geant": {
          "price": 82,
          "url": "https://www.geant.com.uy/productos/keyword/trigo%20burgol"
        },
        "devoto": {
          "price": 88,
          "url": "https://www.devoto.com.uy/productos/keyword/trigo%20burgol"
        },
        "disco": {
          "price": 88,
          "url": "https://www.disco.com.uy/productos/keyword/trigo%20burgol"
        },
        "tienda_inglesa": {
          "price": 88,
          "url": "https://www.tiendainglesa.com.uy/supermercado/busqueda?0,0,trigo%20burgol,0"
        }
      }
    }
  ],
  "vinagre": [
    {
      "id": 2010,
      "ean": "7730991007021",
      "name": "Vinagre de Vino / Alcohol 500 ml",
      "brand": "Río de la Plata",
      "unit_size": "500 ml",
      "diet_tags": [
        "sin_tacc",
        "sin_lactosa",
        "vegano"
      ],
      "min_price": 55,
      "offers": {
        "frog": {
          "price": 55,
          "url": "https://www.frog.com.uy/buscar?q=vinagre"
        },
        "el_dorado": {
          "price": 55,
          "url": "https://www.eldorado.com.uy/vinagre?_q=vinagre&map=ft"
        },
        "geant": {
          "price": 55,
          "url": "https://www.geant.com.uy/productos/keyword/vinagre"
        },
        "tata": {
          "price": 57,
          "url": "https://www.tata.com.uy/buscar?text=vinagre"
        },
        "devoto": {
          "price": 59,
          "url": "https://www.devoto.com.uy/productos/keyword/vinagre"
        },
        "disco": {
          "price": 59,
          "url": "https://www.disco.com.uy/productos/keyword/vinagre"
        },
        "tienda_inglesa": {
          "price": 59,
          "url": "https://www.tiendainglesa.com.uy/supermercado/busqueda?0,0,vinagre,0"
        }
      }
    },
    {
      "id": 479,
      "ean": "",
      "name": "Vinagre de Alcohol COLOLÓ 500 cc",
      "brand": "Cololó",
      "unit_size": "500 cc",
      "diet_tags": [],
      "min_price": 25,
      "offers": {
        "el_clon": {
          "price": 25,
          "url": "https://www.elclon.com.uy/catalogo/vinagre-cololo-alcohol-500-ml_35338_0"
        },
        "disco": {
          "price": 36,
          "url": "https://www.disco.com.uy/product/vinagre-de-alcohol-cololo-500-cc/677331"
        },
        "devoto": {
          "price": 36,
          "url": "https://www.devoto.com.uy/product/vinagre-de-alcohol-cololo-500-cc/677331"
        },
        "geant": {
          "price": 36,
          "url": "https://www.geant.com.uy/product/vinagre-de-alcohol-cololo-500-cc/677331"
        }
      }
    }
  ],
  "vino": [
    {
      "id": 2007,
      "ean": "7730991007018",
      "name": "Vino Blanco / Tinto de Mesa Faisán 1 L",
      "brand": "Faisán",
      "unit_size": "1 L",
      "diet_tags": [
        "sin_tacc",
        "sin_lactosa",
        "vegano"
      ],
      "min_price": 134,
      "offers": {
        "el_dorado": {
          "price": 134,
          "url": "https://www.eldorado.com.uy/vino%20faisan?_q=vino%20faisan&map=ft"
        },
        "tata": {
          "price": 138,
          "url": "https://www.tata.com.uy/buscar?text=vino%20faisan"
        },
        "devoto": {
          "price": 142,
          "url": "https://www.devoto.com.uy/productos/keyword/vino%20faisan"
        },
        "disco": {
          "price": 143,
          "url": "https://www.disco.com.uy/productos/keyword/vino%20faisan"
        },
        "frog": {
          "price": 145,
          "url": "https://www.frog.com.uy/buscar?q=vino%20faisan"
        },
        "geant": {
          "price": 145,
          "url": "https://www.geant.com.uy/productos/keyword/vino%20faisan"
        },
        "tienda_inglesa": {
          "price": 157,
          "url": "https://www.tiendainglesa.com.uy/supermercado/busqueda?0,0,vino%20faisan,0"
        }
      }
    }
  ],
  "yogur": [
    {
      "id": 1938,
      "ean": "7730991004010",
      "name": "Yogur Natural Descremado Conaprole 180 g",
      "brand": "Conaprole",
      "unit_size": "180 g",
      "diet_tags": [
        "descremado",
        "sin_tacc"
      ],
      "min_price": 44,
      "offers": {
        "el_dorado": {
          "price": 44,
          "url": "https://www.eldorado.com.uy/yogur%20natural%20conaprole?_q=yogur%20natural%20conaprole&map=ft"
        },
        "tata": {
          "price": 46,
          "url": "https://www.tata.com.uy/buscar?text=yogur%20natural%20conaprole"
        },
        "frog": {
          "price": 48,
          "url": "https://www.frog.com.uy/buscar?q=yogur%20natural%20conaprole"
        },
        "geant": {
          "price": 48,
          "url": "https://www.geant.com.uy/productos/keyword/yogur%20natural%20conaprole"
        },
        "devoto": {
          "price": 51,
          "url": "https://www.devoto.com.uy/productos/keyword/yogur%20natural%20conaprole"
        },
        "disco": {
          "price": 52,
          "url": "https://www.disco.com.uy/productos/keyword/yogur%20natural%20conaprole"
        },
        "tienda_inglesa": {
          "price": 52,
          "url": "https://www.tiendainglesa.com.uy/supermercado/busqueda?0,0,yogur%20natural%20conaprole,0"
        }
      }
    },
    {
      "id": 206,
      "ean": "",
      "name": "Yogur Griego CONAPROLE Natural sin endulzar 170 g",
      "brand": "Conaprole",
      "unit_size": "170 g",
      "diet_tags": [],
      "min_price": 48,
      "offers": {
        "devoto": {
          "price": 48,
          "url": "https://www.devoto.com.uy/product/yogur-griego-conaprole-natural-sin-endulzar-170-g/243034"
        },
        "disco": {
          "price": 48,
          "url": "https://www.disco.com.uy/product/yogur-griego-conaprole-natural-sin-endulzar-170-g/243034"
        },
        "geant": {
          "price": 59,
          "url": "https://www.geant.com.uy/product/yogur-griego-conaprole-natural-sin-endulzar-170-g/243034"
        }
      }
    }
  ],
  "zanahoria": [
    {
      "id": 1992,
      "ean": "7730991008010",
      "name": "Zanahoria Fresca 500 g",
      "brand": "Feria / Frescos",
      "unit_size": "500 g",
      "diet_tags": [
        "sin_tacc",
        "sin_lactosa",
        "vegano"
      ],
      "min_price": 39,
      "offers": {
        "frog": {
          "price": 39,
          "url": "https://www.frog.com.uy/buscar?q=zanahoria"
        },
        "el_dorado": {
          "price": 39,
          "url": "https://www.eldorado.com.uy/zanahoria?_q=zanahoria&map=ft"
        },
        "tata": {
          "price": 41,
          "url": "https://www.tata.com.uy/buscar?text=zanahoria"
        },
        "devoto": {
          "price": 42,
          "url": "https://www.devoto.com.uy/productos/keyword/zanahoria"
        },
        "disco": {
          "price": 42,
          "url": "https://www.disco.com.uy/productos/keyword/zanahoria"
        },
        "geant": {
          "price": 43,
          "url": "https://www.geant.com.uy/productos/keyword/zanahoria"
        },
        "tienda_inglesa": {
          "price": 46,
          "url": "https://www.tiendainglesa.com.uy/supermercado/busqueda?0,0,zanahoria,0"
        }
      }
    }
  ],
  "zapallito": [
    {
      "id": 1997,
      "ean": "7730991008015",
      "name": "Zapallito / Zucchini Fresco 500 g",
      "brand": "Feria / Frescos",
      "unit_size": "500 g",
      "diet_tags": [
        "sin_tacc",
        "sin_lactosa",
        "vegano"
      ],
      "min_price": 53,
      "offers": {
        "el_dorado": {
          "price": 53,
          "url": "https://www.eldorado.com.uy/zucchini?_q=zucchini&map=ft"
        },
        "tata": {
          "price": 55,
          "url": "https://www.tata.com.uy/buscar?text=zucchini"
        },
        "frog": {
          "price": 58,
          "url": "https://www.frog.com.uy/buscar?q=zucchini"
        },
        "geant": {
          "price": 58,
          "url": "https://www.geant.com.uy/productos/keyword/zucchini"
        },
        "devoto": {
          "price": 62,
          "url": "https://www.devoto.com.uy/productos/keyword/zucchini"
        },
        "disco": {
          "price": 63,
          "url": "https://www.disco.com.uy/productos/keyword/zucchini"
        },
        "tienda_inglesa": {
          "price": 63,
          "url": "https://www.tiendainglesa.com.uy/supermercado/busqueda?0,0,zucchini,0"
        }
      }
    }
  ],
  "polenta": [
    {
      "id": 390,
      "ean": "",
      "name": "Polenta 1 minuto PURITAS 450 g",
      "brand": "Puritas",
      "unit_size": "450 g",
      "diet_tags": [
        "sin_tacc"
      ],
      "min_price": 35,
      "offers": {
        "el_clon": {
          "price": 35,
          "url": "https://www.elclon.com.uy/catalogo/polenta-1-minuto-puritas-450-gr_84083_0"
        },
        "frog": {
          "price": 46,
          "url": "https://frog.uy/puritas-polenta-450gr"
        },
        "disco": {
          "price": 48,
          "url": "https://www.disco.com.uy/product/polenta-1-minuto-puritas-450-g/630910"
        },
        "devoto": {
          "price": 48,
          "url": "https://www.devoto.com.uy/product/polenta-1-minuto-puritas-450-g/630910"
        },
        "geant": {
          "price": 48,
          "url": "https://www.geant.com.uy/product/polenta-1-minuto-puritas-450-g/630910"
        },
        "tata": {
          "price": 49,
          "url": "https://www.tata.com.uy/polenta-1-minuto-puritas-450-g-16198/p"
        }
      }
    },
    {
      "id": 393,
      "ean": "",
      "name": "Polenta Instantánea RÍO DE LA PLATA 450 g",
      "brand": "Río de la Plata",
      "unit_size": "450 g",
      "diet_tags": [
        "sin_tacc"
      ],
      "min_price": 35,
      "offers": {
        "el_clon": {
          "price": 35,
          "url": "https://www.elclon.com.uy/catalogo/polenta-instantanea-rio-de-la-plata-450-gr_83877_0"
        },
        "disco": {
          "price": 42,
          "url": "https://www.disco.com.uy/product/polenta-instantanea-rio-de-la-plata-450-g/981432"
        },
        "devoto": {
          "price": 42,
          "url": "https://www.devoto.com.uy/product/polenta-instantanea-rio-de-la-plata-450-g/981432"
        },
        "geant": {
          "price": 42,
          "url": "https://www.geant.com.uy/product/polenta-instantanea-rio-de-la-plata-450-g/981432"
        },
        "tienda_inglesa": {
          "price": 42,
          "url": "https://www.tiendainglesa.com.uy/supermercado/polenta-instantanea-rio-de-la-plata-450-g.producto?93253,,42"
        }
      }
    }
  ],
  "leche": [
    {
      "id": 143,
      "ean": "",
      "name": "Leche fresca entera CONAPROLE 1 L",
      "brand": "Conaprole",
      "unit_size": "1 L",
      "diet_tags": [],
      "min_price": 45,
      "offers": {
        "tienda_inglesa": {
          "price": 45,
          "url": "https://www.tiendainglesa.com.uy/supermercado/leche-conaprole-fresca-entera-sachet-1-l.producto?1531,,42"
        },
        "disco": {
          "price": 45,
          "url": "https://www.disco.com.uy/product/leche-fresca-entera-conaprole-1-l/240501"
        },
        "devoto": {
          "price": 45,
          "url": "https://www.devoto.com.uy/product/leche-fresca-entera-conaprole-1-l/240501"
        },
        "geant": {
          "price": 45,
          "url": "https://www.geant.com.uy/product/leche-fresca-entera-conaprole-1-l/240501"
        },
        "tata": {
          "price": 46,
          "url": "https://www.tata.com.uy/leche-fresca-conaprole-entera-1-l-1000047725-1280/p"
        }
      }
    },
    {
      "id": 2,
      "ean": "7730123000012",
      "name": "Leche Entera Conaprole 1 L",
      "brand": "Conaprole",
      "unit_size": "1 L",
      "diet_tags": [],
      "min_price": 46,
      "offers": {
        "tata": {
          "price": 46,
          "url": "https://www.tata.com.uy"
        },
        "disco": {
          "price": 48,
          "url": "https://www.disco.com.uy"
        },
        "devoto": {
          "price": 48,
          "url": "https://www.devoto.com.uy"
        },
        "tienda_inglesa": {
          "price": 49,
          "url": "https://www.tiendainglesa.com.uy"
        },
        "frog": {
          "price": 50,
          "url": "https://www.frog.com.uy"
        }
      }
    }
  ],
  "galletas": [
    {
      "id": 160,
      "ean": "",
      "name": "Galleta arroz SAMAN Mini 150 g",
      "brand": "Saman",
      "unit_size": "150 g",
      "diet_tags": [],
      "min_price": 83,
      "offers": {
        "geant": {
          "price": 83,
          "url": "https://www.geant.com.uy/product/galleta-arroz-saman-mini-150-g/744591"
        },
        "disco": {
          "price": 84,
          "url": "https://www.disco.com.uy/product/galleta-arroz-saman-mini-150-g/744591"
        },
        "devoto": {
          "price": 84,
          "url": "https://www.devoto.com.uy/product/galleta-arroz-saman-mini-150-g/744591"
        },
        "frog": {
          "price": 88,
          "url": "https://frog.uy/gallsaman-arroz-mini-150gr"
        }
      }
    },
    {
      "id": 158,
      "ean": "",
      "name": "Galleta arroz SAMAN sin sal Integral 150 g",
      "brand": "Saman",
      "unit_size": "150 g",
      "diet_tags": [
        "integral"
      ],
      "min_price": 77,
      "offers": {
        "geant": {
          "price": 77,
          "url": "https://www.geant.com.uy/product/galleta-arroz-saman-sin-sal-integral-150-g/744578"
        },
        "disco": {
          "price": 78,
          "url": "https://www.disco.com.uy/product/galleta-arroz-saman-sin-sal-integral-150-g/744578"
        },
        "devoto": {
          "price": 78,
          "url": "https://www.devoto.com.uy/product/galleta-arroz-saman-sin-sal-integral-150-g/744578"
        }
      }
    }
  ],
  "mermelada": [
    {
      "id": 467,
      "ean": "",
      "name": "Mermelada LOS NIETITOS 3 frutas 0% pote 400 g",
      "brand": "Los Nietitos",
      "unit_size": "400 g",
      "diet_tags": [],
      "min_price": 194,
      "offers": {
        "disco": {
          "price": 194,
          "url": "https://www.disco.com.uy/product/mermelada-los-nietitos-3-frutas-0-pote-400-g/662196"
        },
        "devoto": {
          "price": 194,
          "url": "https://www.devoto.com.uy/product/mermelada-los-nietitos-3-frutas-0-pote-400-g/662196"
        },
        "geant": {
          "price": 194,
          "url": "https://www.geant.com.uy/product/mermelada-los-nietitos-3-frutas-0-pote-400-g/662196"
        },
        "frog": {
          "price": 194,
          "url": "https://frog.uy/mermlniet3-frutas-0-pt-400gr-adu"
        }
      }
    },
    {
      "id": 466,
      "ean": "",
      "name": "Mermelada Durazno DOÑA ELVIRA 240 g",
      "brand": "Doña Elvira",
      "unit_size": "240 g",
      "diet_tags": [],
      "min_price": 50,
      "offers": {
        "disco": {
          "price": 50,
          "url": "https://www.disco.com.uy/product/mermelada-durazno-dona-elvira-240-g/662603"
        },
        "geant": {
          "price": 50,
          "url": "https://www.geant.com.uy/product/mermelada-durazno-dona-elvira-240-g/662603"
        },
        "devoto": {
          "price": 50,
          "url": "https://www.devoto.com.uy/product/mermelada-durazno-dona-elvira-240-g/662603"
        }
      }
    }
  ],
  "margarina": [
    {
      "id": 1070,
      "ean": "7891999013309",
      "name": "Margarina Mesa Con Sal 500gr",
      "brand": "Mesa",
      "unit_size": "500gr",
      "diet_tags": [],
      "min_price": 70,
      "offers": {
        "el_dorado": {
          "price": 70,
          "url": "https://www.eldorado.com.uy/margarina-mesa-con-sal-500gr/p"
        }
      }
    }
  ]
};

// Sincronización en vivo con `./data/market-catalog.json` (generado por el proyecto `precios`)
(function syncLiveMarketCatalog() {
  if (typeof fetch !== "function") return;
  fetch("./data/market-catalog.json")
    .then((r) => (r.ok ? r.json() : null))
    .then((data) => {
      if (data && data.by_ingredient && typeof data.by_ingredient === "object") {
        MDEO_CATALOG_BY_INGREDIENT = data.by_ingredient;
      }
    })
    .catch(() => {
      // Usa el índice embebido si se abre por file://
    });
})();

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
  return String(itemText || "")
    .toLowerCase()
    .replace(/\([^)]*\)/g, "")
    .replace(/\b(en tiras|en cubos|en rodajas|en aros|en gajos|lavadas con cáscara|lavada|cocidos|cocida y escurrida|picado|picados|picada|machacados|laminados|batidos|escurrido|sin espinas|abierta|rallado|rallada|maduras|madura|molida|fresco|fresca|opcional)\b/g, "")
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

// Mapea cualquier ingrediente de receta (original o adaptado a Sin TACC / Sin lactosa / Vegana / Diabetes) a su clave en `precios.db`
function resolveRecipeIngredientKey(itemText) {
  const t = String(itemText || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  const isGF = /(sin tacc|sin gluten|libre de gluten|premezcla)/.test(t);
  const isLF = /(sin lactosa|deslactosad)/.test(t);
  const isSF = /(sin azucar|stevia|edulcorante|eritritol)/.test(t);
  const isInt = /(integral|salvado)/.test(t);

  // 1. Productos Sin TACC
  if (isGF) {
    if (/(fideo|tallarin|spaghetti|espagueti|fettuccini|cinta|tirabuzon|penne|mostachol|macarron|rigatoni|caracol|monito|codito|pasta)/.test(t)) {
      return "fideos_sin_tacc";
    }
    if (/(lasana)/.test(t)) return "lasana_sin_tacc";
    if (/(pan rallado|rebozador)/.test(t)) return "rebozador_sin_tacc";
    if (/(tapa|empanada|copetin)/.test(t)) return "tapas_sin_tacc";
    if (/(panqueque|maicena|maizena|fecula)/.test(t)) return "maicena";
    if (/(premezcla|harina)/.test(t)) return "harina_sin_tacc";
    if (/(\bpan\b|molde|lactal|baguette)/.test(t)) return "pan_sin_tacc";
    if (/(avena)/.test(t)) return "avena_sin_tacc";
    if (/(polenta|semola de maiz)/.test(t)) return "polenta_sin_tacc";
    if (/(galleta)/.test(t)) return "galletas_sin_tacc";
  }

  if (/(maicena|maizena|fecula de maiz|almidon de maiz|fecula de mandioca)/.test(t)) return "maicena";

  // 2. Alternativas Sin Lactosa y Veganas
  if (/(bebida vegetal|bebida de almendra|leche de almendra|bebida de avena|bebida de soja)/.test(t)) return "bebida_vegetal";
  if (/(crema vegetal)/.test(t)) return "crema_vegetal";
  if (/(queso vegetal|mozzarella vegetal|levadura nutricional)/.test(t)) return "queso_vegetal";
  if (/(tofu)/.test(t)) return "tofu";
  if (/(soja texturizada)/.test(t)) return "soja_texturizada";
  if (/(crema de leche)/.test(t)) return isLF ? "crema_deslactosada" : "crema_de_leche";
  if (/(dulce de leche)/.test(t)) return "dulce_de_leche";
  if (/(membrillo)/.test(t)) return "membrillo";
  if (/(coco rallado|\bcoco\b)/.test(t)) return "coco_rallado";
  if (/(leche)/.test(t) && !/(coco)/.test(t)) {
    if (isLF) return "leche_deslactosada";
    if (/descremad/.test(t)) return "leche_descremada";
    return "leche";
  }
  if (/(manteca)/.test(t) && !/(mani|papel)/.test(t)) return "manteca";
  if (/(margarina)/.test(t)) return "margarina";
  if (/(yogur)/.test(t)) return "yogur";
  if (/(ricota)/.test(t)) return isLF ? "queso_sin_lactosa" : "ricota";
  if (/(mozzarella|muzzarella)/.test(t)) return isLF ? "queso_sin_lactosa" : "mozzarella";
  if (/(parmesano|sardo|provolone|queso rallado)/.test(t)) return isLF ? "queso_sin_lactosa" : "queso_rallado";
  if (/(queso crema|untable|mascarpone)/.test(t)) return isLF ? "queso_sin_lactosa" : "queso_crema";
  if (/(queso azul|roquefort)/.test(t)) return "queso_azul";
  if (/(queso|colonia|dambo|gruyere|cheddar|port salut|feta|brie)/.test(t)) return isLF ? "queso_sin_lactosa" : "queso_colonia";
  if (/(huevo|clara|yema)/.test(t) && !/(fideo|tallarin|fettuccini|cinta|pasta)/.test(t)) return "huevos";

  // 3. Pastas, Harinas, Panificados y Legumbres
  if (/(zoodles|cintas de zucchini|laminas de zucchini)/.test(t)) return "zapallito";
  if (/(lasana)/.test(t)) return "laminas_lasana";
  if (/(panqueque)/.test(t)) return "panqueques";
  if (/(tapa.*empanada|tapa.*copetin)/.test(t)) return "tapas_empanadas";
  if (/(fideo|tallarin|spaghetti|espagueti|fettuccini|cinta|tirabuzon|penne|mostachol|macarron|rigatoni|caracol|monito|codito|pasta)/.test(t)) {
    return isInt ? "fideos_integrales" : "fideos";
  }
  if (/(\barroz\b)/.test(t) && !/(galleta|harina)/.test(t)) return isInt ? "arroz_integral" : "arroz";
  if (/(semola)/.test(t)) return "semola";
  if (/(burgol)/.test(t)) return "trigo_burgol";
  if (/(polenta|harina de maiz)/.test(t)) return "polenta_sin_tacc";
  if (/(avena)/.test(t)) return "avena";
  if (/(harina de almendra)/.test(t)) return "frutos_secos";
  if (/(harina de arroz|harina de garbanzo)/.test(t)) return "harina_sin_tacc";
  if (/(harina)/.test(t)) return isInt ? "harina_integral" : "harina_trigo";
  if (/(pan rallado|rebozador)/.test(t)) return "pan_rallado";
  if (/(\bpan\b|minon|baguette|lactal|arabe|pita|tortilla)/.test(t)) return isInt ? "pan_integral" : "pan_molde";
  if (/(galleta de arroz)/.test(t)) return "galletas_sin_tacc";
  if (/(galleta)/.test(t)) return "galletas";
  if (/(levadura|polvo de hornear|bicarbonato)/.test(t)) return "levadura";
  if (/(lenteja)/.test(t)) return "lentejas";
  if (/(poroto)/.test(t)) return "porotos";
  if (/(garbanzo)/.test(t)) return "garbanzos";
  if (/(arveja)/.test(t)) return "arvejas";
  if (/(choclo)/.test(t)) return "choclo";

  // 4. Carnes, Pollo, Fiambres y Pescados
  if (/(pechuga|suprema|muslo|pollo)/.test(t) && !/caldo/.test(t)) return "pechuga_pollo";
  if (/(carne.*picada|picada magra)/.test(t)) return "carne_picada";
  if (/(bife|colita|cuadril|nalga|peceto|lomo|asado|carne)/.test(t) && !/(caldo|cerdo)/.test(t)) return "carne_vacuna";
  if (/(cerdo|bondiola|costilla)/.test(t)) return "cerdo";
  if (/(chorizo)/.test(t)) return "chorizo";
  if (/(panceta|bacon)/.test(t)) return "panceta";
  if (/(jamon crudo)/.test(t)) return "jamon_crudo";
  if (/(jamon|lomito)/.test(t)) return "jamon_cocido";
  if (/(salmon)/.test(t)) return "salmon";
  if (/(merluza|corvina|brotola|pescado)/.test(t) && !/caldo/.test(t)) return "merluza";
  if (/(atun)/.test(t)) return "atun";
  if (/(camaron|mejillon|marisco)/.test(t)) return "camarones";
  if (/(anchoa)/.test(t)) return "anchoas";

  // 5. Aceites, Salsas, Endulzantes y Condimentos
  if (/(aceite de oliva|oliva)/.test(t)) return "aceite_oliva";
  if (/(aceite)/.test(t)) return "aceite_girasol";
  if (/(aceto)/.test(t)) return "aceto";
  if (/(vinagre)/.test(t)) return "vinagre";
  if (/(vino|conac)/.test(t)) return "vino";
  if (/(mayonesa)/.test(t)) return "mayonesa";
  if (/(mostaza)/.test(t)) return "mostaza";
  if (/(extracto.*tomate)/.test(t)) return "extracto_tomate";
  if (/(pulpa de tomate|pure de tomate|salsa de tomate|tomate triturado|tomate perita en lata|tomates? en lata)/.test(t)) {
    return isSF ? "pulpa_tomate_sin_azucar" : "pulpa_tomate";
  }
  if (/(caldo)/.test(t)) return "caldo";
  if (isSF || /(edulcorante|stevia|eritritol)/.test(t)) return "edulcorante";
  if (/(azucar)/.test(t)) return "azucar";
  if (/(miel)/.test(t)) return "miel";
  if (/(mermelada)/.test(t)) return isSF ? "mermelada_sin_azucar" : "mermelada";
  if (/(cacao|chocolate)/.test(t)) return "cacao";
  if (/(nuez|nueces|almendra|avellana|castana)/.test(t)) return "frutos_secos";
  if (/(mani|pasta de mani)/.test(t)) return "mani";
  if (/(semilla|sesamo|chia|lino|girasol)/.test(t)) return "semillas";
  if (/(aceituna)/.test(t)) return "aceitunas";
  if (/(alcaparra)/.test(t)) return "alcaparras";

  // 6. Verdulería y Frutas
  if (/(papa)/.test(t)) return "papa";
  if (/(boniato)/.test(t)) return "boniato";
  if (/(calabaza|zapallo|cabutia)/.test(t)) return "calabaza";
  if (/(verdeo|puerro)/.test(t)) return "cebolla_verdeo";
  if (/(cebolla)/.test(t)) return "cebolla";
  if (/(ajo)/.test(t)) return "ajo";
  if (/(tomates? secos?)/.test(t)) return "tomates_secos";
  if (/(tomate|cherry)/.test(t)) return "tomate";
  if (/(morron|aji)/.test(t)) return "morron";
  if (/(zanahoria)/.test(t)) return "zanahoria";
  if (/(espinaca)/.test(t)) return "espinaca";
  if (/(acelga)/.test(t)) return "acelga";
  if (/(brocoli|coliflor)/.test(t)) return "brocoli";
  if (/(berenjena)/.test(t)) return "berenjena";
  if (/(zapallito|zucchini)/.test(t)) return "zapallito";
  if (/(champinon|portobello|hongo)/.test(t)) return "champinones";
  if (/(esparrago)/.test(t)) return "esparragos";
  if (/(palta)/.test(t)) return "palta";
  if (/(lechuga|rucula|repollo|pepino|apio)/.test(t)) return "verduras_hoja";
  if (/(limon|naranja|pomelo|manzana|banana|frutilla|frambuesa|durazno|ciruela|pera|anana|sandia|kiwi|uva)/.test(t)) return "frutas";
  if (/(\bsal\b|sal fina|sal gruesa)/.test(t) && !/(oregano|pimienta)/.test(t)) return "sal";
  return "especias";
}

// Convierte el tamaño del envase (ej: '500 g', '1 kg', '250 ml', '6 un') a gramos/ml/unidades para calcular la fracción usada
function parsePackAmountGrams(unitSizeStr) {
  const s = String(unitSizeStr || "").toLowerCase().replace(",", ".");
  const m = s.match(/(\d+(?:\.\d+)?)\s*(kg|gr|g|ml|cc|l|lt|lts|un)/);
  if (!m) return 500;
  const val = parseFloat(m[1]);
  const u = m[2];
  if (u === "kg" || u === "l" || u === "lt" || u === "lts") return val * 1000;
  if (u === "un") return val * 55;
  return val || 500;
}

function estimateRecipeUsageFraction(ing, multiplier, packUnitSize) {
  const amt = Math.max(0.25, (Number(ing.amount) || 1) * multiplier);
  const u = String(ing.unit || "").toLowerCase();
  const item = String(ing.item || "").toLowerCase();
  const packG = Math.max(25, parsePackAmountGrams(packUnitSize));

  let usedG = 100;
  if (u === "kg" || u === "l" || u === "litro") usedG = amt * 1000;
  else if (u === "g" || u === "gr" || u === "ml" || u === "cc") usedG = amt;
  else if (u.startsWith("taza")) usedG = amt * 160;
  else if (u === "cda" || u === "cdas" || u.startsWith("cucharada")) usedG = amt * 14;
  else if (u === "cdta" || u === "cdtas" || u === "cdita" || u.startsWith("pizca") || u === "a gusto") usedG = 12;
  else if (u.startsWith("diente")) usedG = amt * 6;
  else if (u.startsWith("feta") || u.startsWith("rebanada") || u.startsWith("lámina")) usedG = amt * 25;
  else if (u.startsWith("lata")) usedG = amt * 300;
  else if (u.startsWith("atado") || u.startsWith("manojo") || u.startsWith("puñado")) usedG = /albahaca|perejil/.test(item) ? 40 : 250;
  else if (/huevo|clara|yema/.test(item)) usedG = amt * 55;
  else if (/panqueque|tapa/.test(item)) usedG = amt * 25;
  else usedG = amt * 120;

  // Fracción entre 0.15 de un envase (condimentos/chorrito de aceite) y la cantidad de envases necesarios
  const rawFraction = usedG / packG;
  return Math.max(0.18, Math.min(4.0, rawFraction));
}

function matchCatalogProductForChain(ing, chain, multiplier) {
  const itemText = ing.item || ing.name || "";
  const ikey = resolveRecipeIngredientKey(itemText);
  const candidates = MDEO_CATALOG_BY_INGREDIENT[ikey] || [];
  const searchTerm = cleanSearchTerm(itemText) || itemText;

  if (candidates.length > 0) {
    // Elegir el producto que tenga oferta directa en esta cadena o el primero del índice
    const prod = candidates.find((p) => p.offers && p.offers[chain.id]) || candidates[0];
    const directOffer = prod.offers ? prod.offers[chain.id] : null;
    const packPrice = directOffer
      ? Math.round(Number(directOffer.price))
      : Math.round((prod.min_price || 95) * chain.priceFactor);
    const productUrl =
      directOffer && directOffer.url ? directOffer.url : chain.buildSearchUrl(prod.name || searchTerm);
    const fraction = estimateRecipeUsageFraction(ing, multiplier, prod.unit_size || "500 g");
    const proportionalUYU = Math.max(12, Math.round(packPrice * fraction));

    return {
      ingredientKey: ikey,
      matchedProductName: prod.name,
      matchedBrand: prod.brand || "",
      matchedUnitSize: prod.unit_size || "",
      matchedDietTags: prod.diet_tags || [],
      packPriceUYU: packPrice,
      proportionalUYU,
      gondolaUrl: productUrl,
      fromPreciosDb: true
    };
  }

  // Fallback si es un ingrediente no tabulado
  const base = estimateIngredientBaseUYU(ing, multiplier);
  const variance = ((hashCode(`${chain.id}-${itemText}`) % 11) - 5) / 100;
  const fallbackPrice = Math.max(12, Math.round(base * chain.priceFactor * (1 + variance)));
  return {
    ingredientKey: ikey,
    matchedProductName: itemText,
    matchedBrand: "",
    matchedUnitSize: "",
    matchedDietTags: [],
    packPriceUYU: fallbackPrice,
    proportionalUYU: fallbackPrice,
    gondolaUrl: chain.buildSearchUrl(searchTerm),
    fromPreciosDb: false
  };
}

function estimateIngredientBaseUYU(ing, multiplier) {
  const name = (ing.item || ing.name || "").toLowerCase();
  const unit = (ing.unit || "").toLowerCase();
  const qty = (Number(ing.amount) || 1) * multiplier;

  let unitPrice = 95;
  if (name.includes("salmón") || name.includes("salmon")) unitPrice = 385;
  else if (name.includes("sin tacc") || name.includes("sin gluten") || name.includes("premezcla")) unitPrice = 155;
  else if (name.includes("colita") || name.includes("bife") || name.includes("carne")) unitPrice = 240;
  else if (name.includes("pollo") || name.includes("suprema") || name.includes("muslo")) unitPrice = 180;
  else if (name.includes("merluza") || name.includes("brótola") || name.includes("atún")) unitPrice = 165;
  else if (name.includes("queso") || name.includes("ricota") || name.includes("mozzarella") || name.includes("muzzarella")) unitPrice = 140;
  else if (name.includes("yogur") || name.includes("leche")) unitPrice = 58;
  else if (name.includes("aceite de oliva")) unitPrice = 140;
  else if (name.includes("palta")) unitPrice = 79;
  else if (name.includes("huevo")) unitPrice = 15;
  else if (name.includes("lenteja") || name.includes("garbanzo") || name.includes("poroto")) unitPrice = 68;
  else if (name.includes("papa") || name.includes("boniato") || name.includes("zapallo") || name.includes("calabaza") || name.includes("zanahoria") || name.includes("cebolla") || name.includes("tomate")) unitPrice = 55;
  else if (name.includes("avena") || name.includes("arroz") || name.includes("fideos") || name.includes("harina") || name.includes("pan")) unitPrice = 69;
  else if (name.includes("sal") || name.includes("pimienta") || name.includes("orégano")) unitPrice = 18;

  if (unit === "g" || unit === "ml") return Math.max(15, Math.round((qty / 250) * unitPrice));
  if (unit === "kg" || unit === "l") return Math.max(40, Math.round(qty * unitPrice * 1.9));
  if (unit === "cda" || unit === "cdas" || unit === "cdta" || unit === "pizca" || unit === "dientes") {
    return Math.max(12, Math.round(Math.min(qty, 6) * 14));
  }
  return Math.max(20, Math.round(qty * unitPrice));
}

function estimateItemSupermarketUYU(name, amount, unit, preferredChainId = null) {
  const chains = preferredChainId
    ? MDEO_SUPERMARKETS.filter((c) => c.id === preferredChainId)
    : MDEO_SUPERMARKETS;
  const list = chains.length ? chains : MDEO_SUPERMARKETS;

  let bestPrice = Infinity;
  let bestChain = list[0];
  let bestMatch = null;

  for (const chain of list) {
    const matched = matchCatalogProductForChain({ item: name, amount, unit }, chain, 1);
    if (matched.proportionalUYU < bestPrice) {
      bestPrice = matched.proportionalUYU;
      bestChain = chain;
      bestMatch = matched;
    }
  }

  return {
    priceUYU: bestPrice,
    packPriceUYU: bestMatch ? bestMatch.packPriceUYU : bestPrice,
    matchedProductName: bestMatch ? bestMatch.matchedProductName : name,
    matchedDietTags: bestMatch ? bestMatch.matchedDietTags : [],
    chainId: bestChain.id,
    chainName: bestChain.name,
    gondolaUrl: bestMatch ? bestMatch.gondolaUrl : bestChain.buildSearchUrl(cleanSearchTerm(name) || name)
  };
}

function estimateRecipeSupermarketSummary(recipe, servingsMultiplier = 1, preferredChainId = null) {
  const normalized = {
    ...recipe,
    ingredients: (recipe.ingredients || []).map((i) => ({
      ...i,
      item: i.item || i.name || ""
    }))
  };
  const compared = compareRecipeInMontevideo(
    normalized,
    servingsMultiplier,
    MDEO_BARRIOS[0],
    "price",
    {}
  );
  const chosen = preferredChainId
    ? compared.find((c) => c.chainId === preferredChainId) || compared[0]
    : compared[0];
  const avg = Math.round(compared.reduce((s, c) => s + c.totalUYU, 0) / Math.max(1, compared.length));
  return {
    cheapestChainId: chosen.chainId,
    cheapestChainName: chosen.chainName,
    cheapestTotalUYU: chosen.totalUYU,
    cheapestPacksTotalUYU: chosen.totalPacksUYU,
    averageTotalUYU: avg,
    byChain: compared
  };
}

function compareRecipeInMontevideo(recipe, servingsMultiplier, userCoords, sortBy = "price", checkedMap = {}) {
  const results = MDEO_SUPERMARKETS.map((chain) => {
    const closestBranch = findClosestBranch(chain, userCoords);
    let totalUYU = 0;
    let totalPacksUYU = 0;

    const items = (recipe.ingredients || []).map((ing, idx) => {
      const checked = Boolean(checkedMap[idx]);
      const matched = matchCatalogProductForChain(ing, chain, servingsMultiplier);
      const rawPrice = matched.proportionalUYU;
      const packPriceUYU = matched.packPriceUYU;
      const priceUYU = checked ? 0 : rawPrice;
      totalUYU += priceUYU;
      totalPacksUYU += checked ? 0 : packPriceUYU;

      const searchTerm = cleanSearchTerm(ing.item) || ing.item;
      return {
        index: idx,
        item: ing.item,
        amount: ing.amount,
        unit: ing.unit,
        checked,
        priceUYU,
        estimatedFullPriceUYU: rawPrice,
        packPriceUYU,
        matchedProductName: matched.matchedProductName,
        matchedBrand: matched.matchedBrand,
        matchedUnitSize: matched.matchedUnitSize,
        matchedDietTags: matched.matchedDietTags,
        fromPreciosDb: matched.fromPreciosDb,
        searchTerm,
        gondolaUrl: matched.gondolaUrl
      };
    });

    return {
      chainId: chain.id,
      chainName: chain.name,
      color: chain.color,
      totalUYU,
      totalPacksUYU,
      closestBranch,
      items
    };
  });

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
