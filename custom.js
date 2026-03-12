/**
 * ImpactFlow Cal.com Branding — Custom JavaScript
 * Stand: 2026-03-12
 *
 * Dieses Script wird via Nginx in jede Cal.com-Seite injiziert.
 * Es laeuft nach dem Seitenaufbau und passt Dinge an,
 * die mit reinem CSS nicht moeglich sind.
 */

(function () {
  "use strict";

  // ============================================
  // Konfiguration
  // ============================================
  const CONFIG = {
    // ImpactFlow Farben
    colors: {
      grey: "#878787",
      pink: "#f29cb6",
      mint: "#9dd3c7",
    },

    // Textersetzungen (Original -> Neu)
    textReplacements: {
      "Brauchst du Hilfe?": "Hilfe bei der Buchung?",
      // Weitere Texte hier einfuegen:
      // "Alter Text": "Neuer Text",
    },

    // Elemente die ausgeblendet werden sollen (CSS Selektoren)
    hideElements: [
      // 12h/24h Toggle (Fallback falls CSS nicht greift)
      '.ml-auto.rtl\\:mr-auto:has(button[aria-checked])',
    ],
  };

  // ============================================
  // Texte ersetzen
  // ============================================
  function replaceTexts() {
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );

    let node;
    while ((node = walker.nextNode())) {
      for (const [original, replacement] of Object.entries(
        CONFIG.textReplacements
      )) {
        if (node.textContent.trim() === original) {
          node.textContent = replacement;
        }
      }
    }
  }

  // ============================================
  // Elemente ausblenden (Fallback fuer CSS)
  // ============================================
  function hideElements() {
    CONFIG.hideElements.forEach(function (selector) {
      document.querySelectorAll(selector).forEach(function (el) {
        el.style.display = "none";
      });
    });
  }

  // ============================================
  // Verfuegbarkeits-Dots umfaerben
  // (Fallback falls CSS-Selektor nicht greift)
  // ============================================
  function recolorDots() {
    document.querySelectorAll("span.bg-emerald-400").forEach(function (dot) {
      dot.style.backgroundColor = CONFIG.colors.pink;
    });
  }

  // ============================================
  // Alle Anpassungen ausfuehren
  // ============================================
  function applyBranding() {
    replaceTexts();
    hideElements();
    recolorDots();
  }

  // ============================================
  // Start: Beim Laden + bei DOM-Aenderungen
  // (Cal.com ist eine SPA — Content aendert sich dynamisch)
  // ============================================
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", applyBranding);
  } else {
    applyBranding();
  }

  // MutationObserver: Reagiert auf dynamische Aenderungen (SPA-Navigation)
  var observer = new MutationObserver(function (mutations) {
    // Debounce: Nur alle 500ms ausfuehren
    clearTimeout(window._impactflowTimer);
    window._impactflowTimer = setTimeout(applyBranding, 500);
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
})();
