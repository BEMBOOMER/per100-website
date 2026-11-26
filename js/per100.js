// PER100: menu, vensters (film en download), verschijnen bij scrollen, contactformulier.
(function () {
  "use strict";
  document.documentElement.classList.add("js");

  // ---------- menu op mobiel ----------
  var knop = document.querySelector(".hamburger");
  var menu = document.getElementById("menu");
  function zetMenu(open) {
    if (!knop || !menu) return;
    knop.setAttribute("aria-expanded", open ? "true" : "false");
    knop.setAttribute("aria-label", open ? "Menu sluiten" : "Menu openen");
    menu.classList.toggle("is-open", open);
  }
  if (knop && menu) {
    knop.addEventListener("click", function () { zetMenu(knop.getAttribute("aria-expanded") !== "true"); });
    menu.addEventListener("click", function (e) { if (e.target.closest("a")) zetMenu(false); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && knop.getAttribute("aria-expanded") === "true") { zetMenu(false); knop.focus(); } });
    document.addEventListener("click", function (e) { if (menu.classList.contains("is-open") && !e.target.closest(".kopbalk")) zetMenu(false); });
    window.matchMedia("(min-width: 861px)").addEventListener("change", function (m) { if (m.matches) zetMenu(false); });
  }

  // ---------- vensters ----------
  function open(id) {
    var d = document.getElementById(id);
    if (!d) return;
    if (typeof d.showModal === "function") d.showModal(); else d.setAttribute("open", "");
    document.body.style.overflow = "hidden";
    var v = d.querySelector("video");
    if (v) { try { v.currentTime = 0; var p = v.play(); if (p && p.catch) p.catch(function () {}); } catch (e) {} }
  }
  function sluit(d) {
    var v = d.querySelector("video");
    if (v) v.pause();
    if (typeof d.close === "function") d.close(); else d.removeAttribute("open");
    document.body.style.overflow = "";
  }
  document.querySelectorAll("[data-open]").forEach(function (el) {
    el.addEventListener("click", function (e) { e.preventDefault(); open(el.getAttribute("data-open")); });
  });
  document.querySelectorAll("dialog.venster").forEach(function (d) {
    d.addEventListener("click", function (e) {
      if (e.target.closest("[data-sluit]") || e.target === d || e.target.classList.contains("venster__in")) sluit(d);
    });
    d.addEventListener("cancel", function () { var v = d.querySelector("video"); if (v) v.pause(); document.body.style.overflow = ""; });
    d.addEventListener("close", function () { document.body.style.overflow = ""; });
  });

  // ---------- beweging bij laden ----------
  var rustig = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function geladen() { document.body.classList.add("is-geladen"); }
  requestAnimationFrame(function () { requestAnimationFrame(geladen); });
  setTimeout(geladen, 120);
  var heroTel = document.querySelector(".hero__beeld .telefoon");
  if (heroTel && !rustig) heroTel.classList.add("zweeft");

  // lijsten komen na elkaar binnen
  document.querySelectorAll("[data-na-elkaar]").forEach(function (g) {
    Array.prototype.forEach.call(g.children, function (c, i) { c.classList.add("opkomst"); c.style.setProperty("--i", i); });
  });

  // ---------- verschijnen bij scrollen ----------
  var stukken = document.querySelectorAll(".opkomst");
  if ("IntersectionObserver" in window && !rustig) {
    var io = new IntersectionObserver(function (items) {
      items.forEach(function (it) { if (it.isIntersecting) { it.target.classList.add("is-zichtbaar"); io.unobserve(it.target); } });
    }, { rootMargin: "0px 0px -10% 0px", threshold: 0.12 });
    stukken.forEach(function (s) { io.observe(s); });
  } else {
    stukken.forEach(function (s) { s.classList.add("is-zichtbaar"); });
  }

  // ---------- contactformulier: controleren en als e-mail openen ----------
  var form = document.getElementById("contactformulier");
  if (form) {
    var adres = form.getAttribute("data-naar");
    function fout(veld, tekst) {
      var label = veld.closest(".veld") || veld.closest(".vink");
      var small = label ? label.querySelector("small") : null;
      if (tekst) { if (label) label.setAttribute("data-fout", ""); if (small) small.textContent = tekst; veld.setAttribute("aria-invalid", "true"); }
      else { if (label) label.removeAttribute("data-fout"); if (small) small.textContent = ""; veld.removeAttribute("aria-invalid"); }
    }
    function controleer(veld) {
      var w = (veld.value || "").trim();
      if (veld.name === "naam") return w ? "" : "Vul je naam in.";
      if (veld.name === "email") return !w ? "Vul je e-mailadres in." : (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(w) ? "" : "Dit e-mailadres klopt niet helemaal.");
      if (veld.name === "onderwerp") return w ? "" : "Kies een onderwerp.";
      if (veld.name === "bericht") return w.length >= 10 ? "" : "Schrijf minstens een korte zin.";
      if (veld.name === "akkoord") return veld.checked ? "" : "Vink dit aan om verder te gaan.";
      return "";
    }
    form.querySelectorAll("input, select, textarea").forEach(function (veld) {
      veld.addEventListener("blur", function () { if (veld.value || veld.type === "checkbox") fout(veld, controleer(veld)); });
      veld.addEventListener("input", function () { if (veld.hasAttribute("aria-invalid")) fout(veld, controleer(veld)); });
      veld.addEventListener("change", function () { if (veld.hasAttribute("aria-invalid")) fout(veld, controleer(veld)); });
    });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var eerste = null;
      form.querySelectorAll("input, select, textarea").forEach(function (veld) {
        var t = controleer(veld); fout(veld, t); if (t && !eerste) eerste = veld;
      });
      if (eerste) { eerste.focus(); return; }
      var d = new FormData(form);
      var onderwerp = "PER100: " + d.get("onderwerp");
      var body = d.get("bericht") + "\n\n" + d.get("naam") + "\n" + d.get("email");
      window.location.href = "mailto:" + adres + "?subject=" + encodeURIComponent(onderwerp) + "&body=" + encodeURIComponent(body);
      var m = document.getElementById("formulier-melding");
      if (m) { m.hidden = false; m.focus(); }
    });
  }
})();

