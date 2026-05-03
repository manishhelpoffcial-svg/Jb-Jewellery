import React, { useEffect, useState } from 'react';
import { Link } from 'wouter';
import { ShoppingCart, Zap, Gift, Tag, ArrowRight, Heart } from 'lucide-react';
import { motion } from 'framer-motion';
import { categoriesApi, type SbCategory } from '@/lib/adminApi';
import { fetchProducts } from '@/lib/sbCatalog';
import type { Product } from '@/data/products';
import { formatPrice } from '@/lib/utils';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';

// ── Compact product mini-card ───────────────────────────────────────────────
function MiniCard({ product, comboPrice, comboCount }: { product: Product; comboPrice: number; comboCount: number }) {
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const wished = isInWishlist(product.id);
  const saving = Math.max(0, product.price * comboCount - comboPrice);

  return (
    <motion.div
      whileHover={{ y: -3 }}
      className="shrink-0 w-[140px] sm:w-[160px] bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-lg hover:border-primary/50 transition-all duration-300 flex flex-col group"
    >
      <div className="relative aspect-square bg-gradient-to-br from-[#FFFBE6] to-[#FFF0B3] flex items-center justify-center overflow-hidden">
        {product.image ? (
          <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <span className="text-5xl font-black text-black/10">{product.name.charAt(0)}</span>
        )}
        <button
          onClick={() => toggleWishlist(product.id)}
          className="absolute top-2 right-2 p-1.5 bg-white/80 rounded-full shadow-sm hover:text-red-500 transition-colors"
        >
          <Heart className={`w-3 h-3 ${wished ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
        </button>
        {saving > 0 && (
          <span className="absolute bottom-2 left-2 bg-green-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
            Save ₹{saving}
          </span>
        )}
      </div>
      <div className="p-3 flex flex-col gap-2 flex-1">
        <p className="text-[11px] font-bold text-gray-800 line-clamp-2 leading-tight min-h-[28px]">{product.name}</p>
        <p className="text-xs font-black text-gray-900">{formatPrice(product.price)}</p>
        <button
          onClick={() =>
            addToCart({
              id: product.id,
              name: product.name,
              price: product.price,
              originalPrice: product.originalPrice,
              discount: product.discount,
              category: product.category,
              rating: product.rating,
              reviews: product.reviews,
              image: product.image,
              isBestseller: product.isBestseller,
              isNew: product.isNew,
            })
          }
          className="w-full bg-primary text-black text-[10px] font-bold py-1.5 rounded-lg flex items-center justify-center gap-1 hover:bg-yellow-400 transition-all"
        >
          <ShoppingCart className="w-3 h-3" /> Add
        </button>
      </div>
    </motion.div>
  );
}

// ── Combo banner accent colours ─────────────────────────────────────────────
const TIER_STYLES = [
  { bg: 'from-black to-zinc-900', badge: 'bg-primary text-black', icon: <Zap className="w-5 h-5" />, label: 'Best Starter Deal' },
  { bg: 'from-zinc-900 to-neutral-800', badge: 'bg-rose-500 text-white', icon: <Tag className="w-5 h-5" />, label: 'Most Popular 🔥' },
  { bg: 'from-neutral-900 to-stone-900', badge: 'bg-emerald-500 text-white', icon: <Gift className="w-5 h-5" />, label: 'Best Value Pack' },
];

// ── Main Section ────────────────────────────────────────────────────────────
export function ComboDeals() {
  const [cats, setCats] = useState<SbCategory[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    Promise.all([
      categoriesApi.listPublic('combo'),
      fetchProducts(),
    ])
      .then(([catRes, prods]) => {
        setCats(catRes.categories);
        setProducts(prods);
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  if (loaded && cats.length === 0) return null;

  return (
    <section className="py-16 lg:py-20 bg-[#F9F9F9]">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <span className="inline-flex items-center gap-2 bg-black text-primary text-xs font-black px-4 py-1.5 rounded-full tracking-widest uppercase mb-4">
            <Zap className="w-3.5 h-3.5" /> Limited Time
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 leading-tight">
            Unbeatable Combo Deals 🔥
          </h2>
          <p className="text-gray-500 mt-3 text-sm sm:text-base max-w-md mx-auto">
            Pick your favourites, bundle up & save big — the more you grab, the better the deal!
          </p>
        </div>

        {/* Deal Cards */}
        <div className="flex flex-col gap-8">
          {cats.map((combo, i) => {
            const style = TIER_STYLES[i % TIER_STYLES.length];
            const count = combo.combo_count ?? 4;
            const price = combo.combo_price ?? 299;
            const perPiece = Math.ceil(price / count);
            // Show products whose individual price fits this deal well
            const maxFit = perPiece * 2.5;
            const fits = products
              .filter((p) => p.price <= maxFit)
              .sort((a, b) => a.price - b.price);

            const headline = `Buy Any ${count} @ ₹${price}`;

            return (
              <motion.div
                key={combo.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className={`rounded-3xl overflow-hidden bg-gradient-to-br ${style.bg} shadow-2xl`}
              >
                {/* Banner top */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-6 sm:px-8 pt-7 pb-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-3">
                      <span className={`inline-flex items-center gap-1.5 text-[11px] font-black px-3 py-1 rounded-full uppercase tracking-wider ${style.badge}`}>
                        {style.icon} {style.label}
                      </span>
                      {combo.combo_extra && (
                        <span className="inline-flex items-center gap-1 bg-white/10 text-white text-[11px] font-semibold px-3 py-1 rounded-full border border-white/20">
                          🎁 {combo.combo_extra}
                        </span>
                      )}
                    </div>
                    <h3 className="text-white text-3xl sm:text-4xl lg:text-5xl font-black leading-tight tracking-tight">
                      {headline}
                    </h3>
                    <p className="text-white/60 text-sm mt-2">
                      Just <span className="text-primary font-bold">₹{perPiece}/piece</span> — pick any {count} items from below
                    </p>
                  </div>
                  <div className="flex flex-col items-start sm:items-end gap-3 shrink-0">
                    <div className="text-right">
                      <p className="text-white/40 text-xs font-semibold uppercase tracking-widest mb-0.5">Combo Total</p>
                      <p className="text-primary text-4xl font-black leading-none">₹{price}</p>
                    </div>
                    <Link href={`/category/${combo.slug}`}>
                      <button className="flex items-center gap-2 bg-primary text-black font-black text-sm px-6 py-3 rounded-xl hover:bg-yellow-400 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-primary/30 whitespace-nowrap">
                        Shop This Deal <ArrowRight className="w-4 h-4" />
                      </button>
                    </Link>
                  </div>
                </div>

                {/* Divider */}
                <div className="mx-6 sm:mx-8 h-px bg-white/10" />

                {/* Product strip */}
                <div className="px-6 sm:px-8 py-5">
                  {fits.length === 0 ? (
                    <p className="text-white/40 text-sm italic py-4 text-center">Products loading…</p>
                  ) : (
                    <>
                      <p className="text-white/50 text-xs font-semibold uppercase tracking-widest mb-4">
                        Fits this deal perfectly ({fits.length} items)
                      </p>
                      <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-2 snap-x snap-mandatory">
                        {fits.map((p) => (
                          <div key={p.id} className="snap-center">
                            <MiniCard product={p} comboPrice={price} comboCount={count} />
                          </div>
                        ))}
                        {/* View all CTA tile */}
                        <Link href={`/category/${combo.slug}`}>
                          <div className="shrink-0 w-[140px] sm:w-[160px] h-full min-h-[220px] border-2 border-dashed border-white/20 rounded-2xl flex flex-col items-center justify-center gap-2 hover:border-primary/60 transition-colors cursor-pointer group snap-center">
                            <ArrowRight className="w-6 h-6 text-white/30 group-hover:text-primary transition-colors" />
                            <span className="text-white/40 group-hover:text-primary text-[11px] font-bold text-center transition-colors">See All</span>
                          </div>
                        </Link>
                      </div>
                    </>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-gray-400 mt-8">
          * Add items individually to cart and apply the combo deal at checkout. Mix &amp; match any category!
        </p>
      </div>
    </section>
  );
}
