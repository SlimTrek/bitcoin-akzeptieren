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
    });

    navList.querySelectorAll('a').forEach((link) => {
        link.addEventListener('click', () => {
            navList.classList.remove('active');
            setExpanded(false);
        });
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && navList.classList.contains('active')) {
            navList.classList.remove('active');
            setExpanded(false);
        }
    });
}

function markActiveNavLink() {
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.nav-links a');

    navLinks.forEach((link) => {
        const linkPath = new URL(link.href).pathname;

        if (currentPath === '/' || currentPath === '/index.html') {
            if (linkPath === '/') {
                link.classList.add('active');
            }
        } else if (linkPath === currentPath) {
            link.classList.add('active');
        }
    });
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
    const domain = window.BA_SITE && window.BA_SITE.plausibleDomain;
    if (!domain || typeof domain !== 'string' || !domain.trim()) {
        return;
    }
    if (document.querySelector('script[data-domain][src*="plausible"]')) {
        return;
    }
    const script = document.createElement('script');
    script.defer = true;
    script.dataset.domain = domain.trim();
    script.src = 'https://plausible.io/js/script.js';
    document.head.appendChild(script);
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
