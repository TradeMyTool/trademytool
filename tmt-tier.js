/* TradeMyTool — Seller Tier System
   Loaded on trade-shop.html after Firebase is already initialized there.
   Relies on the page's existing global `db`, `auth`, `activeListing`, `$()`. */

function tmtTierEmoji(tier) {
  if (tier === "gold") return " \uD83E\uDD47";
  if (tier === "silver") return " \uD83E\uDD48";
  if (tier === "bronze") return " \uD83E\uDD49";
  return "";
}

/* Recompute a seller's tier based on how many of their listings are marked sold.
   Call this after any listing's `sold` field changes. */
function tmtUpdateTier(uid) {
  if (!uid) return;
  db.collection("listings")
    .where("ownerId", "==", uid)
    .where("sold", "==", true)
    .get()
    .then(function (snap) {
      var count = snap.size;
      var tier = count >= 15 ? "gold" : count >= 5 ? "silver" : "bronze";
      db.collection("users").doc(uid).set(
        { itemsSoldCount: count, tier: tier },
        { merge: true }
      ).catch(function () {});
    })
    .catch(function () {});
}

/* Show the seller's tier emoji next to their name in the listing viewer. */
function tmtShowTier(uid) {
  if (!uid) return;
  db.collection("users").doc(uid).get().then(function (doc) {
    var tier = doc.exists ? doc.data().tier : null;
    var el = document.getElementById("viewerOwner");
    if (tier && el && typeof activeListing !== "undefined" && activeListing && activeListing.ownerId === uid) {
      el.textContent = (activeListing.ownerName || "Unknown seller") + tmtTierEmoji(tier);
    }
  }).catch(function () {});
}

/* Keep each user's email on their Firestore profile so the admin membership
   panel can look buyers up by email after a GoDaddy commerce purchase. */
if (typeof auth !== "undefined") {
  auth.onAuthStateChanged(function (user) {
    if (user) {
      db.collection("users").doc(user.uid).set(
        { email: user.email || "" },
        { merge: true }
      ).catch(function () {});
    }
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

