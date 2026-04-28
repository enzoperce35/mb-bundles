import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { HARDCODED_PANTRY } from '../constants/bundleMenu';
import { ChevronLeft, X, Download, Info, Share2 } from 'lucide-react';
import { getEditableVariants, calculateSmartQuantity } from '../utils/bundleLogic';
import * as htmlToImage from 'html-to-image';
import PosterTemplate from '../components/PosterTemplate';
import logo from '../assets/images/mb-logo-warm-golden-yellow-removebg-preview.png';
import { getDesignedBundlePrice } from '../utils/discountLogic';
import BundleCard from '../components/BundleCard';

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
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedBundle, setSelectedBundle] = useState(null);
  const [generatingId, setGeneratingId] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const [editingId, setEditingId] = useState(null);
  const [customSelections, setCustomSelections] = useState({});
  const [isUpdating, setIsUpdating] = useState(false);

  const flatPantry = useMemo(() => flattenPantry(HARDCODED_PANTRY), []);

  // HYDRATED PANTRY MAP
  const pantryMap = useMemo(() => {
    const map = {};
    flatPantry.forEach(item => {
      map[item.rails_variant_id] = {
        ...item,
        price: parseFloat(item.price || 0)
      };
    });
    allProducts.forEach(product => {
      product.product_variants?.forEach(variant => {
        if (map[variant.id]) {
          map[variant.id].price = parseFloat(variant.price || 0);
        }
      });
    });
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
      map[bundle.id] = getEditableVariants(HARDCODED_PANTRY, bundle.max_pax);
    });
    return map;
  }, [bundles]);

  // Load customizations from LocalStorage
  useEffect(() => {
    const saved = localStorage.getItem('servewise_bundle_customizations');
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved);
      const validVariantIds = new Set(flatPantry.map(p => p.rails_variant_id));
      const cleaned = Object.fromEntries(
        Object.entries(parsed).map(([bundleId, items]) => [
          bundleId,
          items.filter(i => validVariantIds.has(i.product_variant_id))
        ])
      );
      setCustomSelections(cleaned);
    } catch {
      localStorage.removeItem('servewise_bundle_customizations');
    }
  }, [flatPantry]);

  // Fetch API Data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [bundleRes, productRes] = await Promise.all([
          fetch(`https://servewise-market-backend.onrender.com/api/v1/bundles?pax=${paxQuery}`),
          fetch(`https://servewise-market-backend.onrender.com/api/v1/products`)
        ]);
        setBundles(await bundleRes.json());
        setAllProducts(await productRes.json());
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [paxQuery]);

  const handleToggleItem = (bundle, variantId) => {
    if (isUpdating) return;
    const variantData = pantryMap[variantId];
    if (!variantData || variantData.main) return;

    setIsUpdating(true);
    setCustomSelections(prev => {
      const currentItems = prev[bundle.id] || bundle.bundle_items || [];
      const exists = currentItems.find(i => i.product_variant_id === variantId);
      let newItems;

      if (exists) {
        newItems = currentItems.filter(i => i.product_variant_id !== variantId);
      } else {
        const smartQty = calculateSmartQuantity(variantData?.pax, bundle.max_pax);
        newItems = [...currentItems, {
          product_variant_id: variantId,
          quantity: smartQty,
          price: variantData?.price || 0,
          _clickedAt: Date.now()
        }];
      }
      const updated = { ...prev, [bundle.id]: newItems };
      localStorage.setItem('servewise_bundle_customizations', JSON.stringify(updated));
      return updated;
    });
    setTimeout(() => setIsUpdating(false), 16);
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
    const sortedItems = [...activeItems].sort((a, b) => {
      const isMainA = pantryMap[a.product_variant_id]?.main ? 1 : 0;
      const isMainB = pantryMap[b.product_variant_id]?.main ? 1 : 0;
      return isMainB - isMainA;
    });

    const rawTotal = sortedItems.reduce((acc, item) => {
      const pMapInfo = pantryMap[item.product_variant_id];
      const unitPrice = (pMapInfo && pMapInfo.price > 0) ? pMapInfo.price : (parseFloat(item.price) || 0);
      return acc + (unitPrice * (item.quantity || 1));
    }, 0);

    const designedPrice = getDesignedBundlePrice(rawTotal, paxQuery);

    setSelectedBundle({
      ...bundle,
      bundle_items: sortedItems,
      designed_price: designedPrice
    });
    setGeneratingId(bundle.id);

    // Give DOM time to mount the PosterTemplate in the hidden container
    setTimeout(async () => {
      const node = document.getElementById('ma-donna-poster-final');
      if (!node) {
        setGeneratingId(null);
        return;
      }

      try {
        const dataUrl = await htmlToImage.toPng(node, {
          pixelRatio: 2,
          cacheBust: true,
          useCORS: true
        });

        const isMessenger = /FBAN|FBAV|Instagram|Messenger/i.test(navigator.userAgent);

        if (isMessenger) {
          // --- NEW LOGIC START ---
          // Convert Base64 to a Blob
          const response = await fetch(dataUrl);
          const blob = await response.blob();
          // Create a temporary "File-like" URL
          const blobUrl = URL.createObjectURL(blob);
          setPreviewUrl(blobUrl);
          // --- NEW LOGIC END ---
        } else {
          // Standard browser download
          const link = document.createElement('a');
          link.download = `MaDonna_${bundle.name.replace(/\s+/g, '_')}.png`;
          link.href = dataUrl;
          link.click();
        }
      } catch (err) {
        console.error("Capture failed:", err);
      }
    }, 800);
  };


  const handleNativeShare = async () => {
    if (!previewUrl) return;

    try {
      const response = await fetch(previewUrl);
      const blob = await response.blob();
      // We create a physical file object from the blob
      const file = new File([blob], `MaDonna_Poster.png`, { type: "image/png" });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Ma\'Donna Delicacies',
          text: 'Check out our custom bundle!',
        });
      } else {
        // If native share fails, we try to open the blob in a new window as a fallback
        window.open(previewUrl, '_blank');
      }
    } catch (error) {
      console.error('Share failed:', error);
      alert("Please take a screenshot or long-press the image to save.");
    }
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
          <img src={logo} alt="Ma'Donna" className="w-32 md:w-44 h-auto drop-shadow-logo animate-float" />
        </header>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {bundles.map(bundle => (
              <BundleCard
                key={bundle.id}
                bundle={bundle}
                pantryMap={pantryMap}
                smartSides={smartSidesMap[bundle.id]}
                customSelections={customSelections}
                editingId={editingId}
                setEditingId={setEditingId}
                handleToggleItem={handleToggleItem}
                resetBundle={resetBundle}
                handleDownloadPoster={handleDownloadPoster}
                generatingId={generatingId}
                paxQuery={paxQuery}
              />
            ))}
          </div>
        )}
      </div>

      {/* --- MESSENGER PREVIEW MODAL --- */}
      {previewUrl && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center p-4 backdrop-blur-md">
          <div className="relative w-full max-w-lg">
            {/* Close Button */}
            <button
              onClick={() => setPreviewUrl(null)}
              className="absolute -top-14 right-0 bg-white/10 text-white p-3 rounded-full"
            >
              <X size={28} />
            </button>

            {/* Image Container: select-none is critical here */}
            <div className="bg-white p-2 rounded-3xl shadow-2xl overflow-hidden select-none">
              <img
                src={previewUrl}
                alt="Poster Preview"
                className="w-full h-auto rounded-2xl pointer-events-auto"
                style={{
                  WebkitTouchCallout: 'default', // Specifically for iOS/Messenger save menu
                  WebkitUserSelect: 'none',
                  userSelect: 'none',
                  touchAction: 'manipulation'
                }}
              />
            </div>

            <div className="mt-8 flex flex-col items-center gap-4 Montserrat">
              {/* ACTION BUTTON: This now calls the share function */}
              <button
                onClick={handleNativeShare}
                className="flex items-center gap-3 bg-emerald-600 hover:bg-emerald-700 text-white px-10 py-4 rounded-full font-black uppercase tracking-widest shadow-xl transition-all active:scale-95"
              >
                <Share2 size={22} />
                Save or Send Poster
              </button>

              <div className="flex items-center gap-2 text-white/50 text-[10px] uppercase tracking-widest font-bold">
                <Info size={12} />
                <span>Tap button to Share • Long-press to Save</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- HIDDEN POSTER RENDER --- */}
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
