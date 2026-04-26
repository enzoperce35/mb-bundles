import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Trash2, Save, Package, Clock, Users, Search, ChevronLeft, AlertTriangle } from 'lucide-react';
import { HARDCODED_PANTRY } from '../constants/bundleMenu';
import { useParams, useNavigate } from 'react-router-dom';

const flattenPantry = (pantry) => {
  return pantry.flatMap(product =>
    (product.variants || []).map(variant => ({
      ...variant,
      product_name: product.product_name,
      rails_parent_id: product.rails_parent_id
    }))
  );
};

const EditBundle = () => {
  const { id } = useParams(); 
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

  const [deletedIds, setDeletedIds] = useState([]);
  const [priceMap, setPriceMap] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBundleAndPrices = async () => {
      try {
        const bResponse = await fetch(`https://servewise-market-backend.onrender.com/api/v1/bundles/${id}`);
        const bData = await bResponse.json();

        const pResponse = await fetch('https://servewise-market-backend.onrender.com/api/v1/products?shop_id=1&admin_mode=true');
        const pData = await pResponse.json();
        
        const liveMapping = {};
        const allProducts = Array.isArray(pData[0]?.products) ? pData.flatMap(g => g.products) : pData;
        allProducts.forEach(product => {
          (product.product_variants || product.variants || []).forEach(v => {
            if (v.id) liveMapping[v.id.toString()] = Number(v.price);
          });
        });
        setPriceMap(liveMapping);

        const mappedItems = bData.bundle_items.map(bi => {
          const pantryMatch = flatPantry.find(p => p.rails_variant_id === bi.product_variant_id);
          return {
            id: bi.id,
            rails_variant_id: bi.product_variant_id,
            quantity: bi.quantity,
            name: pantryMatch?.name || bi.variant_name || "Unknown Item",
            mb_name: pantryMatch?.mb_name || bi.variant_name || "Unknown Item",
            pax: pantryMatch?.pax || bi.pax || 0
          };
        });

        setBundle({
          name: bData.name || '',
          price: bData.price || '',
          min_pax: bData.min_pax || 10,
          max_pax: bData.max_pax || 20,
          lead_time_days: bData.lead_time_days || 2,
          shop_id: bData.shop_id || 1,
          items: mappedItems
        });
        setLoading(false);
      } catch (err) {
        setLoading(false);
      }
    };
    fetchBundleAndPrices();
  }, [id, flatPantry]);

  const getItemPrice = (variantId) => priceMap[variantId?.toString()] || 0;

  const bundleTotals = useMemo(() => {
    return bundle.items.reduce((acc, item) => {
      const itemPrice = getItemPrice(item.rails_variant_id);
      const itemPax = parseFloat(item.pax) || 0;
      return {
        price: acc.price + (itemPrice * item.quantity),
        pax: acc.pax + (itemPax * item.quantity)
      };
    }, { price: 0, pax: 0 });
  }, [bundle.items, priceMap]);

  const addItemToBundle = (item) => {
    setBundle(prev => {
      const exists = prev.items.find(i => i.rails_variant_id === item.rails_variant_id);
      if (exists) {
        return {
          ...prev,
          items: prev.items.map(i => i.rails_variant_id === item.rails_variant_id ? { ...i, quantity: i.quantity + 1 } : i)
        };
      }
      return { ...prev, items: [...prev.items, { ...item, quantity: 1 }] };
    });
  };

  const removeItem = (rails_variant_id) => {
    const itemToRemove = bundle.items.find(i => i.rails_variant_id === rails_variant_id);
    if (itemToRemove?.id) {
      setDeletedIds(prev => [...prev, itemToRemove.id]);
    }
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

  const handleDeleteFullBundle = async () => {
    if (window.confirm("WARNING: PERMANENTLY delete this entire bundle?")) {
      try {
        const response = await fetch(`https://servewise-market-backend.onrender.com/api/v1/bundles/${id}`, {
          method: 'DELETE'
        });
        if (response.ok) {
          alert("Bundle deleted.");
          navigate('/admin/bundles');
        }
      } catch (err) {
        alert("Deletion failed.");
      }
    }
  };

  const handleUpdateBundle = async () => {
    const payload = {
      bundle: {
        name: bundle.name,
        price: parseFloat(bundle.price),
        min_pax: bundle.min_pax,
        max_pax: bundle.max_pax,
        lead_time_days: bundle.lead_time_days,
        bundle_items_attributes: [
          ...bundle.items.map(item => ({ id: item.id || null, product_variant_id: item.rails_variant_id, quantity: item.quantity, _destroy: false })),
          ...deletedIds.map(dbId => ({ id: dbId, _destroy: true }))
        ]
      }
    };

    try {
      const response = await fetch(`https://servewise-market-backend.onrender.com/api/v1/bundles/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (response.ok) {
        alert("Mabuhay! Bundle updated successfully.");
        navigate('/admin/bundles');
      }
    } catch (err) {
      alert("Error saving.");
    }
  };

  const filteredPantry = flatPantry.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.mb_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="min-h-screen bg-stone-950 flex items-center justify-center text-white font-black">SYNCING DATA...</div>;

  return (
    <div className="relative min-h-screen font-sans overflow-x-hidden">
      <div className="fixed inset-0 bg-[url('https://images.unsplash.com/photo-1516062423079-7ca13cdc7f5a?q=80&w=2083')] bg-cover bg-center">
        <div className="absolute inset-0 bg-black/70 backdrop-blur-md"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto p-4 md:p-12 flex flex-col gap-8">
        <header className="flex justify-between items-start">
          <div>
            <button onClick={() => navigate(-1)} className="text-white/40 hover:text-white flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] mb-4 transition-all">
              <ChevronLeft size={16} /> Return
            </button>
            <h1 className="text-4xl font-black text-white Montserrat tracking-tighter uppercase">Edit Bundle #{id}</h1>
          </div>
          <button onClick={handleDeleteFullBundle} className="bg-red-500/10 hover:bg-red-600 text-red-500 hover:text-white border border-red-500/30 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2">
            <Trash2 size={16} /> Delete Bundle
          </button>
        </header>

        <div className="flex flex-col lg:flex-row gap-8">
          <div className="w-full lg:w-3/5 bg-stone-50/95 rounded-[2.5rem] p-6 md:p-10 shadow-2xl border-b-8 border-orange-900">
            <div className="space-y-8">
              {/* Basic Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col">
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2 Montserrat">Bundle Name</label>
                  <input type="text" className="bg-white border-2 border-stone-200 rounded-2xl px-5 py-4 focus:border-orange-600 outline-none font-bold" value={bundle.name} onChange={(e) => setBundle({ ...bundle, name: e.target.value })} />
                </div>
                <div className="flex flex-col">
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2 Montserrat">Selling Price (₱)</label>
                  <input type="number" className="bg-white border-2 border-stone-200 rounded-2xl px-5 py-4 focus:border-orange-600 outline-none font-black text-orange-800 text-xl" value={bundle.price} onChange={(e) => setBundle({ ...bundle, price: e.target.value })} />
                </div>
              </div>

              {/* Editable Pax & Lead Time */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-orange-900/5 p-4 rounded-2xl border border-orange-900/10">
                  <label className="text-[10px] font-black text-orange-900 uppercase Montserrat tracking-widest mb-2 flex items-center gap-2"><Users size={14}/> Min Pax</label>
                  <select className="w-full bg-transparent font-black text-lg Montserrat outline-none" value={bundle.min_pax} onChange={(e) => setBundle({...bundle, min_pax: parseInt(e.target.value)})}>
                    {[5,10,15,20,25,30,40,50].map(p => <option key={p} value={p}>{p} Pax</option>)}
                  </select>
                </div>
                <div className="bg-orange-900/5 p-4 rounded-2xl border border-orange-900/10">
                  <label className="text-[10px] font-black text-orange-900 uppercase Montserrat tracking-widest mb-2 flex items-center gap-2"><Users size={14}/> Max Pax</label>
                  <select className="w-full bg-transparent font-black text-lg Montserrat outline-none" value={bundle.max_pax} onChange={(e) => setBundle({...bundle, max_pax: parseInt(e.target.value)})}>
                    {[5,10,15,20,25,30,40,50].map(p => <option key={p} value={p}>{p} Pax</option>)}
                  </select>
                </div>
                <div className="bg-stone-900/5 p-4 rounded-2xl border border-stone-900/10">
                  <label className="text-[10px] font-black text-stone-900 uppercase Montserrat tracking-widest mb-2 flex items-center gap-2"><Clock size={14}/> Lead Time</label>
                  <div className="flex items-center gap-2">
                    <input type="number" className="w-full bg-transparent font-black text-lg Montserrat outline-none" value={bundle.lead_time_days} onChange={(e) => setBundle({...bundle, lead_time_days: parseInt(e.target.value)})}/>
                    <span className="text-[10px] font-black text-stone-400 uppercase Montserrat">Days</span>
                  </div>
                </div>
              </div>

              {/* Composition Section */}
              <div>
                <div className="flex justify-between items-end mb-4 px-2">
                  <h3 className="text-[10px] font-black text-stone-400 uppercase tracking-widest Montserrat">Current Items</h3>
                  <div className="text-right">
                    <p className="text-[9px] font-black text-orange-600 uppercase tracking-widest Montserrat">
                        Running Total Value:
                    </p>
                    <p className="text-2xl font-black text-stone-800 Montserrat">₱{bundleTotals.price.toLocaleString()}</p>
                  </div>
                </div>
                
                <div className="bg-white/50 border-2 border-dashed border-stone-200 rounded-[2rem] p-4 min-h-[350px]">
                  {bundle.items.map((item) => {
                    const itemTotalPrice = getItemPrice(item.rails_variant_id) * item.quantity;
                    const itemTotalPax = Math.ceil((parseFloat(item.pax) || 0) * item.quantity);

                    return (
                      <div key={item.rails_variant_id} className="flex items-center justify-between bg-white p-5 rounded-2xl shadow-sm border-l-8 border-orange-600 mb-3">
                        <div className="flex-grow">
                          <p className="font-black text-stone-800 Montserrat text-sm uppercase leading-tight">{item.name}</p>
                          <p className="text-[10px] font-bold text-orange-600 Montserrat mt-1 uppercase tracking-tight">
                            {item.pax > 0 && `${itemTotalPax} Pax | `}
                            ₱{getItemPrice(item.rails_variant_id)} x {item.quantity} = ₱{itemTotalPrice.toLocaleString()}
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <div className="flex items-center bg-stone-100 rounded-xl p-1 px-3 gap-3">
                            <button onClick={() => updateItemQuantity(item.rails_variant_id, item.quantity - 1)} className="text-stone-400 hover:text-orange-600 font-bold">-</button>
                            <span className="font-black text-stone-800 Montserrat text-sm">{item.quantity}</span>
                            <button onClick={() => updateItemQuantity(item.rails_variant_id, item.quantity + 1)} className="text-stone-400 hover:text-orange-600 font-bold">+</button>
                          </div>
                          <button onClick={() => removeItem(item.rails_variant_id)} className="p-3 text-stone-200 hover:text-red-500 transition-colors">
                            <Trash2 size={20} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <button onClick={handleUpdateBundle} className="w-full bg-orange-700 hover:bg-orange-800 text-white font-black py-6 rounded-3xl shadow-2xl transition-all flex items-center justify-center gap-4 tracking-[0.3em] uppercase text-sm Montserrat">
                <Save size={20} /> Update Bundle
              </button>
            </div>
          </div>

          {/* Pantry Side Panel */}
          <div className="w-full lg:w-2/5 bg-stone-900/90 backdrop-blur-xl rounded-[2.5rem] p-8 h-[850px] flex flex-col border border-stone-800/50 shadow-2xl">
            <div className="mb-6 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-500" size={18} />
                <input type="text" placeholder="Filter Ingredients..." className="w-full bg-stone-800 border border-stone-700 rounded-2xl py-4 pl-12 text-white font-bold text-sm outline-none focus:border-orange-500 transition-all shadow-inner" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <div className="flex-grow overflow-y-auto space-y-2 pr-2 custom-scrollbar">
              {filteredPantry.map((item) => (
                <button key={item.rails_variant_id} onClick={() => addItemToBundle(item)} className="w-full group flex items-center justify-between p-4 rounded-2xl bg-stone-800/40 hover:bg-orange-600/10 border border-stone-700/30 hover:border-orange-500/50 transition-all text-left">
                  <div>
                    <p className="text-stone-100 font-bold Montserrat text-[13px] uppercase group-hover:text-orange-400 transition-colors">{item.name}</p>
                    <div className="flex gap-2 mt-1">
                      {item.pax > 0 && (
                        <span className="text-[9px] font-black bg-stone-700 text-stone-300 px-2 py-0.5 rounded uppercase Montserrat tracking-tighter">
                          {item.pax} Pax
                        </span>
                      )}
                      <span className="text-[9px] font-black text-orange-500 uppercase tracking-widest">₱{getItemPrice(item.rails_variant_id)}</span>
                    </div>
                  </div>
                  <div className="bg-stone-700 group-hover:bg-orange-600 p-2.5 rounded-xl text-white transition-all">
                    <Plus size={16} strokeWidth={3} />
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

export default EditBundle;
