import React from 'react';
import { Users, UsersRound, Home, PartyPopper, Utensils, Coffee, Store, Tent } from 'lucide-react';

const PaxSelector = ({ onSelect }) => {
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

  return (
    <div className="min-h-screen bg-wood flex flex-col items-center p-8">
      <div className="relative z-10 w-full max-w-6xl text-center mt-12">
        <h1 className="text-4xl font-extrabold text-white mb-2 tracking-tighter drop-shadow-lg">
          MB-BUNDLES
        </h1>
        <p className="text-emerald-100 text-lg mb-12 font-medium italic">
          Select your group size to see curated packages
        </p>

        {/* Responsive Grid: 1 col on mobile, 2 on tablet, 4 on desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onSelect(cat.id)}
              className="group relative bg-orange-50/95 hover:bg-white transition-all duration-200 rounded-xl p-6 shadow-xl border-b-4 border-emerald-900 flex flex-col items-center justify-center hover:-translate-y-1"
            >
              <div className="bg-emerald-100 p-3 rounded-full mb-3 group-hover:bg-emerald-200 transition-colors">
                {cat.icon}
              </div>
              <h3 className="text-sm font-bold text-stone-500 uppercase tracking-widest mb-1">
                {cat.label}
              </h3>
              <span className="text-2xl font-extrabold text-stone-800">
                {cat.pax}
              </span>
              <p className="mt-2 text-xs text-stone-400 font-medium">{cat.desc}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PaxSelector;
