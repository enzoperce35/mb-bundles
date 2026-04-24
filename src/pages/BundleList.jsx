import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { HARDCODED_PANTRY } from '../constants/bundleMenu';
import { Clock, Users, ChevronLeft, ShoppingBag, Leaf, Share2, Edit3, Save, RotateCcw } from 'lucide-react';
import { getEditableVariants, calculateSmartQuantity, formatItemName } from '../utils/bundleLogic';
import ShareModal from '../components/ShareModal';

const flattenPantry = (pantry) => {
  return pantry.flatMap(product =>
    (product.variants || []).map(variant => ({
      ...variant,
      product_name: product.product_name,
      rails_parent_id: product.rails_parent_id,
      public_id: product.public_id
    }))
  );
};

const BundleList = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const paxQuery = searchParams.get('pax') || 10;

  const [bundles, setBundles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBundle, setSelectedBundle] = useState(null);

  const [editingId, setEditingId] = useState(null);
  const [customSelections, setCustomSelections] = useState({});

  const flatPantry = useMemo(() => flattenPantry(HARDCODED_PANTRY), []);
  const editableVariants = useMemo(() => getEditableVariants(HARDCODED_PANTRY), []);

  const pantryMap = useMemo(() => {
    const map = {};
    
    // 1. Start with hardcoded structure (pax, count, names)
    flatPantry.forEach(item => { map[item.rails_variant_id] = { ...item }; });
  
    // 2. Overlay backend data (Prices)
    bundles.forEach(bundle => {
      bundle.bundle_items?.forEach(bi => {
        if (map[bi.product_variant_id]) {
          // Use the price directly from the backend object
          map[bi.product_variant_id].price = parseFloat(bi.price || bi.product_variant?.price || 0);
        }
      });
    });
  
    return map;
  }, [flatPantry, bundles]);
  
  // This creates an object where keys are bundle IDs and values are the best side variants
  const smartSidesMap = useMemo(() => {
    const map = {};
    bundles.forEach(bundle => {
      map[bundle.id] = getEditableVariants(HARDCODED_PANTRY, bundle.max_pax);
    });
    return map;
  }, [bundles]);

  useEffect(() => {
    const saved = localStorage.getItem('servewise_bundle_customizations');
    if (saved) setCustomSelections(JSON.parse(saved));
  }, []);

  useEffect(() => {
    const fetchBundles = async () => {
      setLoading(true);
      try {
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

  const handleToggleItem = (bundle, variantId) => {
    const bundleId = bundle.id;
    setCustomSelections(prev => {
      // Get current selection or default to initial bundle items
      const currentItems = prev[bundleId] || bundle.bundle_items;
      const exists = currentItems.find(i => i.product_variant_id === variantId);

      let newItems;
      if (exists) {
        // Remove if it exists
        newItems = currentItems.filter(i => i.product_variant_id !== variantId);
      } else {
        // Add if it doesn't exist (using smart quantity for the specific variant)
        const variantData = pantryMap[variantId];
        const smartQty = calculateSmartQuantity(variantData?.pax, bundle.max_pax);
        newItems = [...currentItems, { product_variant_id: variantId, quantity: smartQty }];
      }

      const updated = { ...prev, [bundleId]: newItems };
      localStorage.setItem('servewise_bundle_customizations', JSON.stringify(updated));
      return updated;
    });
  };

  const resetBundle = (bundleId) => {
    setCustomSelections(prev => {
      const updated = { ...prev };
      delete updated[bundleId];
      localStorage.setItem('servewise_bundle_customizations', JSON.stringify(updated));
      return updated;
    });
    setEditingId(null);
  };

  return (
    <div className="min-h-screen bg-[url('https://images.unsplash.com/photo-1516062423079-7ca13cdc7f5a?q=80&w=2083')] bg-cover bg-fixed p-6 font-sans">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>

      <div className="relative z-10 max-w-5xl mx-auto">
        <header className="flex justify-between items-center mb-10">
          <button onClick={() => navigate('/')} className="flex items-center gap-2 text-white/80 hover:text-white transition-colors font-bold uppercase text-xs tracking-widest">
            <ChevronLeft size={18} /> Change Pax
          </button>
          <div className="text-right">
            <h1 className="text-2xl font-black text-white tracking-tighter uppercase leading-none Montserrat">👋 MABUHAY! Menu for {paxQuery} Pax</h1>
            <div className="h-1 w-12 bg-emerald-500 ml-auto mt-2 rounded-full"></div>
          </div>
        </header>

        {loading ? (
          <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {bundles.map((bundle) => {
              const isEditing = editingId === bundle.id;
              // activeItems is an array of objects: { product_variant_id, quantity }
              const activeItems = customSelections[bundle.id] || bundle.bundle_items;
              const activeIds = activeItems.map(i => i.product_variant_id);

              const displayBundle = { ...bundle, bundle_items: activeItems };

              const smartSidesForThisBundle = smartSidesMap[bundle.id] || [];

              // In Edit Mode, we show the union of current items + all editable sides from pantry
              const itemsToShow = isEditing
                ? [...new Set([...activeIds, ...smartSidesForThisBundle.map(v => v.rails_variant_id)])]
                : activeIds;

              return (
                <div key={bundle.id} className="group relative bg-orange-50/95 rounded-3xl overflow-hidden shadow-2xl flex flex-col border-b-8 border-emerald-900 transition-all hover:shadow-emerald-900/20">
                  <div className="p-8 pb-0">
                    <div className="flex justify-between items-start mb-4">
                      <button
                        onClick={() => setEditingId(isEditing ? null : bundle.id)}
                        className={`flex items-center gap-2 text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest transition-all Montserrat ${isEditing ? 'bg-orange-600 text-white animate-pulse' : 'bg-emerald-800 text-white hover:bg-emerald-700'}`}
                      >
                        {isEditing ? <Save size={12} /> : <Edit3 size={12} />}
                        {isEditing ? 'Finish Editing' : 'Edit Inclusions'}
                      </button>

                      <button
                        onClick={() => { setSelectedBundle(displayBundle); setIsModalOpen(true); }}
                        className="flex items-center gap-1 text-stone-400 hover:text-emerald-700 font-bold text-[10px] uppercase tracking-widest transition-colors Montserrat"
                      >
                        <Share2 size={16} /> Share Poster
                      </button>
                    </div>

                    <h2 className="text-3xl font-black text-stone-800 tracking-tighter leading-none mb-2 uppercase Montserrat">{bundle.name}</h2>
                    <div className="flex items-center gap-4 Montserrat">
                      <p className="text-stone-400 font-bold text-xs uppercase flex items-center gap-1.5"><Users size={14} /> {bundle.min_pax}-{bundle.max_pax} Pax</p>
                      <p className="text-orange-700 font-bold text-xs uppercase flex items-center gap-1.5"><Clock size={14} /> {bundle.lead_time_days || 2} Days</p>
                    </div>
                  </div>

                  <div className="p-8 pt-6 flex-grow">
                    <div className={`rounded-2xl p-5 border relative transition-all ${isEditing ? 'bg-white border-orange-200' : 'bg-emerald-900/5 border-emerald-900/10'}`}>
                      <div className="flex justify-between items-center mb-4 Montserrat">
                        <h3 className="text-[10px] font-black text-emerald-900 uppercase tracking-widest italic">
                          {isEditing ? 'Select Items to Include:' : 'The Set List:'}
                        </h3>
                        {isEditing && (
                          <button onClick={() => resetBundle(bundle.id)} className="text-[9px] text-orange-600 font-bold flex items-center gap-1 uppercase">
                            <RotateCcw size={10} /> Reset Default
                          </button>
                        )}
                      </div>

                      <ul className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                        {itemsToShow.map((variantId) => {
                          const pantryItem = pantryMap[variantId];
                          if (!pantryItem) return null;

                          const isSelected = activeIds.includes(variantId);
                          const itemInSelection = activeItems.find(i => i.product_variant_id === variantId);

                          // Determine quantity: if selected use saved qty, if not selected use smart calc
                          const quantity = isSelected
                            ? itemInSelection.quantity
                            : calculateSmartQuantity(pantryItem.pax, bundle.max_pax);

                          return (
                            <li
                              key={variantId}
                              onClick={() => isEditing && handleToggleItem(bundle, variantId)}
                              className={`text-sm font-bold flex items-center gap-3 transition-all Montserrat ${isEditing ? 'cursor-pointer p-2 rounded-lg hover:bg-stone-50' : ''} ${isSelected ? 'text-stone-700' : 'text-stone-300 opacity-50'}`}
                            >
                              <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-emerald-600 border-emerald-600' : 'bg-transparent border-stone-300'}`}>
                                {isSelected && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                              </div>
                              <span className={!isSelected && isEditing ? 'line-through' : ''}>
                                {formatItemName(pantryItem, quantity)}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  </div>

                  <div className="p-8 pt-0 mt-auto">
                    <div className="flex items-center justify-between gap-4 Montserrat">
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
              );
            })}
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
