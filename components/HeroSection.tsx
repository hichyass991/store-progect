import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, EffectFade, Pagination, Navigation } from 'swiper/modules';
import { motion } from 'framer-motion';

// Use any to bypass broken framer-motion type definitions in the environment
const Motion = motion as any;

// Types for individual media assets
interface MediaItem {
  type: 'image' | 'video';
  url: string;
}

interface HeroSectionProps {
  id?: string;
  title: string;
  subtitle: string;
  cta: string;
  media: MediaItem[];
  autoplay?: boolean;
  transition?: 'fade' | 'slide';
  height?: string;
  isEditing?: boolean;
}

/**
 * HeroSection Component
 * A premium, high-performance carousel supporting images and videos.
 * Enhanced with cinematic vignettes, focus-gradients, and multi-layer depth overlays.
 */
const HeroSection: React.FC<HeroSectionProps> = ({
  id,
  title,
  subtitle,
  cta,
  media = [],
  autoplay = true,
  transition = 'fade',
  height = '85vh',
  isEditing = false
}) => {
  const activeMedia = media.slice(0, 5);
  const hasMultiple = activeMedia.length > 1;

  // Cinematic Animation Variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2,
      }
    }
  };

  const itemVariants = {
    hidden: { 
      opacity: 0, 
      y: 60, 
      rotateX: 25,
      filter: 'blur(8px)',
      scale: 0.95
    },
    visible: {
      opacity: 1,
      y: 0,
      rotateX: 0,
      filter: 'blur(0px)',
      scale: 1,
      transition: {
        duration: 1.4,
        ease: [0.22, 1, 0.36, 1]
      }
    }
  };

  return (
    <section 
      key={id} 
      style={{ height, perspective: '1200px' }} 
      className="relative min-h-[600px] w-full bg-slate-950 overflow-hidden"
    >
      <Swiper
        modules={[Autoplay, EffectFade, Pagination, Navigation]}
        effect={transition === 'fade' ? 'fade' : 'slide'}
        fadeEffect={{ crossFade: true }}
        autoplay={autoplay && hasMultiple ? { 
          delay: 6000, 
          disableOnInteraction: false,
          pauseOnMouseEnter: true 
        } : false}
        pagination={hasMultiple ? { 
          clickable: true,
          dynamicBullets: true 
        } : false}
        navigation={hasMultiple}
        loop={hasMultiple}
        speed={1500}
        className="absolute inset-0 w-full h-full"
      >
        {activeMedia.length > 0 ? (
          activeMedia.map((item, idx) => (
            <SwiperSlide key={`${id || 'hero'}-slide-${idx}`} className="relative w-full h-full overflow-hidden">
              <Motion.div 
                initial={{ scale: 1.15 }}
                whileInView={{ scale: 1 }}
                transition={{ duration: 3, ease: [0.16, 1, 0.3, 1] }}
                className="absolute inset-0 w-full h-full bg-slate-900"
              >
                {item.type === 'video' ? (
                  <video 
                    src={item.url} 
                    autoPlay 
                    loop 
                    muted 
                    playsInline
                    className="w-full h-full object-cover opacity-50" 
                  />
                ) : (
                  <img 
                    src={item.url} 
                    alt={`Slide ${idx + 1}`} 
                    className="w-full h-full object-cover opacity-50" 
                  />
                )}
                
                {/* Layer 1: Cinematic Vignette (Center Focus) */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_rgba(2,6,23,0.85)_100%)] z-[1]" />
                
                {/* Layer 2: Baseline Gradient (Readability) */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent z-[2]" />
                
                {/* Layer 3: Top Frame Gradient (Navigation) */}
                <div className="absolute inset-0 bg-gradient-to-b from-slate-950/60 via-transparent to-transparent z-[2]" />

                {/* Layer 4: Cinematic Noise Texture (Subtle Depth) */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay z-[3]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}></div>
              </Motion.div>
            </SwiperSlide>
          ))
        ) : (
          <SwiperSlide className="bg-slate-900 flex items-center justify-center">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-800 via-slate-900 to-slate-950 opacity-50" />
            <div className="relative z-10 flex flex-col items-center gap-4 opacity-20">
               <i className="fas fa-mountain-sun text-4xl text-white"></i>
               <span className="text-[10px] font-black uppercase tracking-[0.5em] text-white">Visual Artifact Pending</span>
            </div>
          </SwiperSlide>
        )}
      </Swiper>

      {/* Hero Content Overlay with Refined Entrance Logic */}
      <div className="absolute inset-0 z-20 flex flex-col items-center justify-center pointer-events-none">
        <Motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          className="text-center px-6 max-w-5xl"
        >
          <Motion.div variants={itemVariants} className="inline-block mb-6">
            <span className="text-[9px] md:text-[11px] font-black text-emerald-500 uppercase tracking-[0.6em] bg-emerald-500/10 px-6 py-2 rounded-full border border-emerald-500/20 backdrop-blur-sm">
              Nexus Studio Edition
            </span>
          </Motion.div>

          <Motion.h1 
            variants={itemVariants}
            className="text-white text-5xl md:text-[10rem] font-black mb-8 tracking-tighter leading-[0.75] drop-shadow-[0_20px_50px_rgba(0,0,0,0.6)] uppercase italic"
          >
            {title || 'Defining Modern Space.'}
          </Motion.h1>
          
          <Motion.p 
            variants={itemVariants}
            className="text-slate-300 text-base md:text-3xl mb-14 font-light max-w-3xl mx-auto leading-relaxed tracking-wide opacity-90 drop-shadow-lg"
          >
            {subtitle || 'Elevating digital commerce through high-performance architectural components.'}
          </Motion.p>
          
          <Motion.div
            variants={itemVariants}
            className="pointer-events-auto"
          >
            <button className="group relative bg-white text-slate-950 px-10 md:px-20 py-4 md:py-7 rounded-full font-black text-[9px] md:text-[11px] uppercase tracking-[0.5em] shadow-[0_20px_80px_rgba(0,0,0,0.3)] transition-all hover:scale-105 hover:bg-emerald-500 hover:text-white active:scale-95 overflow-hidden">
              <span className="relative z-10">{cta || 'Enter Collection'}</span>
              <div className="absolute inset-0 rounded-full bg-emerald-400 blur-2xl opacity-0 group-hover:opacity-40 transition-opacity" />
              <div className="absolute top-0 -left-[100%] w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent group-hover:left-[100%] transition-all duration-1000 ease-in-out pointer-events-none" />
            </button>
          </Motion.div>
        </Motion.div>
      </div>
      
      {isEditing && (
        <div className="absolute top-10 left-10 z-30 pointer-events-none animate-pulse">
          <div className="bg-emerald-600/90 text-white text-[8px] font-black uppercase tracking-[0.3em] px-5 py-2.5 rounded-full shadow-2xl border border-emerald-400/30 backdrop-blur-md">
            Nexus Pro: Live Carousel Active
          </div>
        </div>
      )}
      
      {/* Decorative side elements with high-fidelity reveal */}
      <Motion.div 
        initial={{ opacity: 0, x: -30 }}
        whileInView={{ opacity: 0.4, x: 0 }}
        transition={{ delay: 0.8, duration: 1.5, ease: "easeOut" }}
        className="absolute left-10 top-1/2 -translate-y-1/2 z-20 hidden lg:flex flex-col gap-10"
      >
          <div className="w-px h-32 bg-gradient-to-b from-transparent via-white to-transparent" />
          <div className="text-[10px] font-black text-white uppercase vertical-text tracking-[1.2em] opacity-50">Studio Archive</div>
          <div className="w-px h-32 bg-gradient-to-b from-transparent via-white to-transparent" />
      </Motion.div>

      {/* Scroll indicator */}
      <Motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 0.4, y: 0 }}
        transition={{ delay: 2, duration: 1, repeat: Infinity, repeatType: 'reverse' }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2"
      >
        <div className="w-px h-10 bg-white shadow-lg" />
        <span className="text-[8px] font-black text-white uppercase tracking-widest drop-shadow-md">Scroll</span>
      </Motion.div>
    </section>
  );
};

export default HeroSection;
