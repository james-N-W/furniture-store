// ProductDetail.jsx
// Shows a single product with full details.
// Handles the purchase flow with payment method selection.
//
// Payment methods:
// - M-Pesa → status "pending", WhatsApp asks for payment details
// - Cash on delivery → status "confirmed" automatically
// - Cash on collection → status "confirmed" automatically
// - Bank transfer → status "pending", WhatsApp asks for bank details
//
// Flow:
// 1. Customer selects payment method
// 2. Order saved to Firestore
// 3. WhatsApp opens with pre-filled message
// 4. Customer redirected to /orders

import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { doc, getDoc, addDoc, collection } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";

// Payment method definitions
// autoConfirm: true means order is confirmed instantly without payment proof
const PAYMENT_METHODS = [
  {
    id: "mpesa",
    label: "M-Pesa",
    desc: "Pay via M-Pesa. We'll send you our number on WhatsApp.",
    autoConfirm: false,
  },
  {
    id: "cash_delivery",
    label: "Cash on delivery",
    desc: "Pay cash when your furniture is delivered to you.",
    autoConfirm: true,
  },
  {
    id: "cash_collection",
    label: "Cash on collection",
    desc: "Collect and pay cash at our workshop.",
    autoConfirm: true,
  },
  {
    id: "bank_transfer",
    label: "Bank transfer",
    desc: "Pay via bank transfer. We'll send account details on WhatsApp.",
    autoConfirm: false,
  },
];

