import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Clock, Users, ChevronLeft, ShoppingBag, Leaf, Share2, X, Download, MessageSquare } from 'lucide-react';

// --- Share Modal Component ---
const ShareModal = ({ isOpen, onClose, bundle }) => {
  if (!isOpen || !bundle) return null;

  // Cloudinary Dynamic URL Logic
  // Replace 'your-cloud-name' with your actual Cloudinary handle
  const baseUrl = "https://res.cloudinary.com/dvgveqqtj/image/upload/";
  const textOverlay = `l_text:Montserrat_60_bold:${encodeURIComponent(bundle.name)},co_rgb:ffffff,g_north,y_150/`;
  const priceOverlay = `l_text:Montserrat_80_bold:₱${bundle.price},co_rgb:10b981,g_center,y_50/`;
  const baseImage = "mb_bundles_template_wood.jpg"; 
  
  const posterUrl = `${baseUrl}${textOverlay}${priceOverlay}${baseImage}`;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative bg-stone-900 rounded-3xl max-w-lg w-full overflow-hidden border border-white/10 shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="p-4 flex justify-between items-center border-b border-white/5">
          <h3 className="text-white font-black uppercase text-[10px] tracking-widest">Shareable Menu Poster</h3>
          <button onClick={onClose} className="text-stone-400 hover:text-white"><X size={20} /></button>
        </div>
        <div className="p-6">
          <div className="bg-stone-800 rounded-2xl aspect-[4/5] overflow-hidden shadow-inner flex items-center justify-center border border-white/5">
            <img src={posterUrl} alt="Poster Preview" className="w-full h-full object-contain" />
          </div>
        </div>
        <div className="p-6 bg-stone-950/50 flex flex-col gap-3">
          <a href={posterUrl} download={`${bundle.name}.jpg`} className="w-full bg-emerald-800 hover:bg-emerald-700 text-white py-4 rounded-xl font-black uppercase text-xs flex items-center justify-center gap-2 transition-all">
            <Download size={18} /> Save to Gallery
          </a>
          <button className="w-full bg-white/5 hover:bg-white/10 text-white py-4 rounded-xl font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all border border-white/10">
            <MessageSquare size={16} /> Send to Group Chat
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Main BundleList Component ---
const BundleList = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const paxQuery = searchParams.get('pax') || 10;

  const [bundles, setBundles] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBundle, setSelectedBundle] = useState(null);

  useEffect(() => {
    const mockBundles = [
      {
        id: 1,
        name: "Fiesta Barkada Set",
        price: "2499",
        min_pax: 10,
        max_pax: 15,
        lead_time: 2,
        items: ["Beef Caldereta", "Pancit Guisado", "15pcs Shanghai", "Plain Rice", "Buko Pandan"]
      },
      {
        id: 2,
        name: "Classic Pinoy Celebration",
        price: "3200",
        min_pax: 15,
        max_pax: 20,
        lead_time: 2,
        items: ["Chicken Adobo", "Kare-Kare", "Chopsuey", "20pcs Shanghai", "Large Leche Flan"]
      }
    ];
    
    setBundles(mockBundles.filter(b => paxQuery >= b.min_pax && paxQuery <= b.max_pax));
    setLoading(false);
  }, [paxQuery]);

  return (
    <div className="min-h-screen bg-[url('https://images.unsplash.com/photo-1516062423079-7ca13cdc7f5a?q=80&w=2083')] bg-cover bg-fixed p-6 font-sans">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>

      <div className="relative z-10 max-w-5xl mx-auto">
        <header className="flex justify-between items-center mb-10">
          <button onClick={() => navigate('/')} className="flex items-center gap-2 text-white/80 hover:text-white transition-colors font-bold uppercase text-xs tracking-widest">
            <ChevronLeft size={18} /> Change Pax
          </button>
          <div className="text-right">
            <h1 className="text-2xl font-black text-white tracking-tighter uppercase leading-none">Menu for {paxQuery} Pax</h1>
            <div className="h-1 w-12 bg-emerald-500 ml-auto mt-2 rounded-full"></div>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {bundles.map((bundle) => (
            <div key={bundle.id} className="group relative bg-orange-50/95 rounded-3xl overflow-hidden shadow-2xl flex flex-col border-b-8 border-emerald-900 transition-transform hover:-translate-y-1">
              <div className="p-8 pb-0">
                <div className="flex justify-between items-start mb-4">
                  <span className="bg-emerald-800 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">Best Value</span>
                  <button 
                    onClick={() => { setSelectedBundle(bundle); setIsModalOpen(true); }}
                    className="flex items-center gap-1 text-stone-400 hover:text-emerald-700 font-bold text-[10px] uppercase tracking-widest transition-colors"
                  >
                    <Share2 size={16} /> Share Menu
                  </button>
                </div>
                
                <h2 className="text-3xl font-black text-stone-800 tracking-tighter leading-none mb-2">{bundle.name}</h2>
                <div className="flex items-center gap-4">
                  <p className="text-stone-400 font-bold text-xs uppercase flex items-center gap-1.5"><Users size={14} /> {bundle.min_pax}-{bundle.max_pax} Pax</p>
                  <p className="text-orange-700 font-bold text-xs uppercase flex items-center gap-1.5"><Clock size={14} /> {bundle.lead_time} Days</p>
                </div>
              </div>

              <div className="p-8 pt-6 flex-grow">
                <div className="bg-emerald-900/5 rounded-2xl p-5 border border-emerald-900/10 relative overflow-hidden">
                   <Leaf className="absolute -right-4 -bottom-4 text-emerald-900/5 w-24 h-24 rotate-12" />
                   <h3 className="text-[10px] font-black text-emerald-900 uppercase tracking-widest mb-4 italic">The Set List:</h3>
                   <ul className="space-y-2">
                     {bundle.items.map((item, i) => (
                       <li key={i} className="text-stone-700 font-bold text-sm flex items-center gap-2">
                         <div className="w-1.5 h-1.5 bg-emerald-600 rounded-full"></div> {item}
                       </li>
                     ))}
                   </ul>
                </div>
              </div>

              <div className="p-8 pt-0 mt-auto">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <span className="block text-[10px] font-black text-stone-400 uppercase tracking-widest">Starting at</span>
                    <span className="text-3xl font-black text-emerald-900 tracking-tighter">₱{bundle.price}</span>
                  </div>
                  <button className="bg-emerald-800 hover:bg-emerald-900 text-white px-6 py-4 rounded-2xl font-black tracking-widest uppercase text-sm shadow-lg flex items-center gap-2 transition-all active:scale-95">
                    <ShoppingBag size={18} /> Order Now
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {bundles.length === 0 && !loading && (
          <div className="text-center py-20 bg-stone-900/40 rounded-3xl border-2 border-dashed border-white/10 backdrop-blur-md">
            <p className="text-white/60 font-bold text-lg italic">We haven't built bundles for {paxQuery} pax yet.</p>
            <button onClick={() => navigate('/')} className="mt-4 text-emerald-400 font-bold uppercase text-xs tracking-widest hover:text-emerald-300 transition-colors">Go back</button>
          </div>
        )}
      </div>

      {/* Shared Component */}
      <ShareModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        bundle={selectedBundle} 
      />
    </div>
  );
};

export default BundleList;
