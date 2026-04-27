import React, { useMemo } from 'react';

const PosterTemplate = ({ bundle, pantryMap }) => {

  // ✅ Get up to 4 unique images
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
      className="w-[1200px] h-[1600px] bg-[#FFFBF5] flex overflow-hidden font-sans border-[16px] border-white"
    >
      {/* LEFT CONTENT */}
      <div className="w-[65%] p-24 flex flex-col justify-between">

        {/* TITLE */}
        <div>
          <h1 className="text-8xl font-black text-stone-900 tracking-tighter uppercase leading-[0.8]">
            {bundle.name}
          </h1>
          <div className="h-2 w-32 bg-emerald-800 mt-10"></div>
        </div>

        {/* ITEMS */}
        <div className="flex-grow flex flex-col justify-center">
          <h3 className="text-2xl font-black text-emerald-900 uppercase tracking-[0.2em] mb-8 italic">
            The Set List:
          </h3>

          <ul className="space-y-6">
            {bundle.bundle_items?.map((bi, i) => {
              const pantryItem = pantryMap[bi.product_variant_id];
              if (!pantryItem) return null;

              const quantity = bi.quantity || 1;
              const itemName =
                pantryItem?.name ||
                bi.product?.name ||
                'Item';

              const displayName = pantryItem?.count
                ? `${quantity * pantryItem.count} pcs ${itemName}`
                : `${quantity} ${itemName}`;

              return (
                <li
                  key={i}
                  className="text-4xl font-bold text-stone-700 flex items-start gap-5"
                >
                  <span className="text-emerald-600 mt-1">▪</span>
                  <span>{displayName}</span>
                </li>
              );
            })}
          </ul>
        </div>

        {/* PRICE */}
        <div>
          <p className="text-[120px] font-black text-emerald-900 tracking-tighter leading-none mb-4">
            ₱{finalPrice.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })}
          </p>
          <p className="text-3xl font-black text-orange-600 uppercase tracking-[0.2em]">
            {bundle.lead_time_days || 2}-Day Lead Time
          </p>
        </div>
      </div>

      {/* RIGHT IMAGE GRID */}
      <div className="w-[35%] flex flex-col gap-2 bg-stone-200 p-2">
        {images.map((item, i) => (
          <div
            key={i}
            className="flex-grow overflow-hidden rounded-lg shadow-sm bg-stone-300"
          >
            <img
              src={`https://res.cloudinary.com/dvgveqqtj/image/upload/c_fill,w_600,h_800,q_auto,f_auto/${item.public_id}`}
              alt={item.product_name}
              className="w-full h-full object-cover"
              crossOrigin="anonymous"
              onError={(e) => {
                e.target.src =
                  "https://via.placeholder.com/600x800?text=MaDonna+Dish";
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default PosterTemplate;