export default function ProductDetail() {
  // useParams reads the :id variable from the URL
  // e.g. /product/abc123 → id = "abc123"
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [ordering, setOrdering] = useState(false);
  const [error, setError] = useState("");

  // selectedPayment — which payment method the customer picked
  const [selectedPayment, setSelectedPayment] = useState("mpesa");

  // showPaymentSelector — toggles the payment method dropdown panel
  const [showPaymentSelector, setShowPaymentSelector] = useState(false);

  useEffect(() => {
    fetchProduct();
  }, [id]); // re-runs if the URL id changes

  async function fetchProduct() {
    try {
      // doc(db, "products", id) — reference to one specific Firestore document
      const docRef = doc(db, "products", id);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        setError("Product not found.");
      } else {
        // Combine the document ID with its field data
        setProduct({ id: docSnap.id, ...docSnap.data() });
      }
    } catch (err) {
      setError("Failed to load product. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleBuyWhatsApp() {
    // Redirect to login if not logged in
    if (!user) { navigate("/login"); return; }
    setOrdering(true);

    try {
      // Find the full payment method object from our array
      const paymentMethod = PAYMENT_METHODS.find((m) => m.id === selectedPayment);

      // Cash orders are confirmed instantly — no payment proof needed
      // M-Pesa and bank transfer stay pending until you verify payment
      const initialStatus = paymentMethod.autoConfirm ? "confirmed" : "pending";

      // Save the order to Firestore BEFORE opening WhatsApp
      // This ensures every order is recorded even if WhatsApp isn't sent
      const orderRef = await addDoc(collection(db, "orders"), {
        // Product snapshot — stored so order stays accurate if product is edited
        productId: product.id,
        productName: product.name,
        productImage: product.image,
        price: product.price,
        category: product.category,

        // Customer details
        customerId: user.uid,
        customerEmail: user.email,

        // Payment details
        paymentMethod: selectedPayment,         // id e.g. "mpesa"
        paymentMethodLabel: paymentMethod.label, // display name e.g. "M-Pesa"

        // Status — cash orders start confirmed, others start pending
        status: initialStatus,

        // Payment proof fields — filled in by admin after payment
        mpesaCode: "",
        mpesaNumber: "",

        // Timestamps
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Build pre-filled WhatsApp message
      // encodeURIComponent converts spaces/special chars to URL-safe format
      const message = encodeURIComponent(
        `Hello! I'd like to place an order.\n\n` +
        `*Product:* ${product.name}\n` +
        `*Category:* ${product.category}\n` +
        `*Price:* KES ${parseFloat(product.price).toLocaleString("en-KE", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}\n` +
        `*Payment method:* ${paymentMethod.label}\n` +
        `*Order ID:* ${orderRef.id}\n` +
        `*Email:* ${user.email}\n\n` +
        // Closing line changes based on payment method
        (selectedPayment === "mpesa"
          ? "Please send me your M-Pesa payment details."
          : selectedPayment === "bank_transfer"
          ? "Please send me your bank account details."
          : "Please confirm my order and arrange delivery.")
      );

      // Open WhatsApp with the message
      // Replace YOUR_WHATSAPP_NUMBER with your real number e.g. 254712345678
      window.open(`https://wa.me/254721937751?text=${message}`, "_blank");

      // Redirect to orders page so customer sees their new order
      navigate("/orders");

    } catch (err) {
      setError("Failed to place order. Please try again.");
    } finally {
      setOrdering(false);
    }
  }

  function handleCustomOrder() {
    if (!user) { navigate("/login"); return; }
    // Pass product name to custom order form so it's pre-filled
    navigate("/custom-order", { state: { productName: product.name } });
  }

  // ── Loading state ──
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{ background: "var(--cream)" }}>
        <div className="w-8 h-8 rounded-full border-2 animate-spin"
          style={{ borderColor: "var(--border)", borderTopColor: "var(--wood)" }} />
      </div>
    );
  }

  // ── Error state ──
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4"
        style={{ background: "var(--cream)" }}>
        <div className="text-center">
          <p className="mb-4" style={{ color: "var(--warm-gray)" }}>{error}</p>
          <Link to="/" className="text-sm underline" style={{ color: "var(--wood)" }}>
            ← Back to collection
          </Link>
        </div>
      </div>
    );
  }

  // Get the currently selected payment method object for display
  const currentPayment = PAYMENT_METHODS.find((m) => m.id === selectedPayment);

  return (
    <div style={{ background: "var(--cream)" }} className="min-h-screen">
      <div className="max-w-5xl mx-auto px-6 py-10">

        {/* Back link */}
        <Link to="/"
          className="text-sm tracking-wide inline-block mb-8 hover:opacity-60 transition"
          style={{ color: "var(--warm-gray)" }}>
          ← Back to collection
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 bg-white rounded-2xl overflow-hidden"
          style={{ border: "0.5px solid var(--border)" }}>

          {/* ── Product image ── */}
          <div className="aspect-square" style={{ background: "var(--wood-light)" }}>
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover"
              onError={(e) =>
                e.target.src = "https://placehold.co/600x600?text=THE+GRAIN"
              }
            />
          </div>

          {/* ── Product info ── */}
          <div className="p-8 flex flex-col justify-between">
            <div>
              {/* Category + material row */}
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs tracking-widest uppercase"
                  style={{ color: "var(--wood)" }}>
                  {product.category}
                </span>
                {product.material && (
                  <>
                    <span style={{ color: "var(--border)" }}>·</span>
                    <span className="text-xs" style={{ color: "var(--warm-gray)" }}>
                      {product.material}
                    </span>
                  </>
                )}
              </div>

              {/* Product name */}
              <h1 className="font-display text-3xl mb-4 leading-tight"
                style={{ color: "var(--charcoal)" }}>
                {product.name}
              </h1>

              {/* Price */}
              <p className="text-2xl font-medium mb-6"
                style={{ color: "var(--charcoal)" }}>
                KES {parseFloat(product.price).toLocaleString("en-KE")}
              </p>

              {/* Description */}
              {product.description && (
                <p className="text-sm leading-relaxed mb-8"
                  style={{ color: "var(--warm-gray)", fontWeight: 300 }}>
                  {product.description}
                </p>
              )}
            </div>

            {/* ── Action section ── */}
            <div className="flex flex-col gap-3">

              {user ? (
                <>
                  {/* Payment method selector toggle button */}
                  <button
                    onClick={() => setShowPaymentSelector(!showPaymentSelector)}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-xl border text-sm transition"
                    style={{
                      borderColor: "var(--border)",
                      color: "var(--charcoal)",
                      background: "transparent",
                    }}
                  >
                    <span>
                      Payment: <strong>{currentPayment.label}</strong>
                    </span>
                    {/* Arrow rotates when panel is open */}
                    <span style={{
                      display: "inline-block",
                      transform: showPaymentSelector ? "rotate(180deg)" : "rotate(0deg)",
                      transition: "transform 0.2s",
                    }}>
                      ↓
                    </span>
                  </button>

                  {/* Payment method options panel */}
                  {showPaymentSelector && (
                    <div className="rounded-xl overflow-hidden"
                      style={{ border: "0.5px solid var(--border)" }}>
                      {PAYMENT_METHODS.map((method, i) => (
                        <button
                          key={method.id}
                          onClick={() => {
                            setSelectedPayment(method.id);
                            setShowPaymentSelector(false);
                          }}
                          className="w-full flex items-start gap-3 px-4 py-3 text-left transition"
                          style={{
                            background: selectedPayment === method.id
                              ? "var(--wood-light)"
                              : "white",
                            borderBottom: i < PAYMENT_METHODS.length - 1
                              ? "0.5px solid var(--border)"
                              : "none",
                          }}
                        >
                          {/* Custom radio button indicator */}
                          <div className="w-4 h-4 rounded-full border flex-shrink-0 mt-0.5 flex items-center justify-center"
                            style={{
                              borderColor: selectedPayment === method.id
                                ? "var(--wood)" : "var(--border)",
                              background: selectedPayment === method.id
                                ? "var(--wood)" : "transparent",
                            }}>
                            {selectedPayment === method.id && (
                              <div className="w-1.5 h-1.5 rounded-full bg-white" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium"
                              style={{ color: "var(--charcoal)" }}>
                              {method.label}
                            </p>
                            <p className="text-xs mt-0.5"
                              style={{ color: "var(--warm-gray)" }}>
                              {method.desc}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Auto-confirm notice for cash orders */}
                  {currentPayment.autoConfirm && (
                    <div className="px-4 py-3 rounded-xl text-xs"
                      style={{ background: "var(--wood-light)", color: "var(--wood)" }}>
                      Your order will be confirmed automatically — no payment needed upfront.
                    </div>
                  )}

                  {/* Main buy button */}
                  <button
                    onClick={handleBuyWhatsApp}
                    disabled={ordering}
                    className="w-full py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition disabled:opacity-50"
                    style={{ background: "#25D366", color: "white" }}
                  >
                    {/* WhatsApp SVG icon */}
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.124.558 4.122 1.532 5.855L.057 23.882l6.162-1.615A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.007-1.374l-.36-.214-3.716.973.99-3.62-.235-.372A9.818 9.818 0 1112 21.818z"/>
                    </svg>
                    {ordering
                      ? "Placing order..."
                      : `Order via 254721937751254721937751 · ${currentPayment.label}`}
                  </button>

                  {/* Custom design button */}
                  <button
                    onClick={handleCustomOrder}
                    className="w-full py-3 rounded-xl text-sm font-medium transition hover:opacity-80"
                    style={{ background: "var(--charcoal)", color: "var(--cream)" }}
                  >
                    Request custom design
                  </button>
                </>
              ) : (
                <>
                  {/* Guest prompt */}
                  <div className="px-4 py-4 rounded-xl text-sm text-center"
                    style={{ background: "var(--wood-light)", color: "var(--charcoal)" }}>
                    Sign in to purchase or request a custom design
                  </div>
                  <div className="flex gap-3">
                    <Link to="/login"
                      className="flex-1 py-3 rounded-xl text-sm font-medium text-center border transition hover:opacity-70"
                      style={{ borderColor: "var(--charcoal)", color: "var(--charcoal)" }}>
                      Sign in
                    </Link>
                    <Link to="/register"
                      className="flex-1 py-3 rounded-xl text-sm font-medium text-center transition hover:opacity-80"
                      style={{ background: "var(--charcoal)", color: "var(--cream)" }}>
                      Register
                    </Link>
                  </div>
                </>
              )}

              {/* Error message */}
              {error && (
                <p className="text-xs text-center" style={{ color: "#A32D2D" }}>
                  {error}
                </p>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}