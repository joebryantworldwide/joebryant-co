"use client";

// Square's Web Payments SDK rendered inline. The card fields live in
// Square-hosted iframes (PCI-safe), but the experience stays entirely on
// our page — tokenize on submit, charge server-side, done. Apple Pay and
// Google Pay are layered on as progressive enhancement: they appear only
// on devices that support them and never interfere with the card form.

import { useEffect, useRef, useState } from "react";
import { fmtMoney } from "../../lib/access/format";
import { invoiceTotal } from "../../lib/access/status";

const APP_ID = process.env.NEXT_PUBLIC_SQUARE_APP_ID;
const LOCATION_ID = process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID;
const SANDBOX = (APP_ID || "").startsWith("sandbox-");
const SDK_URL = SANDBOX
  ? "https://sandbox.web.squarecdn.com/v1/square.js"
  : "https://web.squarecdn.com/v1/square.js";

function loadSquare() {
  return new Promise((resolve, reject) => {
    if (window.Square) return resolve(window.Square);
    let s = document.querySelector("script[data-square-sdk]");
    if (s) {
      s.addEventListener("load", () => resolve(window.Square));
      s.addEventListener("error", () => reject(new Error("Couldn't load Square.")));
      return;
    }
    s = document.createElement("script");
    s.src = SDK_URL;
    s.async = true;
    s.dataset.squareSdk = "1";
    s.onload = () => resolve(window.Square);
    s.onerror = () => reject(new Error("Couldn't load Square."));
    document.head.appendChild(s);
  });
}

export default function SquarePayForm({ projectId, invoice, onPaid }) {
  const mountRef = useRef(null);
  const applePayRef = useRef(null);
  const googlePayRef = useRef(null);
  const cardRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const amount = invoiceTotal(invoice);

  // Shared: tokenize a payment method and charge it server-side.
  async function charge(paymentMethod) {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const result = await paymentMethod.tokenize();
      if (result.status !== "OK") {
        throw new Error(result.errors?.[0]?.message || "Please check your details.");
      }
      const res = await fetch("/api/access/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, invoiceId: invoice.id, sourceId: result.token }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error(data.error || "Payment didn't go through.");
      setDone(true);
      setTimeout(() => onPaid?.(), 2200);
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  }

  useEffect(() => {
    let alive = true;
    const cleanup = [];
    if (!APP_ID || !LOCATION_ID) {
      setError("Card payments aren't switched on yet.");
      return;
    }

    loadSquare()
      .then(async (Square) => {
        const payments = Square.payments(APP_ID, LOCATION_ID);

        // Card — always available.
        const card = await payments.card();
        await card.attach(mountRef.current);
        if (!alive) return card.destroy?.();
        cardRef.current = card;
        cleanup.push(() => card.destroy?.());
        setReady(true);

        // Digital wallets — best effort, only where supported.
        const paymentRequest = payments.paymentRequest({
          countryCode: "US",
          currencyCode: "USD",
          total: { amount: amount.toFixed(2), label: "Total" },
        });

        try {
          const applePay = await payments.applePay(paymentRequest);
          if (alive && applePayRef.current) {
            applePayRef.current.style.display = "block";
            applePayRef.current.onclick = () => charge(applePay);
          }
        } catch {
          /* Apple Pay unavailable on this device — fine. */
        }

        try {
          const googlePay = await payments.googlePay(paymentRequest);
          if (alive && googlePayRef.current) {
            await googlePay.attach(googlePayRef.current);
            googlePayRef.current.onclick = () => charge(googlePay);
            cleanup.push(() => googlePay.destroy?.());
          }
        } catch {
          /* Google Pay unavailable on this device — fine. */
        }
      })
      .catch((e) => setError(e.message));

    return () => {
      alive = false;
      cleanup.forEach((fn) => fn());
    };
  }, []);

  if (done) {
    return (
      <div className="acc-sqpay-done">
        <span className="acc-paid-stamp">PAID</span>
        <p className="serif">Payment received — thank you.</p>
        <p className="acc-sub">{fmtMoney(amount)} · a receipt is on its way from Square.</p>
      </div>
    );
  }

  return (
    <div className="acc-sqpay">
      <div className="acc-sqpay-wallets">
        <button ref={applePayRef} className="acc-applepay" style={{ display: "none" }} aria-label="Pay with Apple Pay" />
        <div ref={googlePayRef} className="acc-googlepay" />
      </div>

      <div ref={mountRef} className="acc-sqpay-card" />
      {SANDBOX && (
        <p className="acc-sub">Test mode — card 4111 1111 1111 1111, any future date, any CVV.</p>
      )}
      {error && <p className="acc-error">{error}</p>}
      <button className="acc-btn primary" onClick={() => charge(cardRef.current)} disabled={!ready || busy}>
        {busy ? "Processing…" : `Pay ${fmtMoney(amount)} now`}
      </button>
    </div>
  );
}
