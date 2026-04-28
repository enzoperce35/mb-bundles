import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { HARDCODED_PANTRY } from '../constants/bundleMenu';
import { ChevronLeft } from 'lucide-react';
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

  const [isUpdating, setIsUpdating] = useState(false);

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

        newItems = [
          ...currentItems,
          {
            product_variant_id: variantId,
            quantity: smartQty,
            price: variantData?.price || 0,
            _clickedAt: Date.now()
          }
        ];
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

    setTimeout(async () => {
      const node = document.getElementById('ma-donna-poster-final');
      if (!node) {
        console.error("Poster node not found");
        setGeneratingId(null);
        return;
      }

      try {
        const dataUrl = await htmlToImage.toPng(node, {
          pixelRatio: 1.5,
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
        setSelectedBundle(null);
      }
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

      {/* ✅ HIDDEN POSTER RENDER (REQUIRED FOR DOWNLOAD) */}
      <div style={{ position: 'absolute', top: '-9999px', left: '-9999px' }}>
        {generatingId && selectedBundle && (
          <div id="ma-donna-poster-final">
            <PosterTemplate bundle={selectedBundle} pantryMap={pantryMap} />
          </div>
        )}
      </div>
    </div>
  );
};

export default BundleList;
