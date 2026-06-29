"use client";

export default function HeroBanner() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#E53E3E] via-[#FC8181] to-[#F6AD55]">
      {/* Decorative circles */}
      <div className="absolute top-[-80px] right-[-40px] w-[200px] h-[200px] border-[8px] border-white/[0.08] rounded-full" />
      <div className="absolute bottom-[-60px] left-[40px] w-[140px] h-[140px] border-[6px] border-white/[0.06] rounded-full" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-6 sm:py-8 text-center">
        {/* Logo mark */}
        <div className="w-[70px] h-[70px] bg-white rounded-full mx-auto mb-3 flex items-center justify-center shadow-lg shadow-black/10 animate-fade-in stagger-1">
          <img src="/logo.png" alt="V1NCC" className="w-12 h-12 object-contain rounded-full" />
        </div>

        {/* Title */}
        <h1
          className="font-display text-white text-5xl sm:text-6xl font-black tracking-[3px] mb-2 animate-fade-in stagger-2"
          style={{ textShadow: "2px 3px 6px rgba(0,0,0,0.2)" }}
        >
          V1NCC TCG
        </h1>
        <p className="text-white/80 text-sm sm:text-base font-medium mb-4 animate-fade-in stagger-3">
          Premium Pokemon Trading Cards • Vietnam
        </p>

        {/* CTAs */}
        <div className="flex gap-3 justify-center flex-wrap mb-4 animate-fade-in stagger-4">
          <a
            href="#shop"
            className="pressable hover-lift bg-white text-brand px-8 py-3 rounded-full font-extrabold text-sm shadow-lg shadow-black/10"
          >
            SHOP NOW →
          </a>
          <a
            href="/sets"
            className="pressable bg-white/15 text-white border-2 border-white/30 px-8 py-3 rounded-full font-semibold text-sm hover:bg-white/25 hover:border-white/50 transition-colors duration-[var(--dur-fast)] ease-[var(--ease-out)]"
          >
            VIEW SETS
          </a>
        </div>

        {/* Trust badges */}
        <div className="flex gap-6 justify-center flex-wrap text-white/80 text-xs sm:text-sm animate-fade-in stagger-5">
          <span>✅ 100% Authentic</span>
          <span>🚚 Fast Shipping</span>
          <span>🃏 980+ Cards</span>
        </div>
      </div>

      {/* Wave bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-[16px] bg-[#FAFAFA] dark:bg-[#0F1629]">
        <svg viewBox="0 0 1440 30" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full absolute -top-[15px]">
          <path d="M0 16V8C240 0 480 0 720 8C960 16 1200 16 1440 8V16H0Z" fill="currentColor" className="text-[#FAFAFA] dark:text-[#0F1629]" />
        </svg>
      </div>
    </section>
  );
}
