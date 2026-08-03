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

async function initSite() {
    const navLoaded = await loadComponent('navbar-placeholder', '/navbar.html');

    if (navLoaded) {
        markActiveNavLink();
        setupMobileMenu();
    }

    await loadComponent('footer-placeholder', '/footer.html');
}

document.addEventListener('DOMContentLoaded', initSite);
