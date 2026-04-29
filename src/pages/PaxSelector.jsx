import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Home, PartyPopper, Coffee } from 'lucide-react';
import logo from '../assets/images/mb-logo-warm-golden-yellow-removebg-preview.png';

const PaxSelector = () => {
  const navigate = useNavigate();

  const categories = [
    { id: 5, label: 'Small Salo-Salo', pax: '5 Pax', icon: <Coffee className="w-6 h-6 text-emerald-800" />, desc: 'Intimate meal' },
    { id: 10, label: 'Family Set', pax: '10 Pax', icon: <Home className="w-6 h-6 text-emerald-800" />, desc: 'Family Celebrations' },
    { id: 15, label: 'Barkada Pack', pax: '15 Pax', icon: <Users className="w-6 h-6 text-emerald-800" />, desc: 'Great for small teams' },
    { id: 20, label: 'Celebration Set', pax: '20 Pax', icon: <PartyPopper className="w-6 h-6 text-emerald-800" />, desc: 'Birthdays & parties' }
  ];

  // OPTIMIZATION: Start the network request when the user hovers
  const prefetchData = (paxCount) => {
    const url = `https://servewise-market-backend.onrender.com/api/v1/bundles?pax=${paxCount}`;
    // This creates a "link" in the browser's head to fetch the data into cache early
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = url;
    link.as = 'fetch';
    document.head.appendChild(link);
  };

  const handlePaxSelection = (paxCount) => {
    navigate(`/bundles?pax=${paxCount}`);
  };

  return (
    <div className="relative min-h-screen w-full font-sans">
      {/* OPTIMIZED BACKGROUND: 
          - Changed w=2083 to w=1200 
          - Added auto=format (WebP) 
          - Set q=60 for better compression
      */}
      <div
        className="fixed inset-0 bg-[url('https://images.unsplash.com/photo-1516062423079-7ca13cdc7f5a?auto=format&fit=crop&w=1200&q=60')] bg-cover bg-center"
        aria-hidden="true"
      >
        <div className="absolute inset-0 bg-black/50 backdrop-blur-md"></div>
      </div>

      <div className="relative z-10 w-full max-w-6xl mx-auto px-6 py-16 flex flex-col items-center">
        <header className="text-center mb-16 flex flex-col items-center">
          <div className="mb-3 animate-float">
            <img
              src={logo}
              alt="Ma'Donna Delicacies Logo"
              className="w-50 md:w-40 h-auto drop-shadow-logo"
            />
          </div>

          <h1 className="text-3xl md:text-5xl font-black text-white mb-4 tracking-tighter drop-shadow-2xl">
            Ma'Donna Delicacies
          </h1>

          <div className="h-1.5 w-24 bg-emerald-500 mx-auto mb-16 rounded-full shadow-lg"></div>

          <div className="relative inline-block">
            <p className="text-emerald-50 text-xl md:text-2xl font-bold italic tracking-tight opacity-90">
              Choose your bundles
            </p>
          </div>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handlePaxSelection(cat.id)}
              onMouseEnter={() => prefetchData(cat.id)} // Trigger prefetch on hover
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

              <div className="absolute bottom-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="w-1 h-1 bg-emerald-600 rounded-full animate-bounce"></div>
              </div>
            </button>
          ))}
        </div>

        <footer className="mt-20 text-white/40 text-[10px] font-black uppercase tracking-[0.4em]">
          Madonna Delicacies • Since 2020
        </footer>
      </div>
    </div>
  );
};

export default PaxSelector;
