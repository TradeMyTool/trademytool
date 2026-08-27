/* TradeMyTool - Seller Tier System
   Loaded on trade-shop.html after Firebase is already initialized there.
   Relies on the page's existing global `db`, `auth`, `activeListing`, `$()`.

   Tier thresholds (items marked sold):
     Gold   20+
     Silver 10-19
     Bronze  5-9
     Under 5 sales: no badge yet.

   This file also RENDERS the tier badge display into the Trade Shop
   banners, so the page's pasted HTML stays under GoDaddy's size limit.
   Its styling lives in tmt-trade-shop.css (.tmt-tiers and friends).

   NOTE: this file deliberately does NOT write the user's email address
   into the `users` collection. That collection is publicly readable so
   tier badges can show on listings, so nothing personal goes in it -
   only the sold count and the tier name. */

var TMT_TIERS = { gold: 20, silver: 10, bronze: 5 };

var TMT_TIER_ART =
  "https://img1.wsimg.com/isteam/ip/d7402eda-1dbc-4b95-a403-7e96b535863f/" +
  "blob-3ec7e32.png/:/cr=t:0%25,l:0%25,w:100%25,h:100%25/rs=w:902,h:902";

function tmtTierFor(count) {
  if (count >= TMT_TIERS.gold) return "gold";
  if (count >= TMT_TIERS.silver) return "silver";
  if (count >= TMT_TIERS.bronze) return "bronze";
  return null;
}

function tmtTierEmoji(tier) {
  if (tier === "gold") return " \uD83E\uDD47";
  if (tier === "silver") return " \uD83E\uDD48";
  if (tier === "bronze") return " \uD83E\uDD49";
  return "";
}

/* Recompute a seller's tier based on how many of their listings are marked
   sold. Call this after any listing's `sold` field changes. */
function tmtUpdateTier(uid) {
  if (!uid) return;
  db.collection("listings")
    .where("ownerId", "==", uid)
    .where("sold", "==", true)
    .get()
    .then(function (snap) {
      var count = snap.size;
      db.collection("users").doc(uid).set(
        { itemsSoldCount: count, tier: tmtTierFor(count) },
        { merge: true }
      ).catch(function (e) {
        if (window.console) console.warn("TMT: could not save tier -", e && e.code);
      });
    })
    .catch(function (e) {
      if (window.console) console.warn("TMT: could not count sales -", e && e.code);
    });
}

/* Show the seller's tier emoji next to their name in the listing viewer. */
function tmtShowTier(uid) {
  if (!uid) return;
  db.collection("users").doc(uid).get().then(function (doc) {
    var tier = doc.exists ? doc.data().tier : null;
    var el = document.getElementById("viewerOwner");
    if (tier && el && typeof activeListing !== "undefined" && activeListing && activeListing.ownerId === uid) {
      var shown = (typeof tmtMask === "function")
        ? tmtMask(activeListing.ownerName)
        : (activeListing.ownerName || "Unknown seller");
      el.textContent = shown + tmtTierEmoji(tier);
    }
  }).catch(function () {});
}

/* Build the Gold / Silver / Bronze badge row inside each banner, replacing
   the simple text pills. Runs on both the desktop and mobile banners. */
(function () {
  var ROWS = [
    { key: "gold",   pos: 1, name: "Gold",   req: TMT_TIERS.gold + "+ sold" },
    { key: "silver", pos: 2, name: "Silver", req: TMT_TIERS.silver + "+ sold" },
    { key: "bronze", pos: 3, name: "Bronze", req: TMT_TIERS.bronze + "+ sold" }
  ];

  function markup() {
    var html = '<div class="tmt-tiers">';
    ROWS.forEach(function (t) {
      html +=
        '<div class="tmt-tier tmt-tier-' + t.key + '">' +
          '<span class="tmt-tier-pos">' + t.pos + '</span>' +
          '<img src="' + TMT_TIER_ART + '" alt="' + t.name + ' tier">' +
          '<span class="tmt-tier-name">' + t.name + '</span>' +
          '<span class="tmt-tier-req">' + t.req + '</span>' +
        '</div>';
    });
    return html + '</div>';
  }

  function render() {
    // Whole banner block - the page just supplies an empty container,
    // which keeps the Trade Shop page under GoDaddy's size limit.
    var banners = document.querySelectorAll(".tmt-tier-banner");
    for (var b = 0; b < banners.length; b++) {
      if (banners[b].getAttribute("data-tmt-tiers")) continue;
      banners[b].setAttribute("data-tmt-tiers", "1");
      banners[b].innerHTML =
        "<h2>\uD83C\uDF89 Totally Free - Unlimited Listings</h2>" +
        "<p>Earn your seller tier as you sell - your badge shows next to " +
        "your name on every listing.</p>" +
        '<div class="ts-ship-pills">' + markup() + "</div>";
    }
    // Any standalone pill container elsewhere on the page.
    var pills = document.querySelectorAll(".ts-ship-pills");
    for (var i = 0; i < pills.length; i++) {
      if (pills[i].getAttribute("data-tmt-tiers")) continue;
      pills[i].setAttribute("data-tmt-tiers", "1");
      pills[i].innerHTML = markup();
    }
  }

  if (document.readyState !== "loading") render();
  else document.addEventListener("DOMContentLoaded", render);
  setTimeout(render, 900);
  setTimeout(render, 2200);
})();

