// ProductCard.jsx
// Redesigned for THE GRAIN — clean editorial card
// with warm hover states and refined typography

import { Link } from "react-router-dom";

export default function ProductCard({ product }) {
  return (
    <Link
      to={`/product/${product.id}`}
      className="group block"
    >
      {/* Image container — square crop with zoom on hover */}
      <div className="aspect-square overflow-hidden mb-4"
        style={{ background: "var(--wood-light)" }}>
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          onError={(e) => e.target.src = "https://placehold.co/600x600?text=THE+GRAIN"}
        />
      </div>

      {/* Card info */}
      <div>
        {/* Category + material row */}
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs tracking-widest uppercase"
            style={{ color: "var(--wood)" }}>
            {product.category}
          </span>
          {/* Material tag — only shows if material field exists */}
          {product.material && (
            <>
              <span style={{ color: "var(--border)" }}>·</span>
              <span className="text-xs tracking-wide"
                style={{ color: "var(--warm-gray)" }}>
                {product.material}
              </span>
            </>
          )}
        </div>

        {/* Product name — serif font for editorial feel */}
        <h3 className="font-display text-base mb-2 leading-snug"
          style={{ color: "var(--charcoal)" }}>
          {product.name}
        </h3>

        {/* Price row */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium"
            style={{ color: "var(--charcoal)" }}>
            KES {parseFloat(product.price).toLocaleString("en-KE")}
          </span>
          <span className="text-xs tracking-wide opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            style={{ color: "var(--wood)" }}>
            View →
          </span>
        </div>
      </div>
    </Link>
  );
}