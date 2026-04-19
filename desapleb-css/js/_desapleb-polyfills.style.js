/* === DESAPLEB POLYFILLS MASTER BUNDLE ===
   Incluye: Polyfills de sistema (ES5/DOM) y Emulación de Flexbox para IE9.
   Compatible con: IE9+, Chrome, Firefox, Safari.
*/
(function () {
    // --- 1. POLYFILLS DE SISTEMA (requestAnimationFrame, matches, classList) ---
    (function () {
        var lastTime = 0;
        var vendors = ['ms', 'moz', 'webkit', 'o'];
        for (var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
            window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
            window.cancelAnimationFrame = window[vendors[x] + 'CancelAnimationFrame'] || window[vendors[x] + 'CancelRequestAnimationFrame'];
        }
        if (!window.requestAnimationFrame) {
            window.requestAnimationFrame = function (callback) {
                var currTime = new Date().getTime();
                var timeToCall = Math.max(0, 16 - (currTime - lastTime));
                var id = window.setTimeout(function () { callback(currTime + timeToCall); }, timeToCall);
                lastTime = currTime + timeToCall;
                return id;
            };
        }
        if (!window.cancelAnimationFrame) {
            window.cancelAnimationFrame = function (id) { clearTimeout(id); };
        }
    }());

    (function () {
        if (typeof Element.prototype.matches !== 'function') {
            Element.prototype.matches = Element.prototype.msMatchesSelector || Element.prototype.mozMatchesSelector || Element.prototype.webkitMatchesSelector || function (s) {
                var matches = (this.document || this.ownerDocument).querySelectorAll(s), i = matches.length;
                while (--i >= 0 && matches.item(i) !== this) { }
                return i > -1;
            };
        }
    }());

    (function () {
        if (!("classList" in document.documentElement) && Object.defineProperty && typeof HTMLElement !== 'undefined') {
            Object.defineProperty(HTMLElement.prototype, 'classList', {
                get: function () {
                    var self = this;
                    function normalize(s) { return s.replace(/^\s+|\s+$/g, ''); }
                    return {
                        add: function (cls) {
                            if (!cls) return;
                            var cur = normalize(self.className).split(' '), found = false;
                            for (var i = 0; i < cur.length; i++) { if (cur[i] === cls) { found = true; break; } }
                            if (!found) { cur.push(cls); self.className = normalize(cur.join(' ')); }
                        },
                        remove: function (cls) {
                            if (!cls) return;
                            var cur = normalize(self.className).split(' ');
                            var out = [];
                            for (var j = 0; j < cur.length; j++) { if (cur[j] && cur[j] !== cls) out.push(cur[j]); }
                            self.className = normalize(out.join(' '));
                        },
                        contains: function (cls) {
                            if (!cls) return false;
                            var cur = normalize(self.className).split(' ');
                            for (var k = 0; k < cur.length; k++) { if (cur[k] === cls) return true; }
                            return false;
                        },
                        toggle: function (cls) {
                            if (!cls) return false;
                            if (this.contains(cls)) { this.remove(cls); return false; }
                            this.add(cls); return true;
                        }
                    };
                }
            });
        }
    }());

    // --- 2. EMULACIÓN DE FLEXBOX (FLEX-POLYFILL) ---
    function applyFlexFallback() {
        // Detectamos si el navegador NO soporta flex nativo (IE9 y anteriores)
        var supportsFlex = 'flexBasis' in document.documentElement.style ||
            'msFlexAlign' in document.documentElement.style ||
            'webkitFlexDirection' in document.documentElement.style;

        if (!supportsFlex) {
            // Buscamos contenedores con la clase ._flex o con estilo flex en línea
            var flexContainers = document.querySelectorAll('._flex, [style*="display: flex"]');

            for (var i = 0; i < flexContainers.length; i++) {
                var container = flexContainers[i];

                // Preparación del contenedor (Simulación de Flex-Row)
                container.style.display = "block";
                container.style.fontSize = "0"; // Elimina el espacio fantasma entre inline-blocks
                container.style.textAlign = "left";

                var children = container.children;
                var childCount = children.length;

                for (var j = 0; j < children.length; j++) {
                    var child = children[j];

                    // Convertir hijos en celdas alineadas
                    child.style.display = "inline-block";
                    child.style.verticalAlign = "top";
                    child.style.fontSize = "16px"; // Restauramos el tamaño de fuente para el contenido

                    // Si se usa ._flex-fill, dividimos el ancho equitativamente
                    if (container.classList.contains('_flex-fill')) {
                        child.style.width = (100 / childCount) + "%";
                        child.style.boxSizing = "border-box";
                    }

                    // Alineación central simulada
                    if (container.classList.contains('_flex-center')) {
                        container.style.textAlign = "center";
                    }
                }
            }
        }
    }

    // --- 3. INICIALIZACIÓN ---
    if (document.readyState === 'complete') {
        applyFlexFallback();
    } else {
        // Usamos addEventListener o attachEvent para asegurar la carga en IE9
        if (window.addEventListener) {
            window.addEventListener('load', applyFlexFallback, false);
        } else if (window.attachEvent) {
            window.attachEvent('onload', applyFlexFallback);
        }
    }
}());