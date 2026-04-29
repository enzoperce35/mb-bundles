import React, { useMemo } from 'react';
import { Clock, Users, RotateCcw, Check, Share2, MessageCircle, Edit3, Save } from 'lucide-react';
import { calculateSmartQuantity, formatItemName } from '../utils/bundleLogic';
import { getDesignedBundlePrice } from '../utils/discountLogic';

const BundleCard = ({
    bundle,
    pantryMap,
    smartSides,
    customSelections,
    editingId,
    setEditingId,
    handleToggleItem,
    resetBundle,
    handleOrderNow,
    generatingId,
    paxQuery
}) => {
    const isEditing = editingId === bundle.id;
    const activeItems = customSelections[bundle.id] || bundle.bundle_items || [];

    // ✅ FAST LOOKUPS
    const activeItemMap = useMemo(() => {
        const map = {};
        activeItems.forEach(i => {
            map[i.product_variant_id] = i;
        });
        return map;
    }, [activeItems]);

    const activeIdSet = useMemo(() => {
        return new Set(activeItems.map(i => i.product_variant_id));
    }, [activeItems]);

    // ✅ ITEMS TO SHOW
    const itemsToShowRaw = useMemo(() => {
        if (!isEditing) return activeItems.map(i => i.product_variant_id);

        const resultMap = {};

        activeItems.forEach(item => {
            const p = pantryMap[item.product_variant_id];
            if (!p) return;
            resultMap[p.rails_parent_id] = item.product_variant_id;
        });

        smartSides?.forEach(variant => {
            if (!resultMap[variant.rails_parent_id]) {
                resultMap[variant.rails_parent_id] = variant.rails_variant_id;
            }
        });

        return Object.values(resultMap);
    }, [isEditing, activeItems, pantryMap, smartSides]);

    // ✅ SORT
    const itemsToShow = useMemo(() => {
        return [...itemsToShowRaw].sort((a, b) => {
            const itemA = pantryMap[a];
            const itemB = pantryMap[b];

            const aScore =
                (itemA?.main ? 3 : 0) +
                (activeIdSet.has(a) ? 2 : 0);

            const bScore =
                (itemB?.main ? 3 : 0) +
                (activeIdSet.has(b) ? 2 : 0);

            if (bScore !== aScore) return bScore - aScore;

            const aTime = activeItemMap[a]?._clickedAt || 0;
            const bTime = activeItemMap[b]?._clickedAt || 0;

            return aTime - bTime;
        });
    }, [itemsToShowRaw, pantryMap, activeIdSet, activeItemMap]);

    // ✅ PRICING
    const pricing = useMemo(() => {
        let total = 0;

        for (const item of activeItems) {
            const p = pantryMap[item.product_variant_id];
            const unitPrice = p?.price > 0 ? p.price : parseFloat(item.price) || 0;
            total += unitPrice * (item.quantity || 1);
        }

        return {
            rawTotal: total,
            designedPrice: getDesignedBundlePrice(total, paxQuery)
        };
    }, [activeItems, pantryMap, paxQuery]);

    return (
        <div className="group relative bg-orange-50/95 rounded-3xl overflow-hidden shadow-2xl flex flex-col border-b-8 border-emerald-900 transition-all hover:shadow-emerald-900/20">

            {/* HEADER */}
            <div className="p-8 pb-0">
                <div className="flex justify-between items-start mb-4 Montserrat">
                    <button
                        onClick={() => setEditingId(isEditing ? null : bundle.id)}
                        className={`flex items-center gap-2 text-[9px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest transition-all 
                        ${isEditing
                                ? 'bg-orange-600 text-white animate-pulse'
                                : 'bg-emerald-800 text-white hover:bg-emerald-700'
                            }`}
                    >
                        {isEditing ? <Save size={12} /> : <Edit3 size={12} />}
                        {isEditing ? 'Finish Editing' : 'Edit Inclusions'}
                    </button>

                    <button
                        onClick={() => handleOrderNow(bundle)}
                        disabled={generatingId === bundle.id}
                        className="group flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-stone-500 hover:text-emerald-700 transition-colors"
                    >
                        <Share2 size={14} className="group-hover:rotate-12 transition-transform" />
                        {generatingId === bundle.id ? "Processing..." : "Share Poster"}
                    </button>
                </div>

                <h2 className="text-3xl font-black text-stone-800 tracking-tighter leading-none mb-2 uppercase Montserrat">
                    {bundle.name}
                </h2>

                <div className="flex items-center gap-4 Montserrat">
                    <p className="text-stone-400 font-bold text-xs uppercase flex items-center gap-1.5">
                        <Users size={14} />
                        {bundle.max_pax} Pax
                    </p>
                    <p className="text-orange-700 font-bold text-xs uppercase flex items-center gap-1.5">
                        <Clock size={14} /> {bundle.lead_time_days || 2} Days
                    </p>
                </div>
            </div>

            {/* ITEMS */}
            <div className="p-8 pt-6 flex-grow">
                <div className={`rounded-2xl p-5 border transition-all ${isEditing ? 'bg-white border-orange-200' : 'bg-emerald-900/5 border-emerald-900/10'}`}>

                    <div className="flex justify-between items-center mb-4 Montserrat">
                        <h3 className="text-[10px] font-black text-emerald-900 uppercase tracking-widest italic">
                            {isEditing ? 'Product Checklist:' : 'The Set List:'}
                        </h3>

                        {isEditing && (
                            <button
                                onClick={() => resetBundle(bundle.id)}
                                className="text-[9px] text-orange-600 font-bold flex items-center gap-1 uppercase"
                            >
                                <RotateCcw size={10} /> Reset Default
                            </button>
                        )}
                    </div>

                    <ul className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar Montserrat">
                        {itemsToShow.map(variantId => {
                            const pantryItem = pantryMap[variantId];
                            if (!pantryItem) return null;

                            const isMain = pantryItem?.main === true;
                            const isSelected = activeIdSet.has(variantId);
                            const itemData = activeItemMap[variantId];

                            const quantity = isSelected
                                ? itemData.quantity
                                : calculateSmartQuantity(pantryItem.pax, bundle.max_pax);

                            const unitPrice = pantryItem.price || itemData?.price || 0;
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
                                    <div className={`w-5 h-5 rounded flex items-center justify-center border-2 
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
                                        <span>{formatItemName(pantryItem, quantity)}</span>

                                        {isEditing && (
                                            <span className={`text-[10px] font-black whitespace-nowrap ${isSelected ? 'text-emerald-700' : 'text-stone-400'
                                                }`}>
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

            {/* FOOTER */}
            <div className="p-8 pt-0 mt-auto">
                <div className="flex items-center justify-between gap-4 Montserrat">

                    {/* PRICE */}
                    <div>
                        <span className="block text-[10px] font-black text-stone-400 uppercase tracking-widest">
                            {isEditing ? 'Live Custom Price' : 'Bundle Price'}
                        </span>

                        <div className="flex flex-col items-start">
                            <span className="text-sm text-stone-400 line-through font-bold">
                                ₱{pricing.rawTotal.toLocaleString(undefined, {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                })}
                            </span>

                            <span className="text-3xl font-black text-emerald-900 tracking-tighter">
                                ₱{pricing.designedPrice.toLocaleString(undefined, {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                })}
                            </span>
                        </div>
                    </div>

                    {/* ORDER BUTTON */}
                    <button
                        onClick={() => handleOrderNow(bundle)}
                        disabled={generatingId === bundle.id}
                        className="bg-emerald-800 hover:bg-emerald-900 text-white px-3 py-4 rounded-2xl font-black tracking-widest uppercase text-xs shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95"
                    >
                        <MessageCircle size={18} />
                        {generatingId === bundle.id ? "Processing..." : "Order Now"}
                    </button>

                </div>
            </div>
        </div>
    );
};

export default React.memo(BundleCard);
