/* TradeMyTool — Seller Tier System
   Loaded on trade-shop.html after Firebase is already initialized there.
   Relies on the page's existing global `db`, `auth`, `activeListing`, `$()`.

   Tier thresholds (items marked sold):
     Gold   20+
     Silver 10-19
     Bronze  5-9
     Under 5 sales: no badge yet.

   NOTE: this file deliberately does NOT write the user's email address
   into the `users` collection. That collection is publicly readable so
   tier badges can show on listings, so nothing personal goes in it —
   only the sold count and the tier name. */

var TMT_TIERS = { gold: 20, silver: 10, bronze: 5 };

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
        if (window.console) console.warn("TMT: could not save tier —", e && e.code);
      });
    })
    .catch(function (e) {
      if (window.console) console.warn("TMT: could not count sales —", e && e.code);
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

/* Make sure a signed-in seller's own tier is up to date, so existing
   sellers get a badge without having to mark something sold again. */
if (typeof auth !== "undefined") {
  auth.onAuthStateChanged(function (user) {
    if (user) tmtUpdateTier(user.uid);
  });
}

/* "X Listings Available" button in the hero — updates itself whenever the
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
