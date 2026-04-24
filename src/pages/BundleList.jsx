import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { HARDCODED_PANTRY } from '../constants/bundleMenu';
import { Clock, Users, ChevronLeft, ShoppingBag, Leaf, Share2, X, Download, MessageSquare } from 'lucide-react';
import ShareModal from '../components/ShareModal';

const flattenPantry = (pantry) => {
  return pantry.flatMap(product =>
    (product.variants || []).map(variant => ({
      ...variant,
      product_name: product.product_name,
      rails_parent_id: product.rails_parent_id,
      public_id: product.public_id // ✅ IMPORTANT
    }))
  );
};

// --- Main BundleList Component ---
const BundleList = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const paxQuery = searchParams.get('pax') || 10;

  const [bundles, setBundles] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBundle, setSelectedBundle] = useState(null);

  const flatPantry = React.useMemo(() => flattenPantry(HARDCODED_PANTRY), []);

  const pantryMap = React.useMemo(() => {
    const map = {};
    flatPantry.forEach(item => {
      map[item.rails_variant_id] = item;
    });
    return map;
  }, [flatPantry]);

  // Fetch real data from Rails
  useEffect(() => {
    const fetchBundles = async () => {
      setLoading(true);
      try {
        // Calling your new Rails endpoint with the pax filter
        const response = await fetch(`https://servewise-market-backend.onrender.com/api/v1/bundles?pax=${paxQuery}`);
        const data = await response.json();
        setBundles(data);
      } catch (err) {
        console.error("Error fetching bundles:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchBundles();
  }, [paxQuery]);

  return (
    <div className="min-h-screen bg-[url('https://images.unsplash.com/photo-1516062423079-7ca13cdc7f5a?q=80&w=2083')] bg-cover bg-fixed p-6 font-sans">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>

      <div className="relative z-10 max-w-5xl mx-auto">
        <header className="flex justify-between items-center mb-10">
          <button onClick={() => navigate('/')} className="flex items-center gap-2 text-white/80 hover:text-white transition-colors font-bold uppercase text-xs tracking-widest">
            <ChevronLeft size={18} /> Change Pax
          </button>
          <div className="text-right">
            {/* Added Greeting per Saved Info */}
            <h1 className="text-2xl font-black text-white tracking-tighter uppercase leading-none">👋 MABUHAY! Menu for {paxQuery} Pax</h1>
            <div className="h-1 w-12 bg-emerald-500 ml-auto mt-2 rounded-full"></div>
          </div>
        </header>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {bundles.map((bundle) => (
              <div key={bundle.id} className="group relative bg-orange-50/95 rounded-3xl overflow-hidden shadow-2xl flex flex-col border-b-8 border-emerald-900 transition-transform hover:-translate-y-1">
                <div className="p-8 pb-0">
                  <div className="flex justify-between items-start mb-4">
                    <span className="bg-emerald-800 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">Available Now</span>
                    <button
                      onClick={() => { setSelectedBundle(bundle); setIsModalOpen(true); }}
                      className="flex items-center gap-1 text-stone-400 hover:text-emerald-700 font-bold text-[10px] uppercase tracking-widest transition-colors"
                    >
                      <Share2 size={16} /> Share Menu
                    </button>
                  </div>

                  <h2 className="text-3xl font-black text-stone-800 tracking-tighter leading-none mb-2 uppercase">{bundle.name}</h2>
                  <div className="flex items-center gap-4">
                    <p className="text-stone-400 font-bold text-xs uppercase flex items-center gap-1.5"><Users size={14} /> {bundle.min_pax}-{bundle.max_pax} Pax</p>
                    <p className="text-orange-700 font-bold text-xs uppercase flex items-center gap-1.5"><Clock size={14} /> {bundle.lead_time_days || 2} Days Lead Time</p>
                  </div>
                </div>

                <div className="p-8 pt-6 flex-grow">
                  <div className="bg-emerald-900/5 rounded-2xl p-5 border border-emerald-900/10 relative overflow-hidden">
                    <Leaf className="absolute -right-4 -bottom-4 text-emerald-900/5 w-24 h-24 rotate-12" />
                    <h3 className="text-[10px] font-black text-emerald-900 uppercase tracking-widest mb-4 italic">The Set List:</h3>
                    <ul className="space-y-2">
                      {bundle.bundle_items?.map((bi, i) => {
                        const pantryItem = pantryMap[bi.product_variant_id];

                        const quantity = bi.quantity || 1;
                        const itemName = pantryItem?.name|| bi.product?.name || 'Item';

                        let displayName = "";

                        if (pantryItem?.count) {
                          const totalCount = quantity * pantryItem.count;
                          displayName = `${totalCount}pcs ${itemName}`;
                        } else {
                          displayName = `${quantity} ${itemName}`;
                        }

                        return (
                          <li key={i} className="text-stone-700 font-bold text-sm flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-emerald-600 rounded-full"></div>
                            {displayName}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </div>

                <div className="p-8 pt-0 mt-auto">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <span className="block text-[10px] font-black text-stone-400 uppercase tracking-widest">Fixed Price</span>
                      <span className="text-3xl font-black text-emerald-900 tracking-tighter">₱{parseFloat(bundle.price).toLocaleString()}</span>
                    </div>
                    <button className="bg-emerald-800 hover:bg-emerald-900 text-white px-6 py-4 rounded-2xl font-black tracking-widest uppercase text-sm shadow-lg flex items-center gap-2 transition-all active:scale-95">
                      <ShoppingBag size={18} /> Order Now
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {bundles.length === 0 && !loading && (
          <div className="text-center py-20 bg-stone-900/40 rounded-3xl border-2 border-dashed border-white/10 backdrop-blur-md">
            <h2 className="text-white font-black text-xl Montserrat mb-2 uppercase">Walang Nahanap!</h2>
            <p className="text-white/60 font-bold text-lg italic Montserrat">We haven't built bundles for {paxQuery} pax yet.</p>
            <button onClick={() => navigate('/')} className="mt-4 text-emerald-400 font-bold uppercase text-xs tracking-widest hover:text-emerald-300 transition-colors">Go back</button>
          </div>
        )}
      </div>

      <ShareModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        bundle={selectedBundle}
        pantryMap={pantryMap}
      />
    </div>
  );
};

export default BundleList;
