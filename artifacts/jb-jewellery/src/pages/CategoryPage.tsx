import React, { useEffect, useState } from 'react';
import { useRoute, Link } from 'wouter';
import { Marquee } from '@/components/layout/Marquee';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { DbProductCard } from '@/components/product/DbProductCard';
import { categoriesApi, type SbCategory, type SbProduct } from '@/lib/adminApi';
import { Loader2, ArrowLeft, Sparkles, Tag } from 'lucide-react';

export default function CategoryPage() {
  const [, params] = useRoute<{ slug: string }>('/category/:slug');
  const slug = params?.slug || '';

  const [cat, setCat] = useState<SbCategory | null>(null);
  const [products, setProducts] = useState<SbProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setErr(null);
    categoriesApi.getBySlug(slug)
      .then(({ category, products }) => { setCat(category); setProducts(products); })
      .catch((e) => setErr(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, [slug]);

  return (
    <div className="min-h-screen flex flex-col w-full bg-white">
      <Marquee />
      <Navbar />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative">
          {cat?.image ? (
            <div className="relative h-44 sm:h-64 lg:h-80 overflow-hidden">
              <img src={cat.image} alt={cat.name} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
              <div className="absolute inset-0 container mx-auto px-4 flex flex-col justify-end pb-6">
                <span className="text-[10px] sm:text-xs font-bold tracking-widest text-primary uppercase mb-1">
                  {cat.type === 'combo' ? 'Combo Deal' : cat.type === 'price' ? 'Budget Pick' : cat.type === 'vibe' ? 'Shop Your Vibe' : 'Category'}
                </span>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white drop-shadow-lg">{cat.name}</h1>
                {cat.subtitle && <p className="text-white/90 text-sm sm:text-base mt-1 max-w-xl">{cat.subtitle}</p>}
              </div>
            </div>
          ) : (
            <div className="bg-gradient-to-r from-yellow-50 to-pink-50 py-10 sm:py-14">
              <div className="container mx-auto px-4">
                <Link href="/" className="inline-flex items-center gap-2 text-xs font-semibold text-gray-500 hover:text-black mb-3"><ArrowLeft className="w-3.5 h-3.5" /> Home</Link>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900">{cat?.name || 'Category'}</h1>
                {cat?.subtitle && <p className="text-gray-600 mt-1">{cat.subtitle}</p>}
              </div>
            </div>
          )}
        </section>

        {/* Combo offer banner */}
        {cat?.type === 'combo' && cat.combo_count && cat.combo_price && (
          <section className="bg-black text-white">
            <div className="container mx-auto px-4 py-4 flex items-center gap-3 flex-wrap">
              <Sparkles className="w-5 h-5 text-primary" />
              <p className="text-sm sm:text-base font-bold flex-1 min-w-0">
                Pick any <span className="text-primary">{cat.combo_count} items</span> from below — pay just <span className="text-primary">₹{cat.combo_price}</span>
                {cat.combo_extra && <span className="text-primary"> · {cat.combo_extra}</span>}
              </p>
              <span className="text-xs font-semibold bg-primary text-black px-3 py-1.5 rounded-full">Combo Offer Active</span>
            </div>
          </section>
        )}

        {cat?.type === 'price' && cat.max_price && (
          <section className="bg-green-50 border-b border-green-100">
            <div className="container mx-auto px-4 py-3 flex items-center gap-2">
              <Tag className="w-4 h-4 text-green-600" />
              <p className="text-sm font-semibold text-green-800">Showing all jewellery priced under ₹{cat.max_price}</p>
            </div>
          </section>
        )}

        {/* Products */}
        <section className="py-10">
          <div className="container mx-auto px-4">
            {loading ? (
              <div className="flex flex-col items-center gap-3 py-20 text-gray-500">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-sm">Loading products…</p>
              </div>
            ) : err ? (
              <div className="text-center py-20">
                <p className="text-gray-500 text-sm">{err}</p>
                <Link href="/" className="inline-block mt-4 text-primary font-bold hover:underline">← Back to Home</Link>
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-gray-400 text-base">No products in this category yet.</p>
                <Link href="/products" className="inline-block mt-4 text-primary font-bold hover:underline">Browse all products →</Link>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-6">
                  <p className="text-sm font-semibold text-gray-600">{products.length} products</p>
                  <Link href="/products" className="text-xs text-gray-500 hover:text-black font-semibold">View all products →</Link>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                  {products.map((p) => (
                    <DbProductCard key={p.id} product={p} />
                  ))}
                </div>
              </>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
