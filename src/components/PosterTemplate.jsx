import React, { useMemo } from 'react';
import logo from '../assets/images/mb-logo-warm-golden-yellow-removebg-preview.png';

const PosterTemplate = ({ bundle, pantryMap }) => {
  // ✅ Dynamic Height Calculation to prevent cramping
  const dynamicHeight = useMemo(() => {
    const itemCount = bundle.bundle_items?.length || 0;
    if (itemCount <= 2) return 1400;
    if (itemCount >= 9) return 1800;
    
    const growthPerItem = (1800 - 1400) / (9 - 2); 
    return 1400 + Math.round((itemCount - 2) * growthPerItem);
  }, [bundle.bundle_items]);

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

  const finalPrice = parseFloat(bundle.designed_price || 0);

  return (
    <div
      id="ma-donna-poster-final"
      style={{ height: `${dynamicHeight}px` }}
      className="w-[1200px] bg-[#FFFBF5] flex overflow-hidden font-sans border-[24px] border-white shadow-2xl transition-all duration-500"
    >
      {/* LEFT CONTENT */}
      <div className="w-[60%] p-16 flex flex-col relative">
        
        {/* HEADER & GREETING */}
        <div className="flex flex-col mb-8">
          <img src={logo} alt="Ma'Donna" className="w-48 object-contain mb-4" />
          <span className="text-emerald-800 font-bold tracking-[0.3em] uppercase text-sm">
            Warm Greetings from Ma'Donna Delicacies
          </span>
        </div>

        <header className="mb-10">
          <h1 className="text-8xl font-black text-stone-900 leading-[0.85] uppercase tracking-tighter mb-6">
            {bundle.name}
          </h1>
          <div className="flex items-center gap-4">
            <div className="h-[2px] w-12 bg-orange-500"></div>
            <span className="text-xl font-bold text-stone-500 uppercase tracking-widest">
              {bundle.min_pax === bundle.max_pax ? `${bundle.max_pax} Pax` : `${bundle.min_pax}-${bundle.max_pax} Pax`}
            </span>
          </div>
        </header>

        {/* CHECKLIST SECTION */}
        <section className="flex-grow flex flex-col justify-center py-6">
          <div className="border-l-4 border-emerald-600 pl-8">
            <h3 className="text-xs font-black text-emerald-900 uppercase tracking-[0.4em] mb-10 opacity-60">
              Order Checklist:
            </h3>
            <ul className="space-y-8">
              {bundle.bundle_items?.map((bi, i) => {
                const pantryItem = pantryMap[bi.product_variant_id];
                if (!pantryItem) return null;
                const quantity = bi.quantity || 1;
                const itemName = pantryItem?.name || bi.product?.name || 'Item';
                
                return (
                  <li key={i} className="flex items-center gap-6">
                    {/* Checklist Icon */}
                    <div className="relative w-9 h-9 border-2 border-emerald-600 flex items-center justify-center rounded-full bg-emerald-50">
                      <svg 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="#059669" 
                        strokeWidth="4" 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        className="w-5 h-5"
                      >
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    </div>
                    <span className="text-4xl font-bold text-stone-800 tracking-tight">
                      {pantryItem?.count 
                        ? `${quantity * pantryItem.count} pcs ${itemName}` 
                        : `${quantity} ${itemName}`}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>

        {/* FOOTER */}
        <div className="pt-10 border-t border-stone-200">
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-emerald-900 italic">₱</span>
            <span className="text-[110px] font-black text-emerald-900 leading-none tracking-tighter">
              {finalPrice.toLocaleString(undefined, { minimumFractionDigits: 0 })}
            </span>
          </div>
          
          <div className="flex justify-between items-end mt-4">
            <div className="inline-block bg-orange-100 px-6 py-3 rounded-xl shadow-sm">
              <p className="text-xl font-black text-orange-700 uppercase tracking-widest">
                🕒 {bundle.lead_time_days || 2} Days Lead Time
              </p>
            </div>
            <p className="text-stone-400 font-bold text-lg italic opacity-50">#MaDonnaDelicacies</p>
          </div>
        </div>
      </div>

      {/* RIGHT GALLERY */}
      <div className="w-[40%] bg-stone-100 flex flex-col p-4 gap-4">
        {images.map((item, i) => (
          <div
            key={i}
            className={`relative overflow-hidden rounded-2xl shadow-xl border-4 border-white ${
              images.length <= 2 ? 'flex-1' : (i === 0 ? 'flex-[1.5]' : 'flex-1')
            }`}
          >
            <img
              src={`https://res.cloudinary.com/dvgveqqtj/image/upload/c_fill,w_800,h_1200,q_auto,f_auto/${item.public_id}`}
              alt={item.product_name}
              className="w-full h-full object-cover"
              crossOrigin="anonymous"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default React.memo(PosterTemplate);
