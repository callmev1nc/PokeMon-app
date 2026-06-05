"use client";

export default function HeroBanner() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#E53E3E] via-[#FC8181] to-[#F6AD55]">
      {/* Decorative circles */}
      <div className="absolute top-[-80px] right-[-40px] w-[200px] h-[200px] border-[8px] border-white/[0.08] rounded-full" />
      <div className="absolute bottom-[-60px] left-[40px] w-[140px] h-[140px] border-[6px] border-white/[0.06] rounded-full" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-16 sm:py-24 text-center">
        {/* Logo mark */}
        <div className="w-[70px] h-[70px] bg-white rounded-full mx-auto mb-5 flex items-center justify-center shadow-lg shadow-black/10">
          <img src="/logo.png" alt="V1NCC" className="w-12 h-12 object-contain rounded-full" />
        </div>

        {/* Title */}
        <h1
          className="text-white text-5xl sm:text-6xl font-black tracking-[3px] mb-2"
          style={{ fontFamily: "var(--font-display)", textShadow: "2px 3px 6px rgba(0,0,0,0.2)" }}
        >
          V1NCC TCG
        </h1>
        <p className="text-white/80 text-sm sm:text-base font-medium mb-8">
          Premium Pokemon Trading Cards • Vietnam
        </p>

        {/* CTAs */}
        <div className="flex gap-3 justify-center flex-wrap mb-8">
          <a
            href="#shop"
            className="bg-white text-[#E53E3E] px-8 py-3 rounded-full font-extrabold text-sm shadow-lg shadow-black/10 hover:shadow-xl hover:scale-105 transition-all duration-200"
          >
            SHOP NOW →
          </a>
          <a
            href="/sets"
            className="bg-white/15 text-white border-2 border-white/30 px-8 py-3 rounded-full font-semibold text-sm hover:bg-white/25 hover:border-white/50 transition-all duration-200"
          >
            VIEW SETS
          </a>
        </div>

        {/* Trust badges */}
        <div className="flex gap-6 justify-center flex-wrap text-white/80 text-xs sm:text-sm">
          <span>✅ 100% Authentic</span>
          <span>🚚 Fast Shipping</span>
          <span>🃏 980+ Cards</span>
        </div>
      </div>

      {/* Wave bottom */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
          <path d="M0 60V30C240 0 480 0 720 30C960 60 1200 60 1440 30V60H0Z" fill="#FAFAFA" />
        </svg>
      </div>
    </section>
  );
}
