/**
 * TradeMyTool - offer notifications
 * -----------------------------------------------------------------
 * Fires whenever a new document lands in the `offers` collection.
 * Looks up the listing to find the seller's email, then emails them
 * the offer details so they don't have to keep checking the site.
 *
 * Runs on Firebase servers - the sending credentials are stored as
 * Firebase secrets and are never exposed in the website's page code.
 */

const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { defineSecret } = require("firebase-functions/params");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");

admin.initializeApp();

// Set once with:  firebase functions:secrets:set GMAIL_USER
const GMAIL_USER = defineSecret("GMAIL_USER");
const GMAIL_PASS = defineSecret("GMAIL_PASS");

const SITE = "https://trademytool.ca/trade-shop";

function esc(t) {
  return String(t == null ? "" : t)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

exports.notifyOfferReceived = onDocumentCreated(
  {
    document: "offers/{offerId}",
    // Must match the Firestore database location (Toronto).
    region: "northamerica-northeast2",
    secrets: [GMAIL_USER, GMAIL_PASS],
  },
  async (event) => {
    const snap = event.data;
    if (!snap) return;
    const offer = snap.data() || {};

    // Find the seller's email from the listing this offer belongs to.
    let sellerEmail = "";
    let listingTitle = offer.listingTitle || "your listing";

    try {
      if (offer.listingId) {
        const listing = await admin
          .firestore().collection("listings").doc(offer.listingId).get();
        if (listing.exists) {
          const d = listing.data() || {};
          sellerEmail = d.ownerEmail || "";
          listingTitle = d.title || listingTitle;
        }
      }
    } catch (e) {
      logger.error("Could not read listing", e);
    }

    if (!sellerEmail) {
      logger.warn("No seller email found for offer", event.params.offerId);
      return;
    }

    const amount =
      offer.amount != null ? "$" + Number(offer.amount).toFixed(2) : "(no amount)";
    const contact = offer.buyerContact || "(none given)";
    const message = offer.message ? String(offer.message) : "";

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: GMAIL_USER.value(), pass: GMAIL_PASS.value() },
    });

    const html = `
      <div style="font-family:Arial,Helvetica,sans-serif;max-width:520px;margin:0 auto;
                  border:2px solid #1a73e8;border-radius:14px;overflow:hidden">
        <div style="background:#111;color:#F7CA4F;padding:18px 20px;font-size:20px;font-weight:900">
          TradeMyTool - You have an offer
        </div>
        <div style="padding:20px;color:#111;font-size:15px;line-height:1.6">
          <p style="margin:0 0 14px">Someone has made an offer on
             <strong>${esc(listingTitle)}</strong>.</p>
          <table style="width:100%;border-collapse:collapse;font-size:15px">
            <tr><td style="padding:6px 0;color:#666">Offer</td>
                <td style="padding:6px 0;font-weight:900">${esc(amount)}</td></tr>
            <tr><td style="padding:6px 0;color:#666">Contact</td>
                <td style="padding:6px 0;font-weight:700">${esc(contact)}</td></tr>
            ${message ? `<tr><td style="padding:6px 0;color:#666">Message</td>
                <td style="padding:6px 0">${esc(message)}</td></tr>` : ""}
          </table>
          <p style="margin:18px 0 0;font-size:14px;color:#444">
            Reply directly to the buyer using the contact above, or open your
            listing on TradeMyTool to see all offers.</p>
          <p style="margin:18px 0 0">
            <a href="${SITE}"
               style="background:#F7CA4F;color:#111;border:2px solid #111;border-radius:999px;
                      padding:10px 24px;text-decoration:none;font-weight:900;display:inline-block">
              Open TradeMyTool</a>
          </p>
        </div>
        <div style="background:#f5f5f5;color:#777;font-size:12px;padding:12px 20px">
          You are receiving this because you have a listing on TradeMyTool.
        </div>
      </div>`;

    const text =
      `You have an offer on "${listingTitle}".\n\n` +
      `Offer: ${amount}\nContact: ${contact}\n` +
      (message ? `Message: ${message}\n` : "") +
      `\nReply directly to the buyer, or open ${SITE}`;

    try {
      await transporter.sendMail({
        from: `"TradeMyTool" <${GMAIL_USER.value()}>`,
        to: sellerEmail,
        replyTo: contact.indexOf("@") !== -1 ? contact : undefined,
        subject: `New offer on "${listingTitle}" - ${amount}`,
        text,
        html,
      });
      logger.info("Offer email sent", { offerId: event.params.offerId });
    } catch (e) {
      logger.error("Could not send offer email", e);
    }
  }
);
