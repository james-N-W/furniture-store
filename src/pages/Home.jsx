// Home.jsx
// THE GRAIN — Professional landing page with editorial design
// Sections:
//   1. Hero — full-width brand statement
//   2. Brand values strip
//   3. Filter bar — category, material, search, sort
//   4. Product grid
//   5. Footer CTA — custom order prompt

import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import ProductCard from "../components/ProductCard";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Home() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ── Filter state ──
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedMaterial, setSelectedMaterial] = useState("All");
  // sort — controls the order products appear in the grid
  const [sort, setSort] = useState("default");

  useEffect(() => { fetchProducts(); }, []);

  async function fetchProducts() {
    try {
      const snapshot = await getDocs(collection(db, "products"));
      const items = snapshot.docs.map((doc) => ({
        id: doc.id, ...doc.data(),
      }));
      setProducts(items);
    } catch (err) {
      setError("Failed to load products. Please refresh.");
    } finally {
      setLoading(false);
    }
  }

  // Extract unique categories from products — deduplicated using Set
  const categories = ["All", ...new Set(products.map((p) => p.category).filter(Boolean))];

  // Extract unique materials — only shows if products have a material field
  const materials = ["All", ...new Set(products.map((p) => p.material).filter(Boolean))];

  // Apply all filters and sorting to the products array
  const filtered = products
    .filter((p) => {
      // Search filter — checks name and description
      const matchesSearch =
        !search ||
        p.name?.toLowerCase().includes(search.toLowerCase()) ||
        p.description?.toLowerCase().includes(search.toLowerCase());

      // Category filter
      const matchesCategory =
        selectedCategory === "All" || p.category === selectedCategory;

      // Material filter
      const matchesMaterial =
        selectedMaterial === "All" || p.material === selectedMaterial;

      // Product must pass ALL three filters to show
      return matchesSearch && matchesCategory && matchesMaterial;
    })
    .sort((a, b) => {
      // Sort the filtered results based on the selected sort option
      if (sort === "price-asc") return parseFloat(a.price) - parseFloat(b.price);
      if (sort === "price-desc") return parseFloat(b.price) - parseFloat(a.price);
      if (sort === "name-asc") return a.name?.localeCompare(b.name);
      // default — keep original Firestore order
      return 0;
    });

  // true if any filter is active — used to show the "clear filters" button
  const filtersActive =
    search !== "" ||
    selectedCategory !== "All" ||
    selectedMaterial !== "All" ||
    sort !== "default";

  function clearFilters() {
    setSearch("");
    setSelectedCategory("All");
    setSelectedMaterial("All");
    setSort("default");
  }

  return (
    <div style={{ background: "var(--cream)" }}>

      {/* ══════════════════════════════
          HERO SECTION
      ══════════════════════════════ */}
      <section className="relative overflow-hidden">
        {/* Background texture — subtle grain overlay for warmth */}
        <div className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
            backgroundSize: "128px",
          }} />

        <div className="max-w-6xl mx-auto px-6 py-24 md:py-36 relative">
          <div className="max-w-3xl">

            {/* Eyebrow label */}
            <p className="text-xs tracking-widest uppercase mb-6"
              style={{ color: "var(--wood)" }}>
              Handcrafted Furniture · All across Kenya
            </p>

            {/* Main headline — large serif display font */}
            <h1 className="font-display text-5xl md:text-7xl leading-none mb-8"
              style={{ color: "var(--charcoal)" }}>
              Furniture that<br />
              <em>tells a story.</em>
            </h1>

            {/* Subheading */}
            <p className="text-lg md:text-xl mb-10 max-w-xl leading-relaxed"
              style={{ color: "var(--warm-gray)", fontWeight: 300 }}>
              Each piece is crafted with intention —
              built to last and designed to feel like home
              from the moment it arrives.
            </p>

            {/* CTA buttons */}
            <div className="flex flex-wrap gap-4">
              <a href="#collection"
                className="px-8 py-3 rounded-full text-sm tracking-wide transition hover:opacity-80"
                style={{ background: "var(--charcoal)", color: "var(--cream)" }}>
                Browse collection
              </a>
             {/*} <Link
                to={user ? "/custom-order" : "/register"}
                className="px-8 py-3 rounded-full text-sm tracking-wide border transition hover:opacity-70"
                style={{ borderColor: "var(--charcoal)", color: "var(--charcoal)" }}>
                Request custom piece
              </Link>*/}
            </div>
          </div>
        </div>

        {/* Decorative line */}
        <div className="absolute bottom-0 left-0 right-0 h-px"
          style={{ background: "var(--border)" }} />
        </section>

     {/* 
     {/* ══════════════════════════════
          BRAND VALUES STRIP
      ══════════════════════════════ 
      <section className="border-b" style={{ borderColor: "var(--border)" }}>
        <div className="max-w-6xl mx-auto px-6 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { label: "Handcrafted", desc: "Every joint, every finish by hand" },
              { label: "Local timber", desc: "Sourced responsibly from Kenya" },
              { label: "Made to order", desc: "Built for your exact space" },
              { label: "Lifetime quality", desc: "Furniture that outlasts trends" },
            ].map((v) => (
              <div key={v.label}>
                {/* Small wood-tone accent line 
                <div className="w-8 h-px mb-3" style={{ background: "var(--wood)" }} />
                <p className="font-display text-base mb-1"
                  style={{ color: "var(--charcoal)" }}>
                  {v.label}
                </p>
                <p className="text-xs leading-relaxed"
                  style={{ color: "var(--warm-gray)" }}>
                  {v.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
      */}
      {/* ══════════════════════════════
          COLLECTION + FILTERS
      ══════════════════════════════ */}
      <section id="collection" className="max-w-6xl mx-auto px-6 py-16">

        {/* Section header */}
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-xs tracking-widest uppercase mb-2"
              style={{ color: "var(--wood)" }}>
              Our work
            </p>
            <h2 className="font-display text-3xl md:text-4xl"
              style={{ color: "var(--charcoal)" }}>
              The Collection
            </h2>
          </div>
          {/* Product count */}
          <p className="text-sm hidden md:block"
            style={{ color: "var(--warm-gray)" }}>
            {filtered.length} {filtered.length === 1 ? "piece" : "pieces"}
          </p>
        </div>

        {/* ── Filter bar ── */}
        <div className="mb-10 flex flex-col gap-4">

          {/* Top row — search + sort */}
          <div className="flex flex-col sm:flex-row gap-3">

            {/* Search input */}
            <div className="relative flex-1">
              {/* Search icon */}
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4"
                style={{ color: "var(--warm-gray)" }}
                fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                id="search"
                name="search"
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search pieces..."
                className="w-full pl-10 pr-4 py-2.5 text-sm rounded-full border outline-none transition"
                style={{
                  background: "transparent",
                  borderColor: "var(--border)",
                  color: "var(--charcoal)",
                }}
              />
            </div>

            {/* Sort dropdown */}
            <select
              id="sort"
              name="sort"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="px-4 py-2.5 text-sm rounded-full border outline-none"
              style={{
                background: "transparent",
                borderColor: "var(--border)",
                color: "var(--warm-gray)",
              }}
            >
              <option value="default">Sort: Featured</option>
              <option value="price-asc">Price: Low to high</option>
              <option value="price-desc">Price: High to low</option>
              <option value="name-asc">Name: A to Z</option>
            </select>
          </div>

          {/* Bottom row — category pills + material pills */}
          <div className="flex flex-wrap gap-2">

            {/* Category filter pills */}
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className="px-4 py-1.5 rounded-full text-xs tracking-wide border transition"
                style={{
                  background: selectedCategory === cat ? "var(--charcoal)" : "transparent",
                  color: selectedCategory === cat ? "var(--cream)" : "var(--warm-gray)",
                  borderColor: selectedCategory === cat ? "var(--charcoal)" : "var(--border)",
                }}
              >
                {cat}
              </button>
            ))}

            {/* Divider between category and material pills */}
            {materials.length > 1 && (
              <span className="self-center text-xs px-1"
                style={{ color: "var(--border)" }}>|</span>
            )}

            {/* Material filter pills — only shows if products have materials */}
            {materials.length > 1 && materials.map((mat) => (
              <button
                key={mat}
                onClick={() => setSelectedMaterial(mat)}
                className="px-4 py-1.5 rounded-full text-xs tracking-wide border transition"
                style={{
                  background: selectedMaterial === mat ? "var(--wood)" : "transparent",
                  color: selectedMaterial === mat ? "var(--cream)" : "var(--warm-gray)",
                  borderColor: selectedMaterial === mat ? "var(--wood)" : "var(--border)",
                }}
              >
                {mat}
              </button>
            ))}

            {/* Clear filters button — only shows when a filter is active */}
            {filtersActive && (
              <button
                onClick={clearFilters}
                className="px-4 py-1.5 rounded-full text-xs tracking-wide border transition"
                style={{
                  borderColor: "var(--wood)",
                  color: "var(--wood)",
                }}
              >
                Clear filters ×
              </button>
            )}
          </div>
        </div>

        {/* ── Loading state ── */}
        {loading && (
          <div className="flex justify-center py-24">
            <div className="w-8 h-8 rounded-full border-2 animate-spin"
              style={{ borderColor: "var(--border)", borderTopColor: "var(--wood)" }} />
          </div>
        )}

        {/* ── Error state ── */}
        {error && (
          <div className="text-sm text-center py-12"
            style={{ color: "var(--warm-gray)" }}>
            {error}
          </div>
        )}

        {/* ── Empty state ── */}
        {!loading && !error && filtered.length === 0 && (
          <div className="text-center py-24">
            <p className="font-display text-2xl mb-3"
              style={{ color: "var(--charcoal)" }}>
              No pieces found
            </p>
            <p className="text-sm mb-6" style={{ color: "var(--warm-gray)" }}>
              {products.length === 0
                ? "The collection is being curated. Check back soon."
                : "Try adjusting your filters."}
            </p>
            {filtersActive && (
              <button onClick={clearFilters}
                className="text-sm underline"
                style={{ color: "var(--wood)" }}>
                Clear all filters
              </button>
            )}
          </div>
        )}

        {/* ── Product grid ── */}
        {!loading && !error && filtered.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-14">
            {filtered.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

      </section>

      {/* ══════════════════════════════
          CUSTOM ORDER CTA SECTION
      ══════════════════════════════ 
      <section className="border-t" style={{ borderColor: "var(--border)" }}>
        <div className="max-w-6xl mx-auto px-6 py-20 md:py-28">
          <div className="max-w-2xl">
            <p className="text-xs tracking-widest uppercase mb-4"
              style={{ color: "var(--wood)" }}>
              Bespoke service
            </p>
            <h2 className="font-display text-3xl md:text-5xl leading-tight mb-6"
              style={{ color: "var(--charcoal)" }}>
              Don't see exactly<br />what you need?
            </h2>
            <p className="text-base leading-relaxed mb-8"
              style={{ color: "var(--warm-gray)", fontWeight: 300 }}>
              Every piece at BROTSIT INTERIORS can be made to your exact specifications —
              dimensions, timber, finish, and form. Tell us your vision and
              we'll bring it to life.
            </p>
            <Link
              to={user ? "/custom-order" : "/register"}
              className="inline-block px-8 py-3 rounded-full text-sm tracking-wide transition hover:opacity-80"
              style={{ background: "var(--charcoal)", color: "var(--cream)" }}>
              {user ? "Start your custom order" : "Create an account to get started"}
            </Link>
          </div>
        </div>
      </section>*/}

      {/* ══════════════════════════════
          FOOTER
      ══════════════════════════════ */}
      <footer className="border-t" style={{ borderColor: "var(--border)" }}>
        <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">

          <div>
            <p className="font-display text-xl mb-1"
              style={{ color: "var(--charcoal)" }}>
              BROTSIT INTERIORS
            </p>
            
          </div>

          <div className="flex flex-col gap-1 text-right">
            <p className="text-xs" style={{ color: "var(--warm-gray)" }}>
              <a href="https://wa.me/254721937751?text=Hello%20I%20am%20interested%20in%20your%20services" target="_blank">
              Questions? Reach us on WhatsApp
              </a>
            </p>
            <p className="text-xs" style={{ color: "var(--warm-gray)" }}>
              © {new Date().getFullYear()} BROTSIT INTERIORS. All rights reserved.
            </p>
          </div>

        </div>
      </footer>

    </div>
  );
}