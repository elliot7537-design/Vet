/* ============================================================
   PawCare Tijuana — Main JavaScript
   ============================================================ */

(function () {
  'use strict';

  /* ----------------------------------------------------------
     LANGUAGE TOGGLE
     Default: English ('en')
     Reads data-en / data-es attributes on every tagged element
  ---------------------------------------------------------- */
  const LANG_KEY  = 'pawcare_lang';
  let   currentLang = localStorage.getItem(LANG_KEY) || 'en';

  function applyLanguage(lang) {
    currentLang = lang;
    localStorage.setItem(LANG_KEY, lang);

    // Update <html lang>
    document.documentElement.lang = lang;

    // Swap all data-en / data-es text nodes (innerText or value)
    document.querySelectorAll('[data-en]').forEach(el => {
      const text = el.getAttribute('data-' + lang);
      if (text === null) return;

      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
        el.placeholder = text;
      } else if (el.tagName === 'OPTION') {
        el.textContent = text;
      } else {
        // Use innerHTML so we preserve entities like &quot;
        el.innerHTML = text;
      }
    });

    // Update <title>
    const titleEl = document.querySelector('title');
    if (titleEl) {
      const t = titleEl.getAttribute('data-' + lang);
      if (t) document.title = t;
    }

    // Update active indicator on toggle
    const enLabel = document.getElementById('langEN');
    const esLabel = document.getElementById('langES');
    if (enLabel && esLabel) {
      enLabel.classList.toggle('active', lang === 'en');
      esLabel.classList.toggle('active', lang === 'es');
    }

    // Announce to screen readers
    const announcer = document.getElementById('sr-announcer');
    if (announcer) {
      announcer.textContent = lang === 'en'
        ? 'Language changed to English'
        : 'Idioma cambiado a Español';
    }
  }

  function toggleLanguage() {
    applyLanguage(currentLang === 'en' ? 'es' : 'en');
  }

  /* ----------------------------------------------------------
     HAMBURGER MENU
  ---------------------------------------------------------- */
  function initHamburger() {
    const hamburger = document.getElementById('hamburger');
    const navLinks  = document.getElementById('navLinks');
    if (!hamburger || !navLinks) return;

    hamburger.addEventListener('click', () => {
      const isOpen = navLinks.classList.toggle('open');
      hamburger.setAttribute('aria-expanded', isOpen);
      // Animate bars
      const bars = hamburger.querySelectorAll('span');
      if (isOpen) {
        bars[0].style.transform = 'translateY(7px) rotate(45deg)';
        bars[1].style.opacity   = '0';
        bars[2].style.transform = 'translateY(-7px) rotate(-45deg)';
      } else {
        bars[0].style.transform = '';
        bars[1].style.opacity   = '';
        bars[2].style.transform = '';
      }
    });

    // Close menu on nav link click
    navLinks.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        navLinks.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
        const bars = hamburger.querySelectorAll('span');
        bars[0].style.transform = '';
        bars[1].style.opacity   = '';
        bars[2].style.transform = '';
      });
    });
  }

  /* ----------------------------------------------------------
     NAVBAR SCROLL SHADOW
  ---------------------------------------------------------- */
  function initNavScroll() {
    const navbar = document.querySelector('.navbar');
    if (!navbar) return;
    window.addEventListener('scroll', () => {
      if (window.scrollY > 10) {
        navbar.style.boxShadow = '0 2px 20px rgba(26,26,46,0.12)';
      } else {
        navbar.style.boxShadow = '';
      }
    }, { passive: true });
  }

  /* ----------------------------------------------------------
     CONTACT FORM SUBMISSION (demo)
  ---------------------------------------------------------- */
  function initContactForm() {
    const form    = document.getElementById('contactForm');
    const success = document.getElementById('formSuccess');
    if (!form || !success) return;

    form.addEventListener('submit', e => {
      e.preventDefault();

      // Basic required validation
      const required = form.querySelectorAll('[required]');
      let valid = true;
      required.forEach(field => {
        field.style.borderColor = '';
        if (!field.value.trim()) {
          field.style.borderColor = '#ff6b8a';
          valid = false;
        }
      });
      if (!valid) return;

      // Simulate form submission
      const submitBtn = form.querySelector('[type="submit"]');
      const originalText = submitBtn.textContent;
      submitBtn.textContent = currentLang === 'en' ? 'Sending…' : 'Enviando…';
      submitBtn.disabled = true;

      setTimeout(() => {
        form.reset();
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
        success.classList.add('visible');
        // Re-apply language to reset select options text
        applyLanguage(currentLang);
        setTimeout(() => success.classList.remove('visible'), 6000);
      }, 1200);
    });

    // Clear red borders on input
    form.querySelectorAll('input, textarea').forEach(field => {
      field.addEventListener('input', () => { field.style.borderColor = ''; });
    });
  }

  /* ----------------------------------------------------------
     SCROLL REVEAL
     – Generic elements: fade up via inline style
     – Vet cards: CSS class toggle with per-row stagger via data-delay
     – Team section header: CSS class toggle
  ---------------------------------------------------------- */
  function initScrollReveal() {
    // ── 1. Generic fade-up elements ──────────────────────────
    const genericTargets = document.querySelectorAll(
      '.service-card, .testimonial-card, .why-us__list li, .about-vet-chip, .detail-item'
    );

    const genericObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.opacity   = '1';
          entry.target.style.transform = 'translateY(0)';
          genericObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    genericTargets.forEach((el, i) => {
      el.style.opacity    = '0';
      el.style.transform  = 'translateY(28px)';
      el.style.transition = `opacity 0.5s ease ${i * 0.055}s, transform 0.5s ease ${i * 0.055}s`;
      genericObserver.observe(el);
    });

    // ── 2. Team section header ────────────────────────────────
    const teamHeader = document.querySelector('.team-header');
    if (teamHeader) {
      const headerObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            headerObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0.2 });
      headerObserver.observe(teamHeader);
    }

    // ── 3. Vet cards — staggered per visual row ───────────────
    // Cards already have opacity:0 / transform via CSS.
    // We group them by their row (3-across on desktop) so each
    // row triggers when it enters the viewport, with the
    // data-delay attribute adding a within-row offset.
    const vetCards = Array.from(document.querySelectorAll('.vet-card'));

    if (vetCards.length === 0) return;

    // Split into rows of 3 (matches the CSS grid)
    const COLS = 3;
    const rows = [];
    for (let i = 0; i < vetCards.length; i += COLS) {
      rows.push(vetCards.slice(i, i + COLS));
    }

    rows.forEach(row => {
      const rowObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          // Reveal each card in the row with its individual delay
          row.forEach(card => {
            const delay = parseInt(card.dataset.delay || '0', 10);
            setTimeout(() => card.classList.add('is-visible'), delay);
          });
          // Unobserve the whole row once triggered
          row.forEach(card => rowObserver.unobserve(card));
        });
      }, { threshold: 0.15 });

      // Observe the first card in the row as the trigger
      rowObserver.observe(row[0]);
    });
  }

  /* ----------------------------------------------------------
     SMOOTH ACTIVE NAV LINK  (highlights current section)
  ---------------------------------------------------------- */
  function initActiveNav() {
    const sections = document.querySelectorAll('section[id]');
    const links    = document.querySelectorAll('.navbar__links a[href^="#"]');

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          links.forEach(a => {
            a.classList.toggle(
              'active-link',
              a.getAttribute('href') === '#' + entry.target.id
            );
          });
        }
      });
    }, { rootMargin: '-40% 0px -55% 0px' });

    sections.forEach(s => observer.observe(s));
  }

  /* ----------------------------------------------------------
     SCREEN-READER ANNOUNCER (live region)
  ---------------------------------------------------------- */
  function addAriaLiveRegion() {
    const el = document.createElement('div');
    el.id = 'sr-announcer';
    el.setAttribute('aria-live', 'polite');
    el.setAttribute('aria-atomic', 'true');
    el.style.cssText = 'position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden;';
    document.body.appendChild(el);
  }

  /* ----------------------------------------------------------
     INIT
  ---------------------------------------------------------- */
  function init() {
    addAriaLiveRegion();

    // Wire up language toggle (click & keyboard)
    const langToggle = document.getElementById('langToggle');
    if (langToggle) {
      langToggle.addEventListener('click', toggleLanguage);
      langToggle.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toggleLanguage();
        }
      });
    }

    // Apply stored/default language on load
    applyLanguage(currentLang);

    initHamburger();
    initNavScroll();
    initContactForm();
    initScrollReveal();
    initActiveNav();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
