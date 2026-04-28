import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { HARDCODED_PANTRY } from '../constants/bundleMenu';
import { ChevronLeft, X, Info, Share2 } from 'lucide-react';
import { getEditableVariants, calculateSmartQuantity } from '../utils/bundleLogic';
import * as htmlToImage from 'html-to-image';
import PosterTemplate from '../components/PosterTemplate';
import logo from '../assets/images/mb-logo-warm-golden-yellow-removebg-preview.png';
import { getDesignedBundlePrice } from '../utils/discountLogic';
import BundleCard from '../components/BundleCard';

const isMessengerWebView = () => {
  const ua = navigator.userAgent || '';
  return /FBAN|FBAV|Instagram|Messenger/i.test(ua);
};

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
        const id = bi.product_variant_id;
        if (map[id] && map[id].price === 0) {
          map[id].price = parseFloat(bi.price || 0);
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

  useEffect(() => {
    const saved = localStorage.getItem('servewise_bundle_customizations');
    if (!saved) return;

    try {
      const parsed = JSON.parse(saved);
      setCustomSelections(parsed);
    } catch {
      localStorage.removeItem('servewise_bundle_customizations');
    }
  }, []);

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
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [paxQuery]);

  const handleToggleItem = (bundle, variantId) => {
    if (isUpdating) return;

    const variant = pantryMap[variantId];
    if (!variant || variant.main) return;

    setIsUpdating(true);

    setCustomSelections(prev => {
      const current = prev[bundle.id] || bundle.bundle_items || [];
      const exists = current.find(i => i.product_variant_id === variantId);

      let updatedItems;

      if (exists) {
        updatedItems = current.filter(i => i.product_variant_id !== variantId);
      } else {
        const qty = calculateSmartQuantity(variant?.pax, bundle.max_pax);
        updatedItems = [
          ...current,
          {
            product_variant_id: variantId,
            quantity: qty,
            price: variant?.price || 0,
            _clickedAt: Date.now()
          }
        ];
      }

      const updated = { ...prev, [bundle.id]: updatedItems };
      localStorage.setItem('servewise_bundle_customizations', JSON.stringify(updated));

      return updated;
    });

    setTimeout(() => setIsUpdating(false), 100);
  };

  const handleDownloadPoster = async (bundle) => {
    const items = customSelections[bundle.id] || bundle.bundle_items || [];

    const sorted = [...items];

    const total = sorted.reduce((acc, item) => {
      const p = pantryMap[item.product_variant_id];
      const price = p?.price || item.price || 0;
      return acc + price * (item.quantity || 1);
    }, 0);

    const designed = getDesignedBundlePrice(total, paxQuery);

    setSelectedBundle({
      ...bundle,
      bundle_items: sorted,
      designed_price: designed
    });

    setGeneratingId(bundle.id);

    setTimeout(async () => {
      const node = document.getElementById('ma-donna-poster-final');
      if (!node) return;

      try {
        const dataUrl = await htmlToImage.toPng(node, {
          pixelRatio: 2,
          cacheBust: true,
          useCORS: true
        });

        if (isMessengerWebView()) {
          // Messenger-safe: no blob URL
          setPreviewUrl(dataUrl);
        } else {
          const a = document.createElement('a');
          a.download = `MaDonna_${bundle.name}.png`;
          a.href = dataUrl;
          a.click();
        }
      } catch (err) {
        console.error(err);
      } finally {
        setGeneratingId(null);
      }
    }, 500);
  };

  const handleNativeShare = async () => {
    if (!previewUrl) return;

    try {
      const res = await fetch(previewUrl);
      const blob = await res.blob();
      const file = new File([blob], 'MaDonna_Poster.png', { type: 'image/png' });

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "Ma'Donna Delicacies",
          text: 'Check out our bundle!'
        });
      } else {
        window.open(previewUrl, '_blank');
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-[url('https://images.unsplash.com/photo-1516062423079-7ca13cdc7f5a?q=80&w=2083')] bg-cover bg-fixed p-6 font-sans relative">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>
        <div className="relative z-10 max-w-5xl mx-auto">

        <header className="flex justify-between items-center mb-10">
          <button onClick={() => navigate('/')} className="text-white">
            <ChevronLeft /> Back
          </button>
          <img src={logo} className="w-32" />
        </header>

        {loading ? (
          <div className="text-white">Loading...</div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
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
                handleDownloadPoster={handleDownloadPoster}
                generatingId={generatingId}
                paxQuery={paxQuery}
              />
            ))}
          </div>
        )}
      </div>

      {/* PREVIEW MODAL */}
      {previewUrl && (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center p-4">

          <button
            onClick={() => setPreviewUrl(null)}
            className="absolute top-6 right-6 text-white"
          >
            <X size={28} />
          </button>

          <div className="bg-white p-2 rounded-2xl max-w-md w-full">
            <img src={previewUrl} className="w-full h-auto rounded-xl" />
          </div>

          <div className="mt-6 flex flex-col gap-3 items-center">

            {isMessengerWebView() ? (
              <>
                <button
                  onClick={handleNativeShare}
                  className="bg-emerald-600 text-white px-8 py-3 rounded-full"
                >
                  Share Poster
                </button>

                <button
                  onClick={() => window.open(previewUrl, '_blank')}
                  className="text-white text-xs underline"
                >
                  Open in browser to download
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleNativeShare}
                  className="bg-emerald-600 text-white px-8 py-3 rounded-full"
                >
                  Share / Save
                </button>

                <button
                  onClick={() => {
                    const a = document.createElement('a');
                    a.href = previewUrl;
                    a.download = 'poster.png';
                    a.click();
                  }}
                  className="text-white text-xs underline"
                >
                  Download
                </button>
              </>
            )}

            <p className="text-white/50 text-xs flex items-center gap-1">
              <Info size={12} /> Use share button for Messenger
            </p>
          </div>
        </div>
      )}

      {/* hidden poster */}
      <div className="absolute -left-[9999px] top-0">
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
