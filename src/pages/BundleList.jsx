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
  const [generatingId, setGeneratingId] = useState(null);

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

    setSelectedBundle(orderPayload);
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
                setCustomSelections={setCustomSelections}
                handleOrderNow={handleOrderNow}
                generatingId={generatingId}
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
              {orderStep === "ready" && (
                <>
                  <h2 className="text-lg font-bold mb-2">
                    Your order is ready!
                  </h2>

                  <p className="text-xs text-gray-500 mb-4">
                    You can now copy or send it to Messenger.
                  </p>

                  <button
                    onClick={handleCopyOrder}
                    className="bg-emerald-600 text-white px-4 py-2 rounded w-full mb-2"
                  >
                    Copy Order
                  </button>

                  <button
                    onClick={handleOpenMessenger}
                    className="bg-blue-600 text-white px-4 py-2 rounded w-full"
                  >
                    Open Messenger
                  </button>
                </>
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
