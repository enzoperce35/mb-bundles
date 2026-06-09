import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Users, Home, PartyPopper, Coffee, BookOpen } from 'lucide-react';
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
    <div className="relative min-h-screen w-full font-sans flex flex-col">
      {/* OPTIMIZED BACKGROUND */}
      <div
        className="fixed inset-0 bg-[url('https://images.unsplash.com/photo-1516062423079-7ca13cdc7f5a?auto=format&fit=crop&w=1200&q=60')] bg-cover bg-center"
        aria-hidden="true"
      >
        <div className="absolute inset-0 bg-black/50 backdrop-blur-md"></div>
      </div>

      {/* FIXED CONTENT LAYER: Changed pb-25 to pb-16 md:pb-24 to use compilation-safe dimensions */}
      <div className="relative z-10 w-full max-w-6xl mx-auto px-6 pt-6 pb-16 md:pb-24 flex-grow flex flex-col items-center">

        {/* TOP RIGHT NAVIGATION LAYER */}
        <div className="w-full flex justify-end mb-12">
          <Link
            to="/our-story"
            className="flex items-center gap-2 text-white/80 hover:text-white text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full border border-white/20 hover:border-white/60 bg-white/5 hover:bg-white/10 backdrop-blur-sm transition-all duration-300 hover:scale-105 active:scale-95"
          >
            <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
            <span>About Us</span>
          </Link>
        </div>

        <header className="text-center mb-16 flex flex-col items-center">
          <div className="mb-3 flex justify-center">
            <img
              src={logo}
              alt="Ma'Donna Delicacies Logo"
              className="w-29 md:w-40 h-auto drop-shadow-logo"
            />
          </div>

          <h1 className="text-3xl md:text-5xl font-black text-white mb-4 tracking-tighter drop-shadow-2xl">
            Ma'Donna Delicacies
          </h1>

          <div className="h-1.5 w-24 bg-emerald-500 mx-auto mb-16 rounded-full shadow-lg"></div>

          <div className="relative inline-block">
            <p className="text-emerald-50 text-xl md:text-2xl font-bold italic tracking-tight opacity-90">
              Create your bundle
            </p>
          </div>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handlePaxSelection(cat.id)}
              onMouseEnter={() => prefetchData(cat.id)}
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

        {/* FIXED FOOTER MARGIN: Added mt-auto and a dedicated py-6 wrapper for clear safe-area spacing */}
        <footer className="mt-auto pt-16 pb-4 text-white/40 text-[10px] font-black uppercase tracking-[0.4em] text-center">
          Madonna Delicacies • Since 2020
        </footer>
      </div>
    </div>
  );
};

export default PaxSelector;