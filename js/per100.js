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
