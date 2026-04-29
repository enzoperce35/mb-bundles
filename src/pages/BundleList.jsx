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

/* =========================
   CLOUDINARY CONFIG
========================= */
const CLOUDINARY_UPLOAD_URL =
  "https://api.cloudinary.com/v1_1/dvgveqqtj/image/upload";

const CLOUDINARY_UPLOAD_PRESET =
  "servewise_unsigned";

/* =========================
   UPLOADER
========================= */
const uploadToCloudinary = async (base64Image) => {
  const formData = new FormData();
  formData.append("file", base64Image);
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

  const res = await fetch(CLOUDINARY_UPLOAD_URL, {
    method: "POST",
    body: formData
  });

  const data = await res.json();

  if (!data.secure_url) {
    throw new Error("Cloudinary upload failed");
  }

  return data.secure_url;
};

/* =========================
   FLATTEN PANTRY
========================= */
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

  const [editingId, setEditingId] = useState(null);
  const [customSelections, setCustomSelections] = useState({});
  const [isUpdating, setIsUpdating] = useState(false);


  /* =========================
     MODAL STATE (NEW)
  ========================= */
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [orderLoading, setOrderLoading] = useState(false);
  const [orderStep, setOrderStep] = useState("idle");
  const [orderMessage, setOrderMessage] = useState("");
  const [cloudUrl, setCloudUrl] = useState("");

  const flatPantry = useMemo(() => flattenPantry(HARDCODED_PANTRY), []);

  const [finalOrderMessage, setFinalOrderMessage] = useState("");
  const [finalCloudUrl, setFinalCloudUrl] = useState("");

  /* =========================
     PANTRY MAP
  ========================= */
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

  const handleToggleItem = (bundle, variantId) => {
    if (isUpdating) return;
  
    const variantData = pantryMap[variantId];
    // Prevent toggling if data is missing or if it's a 'Main' dish
    if (!variantData || variantData.main) return;
  
    setIsUpdating(true);
  
    setCustomSelections(prev => {
      const currentItems = prev[bundle.id] || bundle.bundle_items || [];
      const exists = currentItems.find(i => i.product_variant_id === variantId);
  
      let newItems;
      if (exists) {
        // Remove the item
        newItems = currentItems.filter(i => i.product_variant_id !== variantId);
      } else {
        // Add the item with a smart quantity based on pax
        const smartQty = calculateSmartQuantity(variantData?.pax, bundle.max_pax);
  
        newItems = [
          ...currentItems,
          {
            product_variant_id: variantId,
            quantity: smartQty,
            price: variantData?.price || 0,
          }
        ];
      }
  
      const updated = { ...prev, [bundle.id]: newItems };
      // Save to localStorage so selection is remembered for future interactions
      localStorage.setItem('servewise_bundle_customizations', JSON.stringify(updated));
      return updated;
    });
  
    // Small delay to prevent double-clicks
    setTimeout(() => setIsUpdating(false), 16);
  };

  /* =========================
     SMART SIDES
  ========================= */
  const smartSidesMap = useMemo(() => {
    const map = {};
    bundles.forEach(bundle => {
      map[bundle.id] = getEditableVariants(HARDCODED_PANTRY, bundle.max_pax);
    });
    return map;
  }, [bundles]);

  /* =========================
     FETCH DATA
  ========================= */
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

  useEffect(() => {
    const saved = localStorage.getItem('servewise_bundle_customizations');
    if (!saved) return;
  
    try {
      const parsed = JSON.parse(saved);
      // Safety check: ensure the saved items actually exist in our current pantry
      const validVariantIds = new Set(flatPantry.map(p => p.rails_variant_id));
  
      const cleaned = Object.fromEntries(
        Object.entries(parsed).map(([bundleId, items]) => [
          bundleId,
          items.filter(i => validVariantIds.has(i.product_variant_id))
        ])
      );
  
      setCustomSelections(cleaned);
    } catch (err) {
      console.error("Failed to load customizations", err);
      localStorage.removeItem('servewise_bundle_customizations');
    }
  }, [flatPantry]);

  /* =========================
     ORDER FLOW (MODAL PIPELINE)
  ========================= */
  const handleOrderNow = async (bundle) => {
    const activeItems = customSelections[bundle.id] || bundle.bundle_items || [];

    const sortedItems = [...activeItems].sort((a, b) => {
      const isMainA = pantryMap[a.product_variant_id]?.main ? 1 : 0;
      const isMainB = pantryMap[b.product_variant_id]?.main ? 1 : 0;
      return isMainB - isMainA;
    });

    const rawTotal = sortedItems.reduce((acc, item) => {
      const p = pantryMap[item.product_variant_id];
      const unitPrice = p?.price > 0 ? p.price : (parseFloat(item.price) || 0);
      return acc + (unitPrice * (item.quantity || 1));
    }, 0);

    const designedPrice = getDesignedBundlePrice(rawTotal, paxQuery);

    const orderPayload = {
      ...bundle,
      bundle_items: sortedItems,
      designed_price: designedPrice
    };

    setSelectedBundle({
      ...bundle,
      bundle_items: sortedItems,
      designed_price: designedPrice
    });
    setOrderModalOpen(true);
    setOrderStep("loading");

    try {
      setTimeout(async () => {
        const node = document.getElementById("ma-donna-poster-final");

        if (!node) {
          setOrderStep("error");
          return;
        }

        // 1. generate image
        const dataUrl = await htmlToImage.toPng(node, {
          pixelRatio: 0.5,
          cacheBust: true,
          useCORS: true
        });

        // 2. upload
        const cloudUrl = await uploadToCloudinary(dataUrl);

        // 3. build message
        const itemsText = sortedItems
          .map(i => {
            const p = pantryMap[i.product_variant_id];
            return `- ${p?.name || p?.product_name || "Item"} x${i.quantity}`;
          })
          .join("\n");

        const message = `
  🍽️ NEW ORDER - Ma'Donna Delicacies
  
  📦 Bundle: ${bundle.bundle_name || "Custom Bundle"}
  👥 Pax: ${paxQuery}
  
  🧾 Items:
  ${itemsText}
  
  💰 Total: ₱${designedPrice}
  
  📎 Image: ${cloudUrl}
        `.trim();

        setFinalOrderMessage(message);
        setFinalCloudUrl(cloudUrl);
        setOrderStep("ready");
      });
    } catch (err) {
      console.error(err);
      setOrderStep("error");
    }
  };

  /* =========================
     COPY ORDER
  ========================= */
  const handleCopyOrder = async () => {
    if (!finalOrderMessage) return;

    try {
      await navigator.clipboard.writeText(finalOrderMessage);
      alert("Order copied!");
    } catch (err) {
      // fallback
      const textarea = document.createElement("textarea");
      textarea.value = finalOrderMessage;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);

      alert("Order copied!");
    }
  };

  /* =========================
     OPEN MESSENGER
  ========================= */
  const handleOpenMessenger = () => {
    window.open(
      "https://m.me/mb.castro.779",
      "_blank",
      "noopener,noreferrer"
    );
  };

  const resetBundle = (bundleId) => {
    setCustomSelections(prev => {
      const updated = { ...prev };
      delete updated[bundleId];
      localStorage.setItem('servewise_bundle_customizations', JSON.stringify(updated));
      return updated;
    });
    setEditingId(null); // Close the edit UI
  };

  /* =========================
     UI
  ========================= */
  return (
    <div className="min-h-screen bg-[url('https://images.unsplash.com/photo-1516062423079-7ca13cdc7f5a?q=80&w=2083')] bg-cover bg-fixed p-6 font-sans">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>

      <div className="relative z-10 max-w-5xl mx-auto">

        {/* HEADER */}
        <header className="flex justify-between items-center mb-10 Montserrat">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-white/80 hover:text-white font-bold uppercase text-xs tracking-widest"
          >
            <ChevronLeft size={18} /> Change Pax
          </button>

          <img src={logo} alt="Ma'Donna" className="w-32 md:w-44 h-auto" />
        </header>

        {/* BUNDLES */}
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
                setCustomSelections={setCustomSelections}
                handleOrderNow={handleOrderNow}
                paxQuery={paxQuery}
              />
            ))}
          </div>
        )}

        {/* =========================
          HIDDEN POSTER (FIXED)
        ========================= */}
        <div
          style={{
            position: 'fixed',
            left: '-100vw',   // Move it far to the left instead of up
            top: 0,
            opacity: 0,       // Make it invisible
            pointerEvents: 'none' // Ensure users can't click it
          }}
          aria-hidden="true"
        >
          {selectedBundle && (
            <div id="ma-donna-poster-final">
              <PosterTemplate bundle={selectedBundle} pantryMap={pantryMap} />
            </div>
          )}
        </div>

        {/* =========================
            MODAL UI
        ========================= */}
        {orderModalOpen && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60">

            <div className="bg-white p-6 rounded-xl w-[90%] max-w-md text-center">

              {/* LOADING STATE */}
              {orderStep === "loading" && (
                <>
                  <h2 className="text-lg font-bold mb-2">
                    Preparing your order...
                  </h2>

                  <p className="text-sm text-gray-600">
                    Please wait while we generate your order and upload image.
                  </p>

                  <div className="mt-4 animate-spin h-8 w-8 border-b-2 border-emerald-600 mx-auto" />
                </>
              )}

              {/* READY STATE */}
              {/* READY STATE - Instruction Flow */}
              {orderStep === "ready" && (
                <div className="animate-in fade-in zoom-in duration-300 text-left">
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-3xl mb-2">
                      🍽️
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 Montserrat">Almost there!</h2>
                    <p className="text-gray-500 text-sm">Greetings! Finalize your orders with these 2 simple steps.</p>
                  </div>

                  <div className="space-y-6 mb-8">
                    {/* STEP 1 */}
                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-emerald-600 text-white rounded-full flex items-center justify-center font-bold">
                        1
                      </div>
                      <div>
                        <p className="font-bold text-gray-800">Copy your Order Details</p>
                        <p className="text-sm text-gray-600 mb-3">Click the button below to save a copy of your order details.</p>
                        <button
                          onClick={handleCopyOrder}
                          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold py-2 px-4 rounded-lg transition-all active:scale-95"
                        >
                          Copy Order Button
                        </button>
                      </div>
                    </div>

                    {/* STEP 2 */}
                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                        2
                      </div>
                      <div>
                        <p className="font-bold text-gray-800">Paste in Messenger</p>
                        <p className="text-sm text-gray-600 mb-3">Open our Messenger and simply "Paste" your copy.</p>
                        <button
                          onClick={handleOpenMessenger}
                          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold py-2 px-4 rounded-lg transition-all active:scale-95"
                        >
                          Open Messenger
                        </button>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setOrderModalOpen(false)}
                    className="w-full text-gray-400 text-xs text-center uppercase tracking-widest hover:text-gray-600 transition-colors"
                  >
                    Close Instructions
                  </button>
                </div>
              )}
              
              {/* ERROR STATE */}
              {orderStep === "error" && (
                <>
                  <h2 className="text-red-600 font-bold mb-2">
                    Something went wrong
                  </h2>

                  <button
                    onClick={() => setOrderModalOpen(false)}
                    className="bg-gray-800 text-white px-4 py-2 rounded"
                  >
                    Close
                  </button>
                </>
              )}

              {/* SAFETY FALLBACK (IMPORTANT) */}
              {!orderStep && (
                <>
                  <h2 className="text-lg font-bold mb-2">
                    Loading...
                  </h2>

                  <div className="mt-4 animate-spin h-8 w-8 border-b-2 border-emerald-600 mx-auto" />
                </>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default BundleList;
