import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Save, Package, Clock, Users, Search } from 'lucide-react';

const BundleBuilder = () => {
  // 1. State for the Bundle being built
  const [bundle, setBundle] = useState({
    name: '',
    price: '',
    min_pax: 10,
    max_pax: 20,
    lead_time_days: 2,
    highlight_tag: '',
    items: [] // Products "inserted" into this bundle
  });

  // 2. State for the "Pantry" (Existing Products from Rails)
  const [pantry, setPantry] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch products from your Rails backend on load
  useEffect(() => {
    // Replace the URL with your actual Rails API endpoint once ready
    // fetch('http://localhost:3000/api/v1/products')
    //   .then(res => res.json())
    //   .then(data => setPantry(data));
    
    // Mock data for design preview
    setPantry([
      { id: 1, name: 'Beef Caldereta', category: 'Meat' },
      { id: 2, name: 'Pancit Guisado', category: 'Noodles' },
      { id: 3, name: 'Lumpiang Shanghai', category: 'Appetizer' },
      { id: 4, name: 'Buko Pandan', category: 'Dessert' },
    ]);
  }, []);

  const addItemToBundle = (product) => {
    if (!bundle.items.find(item => item.id === product.id)) {
      setBundle({ ...bundle, items: [...bundle.items, { ...product, quantity: 1 }] });
    }
  };

  const removeItem = (id) => {
    setBundle({ ...bundle, items: bundle.items.filter(item => item.id !== id) });
  };

  const updateItemQuantity = (id, qty) => {
    setBundle({
      ...bundle,
      items: bundle.items.map(item => 
        item.id === id ? { ...item, quantity: parseInt(qty) || 1 } : item
      )
    });
  };

  // 3. Save Function to connect to Rails
  const handleSaveBundle = async () => {
    if (!bundle.name || !bundle.price || bundle.items.length === 0) {
      alert("Please provide a name, price, and at least one item.");
      return;
    }

    const payload = {
      bundle: {
        name: bundle.name,
        price: bundle.price,
        min_pax: bundle.min_pax,
        max_pax: bundle.max_pax,
        lead_time_days: bundle.lead_time_days,
        bundle_items_attributes: bundle.items.map(item => ({
          product_id: item.id,
          quantity: item.quantity
        }))
      }
    };

    console.log("Saving to Rails:", payload);

    try {
      const response = await fetch('http://localhost:3000/api/v1/bundles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        alert("Success! Bundle created.");
      } else {
        alert("Error saving bundle. Check console.");
      }
    } catch (err) {
      console.error("Backend connection failed:", err);
      alert("Could not connect to Rails server.");
    }
  };

  return (
    <div className="min-h-screen bg-[url('https://images.unsplash.com/photo-1516062423079-7ca13cdc7f5a?q=80&w=2083')] bg-cover bg-fixed p-4 md:p-8 font-sans">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm"></div>

      <div className="relative z-10 max-w-7xl mx-auto flex flex-col lg:flex-row gap-8">
        
        {/* LEFT: THE BUNDLE CONFIGURATOR */}
        <div className="w-full lg:w-3/5 bg-stone-50/95 rounded-3xl p-6 md:p-10 shadow-2xl border-b-8 border-emerald-900">
          <header className="mb-8">
            <h2 className="text-3xl font-extrabold text-stone-800 tracking-tighter flex items-center gap-3">
              <Package className="text-emerald-700" /> BUNDLE BUILDER
            </h2>
            <p className="text-stone-500 font-medium">Create a new package for your ServeWise shop.</p>
          </header>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col">
                <label className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] mb-2">Bundle Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. Fiesta Barkada Set"
                  className="bg-white border-2 border-stone-200 rounded-xl px-4 py-3 focus:border-emerald-600 outline-none transition-all font-semibold"
                  onChange={(e) => setBundle({...bundle, name: e.target.value})}
                />
              </div>
              <div className="flex flex-col">
                <label className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] mb-2">Bundle Price (₱)</label>
                <input 
                  type="number" 
                  placeholder="0.00"
                  className="bg-white border-2 border-stone-200 rounded-xl px-4 py-3 focus:border-emerald-600 outline-none transition-all font-bold text-emerald-800"
                  onChange={(e) => setBundle({...bundle, price: e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-emerald-900/5 p-4 rounded-2xl border border-emerald-900/10">
                <label className="flex items-center gap-2 text-[10px] font-black text-emerald-900 uppercase tracking-widest mb-2">
                  <Users size={14}/> Min Pax
                </label>
                <select 
                  className="w-full bg-transparent font-bold text-lg outline-none cursor-pointer"
                  value={bundle.min_pax}
                  onChange={(e) => setBundle({...bundle, min_pax: parseInt(e.target.value)})}
                >
                  {[5, 10, 15, 20, 25, 30, 40, 50].map(p => <option key={p} value={p}>{p} Pax</option>)}
                </select>
              </div>

              <div className="bg-emerald-900/5 p-4 rounded-2xl border border-emerald-900/10">
                <label className="flex items-center gap-2 text-[10px] font-black text-emerald-900 uppercase tracking-widest mb-2">
                  <Users size={14}/> Max Pax
                </label>
                <select 
                  className="w-full bg-transparent font-bold text-lg outline-none cursor-pointer"
                  value={bundle.max_pax}
                  onChange={(e) => setBundle({...bundle, max_pax: parseInt(e.target.value)})}
                >
                  {[5, 10, 15, 20, 25, 30, 40, 50].map(p => <option key={p} value={p}>{p} Pax</option>)}
                </select>
              </div>

              <div className="bg-orange-900/5 p-4 rounded-2xl border border-orange-900/10">
                <label className="flex items-center gap-2 text-[10px] font-black text-orange-900 uppercase tracking-widest mb-2">
                  <Clock size={14}/> Lead Time
                </label>
                <div className="flex items-center gap-2">
                  <input 
                    type="number" 
                    value={bundle.lead_time_days}
                    className="w-full bg-transparent font-bold text-lg outline-none"
                    onChange={(e) => setBundle({...bundle, lead_time_days: parseInt(e.target.value)})}
                  />
                  <span className="text-xs font-bold text-stone-400 uppercase">Days</span>
                </div>
              </div>
            </div>

            <div className="mt-8">
              <h3 className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] mb-4">Included in Bundle</h3>
              <div className="bg-white/50 border-2 border-dashed border-stone-200 rounded-2xl p-4 min-h-[200px]">
                {bundle.items.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-stone-400">
                    <Package size={40} strokeWidth={1} className="mb-2 opacity-20"/>
                    <p className="italic text-sm text-center">Your bundle is empty. Add items from your pantry.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {bundle.items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border-l-4 border-emerald-600">
                        <div>
                          <p className="font-bold text-stone-800">{item.name}</p>
                          <p className="text-[10px] uppercase font-bold text-stone-400 tracking-tighter">{item.category}</p>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex flex-col items-end">
                            <span className="text-[10px] font-bold text-stone-400 uppercase">Qty</span>
                            <input 
                              type="number" 
                              value={item.quantity} 
                              className="w-12 text-center font-black text-emerald-800 outline-none"
                              onChange={(e) => updateItemQuantity(item.id, e.target.value)}
                            />
                          </div>
                          <button 
                            onClick={() => removeItem(item.id)}
                            className="p-2 text-stone-300 hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <button 
              onClick={handleSaveBundle}
              className="w-full bg-emerald-800 hover:bg-emerald-900 text-white font-black py-5 rounded-2xl shadow-xl transition-all transform hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-3 tracking-widest mt-4"
            >
              <Save size={20} /> SAVE BUNDLE
            </button>
          </div>
        </div>

        {/* RIGHT: THE PANTRY */}
        <div className="w-full lg:w-2/5 bg-stone-900/90 backdrop-blur-xl rounded-3xl p-6 shadow-2xl h-fit border border-stone-700/50">
          <div className="mb-6">
            <h3 className="text-white font-black tracking-widest text-sm mb-4 flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              INSERT FROM PANTRY
            </h3>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-500" size={18}/>
              <input 
                type="text" 
                placeholder="Search products..."
                className="w-full bg-stone-800 border border-stone-700 rounded-xl py-3 pl-12 pr-4 text-white outline-none focus:border-emerald-500 transition-all"
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
            {pantry
              .filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
              .map((product) => (
              <div 
                key={product.id}
                onClick={() => addItemToBundle(product)}
                className="group flex items-center justify-between p-4 rounded-xl bg-stone-800/50 hover:bg-emerald-900/30 border border-stone-700 hover:border-emerald-500/50 cursor-pointer transition-all"
              >
                <div>
                  <p className="text-white font-bold group-hover:text-emerald-400 transition-colors">{product.name}</p>
                  <p className="text-[10px] font-bold text-stone-500 uppercase tracking-tighter">{product.category}</p>
                </div>
                <div className="bg-stone-700 group-hover:bg-emerald-500 p-2 rounded-lg transition-colors text-white">
                  <Plus size={16} />
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default BundleBuilder;