/* Make sure a signed-in seller's own tier is up to date, so existing
   sellers get a badge without having to mark something sold again. */
if (typeof auth !== "undefined") {
  auth.onAuthStateChanged(function (user) {
    if (user) tmtUpdateTier(user.uid);
  });
}

/* When a field inside the listing panel is tapped on mobile, the keyboard
   opens and shifts the view - the panel can end up above the visible area.
   Wait for the keyboard, then bring the focused field back into view. */
(function () {
  document.addEventListener("focusin", function (e) {
    var el = e.target;
    if (!el || !el.closest) return;
    if (!el.closest(".viewer")) return;
    var tag = (el.tagName || "").toLowerCase();
    if (tag !== "input" && tag !== "textarea" && tag !== "select") return;
    setTimeout(function () {
      try { el.scrollIntoView({ block: "center", behavior: "smooth" }); }
      catch (x) { try { el.scrollIntoView(); } catch (y) {} }
    }, 350);
  });
})();

/* Buy Now opens the listing straight into the payment panel: the offer form
   and the contact buttons are hidden so it reads as a purchase, not the same
   everything-panel that View and Good Offer open.
   Defined here rather than in the page, which is at its size limit. */
(function () {
  var viewer = null;

  function clearPayMode() {
    if (!viewer) viewer = document.getElementById("viewer");
    if (viewer) viewer.classList.remove("tmt-pay-mode");
  }

  // Any normal open (View / Good Offer) shows the full panel.
  var origShow = window.showViewer;
  if (typeof origShow === "function") {
    window.showViewer = function (item) {
      clearPayMode();
      return origShow.apply(this, arguments);
    };
  }

  window.buyNow = function (item) {
    if (typeof window.showViewer === "function") window.showViewer(item);
    setTimeout(function () {
      if (!viewer) viewer = document.getElementById("viewer");
      if (!viewer) return;
      viewer.classList.add("tmt-pay-mode");
      var pay = document.getElementById("paySection");
      var panel = viewer.querySelector(".viewer-panel");
      if (pay && panel) {
        try { panel.scrollTop = Math.max(0, pay.offsetTop - panel.offsetTop - 8); }
        catch (e) {}
      }
    }, 60);
  };

  // Closing the panel resets it for next time.
  document.addEventListener("click", function (e) {
    var t = e.target;
    if (!t) return;
    if (t.id === "closeViewer" || t.id === "viewer") clearPayMode();
  }, true);
})();

/* "X Listings Available" button in the hero - updates itself whenever the
   listings list re-renders, and jumps straight down to it on click (handy
   on mobile, where the Post Listing form sits above the listings). */
(function () {
  var btn = document.getElementById("listingCountBtn");
  var listWrap = document.getElementById("listWrap");
  if (!btn || !listWrap) return;
  function updateCount() {
    if (typeof allListings === "undefined") return;
    var available = allListings.filter(function (x) { return !x.sold; }).length;
    btn.textContent = "\uD83D\uDD27 " + available + " Listings Available \u2193";
  }
  new MutationObserver(updateCount).observe(listWrap, { childList: true });
  updateCount();
  btn.addEventListener("click", function () {
    listWrap.scrollIntoView({ behavior: "smooth", block: "start" });
  });
})();
