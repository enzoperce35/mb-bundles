import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { HARDCODED_PANTRY } from '../constants/bundleMenu';
import { Clock, Users, ChevronLeft, MessageCircle, Share2, Edit3, Save, RotateCcw, Check } from 'lucide-react';
import { getEditableVariants, calculateSmartQuantity, formatItemName } from '../utils/bundleLogic';
import * as htmlToImage from 'html-to-image';
import PosterTemplate from '../components/PosterTemplate';
import logo from '../assets/images/mb-logo-warm-golden-yellow-removebg-preview.png';
import { getDesignedBundlePrice } from '../utils/discountLogic';

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
//bundles.map
const BundleList = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const paxQuery = searchParams.get('pax') || 10;

  const [bundles, setBundles] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedBundle, setSelectedBundle] = useState(null);
  const [generatingId, setGeneratingId] = useState(null);

  const [editingId, setEditingId] = useState(null);
  const [customSelections, setCustomSelections] = useState({});

  const flatPantry = useMemo(() => flattenPantry(HARDCODED_PANTRY), []);

  // HYDRATED PANTRY MAP: Uses Hardcoded prices as the primary source
  const pantryMap = useMemo(() => {
    const map = {};

    // 1. Start with Hardcoded Prices (Siomai 100, Empanada 100, etc.)
    flatPantry.forEach(item => {
      map[item.rails_variant_id] = {
        ...item,
        price: parseFloat(item.price || 0)
      };
    });

    // 2. Override with Product API prices if they exist
    allProducts.forEach(product => {
      product.product_variants?.forEach(variant => {
        if (map[variant.id]) {
          map[variant.id].price = parseFloat(variant.price || 0);
        }
      });
    });

    // 3. Fallback to Bundle Item prices
    bundles.forEach(bundle => {
      bundle.bundle_items?.forEach(bi => {
        const variantId = bi.product_variant_id;
        if (map[variantId] && map[variantId].price === 0) {
          map[variantId].price = parseFloat(bi.price || 0);
        }
      });
    });

    return map;
  }, [flatPantry, bundles, allProducts]);

  const smartSidesMap = useMemo(() => {
    const map = {};
    bundles.forEach(bundle => {
      // This function returns an array where each product_name is unique
      map[bundle.id] = getEditableVariants(HARDCODED_PANTRY, bundle.max_pax);
    });
    return map;
  }, [bundles]);

  useEffect(() => {
    const saved = localStorage.getItem('servewise_bundle_customizations');
    if (saved) setCustomSelections(JSON.parse(saved));
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [bundleRes, productRes] = await Promise.all([
          fetch(`https://servewise-market-backend.onrender.com/api/v1/bundles?pax=${paxQuery}`),
          fetch(`https://servewise-market-backend.onrender.com/api/v1/products`)
        ]);

        const bundleData = await bundleRes.json();
        const productData = await productRes.json();

        setBundles(bundleData);
        setAllProducts(productData);
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [paxQuery]);

  const handleToggleItem = (bundle, variantId) => {
    const variantData = pantryMap[variantId];
    const minItems = bundle.max_pax === 5 ? 3 : 2;

    // 🚫 BLOCK if main item
    if (!variantData || variantData.main) return;

    const bundleId = bundle.id;

    setCustomSelections(prev => {
      const currentItems = prev[bundleId] || bundle.bundle_items;
      const exists = currentItems.find(i => i.product_variant_id === variantId);

      // 🛑 MINIMUM CHECK: If item exists (trying to uncheck) and count is <= 3, block it.
      if (exists && currentItems.length <= minItems) {
        alert(`Selection must have at least ${minItems} items.`);
        return prev;
      }

      let newItems;
      if (exists) {
        newItems = currentItems.filter(i => i.product_variant_id !== variantId);
      } else {
        const smartQty = calculateSmartQuantity(variantData?.pax, bundle.max_pax);
        newItems = [...currentItems, {
          product_variant_id: variantId,
          quantity: smartQty,
          price: variantData?.price || 0
        }];
      }

      const updated = { ...prev, [bundleId]: newItems };
      // ✅ REMEMBER SELECTION: Saves to local storage for future interactions
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

  const handleDownloadPoster = async (bundle) => {
    const activeItems = customSelections[bundle.id] || bundle.bundle_items || [];

    // ✅ SORT SAME AS UI (main first)
    const sortedItems = [...activeItems].sort((a, b) => {
      const itemA = pantryMap[a.product_variant_id];
      const itemB = pantryMap[b.product_variant_id];

      const isMainA = itemA?.main ? 1 : 0;
      const isMainB = itemB?.main ? 1 : 0;

      return isMainB - isMainA;
    });

    const rawTotal = sortedItems.reduce((acc, item) => {
      const pMapInfo = pantryMap[item.product_variant_id];

      const unitPrice = (pMapInfo && pMapInfo.price > 0)
        ? pMapInfo.price
        : (parseFloat(item.price) || 0);

      return acc + (unitPrice * (item.quantity || 1));
    }, 0);

    const designedPrice = getDesignedBundlePrice(rawTotal, paxQuery);

    const displayBundle = {
      ...bundle,
      bundle_items: sortedItems,
      designed_price: designedPrice
    };

    setSelectedBundle(displayBundle);
    setGeneratingId(bundle.id);

    requestAnimationFrame(async () => {
      requestAnimationFrame(async () => {
        const node = document.getElementById('ma-donna-poster-final');
        if (!node) {
          console.error("Poster node not found");
          setGeneratingId(null);
          return;
        }

        try {
          const dataUrl = await htmlToImage.toPng(node, {
            pixelRatio: 2,
            cacheBust: true,
            useCORS: true
          });

          const link = document.createElement('a');
          link.download = `MaDonna_${bundle.name.replace(/\s+/g, '_')}.png`;
          link.href = dataUrl;
          link.click();
        } catch (err) {
          console.error("Download failed:", err);
        } finally {
          setGeneratingId(null);
        }
      });
    });
  };

  return (
    <div className="min-h-screen bg-[url('https://images.unsplash.com/photo-1516062423079-7ca13cdc7f5a?q=80&w=2083')] bg-cover bg-fixed p-6 font-sans">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>

      <div className="relative z-10 max-w-5xl mx-auto">
        <header className="flex justify-between items-center mb-10 Montserrat">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-white/80 hover:text-white transition-colors font-bold uppercase text-xs tracking-widest"
          >
            <ChevronLeft size={18} /> Change Pax
          </button>

          <div className="text-right flex flex-col items-end">
            {/* LOGO REPLACEMENT */}
            <img
              src={logo}
              alt="Ma'Donna Delicacies"
              className="w-32 md:w-44 h-auto drop-shadow-logo animate-float"
            />
          </div>
        </header>

        {loading ? (
          <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {bundles.map((bundle) => {
              const isEditing = editingId === bundle.id;
              const activeItems = customSelections[bundle.id] || bundle.bundle_items || [];
              const activeIds = activeItems.map(i => i.product_variant_id);

              const displayBundle = { ...bundle, bundle_items: activeItems };
              const smartSidesForThisBundle = smartSidesMap[bundle.id] || [];
              const itemsToShowRaw = isEditing
                ? [...new Set([...activeIds, ...smartSidesForThisBundle.map(v => v.rails_variant_id)])]
                : activeIds;

              // ✅ SORT: main items first
              const itemsToShow = itemsToShowRaw.sort((a, b) => {
                const itemA = pantryMap[a];
                const itemB = pantryMap[b];

                const isMainA = itemA?.main ? 1 : 0;
                const isMainB = itemB?.main ? 1 : 0;

                return isMainB - isMainA; // main=true goes first
              });

              // CALCULATION: Recalculate on every toggle
              const currentTotalPrice = activeItems.reduce((acc, item) => {
                const pMapInfo = pantryMap[item.product_variant_id];
                // Priority: Hydrated Map (Hardcoded) -> Item Property -> 0
                const unitPrice = (pMapInfo && pMapInfo.price > 0)
                  ? pMapInfo.price
                  : (parseFloat(item.price) || 0);

                return acc + (unitPrice * (item.quantity || 1));
              }, 0);

              const rawTotal = currentTotalPrice;
              const designedPrice = getDesignedBundlePrice(rawTotal, paxQuery);

              return (
                <div key={bundle.id} className="group relative bg-orange-50/95 rounded-3xl overflow-hidden shadow-2xl flex flex-col border-b-8 border-emerald-900 transition-all hover:shadow-emerald-900/20">
                  <div className="p-8 pb-0">
                    <div className="flex justify-between items-start mb-4 Montserrat">
                      <button
                        onClick={() => setEditingId(isEditing ? null : bundle.id)}
                        className={`flex items-center gap-2 text-[9px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest transition-all ${isEditing ? 'bg-orange-600 text-white animate-pulse' : 'bg-emerald-800 text-white hover:bg-emerald-700'}`}
                      >
                        {isEditing ? <Save size={12} /> : <Edit3 size={12} />}
                        {isEditing ? 'Finish Editing' : 'Edit Inclusions'}
                      </button>

                      <button
                        onClick={() => handleDownloadPoster(bundle)}
                        disabled={generatingId === bundle.id}
                        className="group flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-stone-500 hover:text-emerald-700 transition-colors"
                      >
                        <Share2 size={14} className="group-hover:rotate-12 transition-transform" />
                        {generatingId === bundle.id ? "Processing..." : "Export Poster"}
                      </button>
                    </div>

                    <h2 className="text-3xl font-black text-stone-800 tracking-tighter leading-none mb-2 uppercase Montserrat">{bundle.name}</h2>
                    <div className="flex items-center gap-4 Montserrat">
                      <p className="text-stone-400 font-bold text-xs uppercase flex items-center gap-1.5">
                        <Users size={14} />
                        {bundle.min_pax === bundle.max_pax
                          ? `${bundle.max_pax} Pax`
                          : `${bundle.min_pax}-${bundle.max_pax} Pax`
                        }
                      </p>
                      <p className="text-orange-700 font-bold text-xs uppercase flex items-center gap-1.5">
                        <Clock size={14} /> {bundle.lead_time_days || 2} Days
                      </p>
                    </div>
                  </div>

                  <div className="p-8 pt-6 flex-grow">
                    <div className={`rounded-2xl p-5 border relative transition-all ${isEditing ? 'bg-white border-orange-200' : 'bg-emerald-900/5 border-emerald-900/10'}`}>
                      <div className="flex justify-between items-center mb-4 Montserrat">
                        <h3 className="text-[10px] font-black text-emerald-900 uppercase tracking-widest italic">
                          {isEditing ? 'Product Checklist:' : 'The Set List:'}
                        </h3>
                        {isEditing && (
                          <button onClick={() => resetBundle(bundle.id)} className="text-[9px] text-orange-600 font-bold flex items-center gap-1 uppercase">
                            <RotateCcw size={10} /> Reset Default
                          </button>
                        )}
                      </div>

                      <ul className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar Montserrat">
                        {itemsToShow.map((variantId) => {
                          const pantryItem = pantryMap[variantId];

                          if (!pantryItem) {
                            console.warn('Missing pantry item for variantId:', variantId);
                            return null;
                          }

                          const isMain = pantryItem?.main === true;


                          const isSelected = activeIds.includes(variantId);
                          const itemInSelection = activeItems.find(i => i.product_variant_id === variantId);

                          const quantity = isSelected
                            ? itemInSelection.quantity
                            : calculateSmartQuantity(pantryItem.pax, bundle.max_pax);

                          const unitPrice = (pantryItem?.price > 0)
                            ? pantryItem.price
                            : (parseFloat(itemInSelection?.price) || 0);

                          const totalPrice = unitPrice * quantity;

                          return (
                            <li
                              key={variantId}
                              onClick={() => isEditing && !isMain && handleToggleItem(bundle, variantId)}
                              className={`text-sm font-bold flex items-center gap-3 transition-all 
                                ${isEditing && !isMain ? 'cursor-pointer p-2 rounded-lg hover:bg-emerald-50/50' : ''} 
                                ${isMain ? 'opacity-100 cursor-not-allowed' : ''}
                                ${isSelected ? 'text-stone-700' : 'text-stone-400'}
                              `}
                            >
                              <div className={`w-5 h-5 rounded flex items-center justify-center transition-all border-2 
                                ${isMain
                                  ? 'bg-emerald-300 border-emerald-300'
                                  : isSelected
                                    ? 'bg-emerald-600 border-emerald-600'
                                    : 'bg-transparent border-stone-300'
                                }`}
                              >
                                {(isSelected || isMain) && (
                                  <Check size={14} className="text-white stroke-[4px]" />
                                )}
                              </div>
                              <div className="flex justify-between items-center w-full">
                                <span>
                                  {formatItemName(pantryItem, quantity)}
                                </span>

                                {isEditing && (
                                  <span
                                    className={`text-[10px] font-black whitespace-nowrap
        ${isSelected ? 'text-emerald-700' : 'text-stone-400'}
      `}
                                  >
                                    ₱{totalPrice.toLocaleString()}
                                  </span>
                                )}
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  </div>

                  <div className="p-8 pt-0 mt-auto">
                    <div className="flex items-center justify-between gap-4 Montserrat">
                      <div>
                        <span className="block text-[10px] font-black text-stone-400 uppercase tracking-widest">
                          {isEditing ? 'Live Custom Price' : 'Bundle Price'}
                        </span>
                        <div className="flex flex-col items-start">
                          {/* Original Price */}
                          <span className="text-sm text-stone-400 line-through font-bold">
                            ₱{rawTotal.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2
                            })}
                          </span>

                          {/* Discounted Designed Price */}
                          <span className="text-3xl font-black text-emerald-900 tracking-tighter">
                            ₱{designedPrice.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2
                            })}
                          </span>
                        </div>
                      </div>
                      <a
                        href="https://m.me/mb.castro.779"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-emerald-800 hover:bg-emerald-900 text-white px-3 py-4 rounded-2xl font-black tracking-widest uppercase text-xs shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95"
                      >
                        <MessageCircle size={18} />
                        Order Now
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ✅ HIDDEN POSTER RENDER (REQUIRED FOR DOWNLOAD) */}
      <div style={{ position: 'absolute', top: '-9999px', left: '-9999px' }}>
        {selectedBundle && (
          <div id="ma-donna-poster-final">
            <PosterTemplate bundle={selectedBundle} pantryMap={pantryMap} />
          </div>
        )}
      </div>
    </div>
  );
};

export default BundleList;
