// Funktion zum Laden von HTML-Komponenten
async function loadComponent(elementId, filePath) {
    try {
        const response = await fetch(filePath);
        if (response.ok) {
            const html = await response.text();
            document.getElementById(elementId).innerHTML = html;
            return true;
        } else {
            console.error(`Fehler beim Laden von ${filePath}: ${response.status}`);
            return false;
        }
    } catch (error) {
        console.error(`Netzwerkfehler beim Laden von ${filePath}:`, error);
        return false;
    }
}

function setupMobileMenu() {
    const menuBtn = document.getElementById('mobile-menu-btn');
    const navList = document.getElementById('nav-links');
    if (!menuBtn || !navList) {
        return;
    }

    const setExpanded = (open) => {
        menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
        menuBtn.setAttribute('aria-label', open ? 'Menü schliessen' : 'Menü öffnen');
    };

    menuBtn.addEventListener('click', () => {
        const open = !navList.classList.contains('active');
        navList.classList.toggle('active', open);
        setExpanded(open);
        if (open) {
            closeNavMore();
        }
    });

    navList.querySelectorAll('a').forEach((link) => {
        link.addEventListener('click', () => {
            navList.classList.remove('active');
            setExpanded(false);
            closeNavMore();
        });
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && navList.classList.contains('active')) {
            navList.classList.remove('active');
            setExpanded(false);
        }
    });
}

function closeNavMore() {
    const more = document.querySelector('.nav-more');
    const moreBtn = document.getElementById('nav-more-btn');
    if (!more || !moreBtn) {
        return;
    }
    more.classList.remove('is-open');
    moreBtn.setAttribute('aria-expanded', 'false');
}

function setupNavMore() {
    const more = document.querySelector('.nav-more');
    const moreBtn = document.getElementById('nav-more-btn');
    if (!more || !moreBtn) {
        return;
    }

    moreBtn.addEventListener('click', (event) => {
        event.stopPropagation();
        const open = !more.classList.contains('is-open');
        more.classList.toggle('is-open', open);
        moreBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });

    document.addEventListener('click', (event) => {
        if (!more.contains(event.target)) {
            closeNavMore();
        }
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            closeNavMore();
        }
    });
}

function markActiveNavLink() {
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.nav-links a');
    let secondaryActive = false;

    navLinks.forEach((link) => {
        const linkPath = new URL(link.href).pathname;
        let isActive = false;

        if (currentPath === '/' || currentPath === '/index.html') {
            isActive = linkPath === '/';
        } else {
            isActive = linkPath === currentPath;
        }

        if (isActive) {
            link.classList.add('active');
            if (link.closest('.nav-more-menu')) {
                secondaryActive = true;
            }
        }
    });

    const moreBtn = document.getElementById('nav-more-btn');
    if (moreBtn && secondaryActive) {
        moreBtn.classList.add('active');
    }
}

async function loadSiteConfig() {
    if (window.BA_SITE) {
        return;
    }
    await new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = '/js/site-config.js';
        script.onload = resolve;
        script.onerror = resolve; // continue without analytics if missing
        document.head.appendChild(script);
    });
}

function enablePlausible() {
    const cfg = window.BA_SITE || {};
    const src = typeof cfg.plausibleScriptSrc === 'string' ? cfg.plausibleScriptSrc.trim() : '';
    if (!src) {
        return;
    }
    if (document.querySelector('script[src*="plausible.io/js/"]')) {
        return;
    }
    const script = document.createElement('script');
    script.async = true;
    script.src = src;
    document.head.appendChild(script);

    // Plausible new installer queue + init (same as their <head> snippet).
    window.plausible = window.plausible || function () {
        (plausible.q = plausible.q || []).push(arguments);
    };
    plausible.init = plausible.init || function (i) {
        plausible.o = i || {};
    };
    plausible.init();
}

function ensureMainContentAnchor() {
    if (document.getElementById('main-content')) {
        return;
    }
    const candidate = document.querySelector(
        'header, .home-hero, .container, .converter-wrapper, .page-header, body > section, main'
    );
    if (!candidate) {
        return;
    }
    candidate.id = 'main-content';
    if (!candidate.hasAttribute('tabindex')) {
        candidate.setAttribute('tabindex', '-1');
    }
}

async function initSite() {
    await loadSiteConfig();
    enablePlausible();
    ensureMainContentAnchor();

    const navLoaded = await loadComponent('navbar-placeholder', '/navbar.html');

    if (navLoaded) {
        markActiveNavLink();
        setupMobileMenu();
        setupNavMore();
    }

    await loadComponent('footer-placeholder', '/footer.html');

    // Site search (navbar + /suche.html)
    const bootSearch = () => {
        if (window.BA_SEARCH && typeof window.BA_SEARCH.init === 'function') {
            window.BA_SEARCH.init();
            return Promise.resolve();
        }
        return new Promise((resolve) => {
            const s = document.createElement('script');
            s.src = '/js/search.js';
            s.onload = () => {
                if (window.BA_SEARCH) window.BA_SEARCH.init();
                resolve();
            };
            s.onerror = resolve;
            document.head.appendChild(s);
        });
    };
    await bootSearch();
}

document.addEventListener('DOMContentLoaded', initSite);
