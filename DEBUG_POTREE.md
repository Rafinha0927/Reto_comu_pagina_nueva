# 🔍 Guía de Debugging - Problema Potree

## ¿Por qué no se ve Potree?

Hay varias razones posibles:

### 1. Librerías no cargadas desde CDN
- Las librerías (Three.js, Potree, jQuery) se cargan desde CDN (jsDelivr)
- Si tu conexión a internet falla, no se cargan
- Si CDN está caído, no se cargan

### 2. Problema de CORS (Cross-Origin)
- El navegador bloquea ciertos recursos por seguridad
- Aparece error: `Access to XMLHttpRequest blocked by CORS policy`

### 3. Incompatibilidad de versiones
- Three.js versión 0.168 podría no ser compatible con Potree 1.8
- Necesitamos versiones compatibles

---

## 🛠️ Cómo debuggear

### Paso 1: Abre la consola del navegador
```
Atajo: F12 o Ctrl+Shift+I (Windows)
Opción: Menú > Más herramientas > Herramientas para desarrolladores
```

### Paso 2: Busca errores rojo
- Si ves errores en rojo, anótalos
- Especialmente busca errores sobre librerías que no cargan

### Paso 3: Verifica qué está cargado
En la consola, escribe:
```javascript
console.log('THREE:', typeof window.THREE);
console.log('Potree:', typeof window.Potree);
console.log('jQuery:', typeof window.jQuery);
```

### Paso 4: Revisa la pestaña Network
- Ve a: DevTools > Network
- Recarga la página
- Busca las URLs que no cargan:
  - `three.min.js` (debería ser ✓ 200 OK)
  - `potree.js` (debería ser ✓ 200 OK)
  - `potree.css` (debería ser ✓ 200 OK)
  - `jquery-3.6.0.min.js` (debería ser ✓ 200 OK)

---

## ✅ Soluciones por orden de probabilidad

### Solución 1: Cambiar orden de carga (MÁS PROBABLE)
Potree necesita jQuery ANTES que Potree mismo.

**Archivo:** `frontend/src/components/PotreeViewer.tsx`
**Cambio:** El orden de `loadScript` debe ser:
1. jQuery
2. Three.js
3. Dependencias (Tween, BinaryHeap)
4. Potree

Esto ya está hecho en la versión actualizada.

### Solución 2: Usar CDN alternativo para Potree
Si jsDelivr falla, intentar con unpkg:
```javascript
// Cambiar:
"https://cdn.jsdelivr.net/npm/potree@1.8/build/potree/potree.js"

// Por:
"https://unpkg.com/potree@1.8/build/potree/potree.js"
```

### Solución 3: Versión más nueva de Three.js
```javascript
// Cambiar:
"https://cdn.jsdelivr.net/npm/three@0.168/build/three.min.js"

// Por:
"https://cdn.jsdelivr.net/npm/three@latest/build/three.min.js"
```

### Solución 4: Descargar Potree localmente
Si los CDN no funcionan, descargamos Potree a tu servidor:

```bash
# En la carpeta frontend/public/
mkdir -p public/potree
cd public/potree
# Descargar archivos necesarios
```

---

## 📊 URLs que deberían funcionar

```
✓ jQuery:    https://code.jquery.com/jquery-3.6.0.min.js
✓ Three.js:  https://cdn.jsdelivr.net/npm/three@0.168/build/three.min.js
✓ Potree JS: https://cdn.jsdelivr.net/npm/potree@1.8/build/potree/potree.js
✓ Potree CSS: https://cdn.jsdelivr.net/npm/potree@1.8/build/potree/potree.css
```

---

## 🔧 Test rápido

Abre la consola y ejecuta esto:

```javascript
// Test 1: Verificar Three.js
if (window.THREE) {
  console.log('✓ THREE cargado:', window.THREE.REVISION);
} else {
  console.error('✗ THREE no disponible');
}

// Test 2: Verificar Potree
if (window.Potree) {
  console.log('✓ Potree cargado');
  console.log('  Viewer:', typeof window.Potree.Viewer);
  console.log('  Loader:', typeof window.Potree.POCLoader);
} else {
  console.error('✗ Potree no disponible');
}

// Test 3: Verificar jQuery
if (window.jQuery) {
  console.log('✓ jQuery cargado:', window.jQuery.fn.jquery);
} else {
  console.error('✗ jQuery no disponible');
}
```

Si todos muestran ✓, entonces el problema está en la inicialización.
Si alguno muestra ✗, entonces no se cargó correctamente.

---

## 📱 Verificación de estado en la página

En la esquina superior izquierda deberías ver:
```
Monitoreo Salón 3D
Potree + 4 sensores en tiempo real

Color legend:
🔵 Frío (<18°C)
🟢 Normal (18-24°C)  
🟡 Calor (24-30°C)
🔴 Muy caliente (>30°C)

[Estado de carga aquí]
```

Si ves errores en rojo en ese panel, cópialos exactamente.

---

## 🚀 Paso siguiente

Después de debuggear:
1. Abre la consola (F12)
2. Copia el contenido de los errores
3. Envía los errores exactos que ves

Con eso podré darte la solución específica.
