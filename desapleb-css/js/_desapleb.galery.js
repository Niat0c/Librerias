/* DESAPLEB GALLERY - filtering & lightbox (comments trimmed) */
(function () {

    // --- INYECCIÓN DE MODAL/LIGHTBOX ---
    function injectLightboxModal() {
        if (document.getElementById('_gallery-lightbox')) return;

        var modalHTML =
            '<div id="_gallery-lightbox" class="_gallery-overlay" style="display:none;position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.85);z-index:14250;justify-content:center;align-items:center;">' +
            '<div class="_gallery-lightbox-content" style="position:relative;max-width:90vw;max-height:90vh;display:flex;flex-direction:column;overflow:auto;">' +
            '<img id="_gallery-lightbox-img" src="" style="max-width:100%;max-height:calc(90vh - 80px);object-fit:contain;">' +
            '<div id="_gallery-lightbox-title" style="color:white;text-align:center;margin-top:15px;font-weight:bold;"></div>' +
            '<button class="_gallery-close" onclick="window._closeGalleryLightbox()" style="position:fixed;top:20px;right:20px;background:transparent;border:none;color:#dc3545;font-size:48px;cursor:pointer;width:50px;height:50px;line-height:1;z-index:14260;padding:0;font-weight:bold;transition:color 0.2s ease;display:flex;align-items:center;justify-content:center;" onmouseover="this.style.color=\'#ff4d5a\'" onmouseout="this.style.color=\'#dc3545\'">×</button>' +
            '</div>' +
            '</div>';

        var container = document.createElement('div');
        container.innerHTML = modalHTML;
        document.body.appendChild(container.firstChild);
    }

    // --- SISTEMA DE FILTRADO CON ATRIBUTOS ---
    function initGalleryFiltering() {
        // Setting up filtering system

        // Buscar todos los filtros con atributo _data-galery-filter
        var filterButtons = document.querySelectorAll('[_data-galery-filter]');
        // Found filter buttons

        filterButtons.forEach(function (btn) {
            btn.addEventListener('click', function (e) {
                e.preventDefault();

                // Obtener el valor del filtro
                var filterValue = this.getAttribute('_data-galery-filter');
                // filter clicked

                // Si es "this", usar el text o value del botón
                if (filterValue === 'this') {
                    filterValue = this.textContent || this.value || '';
                    // resolved 'this' filter value
                }

                // Buscar todos los elementos de galería con _data-galery-filtered
                var galleryItems = document.querySelectorAll('[_data-galery-filtered]');
                // gallery items count

                galleryItems.forEach(function (item) {
                    var filters = item.getAttribute('_data-galery-filtered');
                    // item filters

                    var shouldShow = false;

                    // Si filterValue está vacío, mostrar todo
                    if (filterValue === '') {
                        shouldShow = true;
                        // empty filter: show all
                    } else {
                        // Parsear los filtros (pueden estar separados por comas o punto y coma)
                        var filterArray = filters.split(/[,;]/).map(function (f) { 
                            return f.trim(); 
                        });

                        // Convertir filterValue a minúsculas para comparación sin discriminación de mayúsculas
                        var filterValueLower = filterValue.toLowerCase();

                        // Buscar si el filterValue es un substring de alguno de los filtros (búsqueda LIKE)
                        for (var i = 0; i < filterArray.length; i++) {
                            var filterItemLower = filterArray[i].toLowerCase();
                            
                            // Si el filterItem contiene el filterValue (búsqueda LIKE)
                            if (filterItemLower.indexOf(filterValueLower) !== -1) {
                                shouldShow = true;
                                // found LIKE match
                                break;
                            }
                        }
                    }

                    // Aplicar visibilidad
                    if (shouldShow) {
                        item.style.display = '';
                        // showing item
                    } else {
                        item.style.display = 'none';
                        // hiding item
                    }
                });
            });
        });
    }

    // --- SISTEMA DE LIGHTBOX ---
    function initGalleryLightbox() {
        // Setting up lightbox system

        // Buscar todos los elementos clickeables de galería
        var galleryItems = document.querySelectorAll('[_data-galery-filtered]');

        galleryItems.forEach(function (item) {
            item.style.cursor = 'pointer';
            item.addEventListener('click', function () {
                var img = this.querySelector('img');
                var title = this.getAttribute('_data-galery-title') || this.textContent || '';

                if (img) {
                    // opening lightbox
                    window._openGalleryLightbox(img.src, title);
                }
            });
        });
    }

    // --- FUNCIONES GLOBALES PARA LIGHTBOX ---
    window._openGalleryLightbox = function (src, title) {
        var lightbox = document.getElementById('_gallery-lightbox');
        if (!lightbox) return;

        document.getElementById('_gallery-lightbox-img').src = src;
        document.getElementById('_gallery-lightbox-title').textContent = title;
        lightbox.style.display = 'flex';
        document.body.style.overflow = 'hidden';

        // Cerrar con Esc
        var closeOnEsc = function (e) {
            if (e.key === 'Escape' || e.keyCode === 27) {
                window._closeGalleryLightbox();
                document.removeEventListener('keydown', closeOnEsc);
            }
        };
        document.addEventListener('keydown', closeOnEsc);
        
        // Guardar referencia para poder removerla después
        window._escHandler = closeOnEsc;

        // Cerrar al hacer clic en el overlay (fondo oscuro)
        var closeOnOverlayClick = function (e) {
            if (e.target === lightbox) {
                window._closeGalleryLightbox();
                lightbox.removeEventListener('click', closeOnOverlayClick);
            }
        };
        lightbox.addEventListener('click', closeOnOverlayClick);
        window._overlayClickHandler = closeOnOverlayClick;
    };

    window._closeGalleryLightbox = function () {
        var lightbox = document.getElementById('_gallery-lightbox');
        if (lightbox) {
            lightbox.style.display = 'none';
            document.body.style.overflow = '';
            
            // Remover event listeners
            if (window._escHandler) {
                document.removeEventListener('keydown', window._escHandler);
            }
            if (window._overlayClickHandler) {
                lightbox.removeEventListener('click', window._overlayClickHandler);
            }
        }
    };

    // --- INICIALIZACIÓN ---
    function initGallery() {
        injectLightboxModal();
        
        // Aplicar clase _galery-item automáticamente a elementos con _data-galery-filtered
        var galleryItems = document.querySelectorAll('[_data-galery-filtered]');
        galleryItems.forEach(function (item) {
            if (!item.classList) {
                // Fallback para IE9
                if (item.className.indexOf('_galery-item') === -1) {
                    item.className += ' _galery-item';
                }
            } else {
                item.classList.add('_galery-item');
            }
            
            // Aplicar hover por defecto si no está configurado
            if (!item.hasAttribute('_data-galery-hover')) {
                item.setAttribute('_data-galery-hover', 'true');
            }
        });
        
        initGalleryFiltering();
        initGalleryLightbox();
        // Gallery system initialized
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initGallery);
    } else {
        initGallery();
    }

    // Ejecutar también después de un delay para galerías dinámicas
    setTimeout(initGallery, 500);
})();