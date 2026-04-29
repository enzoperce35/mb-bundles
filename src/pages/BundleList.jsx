import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import * as htmlToImage from 'html-to-image';

// Custom Parts
import { HARDCODED_PANTRY } from '../constants/bundleMenu';
import { getEditableVariants, calculateSmartQuantity } from '../utils/bundleLogic';
import { getDesignedBundlePrice } from '../utils/discountLogic';
import { uploadToCloudinary, flattenPantry } from '../services/orderService';
import PosterTemplate from '../components/PosterTemplate';
import BundleCard from '../components/BundleCard';
import OrderModal from '../components/OrderModal';
import logo from '../assets/images/mb-logo-warm-golden-yellow-removebg-preview.png';

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

  // Modal State
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [orderStep, setOrderStep] = useState("idle");
  const [finalOrderMessage, setFinalOrderMessage] = useState("");

  const flatPantry = useMemo(() => flattenPantry(HARDCODED_PANTRY), []);

  const pantryMap = useMemo(() => {
    const map = {};
    flatPantry.forEach(item => { map[item.rails_variant_id] = { ...item, price: parseFloat(item.price || 0) }; });
    allProducts.forEach(product => {
      product.product_variants?.forEach(v => { if (map[v.id]) map[v.id].price = parseFloat(v.price || 0); });
    });
    bundles.forEach(b => b.bundle_items?.forEach(bi => {
      if (map[bi.product_variant_id]?.price === 0) map[bi.product_variant_id].price = parseFloat(bi.price || 0);
    }));
    return map;
  }, [flatPantry, bundles, allProducts]);

  const smartSidesMap = useMemo(() => {
    const map = {};
    bundles.forEach(b => { map[b.id] = getEditableVariants(HARDCODED_PANTRY, b.max_pax); });
    return map;
  }, [bundles]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [bRes, pRes] = await Promise.all([
          fetch(`https://servewise-market-backend.onrender.com/api/v1/bundles?pax=${paxQuery}`),
          fetch(`https://servewise-market-backend.onrender.com/api/v1/products`)
        ]);
        setBundles(await bRes.json());
        setAllProducts(await pRes.json());
      } catch (err) { console.error(err); } finally { setLoading(false); }
    };
    fetchData();
  }, [paxQuery]);

  const handleToggleItem = (bundle, variantId) => {
    if (isUpdating || pantryMap[variantId]?.main) return;
    setIsUpdating(true);
    setCustomSelections(prev => {
      const items = prev[bundle.id] || bundle.bundle_items || [];
      const exists = items.find(i => i.product_variant_id === variantId);
      const newItems = exists ? items.filter(i => i.product_variant_id !== variantId) : 
        [...items, { product_variant_id: variantId, quantity: calculateSmartQuantity(pantryMap[variantId]?.pax, bundle.max_pax), price: pantryMap[variantId]?.price || 0 }];
      localStorage.setItem('servewise_bundle_customizations', JSON.stringify({ ...prev, [bundle.id]: newItems }));
      return { ...prev, [bundle.id]: newItems };
    });
    setTimeout(() => setIsUpdating(false), 16);
  };

  const handleOrderNow = async (bundle) => {
    const activeItems = customSelections[bundle.id] || bundle.bundle_items || [];
    const sorted = [...activeItems].sort((a, b) => (pantryMap[b.product_variant_id]?.main ? 1 : 0) - (pantryMap[a.product_variant_id]?.main ? 1 : 0));
    const total = sorted.reduce((acc, i) => acc + ((pantryMap[i.product_variant_id]?.price || 0) * (i.quantity || 1)), 0);
    const price = getDesignedBundlePrice(total, paxQuery);

    setSelectedBundle({ ...bundle, bundle_items: sorted, designed_price: price });
    setOrderModalOpen(true);
    setOrderStep("loading");

    try {
      setTimeout(async () => {
        const node = document.getElementById("ma-donna-poster-final");
        const dataUrl = await htmlToImage.toPng(node, { pixelRatio: 0.5, cacheBust: true, useCORS: true });
        const cloudUrl = await uploadToCloudinary(dataUrl);
        const itemsText = sorted.map(i => `- ${pantryMap[i.product_variant_id]?.product_name || "Item"} x${i.quantity}`).join("\n");
        setFinalOrderMessage(`Greetings! 🍽️ NEW ORDER\n\n📦 Bundle: ${bundle.bundle_name}\n👥 Pax: ${paxQuery}\n\n🧾 Items:\n${itemsText}\n\n💰 Total: ₱${price}\n\n📎 Image: ${cloudUrl}`);
        setOrderStep("ready");
      }, 500);
    } catch { setOrderStep("error"); }
  };

  return (
    <div className="min-h-screen bg-[url('https://images.unsplash.com/photo-1516062423079-7ca13cdc7f5a?q=80&w=2083')] bg-cover bg-fixed p-6">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="relative z-10 max-w-5xl mx-auto">
        <header className="flex justify-between items-center mb-10">
          <button onClick={() => navigate('/')} className="text-white/80 font-bold uppercase text-xs tracking-widest flex items-center gap-2"><ChevronLeft size={18} /> Change Pax</button>
          <img src={logo} alt="Ma'Donna" className="w-32 md:w-44" />
        </header>

        {loading ? <div className="flex justify-center py-20 animate-spin h-12 w-12 border-b-2 border-emerald-500 rounded-full mx-auto" /> : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {bundles.map(b => (
              <BundleCard key={b.id} bundle={b} pantryMap={pantryMap} smartSides={smartSidesMap[b.id]} customSelections={customSelections} editingId={editingId} setEditingId={setEditingId} handleToggleItem={handleToggleItem} resetBundle={() => setEditingId(null)} handleOrderNow={handleOrderNow} paxQuery={paxQuery} />
            ))}
          </div>
        )}

        <div style={{ position: 'fixed', left: '-100vw', top: 0, opacity: 0, pointerEvents: 'none' }}>
          {selectedBundle && <div id="ma-donna-poster-final"><PosterTemplate bundle={selectedBundle} pantryMap={pantryMap} /></div>}
        </div>

        <OrderModal 
          isOpen={orderModalOpen} 
          step={orderStep} 
          onCopy={() => { navigator.clipboard.writeText(finalOrderMessage); alert("Copied!"); }} 
          onOpenMessenger={() => window.open("https://m.me/mb.castro.779", "_blank")} 
          onClose={() => setOrderModalOpen(false)} 
        />
      </div>
    </div>
  );
};

export default BundleList;
