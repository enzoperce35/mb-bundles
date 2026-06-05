import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronDown, ChevronUp, Utensils, HeartHandshake, Scale } from 'lucide-react';

const OurStory = () => {
  const navigate = useNavigate();
  const [showMoreProducts, setShowMoreProducts] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const realFoodPhotos = [
    {
      id: 1,
      title: "Creamy Carbonara Platter",
      caption: "Rich, velvety pasta crafted with Mama Donna's signature recipe framework.",
      image: "/carbonara.png",
      aspectRatio: '1 / 1'
    },
    {
      id: 2,
      title: "Crispy Chicken Fillet",
      caption: "Perfectly seasoned and fried fresh to order for ultimate crunch.",
      image: "/chicken_fillet.png",
      aspectRatio: '3 / 4'
    },
    {
      id: 3,
      title: "Golden Empanadas",
      caption: "Flaky, handmade crusts sieved and stuffed generously with savory fillings.",
      image: "/empanada.jpg",
      aspectRatio: '4 / 3'
    },
    {
      id: 4,
      title: "Classic Native Maruya",
      caption: "Crispy, golden Maruya bringing nostalgic comfort to your table.",
      image: "/maruya.jpg",
      aspectRatio: '1 / 1'
    },
    {
      id: 5,
      title: "Fluffy Native Puto",
      caption: "Soft, perfectly steamed Puto that pair beautifully with any of our pasta products.",
      image: "/puto.jpg",
      aspectRatio: '4 / 3'
    },
    {
      id: 6,
      title: "Signature Festive Palabok",
      caption: "A masterful combination of rich textures and distinct components layered into a signature experience.",
      image: "/palabok.jpg",
      aspectRatio: '3 / 4'
    },
  ];

  const extraFoodPhotos = [
    {
      id: 7,
      title: "Flavorful Chicken Wings",
      caption: "Perfectly seasoned, golden-fried wings thrown fresh to order.",
      image: "/chicken wings.jpg",
      aspectRatio: '4 / 3'
    },
    {
      id: 8,
      title: "Lumpiang Shanghai",
      caption: "Savory, tightly-rolled favorites packed with local family heritage flavor.",
      image: "/shanghai.jpg",
      aspectRatio: '3 / 4'
    },
    {
      id: 9,
      title: "Pansit Bihon Tray",
      caption: "Sautéed cleanly with crisp local vegetables and tender toppings.",
      image: "/pansit-bihon.jpg",
      aspectRatio: '1 / 1'
    },
    {
      id: 10,
      title: "Steamed Pork Siomai",
      caption: "Savory meat fillings encased in tender wraps, served steaming hot.",
      image: "/siomai.jpg",
      aspectRatio: '4 / 3'
    },
    {
      id: 11,
      title: "Classic Party Spaghetti",
      caption: "Sweet, rich, and loaded with comforting layers your guests will love.",
      image: "/spaghetti.jpg",
      aspectRatio: '3 / 4'
    },
  ];

  const pillars = [
    {
      icon: <Utensils size={28} style={{ color: '#ea580c' }} strokeWidth={1.75} />,
      title: "Made to Order",
      description: "Nothing sits under a heat lamp. Your platters are prepared fresh the exact day of your gathering."
    },
    {
      icon: <HeartHandshake size={28} style={{ color: '#ea580c' }} strokeWidth={1.75} />,
      title: "Generous Portions",
      description: "We design every bundle with an honest floor limit. No guest ever leaves your table hungry."
    },
    {
      icon: <Scale size={28} style={{ color: '#ea580c' }} strokeWidth={1.75} />,
      title: "Fairly Costed Value",
      description: "Every single dish is costed beautifully and precisely—ensuring premium quality at a price that makes sense for your celebrations."
    }
  ];

  return (
    <div className="about-us-container" style={{ backgroundColor: '#fafaf9', color: '#1c1917', fontFamily: 'system-ui, sans-serif', paddingBottom: '5rem' }}>

      {/* FLOATING BACK BUTTON */}
      <div style={{ position: 'fixed', top: '1.5rem', left: '1.5rem', zIndex: 100 }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(8px)',
            color: '#1c1917',
            border: '1px solid #e7e5e4',
            padding: '0.6rem 1.2rem',
            borderRadius: '9999px',
            fontSize: '0.85rem',
            fontWeight: '700',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            cursor: 'pointer',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
            transition: 'all 0.2s ease-in-out'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.03)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <ArrowLeft size={16} strokeWidth={2.5} style={{ color: '#ea580c' }} />
          <span>Back to Order</span>
        </button>
      </div>

      {/* Hero Section */}
      <section style={{
        position: 'relative',
        padding: '6rem 1.5rem 5rem 1.5rem',
        textAlign: 'center',
        background: 'linear-gradient(135deg, #ffedd5 0%, #fee2e2 100%)',
        overflow: 'hidden'
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', position: 'relative', zIndex: 2 }}>
          <span style={{ color: '#ea580c', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '0.875rem' }}>
            Our Heritage Since 2020
          </span>
          <h1 style={{ fontSize: '3rem', fontWeight: '800', marginTop: '0.5rem', marginBottom: '1.5rem', color: '#1c1917', lineHeight: '1.1' }}>
            Six Years <br /> of Tables That Return
          </h1>
          <p style={{ fontSize: '1.125rem', color: '#44403c', lineHeight: '1.7', maxWidth: '640px', margin: '0 auto' }}>
            Our absolute proudest achievement is that our very first customers from 2020 are still ordering from us today. We’ve grown alongside your celebrations, holding onto an unbreakable bond of trust through every single order.
          </p>
        </div>
      </section>

      {/* Two-Column Story Section */}
      <section style={{ maxWidth: '1200px', margin: '0 auto', padding: '4rem 1.5rem' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '3rem',
          alignItems: 'center'
        }}>

          {/* Main Story Hero Image Frame */}
          <div style={{ position: 'relative', minHeight: '350px', borderRadius: '16px', overflow: 'hidden', backgroundColor: '#e7e5e4', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{
              position: 'absolute', inset: 0, width: '100%', height: '100%',
              backgroundImage: 'url("/mb_shop.jpg")',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              minHeight: '350px'
            }} />
            <div style={{
              position: 'absolute', bottom: '1.5rem', left: '1.5rem', right: '1.5rem',
              backgroundColor: 'rgba(28, 25, 23, 0.85)', backdropFilter: 'blur(4px)',
              padding: '1.25rem', borderRadius: '12px', color: '#ffffff'
            }}>
              <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: '500', color: '#fed7aa' }}>🔥 Mama Donna’s Signature Recipes</p>
              <h4 style={{ margin: '0.25rem 0 0 0', fontSize: '1.1rem', fontWeight: '600' }}>Freshly prepared, delivered hot.</h4>
            </div>
          </div>

          <div>
            <h2 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '1.25rem', color: '#1c1917' }}>
              About Us
            </h2>
            <p style={{ color: '#57534e', lineHeight: '1.7', marginBottom: '1rem' }}>
              We are a community food business dedicated to bringing you affordable meals that go way beyond regular, everyday recipes. We believe great food shouldn't be out of reach. We also believe ordering food should be simple and honest. We made our system easy to use so you can pick your dishes quickly, see your exact prices, and check out with complete peace of mind.
            </p>
            <p style={{ color: '#57534e', lineHeight: '1.7', marginBottom: '1.5rem' }}>
              We originally started our business back in November 2020 by reselling delicious local treats. But very soon after, we began cooking our own original, unique dishes guided by Mama Donna. We are incredibly proud that the very same loyal families who first trusted us in 2020 are still ordering our food today. Together, we have made it through hard times, supply shortages, and price changes because of that deep trust.
            </p>
            <blockquote style={{
              margin: 0, paddingLeft: '1.25rem', borderLeft: '4px solid #ea580c',
              color: '#1c1917', fontStyle: 'italic', fontWeight: '500'
            }}>
              "When ordering is clear and instant, the rush of the day stops right at your screen. Let our exceptional, homemade recipes turn those saved hours into a beautiful day."
            </blockquote>
          </div>
        </div>
      </section>

      <hr style={{ border: '0', height: '1px', backgroundColor: '#e7e5e4', maxWidth: '1200px', margin: '0 auto' }} />

      {/* LOOKBOOK SECTION */}
      <section style={{ maxWidth: '1200px', margin: '0 auto', padding: '5rem 1.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
          <span style={{ color: '#ea580c', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.875rem' }}>
            Straight from our Kitchen
          </span>
          <h2 style={{ fontSize: '2.25rem', fontWeight: '800', color: '#1c1917', marginTop: '0.5rem' }}>
            Real Food, No Filters Needed
          </h2>
          <p style={{ color: '#78716c', marginTop: '0.5rem', maxWidth: '580px', margin: '0.5rem auto 0 auto', lineHeight: '1.6' }}>
            We believe in complete honesty. These are unedited snapshots of our community's absolute best-selling choices, showing you exactly how they look before heading to your home.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '2rem',
          alignItems: 'start'
        }}>
          {realFoodPhotos.map((photo) => (
            <div key={photo.id} style={{
              backgroundColor: '#ffffff',
              padding: '1rem 1rem 1.5rem 1rem',
              borderRadius: '8px',
              border: '1px solid #e7e5e4',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.04), 0 4px 6px -2px rgba(0, 0, 0, 0.02)',
              transform: photo.id % 2 === 0 ? 'rotate(1deg)' : 'rotate(-1deg)',
              transition: 'transform 0.2s ease-in-out'
            }}>
              <div style={{
                width: '100%',
                aspectRatio: photo.aspectRatio,
                borderRadius: '4px',
                overflow: 'hidden',
                backgroundColor: '#f5f5f4'
              }}>
                <img
                  src={photo.image}
                  alt={photo.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  loading="lazy"
                />
              </div>

              <div style={{ marginTop: '1rem', paddingLeft: '0.25rem' }}>
                <h4 style={{ fontSize: '1.05rem', fontWeight: '700', margin: '0 0 0.25rem 0', color: '#1c1917' }}>
                  {photo.title}
                </h4>
                <p style={{ color: '#78716c', fontSize: '0.85rem', margin: 0, fontStyle: 'italic' }}>
                  {photo.caption}
                </p>
              </div>
            </div>
          ))}

          {showMoreProducts && extraFoodPhotos.map((photo) => (
            <div key={photo.id} style={{
              backgroundColor: '#ffffff',
              padding: '1rem 1rem 1.5rem 1rem',
              borderRadius: '8px',
              border: '1px solid #e7e5e4',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.04), 0 4px 6px -2px rgba(0, 0, 0, 0.02)',
              transform: photo.id % 2 === 0 ? 'rotate(1deg)' : 'rotate(-1deg)',
              transition: 'transform 0.2s ease-in-out',
              animation: 'fadeIn 0.4s ease-out'
            }}>
              <div style={{
                width: '100%',
                aspectRatio: photo.aspectRatio,
                borderRadius: '4px',
                overflow: 'hidden',
                backgroundColor: '#f5f5f4'
              }}>
                <img
                  src={photo.image}
                  alt={photo.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  loading="lazy"
                />
              </div>

              <div style={{ marginTop: '1rem', paddingLeft: '0.25rem' }}>
                <h4 style={{ fontSize: '1.05rem', fontWeight: '700', margin: '0 0 0.25rem 0', color: '#1c1917' }}>
                  {photo.title}
                </h4>
                <p style={{ color: '#78716c', fontSize: '0.85rem', margin: 0, fontStyle: 'italic' }}>
                  {photo.caption}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div style={{ textAlign: 'center', marginTop: '3.5rem' }}>
          <button
            onClick={() => setShowMoreProducts(!showMoreProducts)}
            style={{
              background: 'none',
              border: 'none',
              color: '#ea580c',
              fontSize: '1.1rem',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              textDecoration: 'underline',
              textUnderlineOffset: '4px',
              transition: 'color 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#c2410c'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#ea580c'}
          >
            <span>{showMoreProducts ? "See Less Products" : "More Products"}</span>
            {showMoreProducts ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
        </div>
      </section>

      <hr style={{ border: '0', height: '1px', backgroundColor: '#e7e5e4', maxWidth: '1200px', margin: '0 auto' }} />

      {/* PROFESSIONALIZED TRUST & CORE VALUES SECTION */}
      <section style={{ maxWidth: '1200px', margin: '0 auto', padding: '6rem 1.5rem 2rem 1.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <span style={{ color: '#ea580c', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.85rem' }}>
            Our Operational Standards
          </span>
          <h3 style={{ fontSize: '2rem', fontWeight: '800', color: '#1c1917', marginTop: '0.5rem', letterSpacing: '-0.02em' }}>
            Our Promises To You
          </h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2.5rem' }}>
          {pillars.map((pillar, i) => (
            <div key={i} style={{
              backgroundColor: '#ffffff',
              padding: '2.5rem 2rem',
              borderRadius: '12px',
              border: '1px solid #e7e5e4',
              borderTop: '4px solid #ea580c',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.02)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              textAlign: 'left'
            }}>
              {/* Lucide icon container frame inside the branding color theme */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '56px',
                height: '56px',
                borderRadius: '8px',
                backgroundColor: '#fff7ed',
                border: '1px solid #ffedd5',
                marginBottom: '1.5rem'
              }}>
                {pillar.icon}
              </div>

              <h4 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '0.75rem', color: '#1c1917', letterSpacing: '-0.01em' }}>
                {pillar.title}
              </h4>
              <p style={{ color: '#57534e', fontSize: '0.95rem', lineHeight: '1.6', margin: 0 }}>
                {pillar.description}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default OurStory;
