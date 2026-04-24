import React, { useMemo, useState } from 'react';
import { X, Download, Loader2 } from 'lucide-react';
import * as htmlToImage from 'html-to-image';

// --- PREMIUM POSTER TEMPLATE (REVISED LAYOUT) ---
const PosterTemplate = ({ bundle, pantryMap }) => {
  const images = useMemo(() => {
    if (!bundle?.bundle_items) return [];
    const unique = Array.from(
      new Map(
        bundle.bundle_items.map(bi => [
          bi.product_variant_id,
          pantryMap[bi.product_variant_id]
        ])
      ).values()
    );
    return unique.filter(i => i?.public_id).slice(0, 4);
  }, [bundle, pantryMap]);

  // Recalculate price for poster accuracy
  const dynamicTotalPrice = useMemo(() => {
    if (!bundle?.bundle_items) return 0;
    return bundle.bundle_items.reduce((acc, item) => {
      const pMapInfo = pantryMap[item.product_variant_id];
      const unitPrice = (pMapInfo && pMapInfo.price > 0) 
        ? pMapInfo.price 
        : (parseFloat(item.price) || 0);
      return acc + (unitPrice * (item.quantity || 1));
    }, 0);
  }, [bundle, pantryMap]);

  const finalPrice = dynamicTotalPrice > 0 ? dynamicTotalPrice : parseFloat(bundle.price || 0);

  return (
    <div
      id="ma-donna-poster-final"
      className="w-[1200px] h-[1600px] bg-[#FFFBF5] flex overflow-hidden font-sans border-[16px] border-white"
    >
      <div className="w-[65%] p-24 flex flex-col justify-between">
        <div>
          <h1 className="text-8xl font-black text-stone-900 Montserrat tracking-tighter uppercase leading-[0.8]">
            {bundle.name}
          </h1>
          <div className="h-2 w-32 bg-emerald-800 mt-10"></div>
        </div>

        <div className="flex-grow flex flex-col justify-center">
          <h3 className="text-2xl font-black text-emerald-900 uppercase tracking-[0.2em] mb-8 italic Montserrat">
            The Set List:
          </h3>
          <ul className="space-y-6">
            {bundle.bundle_items?.map((bi, i) => {
              const pantryItem = pantryMap[bi.product_variant_id];
              if (!pantryItem) return null;
              const quantity = bi.quantity || 1;
              const itemName = pantryItem?.name || bi.product?.name || 'Item';

              let displayName = pantryItem?.count 
                ? `${quantity * pantryItem.count} pcs ${itemName}` 
                : `${quantity} ${itemName}`;

              return (
                <li key={i} className="text-4xl font-bold text-stone-700 flex items-start gap-5 Montserrat">
                  <span className="text-emerald-600 mt-1">▪</span>
                  <span>{displayName}</span>
                </li>
              );
            })}
          </ul>
        </div>

        <div>
          <p className="text-[120px] font-black text-emerald-900 Montserrat tracking-tighter leading-none mb-4">
            ₱{finalPrice.toLocaleString()}
          </p>
          <p className="text-3xl font-black text-orange-600 uppercase tracking-[0.2em] Montserrat">
            {bundle.lead_time_days || 2}-Day Lead Time
          </p>
        </div>
      </div>

      <div className="w-[35%] flex flex-col gap-2 bg-stone-200 p-2">
        {images.map((item, i) => (
          <div key={i} className="flex-grow overflow-hidden rounded-lg shadow-sm bg-stone-300">
            <img
              src={`https://res.cloudinary.com/dvgveqqtj/image/upload/c_fill,w_600,h_800,q_auto,f_auto/${item.public_id}`}
              alt={item.product_name}
              className="w-full h-full object-cover"
              onError={(e) => { e.target.src = "https://via.placeholder.com/600x800?text=Ma'Donna+Dish"; }}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

const ShareModal = ({ isOpen, onClose, bundle, pantryMap }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  if (!isOpen || !bundle) return null;

  const handleDownload = async () => {
    const node = document.getElementById('ma-donna-poster-final');
    if (!node) return;
    setIsGenerating(true);
    try {
      const dataUrl = await htmlToImage.toPng(node, { pixelRatio: 2, cacheBust: true });
      const link = document.createElement('a');
      link.download = `MaDonna_${bundle.name.replace(/\s+/g, '_')}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Download failed:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 overflow-y-auto">
      <div className="relative bg-[#111] rounded-[2rem] max-w-4xl w-full border border-white/10 shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-300">
        <div className="p-6 flex justify-between items-center border-b border-white/5">
          <h3 className="text-white font-black uppercase text-[10px] tracking-widest Montserrat">Poster Preview</h3>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors"><X size={24} /></button>
        </div>
        <div className="p-10 flex justify-center items-center bg-stone-900/50 min-h-[500px] overflow-hidden">
          <div className="scale-[0.25] md:scale-[0.35] origin-center shadow-2xl transition-transform">
            <PosterTemplate bundle={bundle} pantryMap={pantryMap} />
          </div>
        </div>
        <div className="p-8 bg-black border-t border-white/5">
          <button
            onClick={handleDownload}
            disabled={isGenerating}
            className="w-full bg-emerald-700 hover:bg-emerald-600 text-white py-6 rounded-2xl font-black uppercase text-xs tracking-widest Montserrat flex items-center justify-center gap-3 transition-all active:scale-95 shadow-xl shadow-emerald-900/20"
          >
            {isGenerating ? <Loader2 className="animate-spin" size={20} /> : <Download size={20} />}
            {isGenerating ? "Processing High-Res..." : "Download Menu Poster"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;