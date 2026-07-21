/* ============================================================
   PatchMortem — site wiring configuration
   ------------------------------------------------------------
   EDIT THIS FILE ONLY. Every CTA, form, and external link on
   every page reads its destination from here. Change a value
   once and it updates across the whole site.

   Anything left as an empty string ("") is treated as NOT YET
   CONFIGURED. Those buttons degrade gracefully: they fall back
   to the contact page and log a warning to the console instead
   of sending the visitor to a dead URL.
   ============================================================ */

window.PM_CONFIG = {

  /* ---- 1. APPLICATION URLS ---------------------------------
     The dashboard your customers actually log into.
     Your homepage mock already references app.patchmortem.com.
  ---------------------------------------------------------- */
  appLoginUrl:  "https://patchmortem.com/login",
  appSignupUrl: "https://patchmortem.com/signup",

  /* ---- 2. DEMO BOOKING -------------------------------------
     Paste your scheduling link (Cal.com, Calendly, HubSpot
     Meetings, Zoho Bookings). If blank, "Schedule a demo"
     buttons fall back to the contact form.
  ---------------------------------------------------------- */
  demoBookingUrl: "",

  /* ---- 3. AWS MARKETPLACE ----------------------------------
     Your public listing URL. Leave blank until the listing is
     live — the link will route to contact instead of 404ing.
  ---------------------------------------------------------- */
  awsMarketplaceUrl: "",

  /* ---- 4. FORM SUBMISSION ----------------------------------
     Where the contact form POSTs. Options:
       a) Google Apps Script (RECOMMENDED — you have Workspace)
          "https://script.google.com/macros/s/AKfy.../exec"
          See SETUP-GOOGLE-FORM.md. Responses land in a Sheet
          and you get an email per enquiry.
       b) Your own API      "https://api.patchmortem.com/v1/leads"
       c) Formspree         "https://formspree.io/f/XXXXXXX"
       d) Web3Forms         "https://api.web3forms.com/submit"
     Leave blank to keep the mailto: fallback below.

     NOTE: script.google.com URLs are detected automatically and
     sent as text/plain. Apps Script cannot answer a CORS
     preflight, and text/plain avoids triggering one. The body is
     still JSON — the script parses it. Do not "fix" this.
  ---------------------------------------------------------- */
  formEndpoint: "https://script.google.com/macros/s/AKfycbxFasikwN7zTKLmEFhzvm5jgmxFyd9U-4CW9Q2WJsyEIQ9HTOFiFv_vsnNrzkxhEmSx/exec",
  formMethod:   "POST",

  /* Fallback used when formEndpoint is blank: opens the user's
     mail client with the enquiry pre-filled. Not elegant, but
     it never silently loses a lead. */
  formFallbackEmail: "hello@zurlux.com",

  /* ---- 5. CONTACT ADDRESSES --------------------------------- */
  emailGeneral:  "hello@zurlux.com",
  emailSupport:  "support@patchmortem.com",
  emailSecurity: "security@zurlux.com",
  emailSales:    "hello@zurlux.com",

  /* ---- 6. ANALYTICS ----------------------------------------
     Set to true once you have added a tracking script. CTA
     clicks are pushed to window.dataLayer for GTM / GA4.
  ---------------------------------------------------------- */
  trackClicks: true
};


/* ============================================================
   WIRING ENGINE — no need to edit below this line
   ============================================================ */
