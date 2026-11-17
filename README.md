# Cocina Radial — Recetario Interactivo

Web de recetas de cocina hecha con **HTML, CSS y JavaScript puro**, sin frameworks ni paso de compilación, lista para publicar en **GitHub Pages**.

## Características

- **Menú circular multinivel (4 anillos)**:
  1. **Método / Equipo**: Freidora de aire, Horno, Cocina / Olla, Parrilla / Plancha, Microondas, Sin cocción.
  2. **Momento del día**: Desayuno, Almuerzo, Merienda, Cena, Snacks / Postres.
  3. **Tipo de plato**: Pollo, Carnes, Verduras, Pastas y Arroz, Pescados, Dulces y Panes.
  4. **Estilo / Tiempo**: Express (<20 min), Saludable / Fit, Clásico, Económico.
- **Buscador** por nombre o ingrediente.
- **Favoritos** guardados en el navegador (`localStorage`).
- **Ficha de receta interactiva**:
  - Calculadora de porciones (ajusta las cantidades automáticamente).
  - Checklist de ingredientes para ir marcando mientras cocinás.
  - Temporizador de cocina integrado en los pasos con alerta sonora.

## Cómo agregar más recetas

Editá el archivo [`data/recipes.json`](data/recipes.json) agregando un objeto con la siguiente estructura:

```json
{
  "id": "mi-receta",
  "title": "Nombre de la receta",
  "metodo": "freidora",
  "momento": "almuerzo",
  "categoria": "pollo",
  "estilo": "express",
  "prepMinutes": 10,
  "cookMinutes": 15,
  "temperatureC": 190,
  "servings": 2,
  "difficulty": "Fácil",
  "description": "Breve descripción del plato.",
  "ingredients": [
    { "amount": 300, "unit": "g", "item": "pechuga de pollo" }
  ],
  "steps": [
    { "text": "Precalentar la freidora a 190 °C.", "timerMinutes": 3 },
    { "text": "Cocinar 15 minutos dando vuelta a la mitad.", "timerMinutes": 15 }
  ]
}
```

## Publicar en GitHub Pages

1. Subí los cambios a tu repositorio en GitHub (`git add . && git commit -m "Recetario radial" && git push`).
2. En GitHub, andá a **Settings → Pages**.
3. En **Source**, seleccioná **GitHub Actions** (ya incluye `.github/workflows/pages.yml`) o **Deploy from a branch** (`main` / `(root)`).
4. En unos segundos tu web quedará publicada en `https://<tu-usuario>.github.io/<tu-repo>/`.
