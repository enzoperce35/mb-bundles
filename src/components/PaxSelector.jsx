import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, UsersRound, Home, PartyPopper, Utensils, Coffee, Store, Tent } from 'lucide-react';

const PaxSelector = () => {
  const navigate = useNavigate();

  const categories = [
    { id: 5, label: 'Small Salo-Salo', pax: '5 Pax', icon: <Coffee className="w-6 h-6 text-emerald-800" />, desc: 'Intimate meal' },
    { id: 10, label: 'Family Set', pax: '10 Pax', icon: <Home className="w-6 h-6 text-emerald-800" />, desc: 'Standard family lunch' },
    { id: 15, label: 'Barkada Pack', pax: '15 Pax', icon: <Utensils className="w-6 h-6 text-emerald-800" />, desc: 'Great for small teams' },
    { id: 20, label: 'Celebration Set', pax: '20 Pax', icon: <Users className="w-6 h-6 text-emerald-800" />, desc: 'Birthdays & parties' },
    { id: 25, label: 'Office Feast', pax: '25 Pax', icon: <UsersRound className="w-6 h-6 text-emerald-800" />, desc: 'Corporate lunch' },
    { id: 30, label: 'Grand Salo-Salo', pax: '30 Pax', icon: <Store className="w-6 h-6 text-emerald-800" />, desc: 'Big family reunions' },
    { id: 40, label: 'Fiesta Bundle', pax: '40 Pax', icon: <Tent className="w-6 h-6 text-emerald-800" />, desc: 'Barangay celebrations' },
    { id: 50, label: 'The Ultimate Feast', pax: '50 Pax', icon: <PartyPopper className="w-6 h-6 text-emerald-800" />, desc: 'Maximum celebration' },
  ];

  const handlePaxSelection = (paxCount) => {
    navigate(`/bundles?pax=${paxCount}`);
  };

  return (
    <div className="relative min-h-screen w-full font-sans">
      {/* FIXED BACKGROUND LAYER: This stays blurred while you scroll */}
      <div 
        className="fixed inset-0 bg-[url('https://images.unsplash.com/photo-1516062423079-7ca13cdc7f5a?q=80&w=2083')] bg-cover bg-center"
        aria-hidden="true"
      >
        <div className="absolute inset-0 bg-black/50 backdrop-blur-md"></div>
      </div>

      {/* SCROLLABLE CONTENT LAYER */}
      <div className="relative z-10 w-full max-w-6xl mx-auto px-6 py-16 flex flex-col items-center">
        <header className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tighter drop-shadow-2xl">
            👋 MABUHAY! WELCOME TO MB-BUNDLES
          </h1>
          <div className="h-1.5 w-24 bg-emerald-500 mx-auto mb-6 rounded-full shadow-lg"></div>
          <p className="text-emerald-50 text-lg md:text-xl font-medium italic opacity-90">
            Select your group size to see curated packages for Lipa City
          </p>
        </header>

        {/* The Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handlePaxSelection(cat.id)}
              className="group relative bg-stone-50/90 hover:bg-white transition-all duration-300 rounded-3xl p-8 shadow-2xl border-b-8 border-emerald-900 flex flex-col items-center justify-center hover:-translate-y-2"
            >
              <div className="bg-emerald-100 p-4 rounded-2xl mb-4 group-hover:scale-110 group-hover:bg-emerald-200 transition-all duration-300">
                {cat.icon}
              </div>
              
              <h3 className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] mb-2">
                {cat.label}
              </h3>
              
              <span className="text-3xl font-black text-stone-900 tracking-tighter">
                {cat.pax}
              </span>
              
              <p className="mt-3 text-[11px] text-emerald-800 font-bold uppercase tracking-widest opacity-70 group-hover:opacity-100">
                {cat.desc}
              </p>

              {/* Subtle hover indicator */}
              <div className="absolute bottom-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="w-1 h-1 bg-emerald-600 rounded-full animate-bounce"></div>
              </div>
            </button>
          ))}
        </div>

        <footer className="mt-20 text-white/40 text-[10px] font-black uppercase tracking-[0.4em]">
          Premium Catering • Lipa City, Batangas
        </footer>
      </div>
    </div>
  );
};

export default PaxSelector;