(function () {
  "use strict";

  var C = window.PM_CONFIG || {};
  var warned = [];

  function warn(key, el) {
    if (warned.indexOf(key) === -1) {
      warned.push(key);
      console.warn(
        "[PatchMortem] PM_CONFIG." + key + " is not set. " +
        "Falling back to contact.html. Set it in assets/pm-config.js before go-live."
      );
    }
    if (el) { el.setAttribute("data-pm-unconfigured", key); }
  }

  /* Resolve a configured URL, or fall back to the contact page. */
  function resolve(key, el) {
    var v = C[key];
    if (typeof v === "string" && v.trim() !== "") { return v.trim(); }
    warn(key, el);
    return "contact.html";
  }

  function isExternal(url) {
    return /^https?:\/\//i.test(url) || /^mailto:/i.test(url);
  }

  /* ---- Apply destinations to every [data-pm] element -------- */
  var MAP = {
    "login":     "appLoginUrl",
    "signup":    "appSignupUrl",
    "trial":     "appSignupUrl",
    "demo":      "demoBookingUrl",
    "aws":       "awsMarketplaceUrl",
    "sales":     null,   /* mailto, handled below */
    "support":   null,
    "security":  null,
    "general":   null
  };

  var MAILTO = {
    "sales":    "emailSales",
    "support":  "emailSupport",
    "security": "emailSecurity",
    "general":  "emailGeneral"
  };

  document.addEventListener("DOMContentLoaded", function () {

    /* 1. Wire every tagged CTA */
    var nodes = document.querySelectorAll("[data-pm]");
    Array.prototype.forEach.call(nodes, function (el) {
      var role = el.getAttribute("data-pm");
      var url;

      if (MAILTO[role]) {
        var addr = C[MAILTO[role]];
        if (!addr) { warn(MAILTO[role], el); url = "contact.html"; }
        else {
          var subj = el.getAttribute("data-pm-subject") || "PatchMortem enquiry";
          url = "mailto:" + addr + "?subject=" + encodeURIComponent(subj);
        }
      } else if (MAP[role]) {
        url = resolve(MAP[role], el);
      } else {
        return;
      }

      el.setAttribute("href", url);
      if (isExternal(url)) {
        el.setAttribute("target", "_blank");
        el.setAttribute("rel", "noopener noreferrer");
      } else {
        el.removeAttribute("target");
        el.removeAttribute("rel");
      }

      /* 2. Optional click tracking */
      if (C.trackClicks) {
        el.addEventListener("click", function () {
          window.dataLayer = window.dataLayer || [];
          window.dataLayer.push({
            event: "cta_click",
            cta_role: role,
            cta_label: (el.textContent || "").trim(),
            cta_destination: url,
            page: location.pathname
          });
        });
      }
    });

    /* 3. Wire the contact form */
    var form = document.getElementById("cform");
    if (!form) { return; }

    var btn  = document.getElementById("cbtn");
    var note = document.getElementById("cnote");

    function setNote(msg, colour) {
      if (!note) { return; }
      note.textContent = msg;
      note.style.color = colour || "#3d4868";
    }

    if (!C.formEndpoint) {
      setNote("Submissions open your mail client — set PM_CONFIG.formEndpoint for direct delivery.", "#3d4868");
    } else {
      setNote("Your details go straight to our team. We reply within one business day.", "#3d4868");
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();

      var hp = document.getElementById("f-website");

      var data = {
        company_website: hp ? hp.value : "",   /* honeypot — must stay empty */
        name:   (document.getElementById("f-name")  || {}).value || "",
        email:  (document.getElementById("f-email") || {}).value || "",
        org:    (document.getElementById("f-org")   || {}).value || "",
        size:   (document.getElementById("f-size")  || {}).value || "",
        message:(document.getElementById("f-msg")   || {}).value || "",
        source: "patchmortem.com" + location.pathname,
        submittedAt: new Date().toISOString()
      };

      if (!data.name.trim() || !data.email.trim()) {
        setNote("Please add your name and work email.", "#f85149");
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
        setNote("That email address does not look right.", "#f85149");
        return;
      }

      /* --- No endpoint configured: mailto fallback --- */
      if (!C.formEndpoint) {
        var body =
          "Name: "         + data.name    + "\n" +
          "Work email: "   + data.email   + "\n" +
          "Organisation: " + data.org     + "\n" +
          "Estate size: "  + data.size    + "\n\n" +
          "What breaks on patch night:\n" + data.message + "\n\n" +
          "— sent from " + data.source;
        window.location.href =
          "mailto:" + (C.formFallbackEmail || "hello@zurlux.com") +
          "?subject=" + encodeURIComponent("PatchMortem enquiry — " + (data.org || data.name)) +
          "&body="    + encodeURIComponent(body);
        setNote("Opening your mail client…", "#11a3a3");
        return;
      }

      /* --- Endpoint configured: real POST --- */
      if (btn) { btn.disabled = true; btn.textContent = "Sending…"; }
      setNote("Sending…", "#11a3a3");

      /* Apps Script cannot answer a CORS preflight. Sending as
         text/plain keeps the request "simple" so none is issued.
         The payload is still JSON; the script parses it. */
      var isAppsScript = /script\.google\.com/i.test(C.formEndpoint);
      var headers = isAppsScript
        ? { "Content-Type": "text/plain;charset=utf-8" }
        : { "Content-Type": "application/json", "Accept": "application/json" };

      fetch(C.formEndpoint, {
        method: C.formMethod || "POST",
        headers: headers,
        body: JSON.stringify(data),
        redirect: "follow"
      })
      .then(function (r) {
        if (!r.ok) { throw new Error("HTTP " + r.status); }
        form.reset();
        if (btn) { btn.textContent = "Sent ✓"; }
        setNote("Thank you — we will be in touch within one business day.", "#4ade80");
        if (C.trackClicks) {
          window.dataLayer = window.dataLayer || [];
          window.dataLayer.push({ event: "form_submit", form: "contact", page: location.pathname });
        }
      })
      .catch(function (err) {
        console.error("[PatchMortem] form submission failed:", err);
        if (btn) { btn.disabled = false; btn.textContent = "Send enquiry"; }
        setNote("Could not send. Please email " + (C.formFallbackEmail || "hello@zurlux.com") + " directly.", "#f85149");
      });
    });
  });
})();
