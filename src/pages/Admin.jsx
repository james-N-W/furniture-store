// Admin.jsx — clean restore
// All Firestore reads confirmed working.
// Products: add, edit, delete
// Orders: view all, update status, add M-Pesa code

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  getDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";

// Status options for orders
const ORDER_STATUSES = ["pending", "confirmed", "in production", "delivered", "cancelled"];

// Colour classes for each status badge
const STATUS_STYLES = {
  pending:           "bg-yellow-100 text-yellow-800",
  confirmed:         "bg-blue-100 text-blue-800",
  "in production":   "bg-purple-100 text-purple-800",
  delivered:         "bg-green-100 text-green-800",
  cancelled:         "bg-red-100 text-red-800",
};

export default function Admin() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Which tab is visible — "products" or "orders"
  const [activeTab, setActiveTab] = useState("products");
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ── Product form state ──
  const [products, setProducts] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState("");

  // ── Orders state ──
  const [orders, setOrders] = useState([]);
  const [editingOrder, setEditingOrder] = useState(null);
  const [orderStatus, setOrderStatus] = useState("");
  const [mpesaCode, setMpesaCode] = useState("");
  const [mpesaNumber, setMpesaNumber] = useState("");
  const [savingOrder, setSavingOrder] = useState(false);
  const [material, setMaterial] = useState("");

  useEffect(() => {
    // Wait until auth state is confirmed
    if (user === undefined) return;
    if (user === null) { navigate("/login"); return; }
    loadDashboard();
  }, [user]);

  async function loadDashboard() {
    try {
      // Verify the logged-in user has the admin role
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (!userDoc.exists() || userDoc.data().role !== "admin") {
        navigate("/");
        return;
      }
      setIsAdmin(true);

      // Load products and orders at the same time
      const [productSnap, orderSnap] = await Promise.all([
        getDocs(collection(db, "products")),
        getDocs(collection(db, "orders")),
      ]);

      // Map snapshots to plain objects
      setProducts(productSnap.docs.map((d) => ({ id: d.id, ...d.data() })));

      // Convert Firestore Timestamps to JS Dates and sort newest first
      const orderItems = orderSnap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
        createdAt: d.data().createdAt?.toDate(),
      }));
      orderItems.sort((a, b) => {
        if (!a.createdAt) return 1;
        if (!b.createdAt) return -1;
        return b.createdAt - a.createdAt;
      });
      setOrders(orderItems);

    } catch (err) {
      // Show error in UI instead of redirecting
      setError("Failed to load dashboard: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  // ── Product functions ──

  async function handleProductSubmit(e) {
    e.preventDefault();
    setError(""); setSuccess(""); setSaving(true);
    try {
      const data = {
        name, price: parseFloat(price),
        category,material, description, image,
        updatedAt: new Date(),
      };
      if (editingProduct) {
        await updateDoc(doc(db, "products", editingProduct.id), data);
        setSuccess("Product updated.");
      } else {
        await addDoc(collection(db, "products"), { ...data, createdAt: new Date() });
        setSuccess("Product added.");
      }
      resetProductForm();
      // Refresh products list
      const snap = await getDocs(collection(db, "products"));
      setProducts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (err) {
      setError("Failed to save product: " + err.message);
    } finally {
      setSaving(false);
    }
  }

  function handleEditProduct(product) {
    setEditingProduct(product);
    setName(product.name);
    setPrice(product.price);
    setCategory(product.category);
    setDescription(product.description || "");
    setImage(product.image || "");
    setActiveTab("products");
    setMaterial(product.material || "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleDeleteProduct(id) {
    if (!window.confirm("Delete this product?")) return;
    try {
      await deleteDoc(doc(db, "products", id));
      setSuccess("Product deleted.");
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      setError("Failed to delete: " + err.message);
    }
  }

  function resetProductForm() {
    setEditingProduct(null);
    setName(""); setPrice(""); setCategory("");
    setDescription(""); setImage("");
    setMaterial("");
  }

  // ── Order functions ──

  function handleEditOrder(order) {
    setEditingOrder(order);
    setOrderStatus(order.status);
    setMpesaCode(order.mpesaCode || "");
    setMpesaNumber(order.mpesaNumber || "");
    setError(""); setSuccess("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSaveOrder(e) {
    e.preventDefault();
    setSavingOrder(true);
    setError(""); setSuccess("");
    try {
      await updateDoc(doc(db, "orders", editingOrder.id), {
        status: orderStatus,
        mpesaCode, mpesaNumber,
        updatedAt: new Date(),
      });
      setSuccess("Order updated.");
      setEditingOrder(null);
      // Update the order in local state without refetching
      setOrders((prev) =>
        prev.map((o) =>
          o.id === editingOrder.id
            ? { ...o, status: orderStatus, mpesaCode, mpesaNumber }
            : o
        )
      );
    } catch (err) {
      setError("Failed to update order: " + err.message);
    } finally {
      setSavingOrder(false);
    }
  }

  // ── Render guards ──
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-gray-300 border-t-gray-800 rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-6 py-10">

        <h1 className="text-2xl font-bold text-gray-800 mb-6">Admin Dashboard</h1>

        {/* Tab switcher */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-8 w-fit">
          <button
            onClick={() => setActiveTab("products")}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition ${
              activeTab === "products"
                ? "bg-white text-gray-800 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Products
          </button>
          <button
            onClick={() => setActiveTab("orders")}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 ${
              activeTab === "orders"
                ? "bg-white text-gray-800 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Orders
            {orders.length > 0 && (
              <span className="bg-gray-800 text-white text-xs rounded-full px-2 py-0.5">
                {orders.length}
              </span>
            )}
          </button>
        </div>

        {/* Status messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-4 py-3 mb-4">
            {success}
          </div>
        )}

        {/* ══════════ PRODUCTS TAB ══════════ */}
        {activeTab === "products" && (
          <>
            {/* Product form */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-8">
              <h2 className="text-lg font-semibold text-gray-700 mb-5">
                {editingProduct ? "Edit product" : "Add new product"}
              </h2>
              <form id="product-form" onSubmit={handleProductSubmit} className="flex flex-col gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label htmlFor="product-name" className="text-sm font-medium text-gray-700">
                      Product name
                    </label>
                    <input
                      id="product-name"
                      name="product-name"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Oak Dining Table"
                      className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label htmlFor="product-price" className="text-sm font-medium text-gray-700">
                      Price (KES)
                    </label>
                    <input
                      id="product-price"
                      name="product-price"
                      required
                      type="number"
                      min="0"
                      step="0.01"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="e.g. 45000"
                      className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label htmlFor="product-category" className="text-sm font-medium text-gray-700">
                    Category
                  </label>
                  <input
                    id="product-category"
                    name="product-category"
                    required
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="e.g. Tables, Sofas, Chairs, Beds"
                    className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
                  />
                </div>

                {/* Material field — used for filtering on the storefront */}
                <div className="flex flex-col gap-1">
                  <label htmlFor="product-material" className="text-sm font-medium text-gray-700">
                    Material <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <input
                    id="product-material"
                    name="product-material"
                    value={material}
                    onChange={(e) => setMaterial(e.target.value)}
                    placeholder="e.g. Solid oak, Pine, Mahogany, Metal"
                    className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label htmlFor="product-description" className="text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    id="product-description"
                    name="product-description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Material, dimensions, finish..."
                    rows={3}
                    className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 resize-none"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label htmlFor="product-image" className="text-sm font-medium text-gray-700">
                    Image URL
                  </label>
                  <input
                    id="product-image"
                    name="product-image"
                    value={image}
                    onChange={(e) => setImage(e.target.value)}
                    placeholder="https://i.ibb.co/example/chair.jpg"
                    className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
                  />
                  {image && (
                    <img
                      src={image}
                      alt="Preview"
                      className="mt-2 w-32 h-32 object-cover rounded-lg border border-gray-200"
                      onError={(e) => e.target.style.display = "none"}
                    />
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    Upload to imgbb.com and paste the direct link here
                  </p>
                </div>

                <div className="flex gap-3 mt-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="bg-gray-800 text-white text-sm font-medium px-6 py-2 rounded-lg hover:bg-gray-700 transition disabled:opacity-50"
                  >
                    {saving ? "Saving..." : editingProduct ? "Save changes" : "Add product"}
                  </button>
                  {editingProduct && (
                    <button
                      type="button"
                      onClick={resetProductForm}
                      className="text-sm px-6 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* Products table */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-700">
                  All products ({products.length})
                </h2>
              </div>
              {products.length === 0 ? (
                <p className="px-6 py-12 text-center text-gray-400 text-sm">
                  No products yet — add your first one above.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                      <tr>
                        <th className="px-6 py-3 text-left">Image</th>
                        <th className="px-6 py-3 text-left">Name</th>
                        <th className="px-6 py-3 text-left">Category</th>
                        <th className="px-6 py-3 text-left">Price (KES)</th>
                        <th className="px-6 py-3 text-left">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {products.map((product) => (
                        <tr key={product.id} className="hover:bg-gray-50 transition">
                          <td className="px-6 py-3">
                            <img
                              src={product.image}
                              alt={product.name}
                              className="w-12 h-12 object-cover rounded-lg border border-gray-200"
                              onError={(e) => e.target.src = "https://placehold.co/48x48?text=?"}
                            />
                          </td>
                          <td className="px-6 py-3 font-medium text-gray-800">{product.name}</td>
                          <td className="px-6 py-3 text-gray-500">{product.category}</td>
                          <td className="px-6 py-3 font-medium text-gray-800">
                            {parseFloat(product.price).toLocaleString()}
                          </td>
                          <td className="px-6 py-3">
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleEditProduct(product)}
                                className="text-xs px-3 py-1 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 transition"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteProduct(product.id)}
                                className="text-xs px-3 py-1 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {/* ══════════ ORDERS TAB ══════════ */}
        {activeTab === "orders" && (
          <div className="flex flex-col gap-4">

            {/* Order edit panel */}
            {editingOrder && (
              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-700 mb-1">Update order</h2>
                <p className="text-xs text-gray-400 font-mono mb-5">
                  Order ID: {editingOrder.id}
                </p>
                <form id="order-form" onSubmit={handleSaveOrder} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1">
                    <label htmlFor="order-status" className="text-sm font-medium text-gray-700">
                      Order status
                    </label>
                    <select
                      id="order-status"
                      name="order-status"
                      value={orderStatus}
                      onChange={(e) => setOrderStatus(e.target.value)}
                      className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
                    >
                      {ORDER_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s.charAt(0).toUpperCase() + s.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                      <label htmlFor="mpesa-code" className="text-sm font-medium text-gray-700">
                        M-Pesa confirmation code
                      </label>
                      <input
                        id="mpesa-code"
                        name="mpesa-code"
                        value={mpesaCode}
                        onChange={(e) => setMpesaCode(e.target.value)}
                        placeholder="e.g. QHX4RT2P1K"
                        className="border border-gray-300 rounded-lg px-4 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-gray-400"
                      />
                      <p className="text-xs text-gray-400">
                        Paste the code the customer sent via WhatsApp
                      </p>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label htmlFor="mpesa-number" className="text-sm font-medium text-gray-700">
                        M-Pesa phone number
                      </label>
                      <input
                        id="mpesa-number"
                        name="mpesa-number"
                        value={mpesaNumber}
                        onChange={(e) => setMpesaNumber(e.target.value)}
                        placeholder="e.g. 0712345678"
                        className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
                      />
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="submit"
                      disabled={savingOrder}
                      className="bg-gray-800 text-white text-sm font-medium px-6 py-2 rounded-lg hover:bg-gray-700 transition disabled:opacity-50"
                    >
                      {savingOrder ? "Saving..." : "Save changes"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingOrder(null)}
                      className="text-sm px-6 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Orders list */}
            {orders.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-200 px-6 py-16 text-center text-gray-400 text-sm">
                No orders yet. They appear here when customers click "Buy via WhatsApp".
              </div>
            ) : (orders.map((order) => (
  <div key={order.id}
    className="bg-white rounded-2xl overflow-hidden"
    style={{ border: "0.5px solid var(--border, #E2D9CC)" }}>

    {/* Order header */}
    <div className="flex items-center gap-4 p-5 border-b"
      style={{ borderColor: "var(--border, #E2D9CC)" }}>
      <img
        src={order.productImage}
        alt={order.productName}
        className="w-14 h-14 object-cover rounded-xl flex-shrink-0"
        style={{ border: "0.5px solid var(--border, #E2D9CC)" }}
        onError={(e) => e.target.src = "https://placehold.co/56x56?text=?"}
      />
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-gray-800 truncate">{order.productName}</h3>
        <p className="text-xs text-gray-400 mt-0.5">
          {order.customerEmail} ·{" "}
          {order.createdAt
            ? order.createdAt.toLocaleDateString("en-KE", {
                day: "numeric", month: "short", year: "numeric",
              })
            : ""}
        </p>
        {/* Payment method badge */}
        {order.paymentMethodLabel && (
          <span className="text-xs px-2 py-0.5 rounded-full mt-1 inline-block"
            style={{ background: "#F5F0E8", color: "#B5845A" }}>
            {order.paymentMethodLabel}
          </span>
        )}
      </div>
      <span className={`text-xs font-medium px-3 py-1 rounded-full flex-shrink-0 ${STATUS_STYLES[order.status] || "bg-gray-100 text-gray-600"}`}>
        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
      </span>
    </div>

    {/* Order details */}
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 px-5 py-4 border-b"
      style={{ borderColor: "var(--border, #E2D9CC)" }}>
      <div>
        <p className="text-xs text-gray-400 mb-1">Amount</p>
        <p className="text-sm font-semibold text-gray-800">
          KES {parseFloat(order.price).toLocaleString()}
        </p>
      </div>
      <div>
        <p className="text-xs text-gray-400 mb-1">Order ID</p>
        <p className="text-xs font-mono text-gray-600 truncate">{order.id}</p>
      </div>
      <div>
        <p className="text-xs text-gray-400 mb-1">M-Pesa code</p>
        <p className="text-sm font-mono text-gray-800">
          {order.mpesaCode || (
            <span className="text-gray-400 font-sans text-xs">Not received</span>
          )}
        </p>
      </div>
      <div>
        <p className="text-xs text-gray-400 mb-1">View image</p>
        {order.productImage ? (
          <a href={order.productImage} target="_blank" rel="noreferrer"
            className="text-xs text-blue-600 hover:underline">
            View →
          </a>
        ) : (
          <span className="text-xs text-gray-400">—</span>
        )}
      </div>
    </div>

    {/* ── One-click status buttons ── */}
    <div className="px-5 py-4">
      <p className="text-xs text-gray-400 mb-3">Update status</p>
      <div className="flex flex-wrap gap-2 mb-4">
        {ORDER_STATUSES.map((s) => (
          <button
            key={s}
            onClick={async () => {
              try {
                // Update status directly without opening a form
                await updateDoc(doc(db, "orders", order.id), {
                  status: s,
                  updatedAt: new Date(),
                });
                // Update local state instantly so UI reflects change
                setOrders((prev) =>
                  prev.map((o) => o.id === order.id ? { ...o, status: s } : o)
                );
                setSuccess(`Order marked as ${s}.`);
              } catch (err) {
                setError("Failed to update status.");
              }
            }}
            className="text-xs px-3 py-1.5 rounded-full border transition"
            style={{
              // Highlight the current status
              background: order.status === s ? "var(--charcoal, #1C1C1A)" : "transparent",
              color: order.status === s ? "white" : "var(--warm-gray, #8C8880)",
              borderColor: order.status === s ? "var(--charcoal, #1C1C1A)" : "var(--border, #E2D9CC)",
            }}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* M-Pesa code section — only shows for mpesa and bank_transfer orders */}
      {(order.paymentMethod === "mpesa" || order.paymentMethod === "bank_transfer") && (
        <div>
          {/* Toggle to show/hide the code input */}
          <button
            onClick={() => handleEditOrder(order)}
            className="text-xs underline"
            style={{ color: "var(--wood, #B5845A)" }}
          >
            {editingOrder?.id === order.id ? "Hide payment details" : "Add / edit payment details"}
          </button>

          {/* Payment details form — only shown when this order is being edited */}
          {editingOrder?.id === order.id && (
            <form onSubmit={handleSaveOrder}
              className="mt-3 flex flex-col gap-3 p-4 rounded-xl"
              style={{ background: "var(--cream, #F5F0E8)" }}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label htmlFor="mpesa-code"
                    className="text-xs font-medium text-gray-700">
                    {order.paymentMethod === "mpesa" ? "M-Pesa code" : "Bank reference"}
                  </label>
                  <input
                    id="mpesa-code"
                    name="mpesa-code"
                    value={mpesaCode}
                    onChange={(e) => setMpesaCode(e.target.value)}
                    placeholder={order.paymentMethod === "mpesa" ? "e.g. QHX4RT2P1K" : "e.g. TXN123456"}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-gray-400"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label htmlFor="mpesa-number"
                    className="text-xs font-medium text-gray-700">
                    {order.paymentMethod === "mpesa" ? "M-Pesa number" : "Account name"}
                  </label>
                  <input
                    id="mpesa-number"
                    name="mpesa-number"
                    value={mpesaNumber}
                    onChange={(e) => setMpesaNumber(e.target.value)}
                    placeholder={order.paymentMethod === "mpesa" ? "e.g. 0712345678" : "e.g. John Doe"}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button type="submit" disabled={savingOrder}
                  className="text-xs px-4 py-2 rounded-lg text-white transition disabled:opacity-50"
                  style={{ background: "var(--charcoal, #1C1C1A)" }}>
                  {savingOrder ? "Saving..." : "Save payment details"}
                </button>
                <button type="button"
                  onClick={() => setEditingOrder(null)}
                  className="text-xs px-4 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition">
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>

  </div>
)))
}</div>
        )}

      </div>
    </div>
  );
}