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

// Hauptfunktion, die alles initialisiert
async function initSite() {
    // 1. Navigation laden
    const navLoaded = await loadComponent('navbar-placeholder', '/navbar.html');
    
    if (navLoaded) {
        // Wenn Navigation geladen ist: Logik aktivieren
        
        // A) Aktiven Link markieren
        const currentPath = window.location.pathname;
        const navLinks = document.querySelectorAll('.nav-links a');
        
        navLinks.forEach(link => {
            // Holen des Pfades aus dem Link (z.B. /about.html)
            const linkPath = new URL(link.href).pathname;
            
            // Sonderfall Startseite: "/" und "/index.html" sind das gleiche
            if (currentPath === '/' || currentPath === '/index.html') {
                if (linkPath === '/') link.classList.add('active');
            } else {
                // Normaler Vergleich
                if (linkPath === currentPath) {
                    link.classList.add('active');
                }
            }
        });

        // B) Mobile Menu Logic aktivieren
        const menuBtn = document.getElementById('mobile-menu-btn');
        const navList = document.getElementById('nav-links');
        
        if (menuBtn && navList) {
            menuBtn.addEventListener('click', () => {
                navList.classList.toggle('active');
            });
        }
    }

    // 2. Footer laden
    await loadComponent('footer-placeholder', '/footer.html');
}

// Starten, sobald die Seite geladen ist
document.addEventListener('DOMContentLoaded', initSite);
