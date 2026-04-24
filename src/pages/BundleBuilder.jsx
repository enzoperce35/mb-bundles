import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Trash2, Save, Package, Clock, Users, Search, ChevronLeft } from 'lucide-react';
import { HARDCODED_PANTRY } from '../constants/bundleMenu';
import { useNavigate } from 'react-router-dom';

const flattenPantry = (pantry) => {
  return pantry.flatMap(product =>
    (product.variants || []).map(variant => ({
      ...variant,
      product_name: product.product_name,
      rails_parent_id: product.rails_parent_id
    }))
  );
};

const BundleBuilder = () => {
  const navigate = useNavigate();
  const flatPantry = useMemo(() => flattenPantry(HARDCODED_PANTRY), []);

  const [bundle, setBundle] = useState({
    name: '',
    price: '',
    min_pax: 10,
    max_pax: 20,
    lead_time_days: 2,
    shop_id: 1, 
    items: []
  });

  const [priceMap, setPriceMap] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingPrices, setLoadingPrices] = useState(true);

  // 1. INITIALIZE PRICE MAP FROM HARDCODED_PANTRY IMMEDIATELY
  useEffect(() => {
    const initialMapping = {};
    flatPantry.forEach(item => {
      if (item.rails_variant_id) {
        initialMapping[item.rails_variant_id.toString()] = Number(item.price || 0);
      }
    });
    setPriceMap(initialMapping);

    // 2. THEN FETCH LIVE PRICES TO OVERWRITE IF NECESSARY
    const fetchPrices = async () => {
      try {
        const response = await fetch('https://servewise-market-backend.onrender.com/api/v1/products?shop_id=1&admin_mode=true');
        const data = await response.json();
        const liveMapping = { ...initialMapping }; // Keep hardcoded as base
  
        const allProducts = Array.isArray(data[0]?.products) 
          ? data.flatMap(g => g.products) 
          : data;
  
        allProducts.forEach(product => {
          const variants = product.product_variants || product.variants || [];
          variants.forEach(v => {
            if (v.id) {
              liveMapping[v.id.toString()] = Number(v.price);
            }
          });
        });
  
        setPriceMap(liveMapping);
        setLoadingPrices(false);
      } catch (err) {
        console.error("❌ FETCH ERROR (Using hardcoded as fallback):", err);
        setLoadingPrices(false);
      }
    };
    fetchPrices();
  }, [flatPantry]);

  const getItemPrice = (variantId) => {
    if (!variantId || !priceMap) return 0;
    return priceMap[variantId.toString().trim()] || 0;
  };

  const calculateItemTotal = (item) => {
    const unitPrice = getItemPrice(item.rails_variant_id);
    const unitPax = parseFloat(item.pax) || 0;
    return {
      totalPax: unitPax * item.quantity,
      totalPrice: unitPrice * item.quantity
    };
  };

  const addItemToBundle = (item) => {
    setBundle(prev => {
      const existingItem = prev.items.find(i => i.rails_variant_id === item.rails_variant_id);
      if (existingItem) {
        return {
          ...prev,
          items: prev.items.map(i => 
            i.rails_variant_id === item.rails_variant_id 
              ? { ...i, quantity: i.quantity + 1 } 
              : i
          )
        };
      }
      return {
        ...prev,
        items: [...prev.items, { ...item, quantity: 1 }]
      };
    });
  };

  const removeItem = (rails_variant_id) => {
    setBundle(prev => ({ 
      ...prev, 
      items: prev.items.filter(item => item.rails_variant_id !== rails_variant_id) 
    }));
  };

  const updateItemQuantity = (rails_variant_id, qty) => {
    const newQty = parseInt(qty);
    if (newQty <= 0) {
      removeItem(rails_variant_id);
      return;
    }
    setBundle(prev => ({
      ...prev,
      items: prev.items.map(item =>
        item.rails_variant_id === rails_variant_id ? { ...item, quantity: newQty } : item
      )
    }));
  };

  const filteredPantry = flatPantry.filter(item => 
    item.mb_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.product_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSaveBundle = async () => {
    if (!bundle.name || !bundle.price || bundle.items.length === 0) {
      alert("Oops! Please provide a name, price, and at least one item.");
      return;
    }

    const payload = {
      bundle: {
        name: bundle.name,
        price: parseFloat(bundle.price),
        min_pax: bundle.min_pax,
        max_pax: bundle.max_pax,
        lead_time_days: bundle.lead_time_days,
        shop_id: 1, 
        active: true,
        bundle_items_attributes: bundle.items.map(item => ({
          product_variant_id: item.rails_variant_id,
          quantity: item.quantity,
          // Sending price ensures the snapshot is captured correctly
          price: getItemPrice(item.rails_variant_id) 
        }))
      }
    };

    try {
      const response = await fetch('https://servewise-market-backend.onrender.com/api/v1/bundles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        alert("Mabuhay! Your bundle is now live.");
        navigate('/bundles');
      } else {
        const errorData = await response.json();
        alert(`Save failed: ${errorData.errors?.join(", ") || "Unknown Error"}`);
      }
    } catch (err) {
      alert("Connection error.");
    }
  };

  return (
    <div className="relative min-h-screen font-sans overflow-x-hidden">
      <div className="fixed inset-0 bg-[url('https://images.unsplash.com/photo-1516062423079-7ca13cdc7f5a?q=80&w=2083')] bg-cover bg-center">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-md"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto p-4 md:p-12 flex flex-col gap-8">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <button onClick={() => navigate(-1)} className="text-white/50 hover:text-white flex items-center gap-2 text-[10px] font-black uppercase tracking-widest mb-2 transition-colors">
              <ChevronLeft size={16} /> Back
            </button>
            <h1 className="text-3xl font-black text-white Montserrat tracking-tighter uppercase">
              👋 MABUHAY, ADMIN!
            </h1>
            <p className="text-emerald-400 font-bold text-xs uppercase tracking-[0.2em]">Bundle Builder • Shop 1 (Main)</p>
          </div>
        </header>

        <div className="flex flex-col lg:flex-row gap-8">
          <div className="w-full lg:w-3/5 bg-stone-50/95 rounded-3xl p-6 md:p-10 shadow-2xl border-b-8 border-emerald-900">
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col">
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] mb-2 Montserrat">Bundle Name</label>
                  <input
                    type="text"
                    className="bg-white border-2 border-stone-200 rounded-xl px-4 py-4 focus:border-emerald-600 outline-none transition-all font-bold Montserrat"
                    value={bundle.name}
                    onChange={(e) => setBundle({ ...bundle, name: e.target.value })}
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] mb-2 Montserrat">Selling Price (₱)</label>
                  <input
                    type="number"
                    className="bg-white border-2 border-stone-200 rounded-xl px-4 py-4 focus:border-emerald-600 outline-none transition-all font-black text-emerald-800 text-xl Montserrat"
                    value={bundle.price}
                    onChange={(e) => setBundle({ ...bundle, price: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-emerald-900/5 p-4 rounded-2xl border border-emerald-900/10">
                  <label className="text-[10px] font-black text-emerald-900 uppercase Montserrat tracking-widest mb-2 flex items-center gap-2"><Users size={14}/> Min Pax</label>
                  <select className="w-full bg-transparent font-black text-lg Montserrat outline-none" value={bundle.min_pax} onChange={(e) => setBundle({...bundle, min_pax: parseInt(e.target.value)})}>
                    {[5,10,15,20,25,30,40,50].map(p => <option key={p} value={p}>{p} Pax</option>)}
                  </select>
                </div>
                <div className="bg-emerald-900/5 p-4 rounded-2xl border border-emerald-900/10">
                  <label className="text-[10px] font-black text-emerald-900 uppercase Montserrat tracking-widest mb-2 flex items-center gap-2"><Users size={14}/> Max Pax</label>
                  <select className="w-full bg-transparent font-black text-lg Montserrat outline-none" value={bundle.max_pax} onChange={(e) => setBundle({...bundle, max_pax: parseInt(e.target.value)})}>
                    {[5,10,15,20,25,30,40,50].map(p => <option key={p} value={p}>{p} Pax</option>)}
                  </select>
                </div>
                <div className="bg-orange-900/5 p-4 rounded-2xl border border-orange-900/10">
                  <label className="text-[10px] font-black text-orange-900 uppercase Montserrat tracking-widest mb-2 flex items-center gap-2"><Clock size={14}/> Lead Time</label>
                  <div className="flex items-center gap-2">
                    <input type="number" className="w-full bg-transparent font-black text-lg Montserrat outline-none" value={bundle.lead_time_days} onChange={(e) => setBundle({...bundle, lead_time_days: parseInt(e.target.value)})}/>
                    <span className="text-[10px] font-black text-stone-400 uppercase Montserrat">Days</span>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <div className="flex justify-between items-end mb-4">
                  <h3 className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] Montserrat">Included in Bundle</h3>
                  <div className="text-right">
                    <p className="text-[9px] font-black text-emerald-600 uppercase Montserrat tracking-widest">Total Cost of Items</p>
                    <p className="text-xl font-black text-stone-800 Montserrat">
                      ₱{bundle.items.reduce((acc, item) => acc + calculateItemTotal(item).totalPrice, 0).toLocaleString()}
                    </p>
                  </div>
                </div>
                
                <div className="bg-white/50 border-2 border-dashed border-stone-200 rounded-3xl p-4 min-h-[300px]">
                  {bundle.items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-stone-300 Montserrat">
                      <Package size={48} strokeWidth={1} className="mb-2 opacity-20" />
                      <p className="font-bold text-xs uppercase tracking-widest">Click items to add</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {bundle.items.map((item) => {
                        const { totalPax, totalPrice } = calculateItemTotal(item);
                        const unitPrice = getItemPrice(item.rails_variant_id);
                        const displayPax = Math.ceil(totalPax);

                        return (
                          <div key={item.rails_variant_id} className="flex items-center justify-between bg-white p-5 rounded-2xl shadow-sm border-l-8 border-emerald-600">
                            <div className="flex-grow">
                              <p className="font-black text-stone-800 Montserrat leading-none mb-1 text-sm uppercase">{item.mb_name}</p>
                              <p className="text-[10px] uppercase font-bold text-emerald-600 Montserrat">
                                {item.pax ? `${displayPax} Pax | ` : ''}
                                ₱{unitPrice} x {item.quantity} = ₱{totalPrice.toLocaleString()}
                              </p>
                            </div>
                            <div className="flex items-center gap-6">
                              <div className="flex items-center bg-stone-100 rounded-xl p-1 px-3 gap-4">
                                <button onClick={() => updateItemQuantity(item.rails_variant_id, item.quantity - 1)} className="text-stone-400 hover:text-emerald-600 font-bold">-</button>
                                <span className="font-black text-stone-800 Montserrat text-sm">{item.quantity}</span>
                                <button onClick={() => updateItemQuantity(item.rails_variant_id, item.quantity + 1)} className="text-stone-400 hover:text-emerald-600 font-bold">+</button>
                              </div>
                              <button onClick={() => removeItem(item.rails_variant_id)} className="p-2 text-stone-300 hover:text-red-500 transition-colors"><Trash2 size={18} /></button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <button onClick={handleSaveBundle} className="w-full bg-emerald-800 hover:bg-emerald-900 text-white font-black py-6 rounded-3xl shadow-2xl transition-all flex items-center justify-center gap-3 tracking-[0.3em] uppercase text-sm Montserrat">
                <Save size={20} /> Save Bundle
              </button>
            </div>
          </div>

          <div className="w-full lg:w-2/5 bg-stone-900/90 backdrop-blur-xl rounded-3xl p-8 shadow-2xl h-[800px] flex flex-col border border-stone-700/50">
            <div className="mb-8">
              <h3 className="text-white font-black Montserrat tracking-[0.2em] text-[10px] mb-4 flex items-center gap-2 uppercase">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                Shop 1 Pantry
              </h3>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-500" size={18} />
                <input
                  type="text"
                  placeholder="Search products..."
                  className="w-full bg-stone-800 border border-stone-700 rounded-2xl py-4 pl-12 pr-4 text-white Montserrat font-bold text-sm outline-none focus:border-emerald-500 transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="flex-grow overflow-y-auto pr-2 space-y-2">
              {filteredPantry.map((item) => (
                <button
                  key={item.rails_variant_id}
                  onClick={() => addItemToBundle(item)}
                  className="w-full group flex items-center justify-between p-4 rounded-2xl bg-stone-800/40 hover:bg-emerald-600/20 border border-stone-700/50 hover:border-emerald-500/50 transition-all text-left mb-2"
                >
                  <div>
                    <p className="text-stone-100 font-bold Montserrat text-sm group-hover:text-emerald-400 transition-colors uppercase">
                      {item.mb_name}
                    </p>
                    <div className="flex gap-2 mt-1">
                      {item.pax && (
                        <span className="text-[9px] font-black bg-stone-700 text-stone-300 px-2 py-0.5 rounded uppercase Montserrat tracking-tighter">
                          {item.pax} Pax
                        </span>
                      )}
                      <span className="text-[9px] font-black text-emerald-500 uppercase Montserrat tracking-widest">
                        ₱{getItemPrice(item.rails_variant_id)}
                      </span>
                    </div>
                  </div>
                  <div className="bg-stone-700 group-hover:bg-emerald-600 p-2 rounded-xl transition-all text-white">
                    <Plus size={16} />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BundleBuilder;
