/* =========================================================================
   Vijay Jawali — Portfolio · site.js
   Vanilla JS. Handles theme, nav, reveal, back-to-top, typewriter, filters.
   ========================================================================= */
(function () {
  'use strict';
  var doc = document;
  var root = doc.documentElement;

  /* ---------- Theme (light default, persisted) ---------- */
  try {
    var saved = localStorage.getItem('vj-theme');
    if (saved === 'light' || saved === 'dark') root.setAttribute('data-theme', saved);
  } catch (e) {}

  function currentTheme() {
    var t = root.getAttribute('data-theme');
    if (t) return t;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  function toggleTheme() {
    var next = currentTheme() === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('vj-theme', next); } catch (e) {}
  }

  /* ---------- On DOM ready ---------- */
  function ready(fn) {
    if (doc.readyState !== 'loading') fn();
    else doc.addEventListener('DOMContentLoaded', fn);
  }

  ready(function () {
    doc.body.classList.remove('is-preload');

    /* Theme toggle button */
    var themeBtn = doc.querySelector('[data-theme-toggle]');
    if (themeBtn) themeBtn.addEventListener('click', toggleTheme);

    /* Mobile nav */
    var navToggle = doc.querySelector('[data-nav-toggle]');
    var navLinks = doc.querySelector('[data-nav-links]');
    if (navToggle && navLinks) {
      navToggle.addEventListener('click', function () {
        var open = navLinks.classList.toggle('open');
        navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
      navLinks.querySelectorAll('a').forEach(function (a) {
        a.addEventListener('click', function () {
          navLinks.classList.remove('open');
          navToggle.setAttribute('aria-expanded', 'false');
        });
      });
    }

    /* Nav shadow on scroll */
    var nav = doc.querySelector('.nav');
    function onScrollNav() { if (nav) nav.classList.toggle('scrolled', window.scrollY > 8); }
    onScrollNav();
    window.addEventListener('scroll', onScrollNav, { passive: true });

    /* Back to top */
    var topBtn = doc.getElementById('topButton');
    if (topBtn) {
      window.addEventListener('scroll', function () {
        topBtn.classList.toggle('show', window.scrollY > 300);
      }, { passive: true });
      topBtn.addEventListener('click', function () {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }

    /* Scroll reveal */
    var reveals = doc.querySelectorAll('.reveal');
    if ('IntersectionObserver' in window && reveals.length) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
      reveals.forEach(function (el) { io.observe(el); });
    } else {
      reveals.forEach(function (el) { el.classList.add('in'); });
    }

    /* Scrollspy for section nav (interior pages with in-page anchors) */
    var spyLinks = doc.querySelectorAll('[data-spy] a[href^="#"]');
    if (spyLinks.length && 'IntersectionObserver' in window) {
      var map = {};
      spyLinks.forEach(function (l) {
        var id = l.getAttribute('href').slice(1);
        var sec = id && doc.getElementById(id);
        if (sec) map[id] = l;
      });
      var spyIO = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) {
            spyLinks.forEach(function (l) { l.classList.remove('active'); });
            var active = map[en.target.id];
            if (active) active.classList.add('active');
          }
        });
      }, { rootMargin: '-45% 0px -50% 0px' });
      Object.keys(map).forEach(function (id) { spyIO.observe(doc.getElementById(id)); });
    }

    /* Animate skill bars when visible */
    var bars = doc.querySelectorAll('.bar > span[data-lvl]');
    if (bars.length) {
      if ('IntersectionObserver' in window) {
        var barIO = new IntersectionObserver(function (entries) {
          entries.forEach(function (en) {
            if (en.isIntersecting) {
              en.target.style.width = en.target.getAttribute('data-lvl') + '%';
              barIO.unobserve(en.target);
            }
          });
        }, { threshold: 0.3 });
        bars.forEach(function (b) { barIO.observe(b); });
      } else {
        bars.forEach(function (b) { b.style.width = b.getAttribute('data-lvl') + '%'; });
      }
    }

    /* ---------- Typewriter (home) ---------- */
    doc.querySelectorAll('[data-typewriter]').forEach(function (el) {
      var list;
      try { list = JSON.parse(el.getAttribute('data-typewriter')); } catch (e) { return; }
      if (!list || !list.length) return;
      // shuffle
      for (var i = list.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var t = list[i]; list[i] = list[j]; list[j] = t;
      }
      var idx = 0, ch = 0, out = el.querySelector('.tw-text') || el;
      var speed = parseInt(el.getAttribute('data-speed') || '55', 10);
      var pause = parseInt(el.getAttribute('data-pause') || '1800', 10);
      function step() {
        var cur = list[idx];
        out.textContent = cur.substring(0, ch);
        ch++;
        if (ch > cur.length) { ch = 0; idx = (idx + 1) % list.length; setTimeout(step, pause); }
        else setTimeout(step, speed);
      }
      step();
    });

    /* ---------- Generic filter + search (skills, certs) ---------- */
    doc.querySelectorAll('[data-filterset]').forEach(function (scope) {
      var input = scope.querySelector('[data-search]');
      var btns = scope.querySelectorAll('[data-filter]');
      var items = scope.querySelectorAll('[data-item]');
      var groups = scope.querySelectorAll('[data-group]');
      var countEl = scope.querySelector('[data-count]');
      var empty = scope.querySelector('[data-empty]');
      var totalTemplate = countEl ? countEl.getAttribute('data-count') : '';
      var activeFilter = 'all';

      function apply() {
        var q = (input && input.value ? input.value : '').trim().toLowerCase();
        var shown = 0;
        items.forEach(function (it) {
          var cats = (it.getAttribute('data-cat') || '').toLowerCase();
          var text = (it.getAttribute('data-text') || it.textContent).toLowerCase();
          var okCat = activeFilter === 'all' || cats.split(/\s+/).indexOf(activeFilter) !== -1;
          var okText = !q || text.indexOf(q) !== -1;
          var vis = okCat && okText;
          it.classList.toggle('hidden', !vis);
          if (vis) shown++;
        });
        // hide empty groups
        groups.forEach(function (g) {
          var any = g.querySelectorAll('[data-item]:not(.hidden)').length;
          g.classList.toggle('hidden', any === 0);
        });
        if (countEl) countEl.textContent = totalTemplate.replace('{n}', shown);
        if (empty) empty.classList.toggle('hidden', shown !== 0);
      }

      if (input) input.addEventListener('input', apply);
      btns.forEach(function (b) {
        b.addEventListener('click', function () {
          btns.forEach(function (x) { x.classList.remove('active'); });
          b.classList.add('active');
          activeFilter = b.getAttribute('data-filter');
          apply();
        });
      });
      apply();
    });
  });
})();