/* Examen: dia's van de presentatie doorbladeren, met de video's op hun plek en op volledig scherm */
(function () {
  var box = document.querySelector('[data-dias]'); if (!box) return;
  var dias = box.querySelectorAll('[data-dia]'), vids = box.querySelectorAll('[data-bij]'), teller = box.querySelector('[data-teller]'), nu = 0;
  function toon(i) { nu = (i + dias.length) % dias.length;
    for (var k = 0; k < dias.length; k++) dias[k].classList.toggle('is-actief', k === nu);
    for (var v = 0; v < vids.length; v++) { var aan = +vids[v].getAttribute('data-bij') === nu; vids[v].classList.toggle('is-actief', aan); var el = vids[v].querySelector('video'); if (!aan && !el.paused) el.pause(); }
    teller.textContent = (nu + 1) + ' / ' + dias.length;
    var volgende = dias[(nu + 1) % dias.length]; if (volgende.loading === 'lazy') volgende.loading = 'eager'; }
  box.querySelector('[data-vorige]').addEventListener('click', function () { toon(nu - 1); });
  box.querySelector('[data-volgende]').addEventListener('click', function () { toon(nu + 1); });
  var groot = box.querySelector('[data-groot]');
  function knop() { if (groot) groot.textContent = (document.fullscreenElement || box.classList.contains('is-groot')) ? 'Sluiten' : 'Volledig scherm'; }
  function venster(aan) { box.classList.toggle('is-groot', aan); document.documentElement.classList.toggle('ex-vast', aan); knop(); }
  if (groot) groot.addEventListener('click', function () {
    if (document.fullscreenElement) { document.exitFullscreen(); return; }
    if (box.classList.contains('is-groot')) { venster(false); return; }
    var f = box.requestFullscreen || box.webkitRequestFullscreen;
    if (!f) { venster(true); return; }
    try { var p = f.call(box); if (p && p.catch) p.catch(function () { venster(true); }); } catch (e) { venster(true); }
    setTimeout(function () { if (!document.fullscreenElement && !box.classList.contains('is-groot')) venster(true); }, 450); });
  document.addEventListener('fullscreenchange', knop);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && box.classList.contains('is-groot')) venster(false); });
  document.addEventListener('keydown', function (e) {
    if (e.target && /VIDEO|INPUT|TEXTAREA/.test(e.target.tagName)) { if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return; }
    var r = box.getBoundingClientRect(); if (!document.fullscreenElement && !box.classList.contains('is-groot') && (r.bottom < 0 || r.top > innerHeight)) return;
    if (e.key === 'ArrowRight' || e.key === 'PageDown' || (e.key === ' ' && (document.fullscreenElement || box.classList.contains('is-groot')))) { e.preventDefault(); toon(nu + 1); }
    if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); toon(nu - 1); } });
  toon(0);
})();
