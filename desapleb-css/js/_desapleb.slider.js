/* DESAPLEB SLIDER - core logic (comments trimmed) */
(function () {
    // Helper: add/remove class (IE9-safe)
    function manageClass(el, action, cls) {
        if (!el) return;
        if (action === 'add') {
            if (!el.className.match(new RegExp('(\\s|^)' + cls + '(\\s|$)'))) {
                el.className += (el.className ? " " : "") + cls;
            }
        } else if (action === 'remove') {
            var reg = new RegExp('(\\s|^)' + cls + '(\\s|$)');
            el.className = el.className.replace(reg, ' ').replace(/^\s+|\s+$/g, '');
        }
    }

    function hasClass(el, cls) {
        if (!el || !el.className) return false;
        return el.className.match(new RegExp('(\\s|^)' + cls + '(\\s|$)')) !== null;
    }

    function initSliders() {
        // Usar getElementsByClassName en lugar de querySelectorAll para mejor compatibilidad
        var sliders = [];
        var bySlider = document.getElementsByClassName('_slider');
        var byContainer = document.getElementsByClassName('_slider-container');
        
        for (var i = 0; i < bySlider.length; i++) sliders.push(bySlider[i]);
        for (var i = 0; i < byContainer.length; i++) sliders.push(byContainer[i]);
        
        // sliders found (logging removed in production)
        for (var i = 0; i < sliders.length; i++) {
            setupSlider(sliders[i]);
        }
    }

    function setupSlider(container) {
        // setting up slider
        
        // --- LEER PARÁMETRO DE NAVEGACIÓN ---
        // Por defecto es true (mostrar flechas), pero se puede configurar como false
        var navAttr = container.getAttribute('_slider-navigation');
        var showNavigation = (navAttr !== 'false'); // true por defecto, false solo si dice "false"
        // navigation setting
        
        // --- INYECCIÓN AUTOMÁTICA DE FLECHAS ---
        // Solo si no existen ya en el HTML
        var prevBtn = null;
        var nextBtn = null;
        
        // Buscar botones existentes
        var children = container.childNodes;
        for (var i = 0; i < children.length; i++) {
            if (hasClass(children[i], '_slider-prev')) prevBtn = children[i];
            if (hasClass(children[i], '_slider-next')) nextBtn = children[i];
        }
        
        // Crear prev si no existe Y si la navegación está habilitada
        if (!prevBtn && showNavigation) {
            // creating prev button
            prevBtn = document.createElement('div');
            prevBtn.className = '_slider-prev';
            prevBtn.innerHTML = '&lt;';
            prevBtn.style.cursor = 'pointer';
            prevBtn.style.userSelect = 'none';
            container.appendChild(prevBtn);
        }
        
        // Crear next si no existe Y si la navegación está habilitada
        if (!nextBtn && showNavigation) {
            // creating next button
            nextBtn = document.createElement('div');
            nextBtn.className = '_slider-next';
            nextBtn.innerHTML = '&gt;';
            nextBtn.style.cursor = 'pointer';
            nextBtn.style.userSelect = 'none';
            container.appendChild(nextBtn);
        }
        
        // Si la navegación está deshabilitada, ocultar los botones existentes
        if (!showNavigation) {
            if (prevBtn) prevBtn.style.display = 'none';
            if (nextBtn) nextBtn.style.display = 'none';
            // navigation buttons hidden
        }

        var items = container.getElementsByClassName('_slide-item');
        var track = null;
        var dotsContainer = null;
        var currentIndex = 0;
        
        // Buscar track y dots usando getElementsByClassName
        var children = container.childNodes;
        for (var i = 0; i < children.length; i++) {
            if (hasClass(children[i], '_slider-track')) track = children[i];
            if (hasClass(children[i], '_slider-dots')) dotsContainer = children[i];
        }

        // track and items status

        // --- CASO 1: LÓGICA DE TRACK (Desplazamiento Horizontal) ---
        if (track) {
            // using track mode
            if (nextBtn) {
                nextBtn.onclick = function () {
                    track.scrollLeft += 220;
                    return false;
                };
            }
            if (prevBtn) {
                prevBtn.onclick = function () {
                    track.scrollLeft -= 220;
                    return false;
                };
            }
            return;
        }

        // --- CASO 2: LÓGICA DE FADE/SLIDE (Cambio de Imagen) ---
        if (items.length === 0) {
            // no items found
            return;
        }

        // using fade/slide mode

        // Inicializar primer item (Usando manageClass para IE9)
        manageClass(items[0], 'add', '_active');

        function goTo(index) {
            // Quitar activa actual
            manageClass(items[currentIndex], 'remove', '_active');

            // Actualizar puntos si existen
            if (dotsContainer) {
                var dots = dotsContainer.getElementsByClassName('_slider-dot');
                if (dots[currentIndex]) manageClass(dots[currentIndex], 'remove', '_active');
            }

            // Calcular nuevo índice
            currentIndex = (index + items.length) % items.length;

            // Añadir nuevas clases activas
            manageClass(items[currentIndex], 'add', '_active');
            if (dotsContainer) {
                var dots = dotsContainer.getElementsByClassName('_slider-dot');
                if (dots[currentIndex]) manageClass(dots[currentIndex], 'add', '_active');
            }
        }

        if (nextBtn) {
            nextBtn.onclick = function () { goTo(currentIndex + 1); return false; };
        }
        if (prevBtn) {
            prevBtn.onclick = function () { goTo(currentIndex - 1); return false; };
        }

        // Crear puntos de navegación automáticamente
        if (dotsContainer && items.length > 1) {
            dotsContainer.innerHTML = '';
            for (var j = 0; j < items.length; j++) {
                (function (index) {
                    var dot = document.createElement('span');
                    dot.className = '_slider-dot' + (index === 0 ? ' _active' : '');
                    dot.onclick = function () { goTo(index); };
                    dotsContainer.appendChild(dot);
                })(j);
            }
        }
    }

    // Inicialización segura (Soporte window.onload para IE antiguos si es necesario)
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSliders);
    } else {
        initSliders();
    }
    
    // Ejecutar también después de un delay para slideshows dinámicos
    setTimeout(initSliders, 500);
})();