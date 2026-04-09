import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";

const STATUS_STYLES = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  "in production": "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

export default function Orders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user) fetchOrders();
  }, [user]);

  async function fetchOrders() {
    try {
      const q = query(
        collection(db, "orders"),
        where("customerId", "==", user.uid)
      );
      const snapshot = await getDocs(q);
      const items = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
        createdAt: d.data().createdAt?.toDate(),
      }));
      items.sort((a, b) => {
        if (!a.createdAt) return 1;
        if (!b.createdAt) return -1;
        return b.createdAt - a.createdAt;
      });
      setOrders(items);
    } catch (err) {
      setError("Failed to load orders. Please refresh the page.");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--cream)" }}>
        <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: "var(--border)", borderTopColor: "var(--wood)" }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--cream)" }}>
      <div className="max-w-4xl mx-auto px-6 py-10">

        <div className="mb-8">
          <p className="text-xs tracking-widest uppercase mb-2" style={{ color: "var(--wood)" }}>
            Your account
          </p>
          <h1 className="font-display text-3xl" style={{ color: "var(--charcoal)" }}>
            My Orders
          </h1>
          <p className="text-sm mt-2" style={{ color: "var(--warm-gray)" }}>
            Track your orders and payment status here
          </p>
        </div>

        {error && (
          <div className="text-sm rounded-lg px-4 py-3 mb-6" style={{ background: "#FCEBEB", color: "#A32D2D", border: "0.5px solid #F7C1C1" }}>
            {error}
          </div>
        )}

        {orders.length === 0 && !error && (
          <div className="bg-white rounded-2xl px-6 py-16 text-center" style={{ border: "0.5px solid var(--border)" }}>
            <p className="font-display text-2xl mb-3" style={{ color: "var(--charcoal)" }}>
              No orders yet
            </p>
            <p className="text-sm mb-6" style={{ color: "var(--warm-gray)" }}>
              Browse our collection and place your first order
            </p>
            <Link to="/" className="text-sm px-6 py-2 rounded-full transition hover:opacity-80" style={{ background: "var(--charcoal)", color: "var(--cream)" }}>
              Browse collection
            </Link>
          </div>
        )}

        <div className="flex flex-col gap-4">
          {orders.map((order) => (
            <div key={order.id} className="bg-white rounded-2xl overflow-hidden" style={{ border: "0.5px solid var(--border)" }}>

              <div className="flex items-center gap-4 p-5 border-b" style={{ borderColor: "var(--border)" }}>
                <img
                  src={order.productImage}
                  alt={order.productName}
                  className="w-16 h-16 object-cover rounded-xl flex-shrink-0"
                  style={{ border: "0.5px solid var(--border)" }}
                  onError={(e) => { e.target.src = "https://placehold.co/64x64?text=?"; }}
                />
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium truncate" style={{ color: "var(--charcoal)" }}>
                    {order.productName}
                  </h3>
                  <p className="text-xs mt-0.5" style={{ color: "var(--warm-gray)" }}>
                    {order.createdAt
                      ? order.createdAt.toLocaleDateString("en-KE", { day: "numeric", month: "long", year: "numeric" })
                      : "Date unavailable"}
                  </p>
                  {order.paymentMethodLabel && (
                    <span className="text-xs px-2 py-0.5 rounded-full mt-1 inline-block" style={{ background: "var(--wood-light)", color: "var(--wood)" }}>
                      {order.paymentMethodLabel}
                    </span>
                  )}
                </div>
                <span className={`text-xs font-medium px-3 py-1 rounded-full flex-shrink-0 ${STATUS_STYLES[order.status] || "bg-gray-100 text-gray-600"}`}>
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5">

                <div>
                  <p className="text-xs mb-1" style={{ color: "var(--warm-gray)" }}>Amount</p>
                  <p className="text-sm font-semibold" style={{ color: "var(--charcoal)" }}>
                    KES {parseFloat(order.price).toLocaleString("en-KE")}
                  </p>
                </div>

                <div>
                  <p className="text-xs mb-1" style={{ color: "var(--warm-gray)" }}>Order ID</p>
                  <p className="text-xs font-mono truncate" style={{ color: "var(--charcoal)" }}>
                    {order.id}
                  </p>
                </div>

                <div>
                  <p className="text-xs mb-1" style={{ color: "var(--warm-gray)" }}>
                    {order.paymentMethod === "mpesa" ? "M-Pesa code" : order.paymentMethod === "bank_transfer" ? "Bank reference" : "Payment"}
                  </p>
                  {order.paymentMethod === "mpesa" || order.paymentMethod === "bank_transfer" ? (
                    <p className="text-sm font-mono" style={{ color: "var(--charcoal)" }}>
                      {order.mpesaCode
                        ? order.mpesaCode
                        : <span className="font-sans text-xs" style={{ color: "var(--warm-gray)" }}>Awaiting payment</span>}
                    </p>
                  ) : (
                    <p className="text-xs" style={{ color: "var(--warm-gray)" }}>
                      {order.paymentMethodLabel || "—"}
                    </p>
                  )}
                </div>

                <div>
                  <p className="text-xs mb-1" style={{ color: "var(--warm-gray)" }}>Product image</p>
                  {order.productImage
                    ? <a href={order.productImage} target="_blank" rel="noreferrer" className="text-xs hover:underline" style={{ color: "var(--wood)" }}>View image →</a>
                    : <span className="text-xs" style={{ color: "var(--warm-gray)" }}>No image</span>}
                </div>

              </div>
            

              {order.status === "pending" && (
                <div className="mx-5 mb-5 rounded-xl px-4 py-3 text-xs" style={{ background: "#FAEEDA", color: "#633806", border: "0.5px solid #FAC775" }}>
                  {order.paymentMethod === "mpesa"
                    ? "We received your order. Please wait for our M-Pesa number via WhatsApp, then send payment."
                    : order.paymentMethod === "bank_transfer"
                    ? "We received your order. Please wait for our bank details via WhatsApp, then transfer payment."
                    : "We received your order and are confirming the details with you."}
                </div>
              )}

              {order.status === "confirmed" && (
                <div className="mx-5 mb-5 rounded-xl px-4 py-3 text-xs" style={{ background: "#E6F1FB", color: "#0C447C", border: "0.5px solid #B5D4F4" }}>
                  {order.paymentMethod === "mpesa" || order.paymentMethod === "bank_transfer"
                    ? "Payment confirmed. Your order is now being processed."
                    : "Order confirmed. We will be in touch to arrange delivery or collection."}
                </div>
              )}

              {order.status === "in production" && (
                <div className="mx-5 mb-5 rounded-xl px-4 py-3 text-xs" style={{ background: "#EEEDFE", color: "#3C3489", border: "0.5px solid #CECBF6" }}>
                  Your furniture is currently being crafted. We will contact you when it is ready.
                </div>
              )}

              {order.status === "delivered" && (
                <div className="mx-5 mb-5 rounded-xl px-4 py-3 text-xs" style={{ background: "#EAF3DE", color: "#27500A", border: "0.5px solid #C0DD97" }}>
                  Order delivered. Thank you for choosing BROTSIT INTERIORS !
                </div>
              )}

              {order.status === "cancelled" && (
                <div className="mx-5 mb-5 rounded-xl px-4 py-3 text-xs" style={{ background: "#FCEBEB", color: "#A32D2D", border: "0.5px solid #F7C1C1" }}>
                  This order was cancelled. Please contact us on WhatsApp if you have any questions.
                </div>
              )}

            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
