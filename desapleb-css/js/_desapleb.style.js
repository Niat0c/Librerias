/* eslint-disable no-console */
/* Desapleb Style JS - core library (comments trimmed for maintenance) */

(function () {
    var raf = window.requestAnimationFrame || function (fn) { return setTimeout(fn, 16); };

    // Initialize global namespace for library to avoid conflicts with other apps.
    // Expose minimal UI helpers so consumers don't need to define a global `app`.
    (function ensureNamespace() {
        try {
            if (!window._desaplebCSS) window._desaplebCSS = {};

            // Provide toggleMenu if not implemented by integrator
            if (typeof window._desaplebCSS.toggleMenu !== 'function') {
                window._desaplebCSS.toggleMenu = function () {
                    try {
                        // Toggle visible state of primary nav menu (mobile)
                        var nav = document.getElementById('navMenu') || document.querySelector('nav._nav ._nav-menu');
                        if (!nav) return;
                        if (nav.classList.contains('_show')) {
                            nav.classList.remove('_show');
                            nav.setAttribute('aria-hidden', 'true');
                        } else {
                            nav.classList.add('_show');
                            nav.setAttribute('aria-hidden', 'false');
                        }
                    } catch (e) { /* silent */ }
                };
            }

            // Provide toggleDarkMode if not implemented by integrator
            if (typeof window._desaplebCSS.toggleDarkMode !== 'function') {
                window._desaplebCSS.toggleDarkMode = function () {
                    try {
                        // Prefer integrator-provided function if present
                        if (typeof window.toggleDarkMode === 'function') return window.toggleDarkMode();
                        var enabled = document.body.classList.toggle('_dark-mode');
                        try { localStorage.setItem('theme', enabled ? 'dark' : 'light'); } catch (e) { /* silent */ }
                        // Ensure any open dropdowns are closed and if the mobile menu is open, close it.
                        try {
                            // Close any open nav-item dropdown states to avoid stuck UI
                            var openedItems = document.querySelectorAll('._nav-item._open');
                            for (var oi = 0; oi < openedItems.length; oi++) try { openedItems[oi].classList.remove('_open'); } catch (ex) { }

                            var menu = document.querySelector('._nav-menu');
                            var toggle = document.querySelector('._nav-toggle');
                            if (menu) {
                                var isOpen = menu.classList.contains('_show') || menu.classList.contains('_open');
                                // Only close the menu when toggling dark mode (do not open it)
                                if (isOpen) {
                                    menu.classList.remove('_show');
                                    menu.classList.remove('_open');
                                }
                                if (toggle) {
                                    try { toggle.classList.remove('_active'); updateToggleAria(toggle, false); } catch (e) { }
                                }
                            }
                        } catch (e) { /* silent */ }
                    } catch (e) { /* silent */ }
                };
            }
        } catch (e) { /* silent */ }
    })();

    // Integrate a library-level initializer so consumers only need to include the
    // library to have `_desaplebCSS` available and initialized. The init is
    // idempotent (uses __inited flag) to avoid duplicate work when the file's
    // own DOMContentLoaded handler also runs.
    (function integrateInit() {
        try {
            var ns = window._desaplebCSS = window._desaplebCSS || {};
            if (!ns.init) {
                ns.__inited = ns.__inited || false;
                ns.init = function () {
                    if (ns.__inited) return;
                    ns.__inited = true;
                    try {
                        // call internal init helpers if present
                        if (typeof restoreThemePreference === 'function') try { restoreThemePreference(); } catch (e) { }
                        if (typeof markActiveNav === 'function') try { markActiveNav(); } catch (e) { }
                        if (typeof initTabs === 'function') try { initTabs(); } catch (e) { }
                        if (typeof initFormularios === 'function') try { initFormularios(); } catch (e) { }
                        // move any offcanvas/sidebar elements to body (reuse existing logic)
                        try {
                            document.querySelectorAll('._offcanvas').forEach(function (off) {
                                if (off && off.parentNode && off.parentNode !== document.body) document.body.appendChild(off);
                            });
                        } catch (e) { }
                        // Detect and register optional components already loaded on the page.
                        try {
                            ns.components = ns.components || {};
                            var detectMap = {
                                gallery: ['initGallery', '_openGalleryLightbox', '_closeGalleryLightbox', 'initGalleryLightbox', '_gallery_lightbox', 'injectLightboxModal'],
                                slider: ['initSlider', '_desaplebSliderInit', '_sliderInit', 'initSwiper'],
                                tooltips: ['initTooltips', '_desapleb_tooltip_init', 'initTooltip'],
                                popovers: ['initPopovers', 'initPopover'],
                                hovercards: ['initHoverCards', 'initHoverCard']
                            };

                            for (var comp in detectMap) {
                                if (!detectMap.hasOwnProperty(comp)) continue;
                                var candidates = detectMap[comp];
                                var foundAny = false;
                                ns.components[comp] = ns.components[comp] || {};
                                for (var i = 0; i < candidates.length; i++) {
                                    var g = candidates[i];
                                    try {
                                        if (typeof window[g] === 'function') {
                                            // store reference under the same name
                                            ns.components[comp][g] = window[g];
                                            foundAny = true;
                                        } else if (window[g]) {
                                            ns.components[comp][g] = window[g];
                                            foundAny = true;
                                        }
                                    } catch (err) { /* ignore */ }
                                }

                                // If an init function is present among detected globals, call it once
                                try {
                                    // prefer explicit initGallery/initSlider style names
                                    var initName = 'init' + comp.charAt(0).toUpperCase() + comp.slice(1);
                                    if (typeof window[initName] === 'function') {
                                        if (!ns.components[comp].__inited) {
                                            window[initName]();
                                            ns.components[comp].__inited = true;
                                        }
                                    } else {
                                        // fallback: call any candidate that includes 'init' in its name
                                        for (var k = 0; k < candidates.length; k++) {
                                            var cand = candidates[k];
                                            if (cand.toLowerCase().indexOf('init') !== -1 && typeof window[cand] === 'function') {
                                                if (!ns.components[comp].__inited) {
                                                    window[cand]();
                                                    ns.components[comp].__inited = true;
                                                    break;
                                                }
                                            }
                                        }
                                    }
                                } catch (e) { /* silent */ }

                                if (foundAny) {
                                    try { ns[comp] = ns.components[comp]; } catch (e) { /* silent */ }
                                }
                            }
                        } catch (err) { /* silent */ }
                    } catch (err) { /* silent */ }
                };
            }
        } catch (e) { /* silent */ }
    })();

    // Ensure the integrated init runs on DOMContentLoaded (idempotent)
    try {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', function () {
                try { if (window._desaplebCSS && typeof window._desaplebCSS.init === 'function') window._desaplebCSS.init(); } catch (e) { }
            });
        } else {
            try { if (window._desaplebCSS && typeof window._desaplebCSS.init === 'function') window._desaplebCSS.init(); } catch (e) { }
        }
    } catch (e) { /* silent */ }

    // Simple cross-browser scroll helpers (compatible con IE9)
    function _getScrollTop() {
        return window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
    }

    function _setScrollTop(y) {
        try { document.documentElement.scrollTop = y; } catch (e) { /* silent */ }
        try { document.body.scrollTop = y; } catch (e) { /* silent */ }
    }

    function _easeInOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    // Smooth scroll animation (duration in ms). Uses raf fallback for IE9.
    window.__desapleb_smoothScrollTo = function (targetY, duration) {
        duration = typeof duration === 'number' ? duration : 420;
        var start = _getScrollTop();
        var diff = targetY - start;
        var startTime = Date.now();

        function step() {
            var now = Date.now();
            var t = Math.min(1, (now - startTime) / duration);
            var eased = _easeInOutCubic(t);
            var current = Math.round(start + diff * eased);
            _setScrollTop(current);
            if (t < 1) {
                raf(step);
            }
        }
        step();
    };

    // Scroll to element by id, respecting header offset and body attribute _data-smoothScroll
    window.__desapleb_scrollToId = function (id, duration) {
        try {
            var t = document.getElementById(id);
            if (!t) return;
            // calculate offset to keep section title visible under fixed header
            var header = document.querySelector('._nav._fixed') || document.querySelector('nav._nav._fixed') || document.querySelector('header');
            var headerHeight = (header && header.offsetHeight) ? header.offsetHeight : 80;
            var rect = t.getBoundingClientRect();
            var scrollTop = _getScrollTop();
            var target = Math.max(0, Math.round(rect.top + scrollTop - headerHeight - 8)); // small gap

            var useSmooth = false;
            try {
                var attr = document.body.getAttribute('_data-smoothScroll');
                useSmooth = (attr === 'true');
            } catch (e) { /* silent */ }

            duration = typeof duration === 'number' ? duration : 420;

            // Prefer native behavior when available and enabled, otherwise use JS animation
            if (useSmooth && 'scrollBehavior' in document.documentElement.style) {
                try { window.scrollTo({ top: target, behavior: 'smooth' }); return; } catch (e) { /* fallback */ }
            }

            if (useSmooth) {
                window.__desapleb_smoothScrollTo(target, duration);
            } else {
                // instant
                try { window.scrollTo(0, target); } catch (e) { _setScrollTop(target); }
            }
        } catch (err) { /* silent */ }
    };

    // Expose a friendly, library-level API and a non-conflicting global helper.
    // Ensure that if the page sets body attribute `_data-smoothScroll="true"`
    // the library will perform a smooth animated scroll using the internal
    // JS animation (more reliable across browsers) instead of an instant jump.
    try {
        window._desaplebCSS = window._desaplebCSS || {};

        window._desaplebCSS.scrollToId = function (id, duration) {
            try {
                var el = document.getElementById(id);
                if (!el) return;

                // calculate offset to keep section title visible under fixed header
                var header = document.querySelector('._nav._fixed') || document.querySelector('nav._nav._fixed') || document.querySelector('header');
                var headerHeight = (header && header.offsetHeight) ? header.offsetHeight : 80;
                var rect = el.getBoundingClientRect();
                var scrollTop = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
                var target = Math.max(0, Math.round(rect.top + scrollTop - headerHeight - 8));

                var useSmooth = false;
                try { useSmooth = (document.body.getAttribute('_data-smoothScroll') === 'true'); } catch (e) { useSmooth = false; }

                duration = typeof duration === 'number' ? duration : 420;

                if (useSmooth) {
                    // Prefer the library animation for consistent smooth behaviour
                    try { window.__desapleb_smoothScrollTo(target, duration); return; } catch (e) { /* fallback */ }
                }

                // Fallback: use existing helper that handles instant scroll and native options
                try { window.__desapleb_scrollToId(id, duration); } catch (e) { /* silent */ }
            } catch (err) { /* silent */ }
        };

        // Also provide a top-level helper `scrollToId` for backwards compatibility
        window.scrollToId = function (id, duration) { return window._desaplebCSS.scrollToId(id, duration); };
    } catch (e) { /* silent */ }

    function _matches(el, sel) {
        if (!el || el.nodeType !== 1) return false;
        var fn = el.matches || el.msMatchesSelector || el.webkitMatchesSelector || el.mozMatchesSelector;
        if (fn) return fn.call(el, sel);
        return false;
    }

    /**
     * Inicializa pestañas accesibles (.\_tabs-container)
     * - click activa pestaña
     * - teclado: flechas izquierda/derecha para navegar, Enter/Space para activar
     * - añade roles ARIA: tablist/tab/tabpanel, aria-selected, aria-controls, aria-hidden
     */
    function initTabs() {
        var containers = document.querySelectorAll('._tabs-container');
        for (var ci = 0; ci < containers.length; ci++) {
            (function (container) {
                try {
                    var tabList = container.querySelector('._tabs-nav');
                    if (!tabList) return;

                    // Ensure tablist role
                    tabList.setAttribute('role', 'tablist');

                    var tabs = tabList.querySelectorAll('._tab-link');
                    var panels = container.querySelectorAll('._tab-content');

                    // Helper: find panel by id or by data-target
                    function getPanelById(id) {
                        if (!id) return null;
                        return document.getElementById(id) || container.querySelector('#' + id);
                    }

                    // Initialize tabs and panels ARIA states
                    for (var i = 0; i < tabs.length; i++) {
                        var t = tabs[i];
                        t.setAttribute('role', 'tab');
                        // target can be in attribute _data-target
                        var target = t.getAttribute('_data-target') || t.dataset.target;
                        if (target) {
                            t.setAttribute('aria-controls', target);
                        }

                        // ensure tabindex and aria-selected reflect visual state
                        var isActive = t.classList.contains('_active');
                        t.setAttribute('tabindex', isActive ? '0' : '-1');
                        t.setAttribute('aria-selected', isActive ? 'true' : 'false');

                        // keyboard handling per-tab
                        t.addEventListener('keydown', function (e) {
                            var key = e.which || e.keyCode;
                            // Left:37, Right:39, Home:36, End:35, Enter:13, Space:32
                            if (key === 37 || key === 39 || key === 36 || key === 35) {
                                e.preventDefault();
                                // determine new index
                                var idx = Array.prototype.indexOf.call(tabs, this);
                                if (key === 37) idx = (idx - 1 + tabs.length) % tabs.length;
                                if (key === 39) idx = (idx + 1) % tabs.length;
                                if (key === 36) idx = 0;
                                if (key === 35) idx = tabs.length - 1;
                                var dest = tabs[idx];
                                if (!dest) return;

                                // If Ctrl or Meta pressed, activate immediately; otherwise just move focus
                                if (e.ctrlKey || e.metaKey) {
                                    activateTab(dest, true);
                                } else {
                                    dest.focus();
                                }
                            } else if (key === 13 || key === 32) {
                                // Activate on Enter or Space
                                e.preventDefault();
                                activateTab(this, true);
                            }
                        });

                        // click activation
                        t.addEventListener('click', function (ev) {
                            ev.preventDefault && ev.preventDefault();
                            activateTab(this, true);
                        });
                    }

                    // Initialize panels
                    for (var p = 0; p < panels.length; p++) {
                        var panel = panels[p];
                        panel.setAttribute('role', 'tabpanel');
                        // ensure id exists for aria-controls
                        if (!panel.id) {
                            // generate a stable id
                            panel.id = 'tab-panel-' + Math.random().toString(36).substr(2, 8);
                        }
                        var visible = panel.classList.contains('_active');
                        panel.setAttribute('aria-hidden', visible ? 'false' : 'true');
                        // allow focus inside panel when visible
                        if (visible) panel.setAttribute('tabindex', '0'); else panel.removeAttribute('tabindex');
                    }

                    // activation helper
                    function activateTab(tabEl, moveFocus) {
                        if (!tabEl) return;
                        // deactivate all tabs in this container
                        for (var j = 0; j < tabs.length; j++) {
                            var tt = tabs[j];
                            tt.classList.remove('_active');
                            tt.setAttribute('aria-selected', 'false');
                            tt.setAttribute('tabindex', '-1');
                        }

                        // hide all panels
                        for (var k = 0; k < panels.length; k++) {
                            var pp = panels[k];
                            pp.classList.remove('_active');
                            pp.setAttribute('aria-hidden', 'true');
                            pp.removeAttribute('tabindex');
                        }

                        // activate target tab
                        tabEl.classList.add('_active');
                        tabEl.setAttribute('aria-selected', 'true');
                        tabEl.setAttribute('tabindex', '0');

                        // show associated panel
                        var tgt = tabEl.getAttribute('_data-target') || tabEl.dataset.target || tabEl.getAttribute('aria-controls');
                        var panelEl = getPanelById(tgt);
                        if (panelEl) {
                            panelEl.classList.add('_active');
                            panelEl.setAttribute('aria-hidden', 'false');
                            panelEl.setAttribute('tabindex', '0');
                        }

                        if (moveFocus && tabEl.focus) tabEl.focus();
                    }
                } catch (err) { /* silent */ }
            })(containers[ci]);
        }
    }

    function _closest(el, sel) {
        while (el && el !== document) {
            if (_matches(el, sel)) return el;
            el = el.parentNode;
        }
        return null;
    }

    function _eventClosest(e, sel) {
        var node = e.target;
        while (node && node.nodeType !== 1) node = node.parentNode;
        return _closest(node, sel);
    }

    /* Responsive nav helper integrated into core script
       - Ensures a hamburger toggle exists when missing
       - Inserts it with priority: ._nav-left (first), ._nav-center (first), ._nav-right (last)
       - Creates ._nav-left if none of the primary regions exist
    */
    function createToggleButton() {
        var btn = document.createElement('button');
        btn.className = '_nav-toggle _border _text-dark';
        btn.setAttribute('type', 'button');
        btn.setAttribute('aria-label', 'Abrir menú');
        btn.setAttribute('aria-expanded', 'false');
        try { btn.setAttribute('onclick', '_desaplebCSS.toggleMenu()'); } catch (e) { }
        btn.textContent = '\u2630'; // ☰
        return btn;
    }

    function ensureNavMenu(nav) {
        if (!nav) return null;
        var menu = nav.querySelector('._nav-menu');
        if (menu) return menu;

        var wrapper = document.createElement('div');
        wrapper.className = '_nav-menu';

        var children = Array.prototype.slice.call(nav.childNodes || []);
        for (var i = 0; i < children.length; i++) {
            var c = children[i];
            if (c.nodeType !== 1) continue;
            if (c.classList && c.classList.contains('_nav-toggle')) continue;
            if (c.tagName && (c.tagName.toLowerCase() === 'a' || c.tagName.toLowerCase() === 'button' || (c.classList && (c.classList.contains('_nav-item') || c.classList.contains('nav-item'))))) {
                wrapper.appendChild(c);
            }
        }

        nav.appendChild(wrapper);
        return wrapper;
    }

    function replaceMenuTextWithEmoji(nav) {
        if (!nav) return;
        try {
            var walker = document.createTreeWalker(nav, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, null, false);
            var nodes = [];
            var n;
            while (n = walker.nextNode()) nodes.push(n);
            nodes.forEach(function (node) {
                try {
                    if (node.nodeType === 3) {
                        var txt = node.nodeValue && node.nodeValue.trim();
                        if (txt && txt.toLowerCase() === 'menu') {
                            var parent = node.parentNode;
                            if (!parent) return;
                            var span = document.createElement('span');
                            span.className = '_nav-emoji';
                            span.setAttribute('aria-hidden', 'true');
                            span.textContent = '\u2630';
                            parent.replaceChild(span, node);
                        }
                    } else if (node.nodeType === 1) {
                        var text = node.textContent && node.textContent.trim();
                        if (text && text.toLowerCase() === 'menu') {
                            node.textContent = '';
                            var span2 = document.createElement('span');
                            span2.className = '_nav-emoji';
                            span2.setAttribute('aria-hidden', 'true');
                            span2.textContent = '\u2630';
                            node.appendChild(span2);
                            node.setAttribute('aria-label', 'Abrir menú');
                        }
                    }
                } catch (ex) { }
            });
        } catch (ex) { }
    }

    function updateToggleAria(toggle, open) {
        try { toggle.setAttribute('aria-expanded', open ? 'true' : 'false'); } catch (e) { }
    }

    function attachNavBehavior(nav, toggle, menu) {
        if (!nav || !toggle) return;

        toggle.addEventListener('click', function () {
            try {
                if (window.toggleMenu && typeof window.toggleMenu === 'function') {
                    window.toggleMenu();
                    toggle.classList.toggle('_active');
                    var m = nav.querySelector('._nav-menu');
                    var isOpen = m && (m.classList.contains('_open') || m.classList.contains('_show'));
                    updateToggleAria(toggle, isOpen);
                    return;
                }
                if (window._desaplebCSS && typeof window._desaplebCSS.toggleMenu === 'function') {
                    window._desaplebCSS.toggleMenu();
                    toggle.classList.toggle('_active');
                    var mm = nav.querySelector('._nav-menu');
                    var openNow = mm && (mm.classList.contains('_open') || mm.classList.contains('_show'));
                    updateToggleAria(toggle, openNow);
                    return;
                }
            } catch (e) { }

            if (!menu) menu = ensureNavMenu(nav);
            if (!menu) return;
            var isOpen = menu.classList.contains('_open') || menu.classList.contains('_show');
            if (isOpen) {
                menu.classList.remove('_open'); menu.classList.remove('_show'); toggle.classList.remove('_active'); updateToggleAria(toggle, false);
            } else {
                menu.classList.add('_open'); toggle.classList.add('_active'); updateToggleAria(toggle, true);
            }
        });

        toggle.addEventListener('keydown', function (e) {
            var key = e.key || e.keyCode;
            if (key === 'Enter' || key === ' ' || key === 13 || key === 32) {
                e.preventDefault && e.preventDefault(); toggle.click();
            }
        });

        window.addEventListener('resize', function () {
            try {
                var w = window.innerWidth || document.documentElement.clientWidth;
                if (w > 992) {
                    if (menu && (menu.classList.contains('_open') || menu.classList.contains('_show'))) {
                        menu.classList.remove('_open'); menu.classList.remove('_show'); toggle.classList.remove('_active'); updateToggleAria(toggle, false);
                    }
                }
            } catch (e) { }
        });
    }

    function initResponsiveNav() {
        try {
            var navs = document.querySelectorAll('nav._nav, nav');
            for (var i = 0; i < navs.length; i++) {
                var nav = navs[i];
                if (nav.getAttribute && nav.getAttribute('data-disable-auto-toggle') === 'true') continue;
                replaceMenuTextWithEmoji(nav);
                var existing = nav.querySelector('._nav-toggle');
                var menu = ensureNavMenu(nav);
                if (!existing) {
                    var toggle = createToggleButton();
                    var navLeft = nav.querySelector('._nav-left');
                    var navCenter = nav.querySelector('._nav-center');
                    var navRight = nav.querySelector('._nav-right');
                    if (navLeft) {
                        if (navLeft.firstChild) navLeft.insertBefore(toggle, navLeft.firstChild); else navLeft.appendChild(toggle);
                    } else if (navCenter) {
                        if (navCenter.firstChild) navCenter.insertBefore(toggle, navCenter.firstChild); else navCenter.appendChild(toggle);
                    } else if (navRight) {
                        navRight.appendChild(toggle);
                    } else {
                        try {
                            navLeft = document.createElement('div'); navLeft.className = '_nav-left';
                            if (nav.firstChild) nav.insertBefore(navLeft, nav.firstChild); else nav.appendChild(navLeft);
                            navLeft.appendChild(toggle);
                        } catch (e) {
                            if (nav.firstChild) nav.insertBefore(toggle, nav.firstChild); else nav.appendChild(toggle);
                        }
                    }
                    attachNavBehavior(nav, toggle, menu);
                } else {
                    attachNavBehavior(nav, existing, menu);
                }
            }
        } catch (e) { }
    }

    document.addEventListener('DOMContentLoaded', function () {
        // Desapleb Style active (logging removed in production)

        // Inicializaciones
        initFormularios();
        initTabs();
        markActiveNav();
        // Inicializar helper responsive de navegación (inserta toggle si falta)
        try { if (typeof initResponsiveNav === 'function') initResponsiveNav(); } catch (e) { }
        restoreThemePreference();
        
        // Progressive enhancement: mark document as JS-enabled so CSS can reveal UI affordances
        try {
            document.body.classList.add('has-js');
        } catch (e) { /* ignore */ }

        // Move any ._offcanvas and global backdrop elements to document.body to
        // avoid positioning issues when they are declared inside transformed
        // containers. Fixed-position elements can become relative to transformed
        // ancestors in some browsers; moving them to body avoids that.
        try {
            document.querySelectorAll('._offcanvas').forEach(function (off) {
                if (off && off.parentNode && off.parentNode !== document.body) {
                    document.body.appendChild(off);
                }
                // Force inline styles to ensure they override any cascade issues
                off.style.position = 'fixed';
                off.style.top = '0px';
                off.style.bottom = '0px';
                // Ensure offcanvas stacks above navigation but below modals (matches CSS z-index base)
                off.style.zIndex = '13900';
                var side = off.getAttribute('data-side') || (off.classList.contains('_right') ? 'right' : 'left');
                if (side === 'right') {
                    off.style.right = '0px';
                    off.style.left = 'auto';
                    if (!off.classList.contains('_show')) off.style.transform = 'translateX(110%)';
                } else {
                    off.style.left = '0px';
                    off.style.right = 'auto';
                    if (!off.classList.contains('_show')) off.style.transform = 'translateX(-110%)';
                }
            });
            var bd = document.getElementById('offcanvasBackdropAll');
            if (bd) {
                if (bd.parentNode !== document.body) document.body.appendChild(bd);
                bd.style.position = 'fixed';
                bd.style.inset = '0px';
                // Backdrop should sit below offcanvas and below modals
                bd.style.zIndex = '13800';
            }
        } catch (e) { /* silent */ }

        // Move sidebars to body to avoid positioning issues when they are declared
        // inside transformed containers. Ensure consistent fixed positioning so
        // docs sidebar remains visible and scrollspy can measure targets.
        try {
            var sidebars = document.querySelectorAll('#menuLateralDemos, nav._sidebar, aside._menu, .docs-sidebar, aside._sidebar, ._sidebar');
            Array.prototype.forEach.call(sidebars, function (side) {
                if (!side) return;
                try {
                    if (side.parentNode && side.parentNode !== document.body) document.body.appendChild(side);

                    // Prefer declared width or fallback to 260px
                    var declaredW = side.getAttribute && side.getAttribute('data-sidebar-width');
                    var widthVal = declaredW || (side.offsetWidth ? side.offsetWidth + 'px' : '260px');

                    side.style.position = 'fixed';
                    side.style.top = '80px';
                    side.style.bottom = '0px';
                    side.style.left = '0px';
                    side.style.zIndex = '1300';
                    side.style.width = widthVal;

                    // If not explicitly marked to be visible, hide off-canvas on small screens
                    if (!side.classList.contains('_show')) {
                        // Hide to the left by default
                        side.style.transform = 'translateX(-110%)';
                        side.setAttribute('aria-hidden', 'true');
                    }

                    // On wide screens ensure sidebar is shown
                    if (window.innerWidth >= 1000) {
                        side.style.transform = 'translateX(0)';
                        side.setAttribute('aria-hidden', 'false');
                    }
                } catch (err) { /* ignore per-sidebar errors */ }
            });
        } catch (e) { /* silent */ }

        // Initialize Docs ScrollSpy: handle SPA/dynamic injection and deferred init.
        (function () {
            function getAttrFrom(el) {
                if (!el || !el.getAttribute) return null;
                var a = el.getAttribute('_data-sidebar-scrollspy');
                if (!a) a = el.getAttribute('_data-slidebar-scrollspy') || el.getAttribute('_data-slidebar-LoQueSea');
                return a;
            }

            function isEnabled() {
                var sidebarEl = document.querySelector('#menuLateralDemos') || document.querySelector('nav._sidebar') || document.querySelector('.docs-sidebar');
                var attr = null;
                if (sidebarEl) {
                    attr = getAttrFrom(sidebarEl);
                    if (!attr && sidebarEl.querySelector) {
                        var nested = sidebarEl.querySelector('nav._sidebar, ._sidebar');
                        if (nested) attr = getAttrFrom(nested);
                    }
                }
                if (!attr) {
                    var anyNav = document.querySelector('nav._sidebar, ._sidebar');
                    if (anyNav) attr = getAttrFrom(anyNav);
                }
                return (attr === 'true' || attr === '1');
            }

            function callInitOnce() {
                window._desapleb_scrollspy_initialized = window._desapleb_scrollspy_initialized || false;
                if (window._desapleb_scrollspy_initialized) return true;
                var fn = (window.initDocsScrollSpy && typeof window.initDocsScrollSpy === 'function') ? window.initDocsScrollSpy : (typeof initDocsScrollSpy === 'function' ? initDocsScrollSpy : null);
                if (fn) {
                    try { fn(); } catch (err) { /* ignore init errors */ }
                    window._desapleb_scrollspy_initialized = true;
                    return true;
                }
                return false;
            }

            function startPollingForInit() {
                if (callInitOnce()) return;
                var retries = 0;
                var maxRetries = 40;
                var poll = setInterval(function () {
                    retries++;
                    if (callInitOnce() || retries >= maxRetries) clearInterval(poll);
                }, 100);
                window.addEventListener('load', function () { callInitOnce(); });
            }

            // If enabled now, try to init. Otherwise observe DOM for sidebar injection.
            if (isEnabled()) {
                startPollingForInit();

                // Also observe DOM for cases where init function or sidebar appears later
                try {
                    var obs = new MutationObserver(function () {
                        if (callInitOnce()) { obs.disconnect(); }
                    });
                    obs.observe(document.body, { childList: true, subtree: true });
                } catch (e) { /* ignore observer errors */ }
            } else {
                // Watch for sidebar being injected with the attribute (SPA navigation)
                try {
                    var observer = new MutationObserver(function () {
                        if (isEnabled()) {
                            observer.disconnect();
                            startPollingForInit();
                        }
                    });
                    observer.observe(document.body, { childList: true, subtree: true });
                } catch (e) { /* ignore */ }
            }
        })();

        // Delegate close button clicks for alerts (. _alert-close)
        document.addEventListener('click', function (e) {
            var btn = _eventClosest(e, '._alert-close');
            if (!btn) return;
            var alert = _closest(btn, '._alert');
            if (!alert) return;

            // hide with animation class
            try { alert.classList.add('_hidden'); alert.setAttribute('aria-hidden', 'true'); } catch (er) { /* ignore */ }

            // remove from DOM after animation completes (give time for CSS transition)
            setTimeout(function () {
                try { if (alert && alert.parentNode) alert.parentNode.removeChild(alert); } catch (e2) { }
            }, 260);

            if (e.preventDefault) e.preventDefault();
            return false;
        });

    // Handle nav link clicks: support dropdown toggles on mobile and auto-collapse
    document.addEventListener('click', function (e) {
        try {
            var link = _eventClosest(e, '._nav-link');
            if (!link) return;

            var nav = _closest(link, 'nav._nav, nav');
            if (!nav) return;

            var parentItem = _closest(link, '._nav-item');
            var insideDropdown = _closest(link, '._nav-dropdown');

            // Determine if this clicked link is the top-level toggle for a dropdown
            var isParentToggle = false;
            try {
                if (parentItem && link.parentNode === parentItem && parentItem.querySelector && parentItem.querySelector('._nav-dropdown')) isParentToggle = true;
            } catch (ex) { isParentToggle = false; }

            // If user clicked the parent toggle (e.g. "Descargas"), toggle the submenu open state
            if (isParentToggle) {
                // Prevent navigation on parent toggle so user can open submenu
                if (e.preventDefault) e.preventDefault();
                try { parentItem.classList.toggle('_open'); } catch (err) { }
                return;
            }

            // Otherwise (clicked a real link, possibly inside a dropdown), collapse the mobile menu
            var menu = nav.querySelector('._nav-menu');
            if (menu && (menu.classList.contains('_open') || menu.classList.contains('_show'))) {
                menu.classList.remove('_open');
                menu.classList.remove('_show');
                // remove any open dropdown states inside this nav
                try {
                    var opened = nav.querySelectorAll('._nav-item._open');
                    for (var oi = 0; oi < opened.length; oi++) opened[oi].classList.remove('_open');
                } catch (err) { }
                // sync toggle button state
                var toggle = nav.querySelector('._nav-toggle');
                if (toggle) {
                    try { toggle.classList.remove('_active'); updateToggleAria(toggle, false); } catch (err) { }
                }
            }
        } catch (err) { /* silent */ }
    }, false);
    });

    /**
     * Formularios: manejo de archivos y validación simple
     */
    function initFormularios() {
        // 1. Inputs de Archivo (log del nombre seleccionado)
        var fileInputs = document.querySelectorAll('input[type="file"]._form-control');
        for (var i = 0; i < fileInputs.length; i++) {
            (function (input) {
                    input.addEventListener('change', function (e) {
                    var fileName = 'Sin archivo seleccionado';
                    if (e.target && e.target.files && e.target.files[0]) fileName = e.target.files[0].name;
                    // no logging: production behaviour
                });
            })(fileInputs[i]);
        }

        // 2. Validación en blur para required
        var reqInputs = document.querySelectorAll('._form-control[required]');
        for (var j = 0; j < reqInputs.length; j++) {
            (function (input) {
                input.addEventListener('blur', function () {
                    if (!input.value) {
                        input.classList.add('_danger');
                        input.classList.remove('_success');
                    } else {
                        input.classList.remove('_danger');
                        input.classList.add('_success');
                    }
                });
            })(reqInputs[j]);
        }
    }

    /**
     * Alternar visibilidad de contraseña
     * @param {string} inputId - ID del input de password
     */
    function togglePassword(inputId) {
        var input = document.getElementById(inputId);
        if (!input) return;

        if (input.type === 'password') {
            input.type = 'text';
        } else {
            input.type = 'password';
        }
    }

    /**
     * Contador de caracteres para Textareas
     * @param {HTMLElement} textarea - El elemento
     * @param {string} displayId - ID donde mostrar el conteo
     */
    function actualizarContador(textarea, displayId) {
        var display = document.getElementById(displayId);
        var max = textarea.getAttribute('maxlength');
        var actual = textarea.value.length;
        if (display) {
            display.innerText = actual + ' / ' + max;
            if (actual >= max) display.className = "_badge _danger";
            else display.className = "_badge _dark";
        }
    }


    /**
    * Filtra las filas de una tabla basándose en un input de búsqueda
    * @param {string} inputId - ID del campo de texto
    * @param {string} tableId - ID de la tabla a filtrar
    */
    function filtrarTabla(inputId, tableId) {
        var input = document.getElementById(inputId);
        if (!input) return;
        var filter = (input.value || '').toUpperCase();
        var table = document.getElementById(tableId);
        if (!table) return;
        var tr = table.getElementsByTagName('tr');

        // Recorre todas las filas (excepto el thead) y oculta las que no coinciden
        for (var i = 1; i < tr.length; i++) {
            var visible = false;
            var td = tr[i].getElementsByTagName('td');

            for (var j = 0; j < td.length; j++) {
                if (td[j] && td[j].innerHTML.toUpperCase().indexOf(filter) > -1) {
                    visible = true;
                    break;
                }
            }
            tr[i].style.display = visible ? '' : 'none';
        }
    }

    /**
     * Alterna la visibilidad del cuerpo de una tarjeta
     * @param {string} cardId - ID de la tarjeta o del contenedor body
     */
    function toggleCard(cardId) {
        var body = document.getElementById(cardId);
        if (!body) return;

        if (body.style.display === "none") {
            body.style.display = "block";
        } else {
            body.style.display = "none";
        }
    }

    /**
     * Cambia el tamaño de fuente de un elemento o contenedor
     * @param {string} selector - Selector CSS (ej: '#contenido')
     * @param {number} delta - Cantidad a sumar/restar (ej: 2 o -2)
     */
    function cambiarTamanoFuente(selector, delta) {
        var el = document.querySelector(selector);
        if (!el) return;
        var style = window.getComputedStyle(el).getPropertyValue('font-size');
        var currentSize = parseFloat(style) || 16;
        el.style.fontSize = (currentSize + delta) + 'px';
    }

    /**
     * Aplica una clase de fondo aleatoria de la paleta Desapleb
     * @param {HTMLElement} el - El elemento a cambiar
     */
    function bgAleatorio(el) {
        var colores = ['_bg-brand', '_bg-dark', '_bg-success', '_bg-danger'];
        // Quitamos clases previas
        for (var i = 0; i < colores.length; i++) el.classList.remove(colores[i]);
        // Ponemos una nueva
        var random = colores[Math.floor(Math.random() * colores.length)];
        el.classList.add(random);
    }



    /**
     * Pone un botón en estado de carga o lo restaura
     * @param {HTMLElement} btn - El elemento botón
     * @param {boolean} isLoading - Estado
     */
    function setBtnLoading(btn, isLoading) {
        if (isLoading) {
            btn.classList.add('_btn-loading');
            btn.setAttribute('disabled', 'true');
        } else {
            btn.classList.remove('_btn-loading');
            btn.removeAttribute('disabled');
        }
    }

    /**
     * Ejemplo: Simular una carga al hacer clic
     */
    function demoCarga(btn) {
        setBtnLoading(btn, true);
        setTimeout(function () {
            setBtnLoading(btn, false);
        }, 2000);
    }

    /**
     * Actualiza el ancho y el texto de una barra de progreso
     * @param {string} id - ID del elemento barra
     * @param {number} porcentaje - Valor entre 0 y 100
     */
    function actualizarProgreso(id, porcentaje) {
        var bar = document.getElementById(id);
        if (bar) {
            bar.style.width = porcentaje + '%';
            bar.innerText = porcentaje + '%';
        }
    }

    /**
     * Simulación de carga para la demo
     */
    function simularCarga(id) {
        var p = 0;
        var interval = setInterval(function () {
            p += Math.floor(Math.random() * 15);
            if (p >= 100) {
                p = 100;
                clearInterval(interval);
            }
            actualizarProgreso(id, p);
        }, 400);
    }

    /**
     * DESAPLEB STYLE - Lógica de Modales
     */

    // Definimos las funciones directamente en el objeto global (window)
    // Modals API
    window.abrirModal = function (id) {
        var m = document.getElementById(id);
        if (m) {
            m.style.display = 'block';
            document.body.style.overflow = 'hidden';
        } else {
            // modal not found — silent in production
        }
    };

    // Aliases for different naming conventions used across demos
    try {
        if (!window.closeAllOffcanvas) window.closeAllOffcanvas = window.cerrarAllOffcanvas;
        if (!window.closeOffcanvas) window.closeOffcanvas = window.cerrarOffcanvas;
        if (!window.openOffcanvas) window.openOffcanvas = window.abrirOffcanvas;
    } catch (e) { /* silent */ }

    // Bind attribute-based dismiss triggers: _data-dismiss-offcanvas
    try {
        document.addEventListener('click', function (e) {
            var node = e.target;
            while (node && node.nodeType !== 1) node = node.parentNode;
            if (!node) return;

            var el = node;
            while (el && el !== document) {
                if (el.hasAttribute && el.hasAttribute('_data-dismiss-offcanvas')) break;
                el = el.parentNode;
            }

            if (el && el.getAttribute) {
                var val = el.getAttribute('_data-dismiss-offcanvas');
                if (val) {
                    e.preventDefault && e.preventDefault();
                    if (val === 'all' || val === '_all' || val === '__all') {
                        if (window.cerrarAllOffcanvas) window.cerrarAllOffcanvas();
                        if (window.closeAllOffcanvas) window.closeAllOffcanvas();
                    } else {
                        if (window.cerrarOffcanvas) window.cerrarOffcanvas(val);
                        if (window.closeOffcanvas) window.closeOffcanvas(val);
                    }
                    return;
                }
            }
        }, false);
    } catch (e) { /* silent */ }

    // Close offcanvas on Escape key
    try {
        document.addEventListener('keydown', function (e) {
            var key = e.key || e.keyCode;
            if (key === 'Escape' || key === 'Esc' || key === 27) {
                if (window.cerrarAllOffcanvas) return window.cerrarAllOffcanvas();
                if (window.closeAllOffcanvas) return window.closeAllOffcanvas();
            }
        }, false);
    } catch (e) { /* silent */ }
    // Also attach delegated tabs handler so clicks are handled even if tabs are added dynamically
    try { if (window.initTabs) window.initTabs(); } catch (e) { /* silent */ }

    /**
     * Offcanvas API (abrir/cerrar) and attribute binding
     * Expose window.abrirOffcanvas / window.cerrarOffcanvas and closeAllOffcanvas
     */
    window._activeOffcanvas = window._activeOffcanvas || null;
    window._offcanvasPush = window._offcanvasPush || null;

    window.abrirOffcanvas = function (id) {
        try {
            // close any open offcanvas first - support both possible global names
            if (window.cerrarAllOffcanvas) window.cerrarAllOffcanvas();
            if (window.closeAllOffcanvas) window.closeAllOffcanvas();
        } catch (e) { /* ignore */ }

        var el = document.getElementById(id);
        if (!el) return;

        var backdropAttr = el.getAttribute('data-backdrop');
        var useBackdrop = (backdropAttr === null) ? true : (backdropAttr !== 'false');
        var mode = el.getAttribute('data-mode') || 'overlay';
        var side = el.getAttribute('data-side') || (el.classList.contains('_right') ? 'right' : 'left');

        // Ensure element is in body (should already be done in init, but double-check)
        if (el.parentNode !== document.body) {
            document.body.appendChild(el);
        }

        // Ensure placement class exists so CSS transforms apply correctly
        try {
            if (side === 'right') {
                if (!el.classList.contains('_right')) el.classList.add('_right');
                el.classList.remove('_left');
            } else {
                if (!el.classList.contains('_left')) el.classList.add('_left');
                el.classList.remove('_right');
            }
        } catch (e) { /* silent */ }

        // Force inline styles for open state
        el.style.transform = 'translateX(0)';
        el.style.position = 'fixed';
        // Keep offcanvas below modals but above navigation; match CSS base z-index
        el.style.zIndex = '13900';

        el.classList.add('_show');
        el.setAttribute('aria-hidden', 'false');
        window._activeOffcanvas = id;

        var bd = document.getElementById('offcanvasBackdropAll');
            if (bd && useBackdrop) {
            if (bd.parentNode !== document.body) document.body.appendChild(bd);
            bd.style.position = 'fixed';
            // Backdrop should sit below offcanvas and below modals
            bd.style.zIndex = '13800';
            bd.classList.add('_show');
        }

        if (mode === 'push') {
            try {
                var main = document.querySelector('.docs-main');
                var distance = el.offsetWidth || parseInt(el.style.width, 10) || 320;
                if (main) {
                    if (side === 'left') main.style.transform = 'translateX(' + distance + 'px)';
                    else main.style.transform = 'translateX(-' + distance + 'px)';
                    main.style.transition = 'transform 260ms ease';
                }
                document.body.classList.add('body-offcanvas-open');
                window._offcanvasPush = { id: id, distance: distance, side: side };
            } catch (e) { /* ignore */ }
        } else {
            document.body.classList.add('body-offcanvas-open');
        }
    };

    window.cerrarOffcanvas = function (id) {
        var el = document.getElementById(id);
        if (!el) return;
        
        var side = el.getAttribute('data-side') || (el.classList.contains('_right') ? 'right' : 'left');
        
        // Reset transform to hidden state
        if (side === 'right') {
            el.style.transform = 'translateX(110%)';
        } else {
            el.style.transform = 'translateX(-110%)';
        }
        
        el.classList.remove('_show');
        el.setAttribute('aria-hidden', 'true');

        var mode = el.getAttribute('data-mode') || 'overlay';
        if (mode === 'push' && window._offcanvasPush && window._offcanvasPush.id === id) {
            var main = document.querySelector('.docs-main');
            if (main) main.style.transform = '';
            window._offcanvasPush = null;
        }

        var any = document.querySelector('._offcanvas._show');
        if (!any) {
            var bd = document.getElementById('offcanvasBackdropAll');
            if (bd) bd.classList.remove('_show');
            document.body.classList.remove('body-offcanvas-open');
        }
        if (window._activeOffcanvas === id) window._activeOffcanvas = null;
    };

    window.cerrarAllOffcanvas = window.cerrarAllOffcanvas || function () {
        document.querySelectorAll('._offcanvas._show').forEach(function (n) {
            var side = n.getAttribute('data-side') || (n.classList.contains('_right') ? 'right' : 'left');
            if (side === 'right') {
                n.style.transform = 'translateX(110%)';
            } else {
                n.style.transform = 'translateX(-110%)';
            }
            n.classList.remove('_show');
            n.setAttribute('aria-hidden', 'true');
        });
        var bd = document.getElementById('offcanvasBackdropAll');
        if (bd) bd.classList.remove('_show');
        var main = document.querySelector('.docs-main');
        if (main) main.style.transform = '';
        window._offcanvasPush = null;
        window._activeOffcanvas = null;
        document.body.classList.remove('body-offcanvas-open');
    };

    // Bind attribute-based triggers: _data-offcanvas
    try {
        document.addEventListener('click', function (e) {
            var node = e.target;
            while (node && node.nodeType !== 1) node = node.parentNode;
            if (!node) return;
            // walk up to find element with attribute
            var el = node;
            while (el && el !== document) {
                if (el.hasAttribute && el.hasAttribute('_data-offcanvas')) break;
                el = el.parentNode;
            }
            if (el && el.getAttribute) {
                var id = el.getAttribute('_data-offcanvas');
                if (id) {
                    e.preventDefault && e.preventDefault();
                    window.abrirOffcanvas(id);
                }
            }
        }, false);
    } catch (e) { /* silent */ }

    // Ensure delegated tabs handler is active
    try { window.initTabs && window.initTabs(); } catch (e) { /* silent */ }

    window.cerrarModal = function (id) {
        var m = document.getElementById(id);
        if (m) {
            m.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    };

    // Click fuera del contenido para cerrar modales (backdrop) y binding por atributos
    document.addEventListener('click', function (e) {
        try {
            // Backdrop: si clicamos en el contenedor del modal, cerramos (si no está desactivado)
            if (e.target.classList && e.target.classList.contains('_modal-container')) {
                var parent = _eventClosest(e, '._modal');
                if (parent) {
                    var allow = parent.getAttribute('_data-backdrop-dismiss');
                    if (allow !== 'false') window.cerrarModal(parent.id);
                }
            }

            // Atributo _data-modal: delegación para abrir modales sin handlers inline
            var opener = _eventClosest(e, '[_data-modal]');
            if (opener) {
                if (e.preventDefault) e.preventDefault();
                var id = opener.getAttribute('_data-modal');
                if (id) {
                    if (window.abrirModal) window.abrirModal(id);
                    else {
                        var m = document.getElementById(id);
                        if (m) { m.style.display = 'block'; document.body.style.overflow = 'hidden'; }
                    }
                }
                return;
            }

            // Atributo _data-dismiss-modal: delegación para cerrar modales
            var dis = _eventClosest(e, '[_data-dismiss-modal]');
            if (dis) {
                if (e.preventDefault) e.preventDefault();
                var idd = dis.getAttribute('_data-dismiss-modal');
                if (idd) {
                    if (window.cerrarModal) window.cerrarModal(idd);
                } else {
                    var m = _closest(dis, '._modal');
                    if (m && m.id) window.cerrarModal(m.id);
                }
                return;
            }
        } catch (err) { /* silent */ }
    });

    /**
     * DESAPLEB STYLE - Tooltips con atributo personalizado _data-tooltip
     * Mejor posicionamiento: usamos position: fixed y centrado con translateX(-50%)
     */
    (function initTooltips(){
        function doInit(){
            // Avoid duplicate initialization
            if (document.getElementById('desapleb-tooltip')) return;

            // Singleton tooltip element
            var tooltipEl = document.createElement('div');
            tooltipEl.className = '_tooltip-box';
            tooltipEl.setAttribute('role', 'tooltip');
            tooltipEl.setAttribute('aria-hidden', 'true');
            tooltipEl.style.position = 'fixed';
            tooltipEl.style.left = '0px';
            tooltipEl.style.top = '0px';
            tooltipEl.style.visibility = 'hidden';
            tooltipEl.style.pointerEvents = 'none';
            tooltipEl.id = 'desapleb-tooltip';
            (document.body || document.documentElement).appendChild(tooltipEl);

            var visibleTarget = null;
            var hideTimeout = null;

            function showTooltip(target) {
                if (!target) return;
                var text = target.getAttribute('_data-tooltip');
                if (!text) return;

                // set content
                tooltipEl.textContent = text;

                // ensure visible for size calculation
                tooltipEl.style.visibility = 'hidden';
                tooltipEl.classList.remove('_tooltip-below');
                tooltipEl.classList.remove('_tooltip-visible');

                // compute position in next frame to allow DOM update
                raf(function () {
                    var rect = target.getBoundingClientRect();
                    var tipW = tooltipEl.offsetWidth;
                    var tipH = tooltipEl.offsetHeight;
                    var centerX = rect.left + rect.width / 2;

                    var gap = 8; // gap in px
                    var aboveTop = rect.top - tipH - gap;
                    var placeBelow = (aboveTop < 8);

                    if (placeBelow) {
                        tooltipEl.classList.add('_tooltip-below');
                        tooltipEl.style.top = (rect.bottom + gap) + 'px';
                    } else {
                        tooltipEl.classList.remove('_tooltip-below');
                        tooltipEl.style.top = Math.max(8, aboveTop) + 'px';
                    }

                    // bound horizontal to viewport
                    var left = centerX;
                    var minLeft = Math.ceil(tipW / 2) + 8;
                    var maxLeft = window.innerWidth - Math.ceil(tipW / 2) - 8;
                    left = Math.max(minLeft, Math.min(maxLeft, left));

                    tooltipEl.style.left = left + 'px';
                    tooltipEl.style.visibility = 'visible';
                    tooltipEl.setAttribute('aria-hidden', 'false');
                    tooltipEl.classList.add('_tooltip-visible');

                    visibleTarget = target;
                });
            }

            function hideTooltip() {
                if (!tooltipEl) return;
                tooltipEl.setAttribute('aria-hidden', 'true');
                tooltipEl.classList.remove('_tooltip-visible');
                tooltipEl.style.visibility = 'hidden';
                visibleTarget = null;
                if (hideTimeout) { clearTimeout(hideTimeout); hideTimeout = null; }
            }

            // Show on pointerenter / focus
            document.addEventListener('pointerenter', function (e) {
                try {
                    var t = e.target && e.target.closest && e.target.closest('[_data-tooltip]');
                    if (t) {
                        // ignore when pointer is touch (handled on pointerdown)
                        if (e.pointerType && e.pointerType === 'touch') return;
                        showTooltip(t);
                    }
                } catch (err) { /* silent */ }
            }, true);

            // Hide on pointerleave
            document.addEventListener('pointerleave', function (e) {
                try {
                    var from = e.target && e.target.closest && e.target.closest('[_data-tooltip]');
                    var to = e.relatedTarget && e.relatedTarget.closest && e.relatedTarget.closest('[_data-tooltip]');
                    if (from && !to) hideTooltip();
                } catch (err) { }
            }, true);

            // Focus/blur for keyboard support
            document.addEventListener('focusin', function (e) {
                var t = e.target && e.target.closest && e.target.closest('[_data-tooltip]');
                if (t) showTooltip(t);
            });

            document.addEventListener('focusout', function (e) {
                var t = e.target && e.target.closest && e.target.closest('[_data-tooltip]');
                if (t) hideTooltip();
            });

            // Touch: show on pointerdown (tap) for short time
            document.addEventListener('pointerdown', function (e) {
                if (e.pointerType !== 'touch') return;
                var t = e.target && e.target.closest && e.target.closest('[_data-tooltip]');
                if (!t) return;
                // toggle briefly
                showTooltip(t);
                if (hideTimeout) clearTimeout(hideTimeout);
                hideTimeout = setTimeout(function () { hideTooltip(); }, 2500);
            });

            // Hide on Escape
            document.addEventListener('keydown', function (e) {
                if (e.key === 'Escape' || e.key === 'Esc') hideTooltip();
            });

            // Hide or reposition on scroll/resize for correctness
            window.addEventListener('scroll', function () {
                if (visibleTarget) {
                    // try to reposition; if target is out of viewport hide
                    var rect = visibleTarget.getBoundingClientRect();
                    if (rect.bottom < 0 || rect.top > window.innerHeight) {
                        hideTooltip();
                    } else {
                        showTooltip(visibleTarget);
                    }
                }
            }, true);

            window.addEventListener('resize', function () {
                if (visibleTarget) showTooltip(visibleTarget);
            });
        }

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', doInit);
        } else {
            doInit();
        }
    })();

    /**
     * Docs ScrollSpy
     * - Scans sidebar links with class `._nav-link` and updates active state based on scroll
     * - Can be enabled/disabled via attribute `_data-slidebar-scrollspy="false"` on the sidebar element
     * - Backwards-compatible with legacy attribute `_data-slidebar-LoQueSea`
     */
    function initDocsScrollSpy() {
        try {
            if (document.__desapleb_scrollspy_inited) return;
            document.__desapleb_scrollspy_inited = true;

            // Locate sidebar and links more robustly
            var sidebarEl = document.querySelector('#menuLateralDemos') || document.querySelector('aside#menuLateralDemos') || document.querySelector('nav._sidebar') || document.querySelector('.docs-sidebar');
            var links = [];
            try {
                if (sidebarEl) links = Array.prototype.slice.call(sidebarEl.querySelectorAll('a._nav-link'));
                // fallback: try common selectors across docs if sidebar not found or no links
                if (!links.length) links = Array.prototype.slice.call(document.querySelectorAll('ul._sidebar-menu a._nav-link, ._sidebar-menu a._nav-link, a._nav-link'));
            } catch (err) { links = []; }

            if (!links.length) {
                return;
            }

            var items = [];
            links.forEach(function (link) {
                var href = link.getAttribute('href') || '';
                var id = null;
                var m = href.match(/scrollToId\(['"]([^'\"]+)['"]\)/);
                if (m) id = m[1];
                else if (href.indexOf('#') === 0) id = href.replace(/^#\/?/, '');
                if (id) {
                    var el = document.getElementById(id);
                    if (el) items.push({ id: id, el: el, link: link });
                }
            });

            if (!items.length) return;

            var ticking = false;
            function onScrollSpy() {
                if (ticking) return;
                ticking = true;
                window.requestAnimationFrame(function () {
                    var header = document.querySelector('nav._nav._fixed') || document.querySelector('header');
                    var headerHeight = (header && header.offsetHeight) ? header.offsetHeight : 80;
                    var offset = headerHeight + 12;

                    var current = items[0];
                    items.forEach(function (it) {
                        var rect = it.el.getBoundingClientRect();
                        if (rect.top - offset <= 0) {
                            current = it;
                        }
                    });

                    items.forEach(function (it) {
                        var active = (it.id === current.id);
                        try { it.link.classList.toggle('_active', active); } catch (e) {}
                        if (it.link.parentElement) try { it.link.parentElement.classList.toggle('_active', active); } catch (e) {}
                    });

                    ticking = false;
                });
            }

            // initial and event binding
            onScrollSpy();
            window.addEventListener('scroll', onScrollSpy, { passive: true });
            window.addEventListener('resize', onScrollSpy);
            links.forEach(function (l) { l.addEventListener('click', function () { setTimeout(onScrollSpy, 300); }); });
        } catch (e) { /* silent */ }
    }

    // expose to global for demos that call initDocsScrollSpy() inline
    try { window.initDocsScrollSpy = initDocsScrollSpy; } catch (e) { /* silent */ }

    /**
     * DESAPLEB STYLE - Navbar Logic
     */
    window.toggleMenu = function () {
        var menu = document.querySelector('._nav-menu');
        if (menu) menu.classList.toggle('_open');
    };

    // Lógica para marcar como activo el padre si un hijo está seleccionado (opcional dinámico)
    // Marca nav activo si la URL coincide
    function markActiveNav() {
        var currentUrl = window.location.href;
        var links = document.querySelectorAll('._nav-link');
        for (var i = 0; i < links.length; i++) {
            var link = links[i];
            try {
                if (link.href === currentUrl) {
                    var item = _closest(link, '._nav-item');
                    if (item) item.classList.add('_active');
                    // Subir por los padres para marcarlos todos
                    var parent = _closest(link, '._nav-dropdown');
                    while (parent) {
                        var parentItem = _closest(parent, '._nav-item');
                        if (parentItem) parentItem.classList.add('_active');
                        parent = _closest(parent.parentElement, '._nav-dropdown');
                    }
                }
            } catch (err) {
                // defensivo: continuar si algún enlace no tiene href
            }
        }
    }

    // Toggle Dark Mode (expuesto globalmente)
    window.toggleDarkMode = function () {
        var body = document.body;
        var btn = document.getElementById('btnDark');

        body.classList.toggle('_dark-mode');

        if (body.classList.contains('_dark-mode')) {
            if (btn) btn.innerHTML = '☀️ Modo Claro';
            localStorage.setItem('theme', 'dark');
        } else {
            if (btn) btn.innerHTML = '🌙 Modo Oscuro';
            localStorage.setItem('theme', 'light');
        }
        // Close any open dropdowns and close the mobile menu if open
        try {
            var openedItems = document.querySelectorAll('._nav-item._open');
            for (var oi = 0; oi < openedItems.length; oi++) try { openedItems[oi].classList.remove('_open'); } catch (ex) { }

            var menu = document.querySelector('._nav-menu');
            var toggle = document.querySelector('._nav-toggle');
            if (menu) {
                var isOpen = menu.classList.contains('_show') || menu.classList.contains('_open');
                if (isOpen) {
                    menu.classList.remove('_show');
                    menu.classList.remove('_open');
                }
                if (toggle) {
                    try { toggle.classList.remove('_active'); updateToggleAria(toggle, false); } catch (e) { }
                }
            }
        } catch (e) { /* silent */ }
    };

    function restoreThemePreference() {
        if (localStorage.getItem('theme') === 'dark') {
            document.body.classList.add('_dark-mode');
            var btn = document.getElementById('btnDark');
            if (btn) btn.innerHTML = '☀️ Modo Claro';
        }
    }

    /**
     * DESAPLEB STYLE - Offcanvas Engine
     * Soporta: Standard (Modal), Static (Push), Floating (Overlay)
     */
    window.toggleOffcanvas = function (id) {
        var el = document.getElementById(id);
        if (!el) return;

        var isStatic = el.classList.contains('_static');
        var isFloating = el.classList.contains('_floating');
        var isShowing = el.classList.contains('_show');
        var side = el.classList.contains('_left') ? 'left' : 'right';

        if (!isShowing) {
            // --- ABRIR ---
            el.classList.add('_show');

            if (isStatic) {
                document.body.classList.add('_offcanvas-open-static-' + side);
            }
            else if (isFloating) {
                document.body.classList.add('_offcanvas-open-floating-' + side);
            }
            else {
                // Modo Standard: Crear/Mostrar Backdrop y bloquear Scroll
                var backdrop = document.querySelector('._offcanvas-backdrop');
                if (!backdrop) {
                    backdrop = document.createElement('div');
                    backdrop.className = '_offcanvas-backdrop';
                    document.body.appendChild(backdrop);
                    backdrop.onclick = (function (myid) {
                        return function () { window.toggleOffcanvas(myid); };
                    })(id);
                }
                backdrop.classList.add('_show');
                document.body.style.overflow = 'hidden';
            }
        } else {
            // --- CERRAR ---
            el.classList.remove('_show');

            // Limpiar todas las clases de estado del body
            document.body.classList.remove('_offcanvas-open-static-' + side);
            document.body.classList.remove('_offcanvas-open-floating-' + side);
            document.body.style.overflow = 'auto';

            var backdrop = document.querySelector('._offcanvas-backdrop');
            if (backdrop) backdrop.classList.remove('_show');
        }
    };

    /**
     * DESAPLEB STYLE - Pop-Overs (Windows Style)
     */
    document.addEventListener('click', function (e) {
        var target = _eventClosest(e, '[_data-popover]');

        // Si clicamos fuera de un popover activo, cerramos todos
        if (!target && !_eventClosest(e, '._popover-container')) {
            var pops = document.querySelectorAll('._popover-container');
            for (var i = 0; i < pops.length; i++) {
                var p = pops[i];
                if (p && p.parentNode) p.parentNode.removeChild(p);
            }
            return;
        }

        if (target) {
            // Cerrar otros abiertos antes de abrir uno nuevo
            var pops2 = document.querySelectorAll('._popover-container');
            for (var k = 0; k < pops2.length; k++) {
                var p2 = pops2[k];
                if (p2 && p2.parentNode) p2.parentNode.removeChild(p2);
            }

            var title = target.getAttribute('_data-pop-title') || 'Información';
            var desc = target.getAttribute('_data-pop-desc') || '';

            var popover = document.createElement('div');
            popover.className = '_popover-container';

            // If trigger defines a variant via _data-pop-variant (e.g. "brand" or "_brand"),
            // apply it as a class on the popover so CSS variants are used.
            var variantAttr = target.getAttribute('_data-pop-variant');
            if (variantAttr) {
                var cls = (variantAttr.charAt && variantAttr.charAt(0) === '_') ? variantAttr : ('_' + variantAttr);
                popover.classList.add(cls);
            }

            popover.innerHTML = '<div class="_popover-header">' + title + '</div>' + '<div class="_popover-body">' + desc + '</div>';

            document.body.appendChild(popover);
            popover.style.display = 'block';

            // Posicionamiento
            var rect = target.getBoundingClientRect();
            var x = rect.left + (window.scrollX || window.pageXOffset) + (target.offsetWidth / 2) - (popover.offsetWidth / 2);
            var y = rect.top + (window.scrollY || window.pageYOffset) - popover.offsetHeight - 10;

            popover.style.left = x + 'px';
            popover.style.top = y + 'px';
        }
    });

    /**
     * DESAPLEB STYLE - Tabs Engine
     */
    window.initTabs = function () {
        document.addEventListener('click', function (e) {
            var tabLink = _eventClosest(e, '._tab-link');
            if (!tabLink) return;

            var container = _closest(tabLink, '._tabs-container');
            if (!container) return;
            var targetId = tabLink.getAttribute('_data-target') || (tabLink.dataset && tabLink.dataset.target) || tabLink.getAttribute('data-target');

            // Quitar activo de todos los links del contenedor y actualizar ARIA
            var links = container.querySelectorAll('._tab-link');
            for (var i = 0; i < links.length; i++) {
                var l = links[i];
                l.classList.remove('_active');
                l.setAttribute('aria-selected', 'false');
                l.setAttribute('tabindex', '-1');
            }

            // Quitar activo de todos los paneles del contenedor y actualizar ARIA
            var panels = container.querySelectorAll('._tab-content');
            for (var j = 0; j < panels.length; j++) {
                var p = panels[j];
                p.classList.remove('_active');
                p.setAttribute('aria-hidden', 'true');
                p.removeAttribute('tabindex');
            }

            // Activar el actual (link)
            tabLink.classList.add('_active');
            tabLink.setAttribute('aria-selected', 'true');
            tabLink.setAttribute('tabindex', '0');

            // Activar panel asociado
            if (targetId) {
                var targetPanel = container.querySelector('#' + targetId) || document.getElementById(targetId);
                if (targetPanel) {
                    targetPanel.classList.add('_active');
                    targetPanel.setAttribute('aria-hidden', 'false');
                    targetPanel.setAttribute('tabindex', '0');
                }
            }
        });
    };

    function initHoverCards() {
        var triggers = document.querySelectorAll('._card-trigger');

        for (var i = 0; i < triggers.length; i++) {
            (function (trigger) {
                var described = trigger.getAttribute('aria-describedby');
                if (!described) return;
                var card = document.getElementById(described);
                if (!card) return;

                var container = _closest(trigger, '._card-container') || trigger.parentNode;
                // Keep references to restore the hoverCard to its original location
                var _origParent = card.parentNode;
                var _origNext = card.nextSibling;
                var _movedToBody = false;

                function safeAddVisible() {
                    if (card.classList && card.classList.add) card.classList.add('_visible');
                    else if (card.className.indexOf('_visible') === -1) card.className += ' _visible';
                }

                function safeRemoveVisible() {
                    if (card.classList && card.classList.remove) card.classList.remove('_visible');
                    else card.className = card.className.replace(/\b_visible\b/g, '').replace(/\s\s+/g, ' ').trim();
                }

                function positionCard() {
                    try {
                        var trigRect = trigger.getBoundingClientRect();
                        var cardW = card.offsetWidth;
                        var cardH = card.offsetHeight;
                        var centerX = trigRect.left + (trigRect.width / 2);
                        var gap = 8;

                        // Preferir colocación encima, si hay espacio suficiente
                        var aboveTop = trigRect.top - cardH - gap;
                        var placeBelow = (aboveTop < 8);
                        var top;
                        if (placeBelow) {
                            top = trigRect.bottom + gap;
                            card.classList.add && card.classList.add('_below');
                        } else {
                            top = trigRect.top - cardH - gap;
                            card.classList.remove && card.classList.remove('_below');
                        }

                        // Horizontal center clamped to viewport (client coordinates)
                        var left = centerX - (cardW / 2);
                        var winW = window.innerWidth || document.documentElement.clientWidth;
                        var margin = 8;
                        if (left < margin) left = margin;
                        if ((left + cardW) > (winW - margin)) left = winW - cardW - margin;

                        // Apply computed positions (client coordinates) - hoverCard is position:fixed
                        card.style.left = Math.round(left) + 'px';
                        card.style.top = Math.round(top) + 'px';
                    } catch (e) { /* silent */ }
                }

                function show() {
                    // Move the hover card to body so it escapes any ancestor clipping/staking
                    try {
                        if (!_movedToBody && _origParent && _origParent !== document.body) {
                            _origParent = _origParent;
                            _origNext = _origNext;
                            document.body.appendChild(card);
                            _movedToBody = true;
                            // ensure the element is rendered as fixed (CSS already sets position:fixed)
                        }
                    } catch (e) { /* silent */ }

                    positionCard();
                    safeAddVisible();
                    card.setAttribute('aria-hidden', 'false');
                }

                function hide() {
                    safeRemoveVisible();
                    card.setAttribute('aria-hidden', 'true');

                    // Restore original location to keep DOM tidy
                    try {
                        if (_movedToBody && _origParent) {
                            if (_origNext && _origNext.parentNode === _origParent) _origParent.insertBefore(card, _origNext);
                            else _origParent.appendChild(card);
                            _movedToBody = false;
                        }
                    } catch (e) { /* silent */ }
                }

                // Events
                trigger.addEventListener('mouseenter', show);
                trigger.addEventListener('mouseleave', hide);
                card.addEventListener('mouseenter', show);
                card.addEventListener('mouseleave', hide);
                trigger.addEventListener('focus', show);
                trigger.addEventListener('blur', hide);
                trigger.addEventListener('click', function () { if (card.classList && card.classList.contains('_visible')) hide(); else show(); });

                // Reposition on resize/scroll when visible
                window.addEventListener('resize', function () { if (card.classList && card.classList.contains('_visible')) positionCard(); });
                window.addEventListener('scroll', function () { if (card.classList && card.classList.contains('_visible')) positionCard(); }, true);

            })(triggers[i]);
        }
    }

    function getHoverCard(el) {
        // Buscamos en el contenedor padre para encontrar al hermano con la clase correcta
        var parent = el.parentNode;
        var siblings = parent.childNodes;
        for (var i = 0; i < siblings.length; i++) {
            var node = siblings[i];
            // Nodo tipo ELEMENTO y que contenga la clase _hoverCard
            if (node.nodeType === 1 && node.className.indexOf('_hoverCard') !== -1) {
                return node;
            }
        }
        return null;
    }

    // Exponer la inicialización para que apps SPA puedan reinicializar componentes
    window.initHoverCards = initHoverCards;

    // Inicialización segura para IE9+
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        try { initHoverCards(); } catch (e) { }
    } else {
        document.onreadystatechange = function () {
            if (document.readyState === 'complete') try { initHoverCards(); } catch (e) { }
        };
    }

    /**
     * Ensure offcanvas elements have proper placement and positioning even when
     * CSS isn't fully loaded or markup lacks placement classes. This is defensive
     * and applies inline styles so offcanvas panels won't appear inside flow.
     */
    function initOffcanvasElements() {
        try {
            var nodes = document.querySelectorAll('._offcanvas');
            for (var i = 0; i < nodes.length; i++) {
                (function (el) {
                    // Determine side from data-side or class
                    var side = el.getAttribute('data-side') || (el.classList.contains('_right') ? 'right' : (el.classList.contains('_left') ? 'left' : null));
                    if (!side) side = 'left';

                    // Ensure class reflects side
                    if (side === 'right') { el.classList.add('_right'); el.classList.remove('_left'); }
                    else { el.classList.add('_left'); el.classList.remove('_right'); }

                    // Defensive inline positioning (fixed) to avoid layout shifts
                    var cs = el.style;
                    if (!cs.position || cs.position === '') cs.position = 'fixed';
                    cs.top = cs.top || '0px';
                    cs.bottom = cs.bottom || '0px';
                    // Default width if not specified
                    if (!cs.width || cs.width === '') cs.width = el.getAttribute('data-width') || el.getAttribute('width') || '320px';

                    // Apply initial transform so element is outside viewport
                    if (!el.classList.contains('_show')) {
                        if (side === 'right') cs.transform = 'translateX(110%)';
                        else cs.transform = 'translateX(-110%)';
                    }

                    // Make sure right/left coordinates exist for anchoring
                    if (side === 'right') { cs.right = cs.right || '0px'; cs.left = 'auto'; }
                    else { cs.left = cs.left || '0px'; cs.right = 'auto'; }
                })(nodes[i]);
            }
        } catch (e) { /* silent */ }
    }

    // Run defensive init on DOM ready
    if (document.readyState === 'complete' || document.readyState === 'interactive') initOffcanvasElements();
    else document.addEventListener('DOMContentLoaded', initOffcanvasElements);

    ////////////////////
    // Dropdowns
    ////////////////////
    function initDropdowns() {
        // Delegación: manejador seguro que usa helpers para evitar errores con text nodes
        document.addEventListener('click', function (e) {
            // Si el clic ocurrió sobre un elemento interno (texto, span...), _eventClosest
            // nos devolverá el trigger con clase _dropdown-toggle si existe.
            var toggle = _eventClosest(e, '._dropdown-toggle');

            if (toggle) {
                var parent = _closest(toggle, '._dropdown') || toggle.parentNode;
                var isOpen = parent && ((parent.classList && parent.classList.contains('_open')) || (parent.className && parent.className.indexOf('_open') !== -1));

                // Cerramos otros abiertos
                closeAll();

                if (!isOpen && parent) {
                    if (parent.classList) parent.classList.add('_open');
                    else parent.className = (parent.className ? parent.className + ' ' : '') + '_open';
                }

                if (e.preventDefault) e.preventDefault();
                return false;
            }

            // Si el clic no es sobre un dropdown ni dentro de uno, cerramos todos
            var inside = _eventClosest(e, '._dropdown');
            if (!inside) closeAll();
        }, false);
    }

    function closeAll() {
        var openMenus = document.querySelectorAll('._dropdown._open');
        for (var i = 0; i < openMenus.length; i++) {
            var m = openMenus[i];
            if (m.classList) m.classList.remove('_open');
            else m.className = m.className.replace(/\b_open\b/, '').replace(/\s\s+/g, ' ').trim();
        }
    }

    // Inicialización segura
    if (document.readyState === 'complete' || document.readyState === 'interactive') initDropdowns();
    else document.addEventListener('DOMContentLoaded', initDropdowns);

    // Defensive: ensure a delegated tabs click handler exists so examples work
    // even if initTabs wasn't invoked earlier by the host page.
    try {
        if (!window.__desapleb_tabs_delegate_installed) {
            document.addEventListener('click', function (e) {
                var tabLink = _eventClosest(e, '._tab-link');
                if (!tabLink) return;

                var container = _closest(tabLink, '._tabs-container');
                if (!container) return;
                var targetId = tabLink.getAttribute('_data-target') || (tabLink.dataset && tabLink.dataset.target) || tabLink.getAttribute('data-target');

                // deactivate links
                var links = container.querySelectorAll('._tab-link');
                for (var i = 0; i < links.length; i++) {
                    var l = links[i];
                    l.classList.remove('_active');
                    l.setAttribute('aria-selected', 'false');
                    l.setAttribute('tabindex', '-1');
                }

                // hide panels
                var panels = container.querySelectorAll('._tab-content');
                for (var j = 0; j < panels.length; j++) {
                    var p = panels[j];
                    p.classList.remove('_active');
                    p.setAttribute('aria-hidden', 'true');
                    p.removeAttribute('tabindex');
                }

                // activate clicked link and panel
                tabLink.classList.add('_active');
                tabLink.setAttribute('aria-selected', 'true');
                tabLink.setAttribute('tabindex', '0');

                if (targetId) {
                    var targetPanel = container.querySelector('#' + targetId) || document.getElementById(targetId);
                    if (targetPanel) {
                        targetPanel.classList.add('_active');
                        targetPanel.setAttribute('aria-hidden', 'false');
                        targetPanel.setAttribute('tabindex', '0');
                    }
                }
            }, false);

            window.__desapleb_tabs_delegate_installed = true;
        }
    } catch (e) { /* silent */ }
})();