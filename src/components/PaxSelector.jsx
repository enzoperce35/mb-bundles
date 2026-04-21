import React from 'react';
import { Users, UsersRound, Home, PartyPopper } from 'lucide-react';

const PaxSelector = ({ onSelect }) => {
  const categories = [
    { 
      id: 'small', 
      label: 'Family Salo-Salo', 
      pax: '10-15 Pax', 
      icon: <Home className="w-8 h-8 text-emerald-800" />,
      description: 'Perfect for Sunday lunch or small gatherings.'
    },
    { 
        id: 'medium', 
        label: 'Celebration Set', 
        pax: '20-30 Pax', 
        icon: <UsersRound className="w-8 h-8 text-emerald-800" />, // Changed from UserGroup
        description: 'Ideal for birthdays and office parties.'
      },
    { 
      id: 'large', 
      label: 'Grand Fiesta', 
      pax: '50+ Pax', 
      icon: <PartyPopper className="w-8 h-8 text-emerald-800" />,
      description: 'The ultimate spread for big events and reunions.'
    }
  ];

  return (
    <div className="min-h-screen bg-[url('https://images.unsplash.com/photo-1516062423079-7ca13cdc7f5a?q=80&w=2083')] bg-cover bg-fixed bg-center flex flex-col items-center justify-center p-6">
      {/* Overlay for readability */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"></div>

      <div className="relative z-10 w-full max-w-4xl text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-2 tracking-tight">
          MB-BUNDLES
        </h1>
        <p className="text-emerald-100 text-lg mb-12 font-medium">
          How many people are we feeding today?
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onSelect(cat.id)}
              className="group relative overflow-hidden bg-orange-50/90 hover:bg-white transition-all duration-300 rounded-2xl p-8 shadow-2xl border-b-8 border-emerald-900 flex flex-col items-center"
            >
              {/* Bamboo Texture Accent */}
              <div className="absolute top-0 left-0 w-full h-2 bg-[url('https://www.transparenttextures.com/patterns/bamboo.png')] opacity-20"></div>
              
              <div className="bg-emerald-100 p-4 rounded-full mb-4 group-hover:scale-110 transition-transform">
                {cat.icon}
              </div>
              
              <h3 className="text-xl font-extrabold text-stone-800 uppercase tracking-wider">
                {cat.label}
              </h3>
              
              <span className="mt-2 inline-block bg-emerald-800 text-white px-4 py-1 rounded-full text-sm font-bold">
                {cat.pax}
              </span>

              <p className="mt-4 text-stone-600 text-sm leading-relaxed">
                {cat.description}
              </p>

              {/* Hover Leaf Decor */}
              <div className="absolute -bottom-2 -right-2 opacity-10 group-hover:opacity-30 transition-opacity">
                 <img src="https://cdn-icons-png.flaticon.com/512/892/892926.png" className="w-16 h-16 rotate-12" alt="leaf" />
              </div>
            </button>
          ))}
        </div>

        <button className="mt-12 text-white/80 underline underline-offset-4 hover:text-white transition-colors font-semibold">
          Just want to add individual items? Click here.
        </button>
      </div>
    </div>
  );
};

export default PaxSelector;
