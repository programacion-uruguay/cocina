# Criterios para importar recetas (COMER BIEN / Cocina Radial)

Toda receta nueva que se incorpore desde archivos (PDF, imágenes, documentos) debe cumplir estas reglas:

1. **Disponibilidad en Uruguay**: todos los ingredientes deben conseguirse habitualmente en ferias, almacenes o supermercados de Uruguay.
   - Descartar recetas con ingredientes exóticos o poco accesibles localmente (ej. zamburiñas, rape, caracoles, ñoras, oro comestible, fabes asturianas, cochinillo).
   - Adaptar vocabulario al español rioplatense moderado (`papa` en vez de `patata`, `palta` en vez de `aguacate`, `frutilla` en vez de `fresa`, `morrón` en vez de `pimiento`, `arvejas` en vez de `guisantes`, `manteca` en vez de `mantequilla`, `crema de leche` en vez de `nata`).
2. **Cero repeticiones**: verificar siempre por `id` y por título/preparación base contra `data/recipes.json` y `js/data.js` para no duplicar recetas ya existentes.
3. **Practicidad cotidiana**: priorizar preparaciones realizables en una cocina hogareña común en Uruguay.
