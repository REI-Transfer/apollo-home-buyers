"use client";

import { useState } from "react";
import Image from "next/image";
import { ArrowRight, ArrowDown, Shield, ShieldCheck, MapPin, Clock, DollarSign } from "lucide-react";
import { SurveyCard } from "@/components/v2/survey-card";
import { AddressAutocomplete, type AddressDetails } from "@/components/survey/address-autocomplete";
import { isWithinServiceArea } from "@/lib/service-area";
import { marketPhrase, type Brand } from "@/lib/brand";

export function HeroSection({ brand }: { brand: Brand }) {
  const [showSurvey, setShowSurvey] = useState(false);
  const [initialAddress, setInitialAddress] = useState("");
  const [addressVerified, setAddressVerified] = useState(false);
  const [outsideAreaError, setOutsideAreaError] = useState(false);

  const handleAddressSelect = (address: string, details: AddressDetails) => {
    // Env-driven service-area gate. Permissive when NEXT_PUBLIC_SERVICE_AREAS is empty.
    if (isWithinServiceArea(details.lat, details.lng)) {
      setInitialAddress(address);
      setAddressVerified(true);
      setOutsideAreaError(false);
      setShowSurvey(true);
    } else {
      setAddressVerified(false);
      setOutsideAreaError(true);
    }
  };

  return (
    <section id="hero" className="relative bg-white overflow-hidden">
      <div className="relative z-10 flex flex-col lg:flex-row items-center lg:items-stretch min-h-[100dvh] px-4 pt-28 pb-8 md:px-12 md:pb-20 lg:px-16 lg:pt-16 lg:pb-0 gap-6 lg:gap-0">

        {/* Form content (single centered column; the team photo sits below the form) */}
        <div className="w-full flex flex-col items-center justify-center lg:py-20">
          {/* Trust badges */}
          <div className="hidden md:flex flex-wrap items-center justify-center gap-6 mb-4 mt-4 lg:mt-0 animate-reveal-up">
            <div className="flex items-center gap-2 text-[#5A6B7D] text-base">
              <Shield className="h-4 w-4 text-[#1B2A4A]" />
              <span>Local Cash Buyer</span>
            </div>
            <div className="flex items-center gap-2 text-[#5A6B7D] text-base">
              <Clock className="h-4 w-4 text-[#1B2A4A]" />
              <span>24-Hour Cash Offers</span>
            </div>
            <div className="flex items-center gap-2 text-[#5A6B7D] text-base">
              <DollarSign className="h-4 w-4 text-[#1B2A4A]" />
              <span>No Fees. No Commissions.</span>
            </div>
          </div>

          {/* Main headline */}
          <h1 className="text-center text-2xl font-bold leading-tight tracking-tight text-[#0F1D2F] md:text-5xl lg:text-5xl max-w-2xl animate-reveal-up animation-delay-100">
            {brand.headline}
            {brand.headlineAccent && (
              <>
                <br />
                <span className="text-[color:var(--brand-accent)]">{brand.headlineAccent}</span>
              </>
            )}
          </h1>

          {/* Subheadline */}
          <p className="mt-2 md:mt-4 text-center text-base md:text-xl text-[#5A6B7D] max-w-xl leading-relaxed animate-reveal-up animation-delay-200">
            {brand.subheadline}
          </p>

          {/* Address Input or Survey */}
          <div className="mt-4 md:mt-6 w-full max-w-2xl animate-reveal-up animation-delay-300">
            {!showSurvey ? (
              <div className="flex flex-col gap-3">
                <div className="flex flex-col items-center gap-1">
                  <span className="text-[#1B2A4A] text-base font-medium">Enter your address to start</span>
                  <ArrowDown className="h-5 w-5 text-[#1B2A4A] animate-bounce" />
                </div>
                <div className="relative">
                  <AddressAutocomplete
                    value={initialAddress}
                    onChange={(address) => { setInitialAddress(address); setAddressVerified(false); setOutsideAreaError(false); }}
                    onSelect={handleAddressSelect}
                    placeholder="Enter your property address..."
                    className="[&_input]:h-14 [&_input]:text-lg [&_input]:rounded-2xl [&_input]:shadow-lg [&_input]:border-[#1B2A4A]/30 [&_input]:bg-white"
                  />
                </div>
                <button
                  onClick={() => { if (addressVerified) setShowSurvey(true) }}
                  className="w-full h-14 bg-[#1B2A4A] hover:bg-[#131E36] text-white font-semibold text-xl rounded-2xl transition-all shadow-lg shadow-[#1B2A4A]/20 flex items-center justify-center gap-2"
                >
                  Get My Free Cash Offer
                  <ArrowRight className="h-6 w-6" />
                </button>
                {outsideAreaError && (
                  <p className="text-center text-sm font-medium" style={{ color: "#dc2626" }}>
                    Sorry, that address is outside our current buying area. Please enter a property in {marketPhrase(brand)}.
                  </p>
                )}
                <p className="hidden md:block text-center text-[#94A3B8] text-sm">
                  Takes less than 2 minutes. No obligation.
                </p>
                {/* Our own promise badges. These replaced the template's BBB "A+ Accredited" and Google
                    5-star badges, which were hard-coded for every client and cannot be verified for
                    Apollo. Each badge restates a promise this page already makes, never a third-party
                    rating we cannot show. Same pattern as REI-Transfer/we-solve-homes#2. */}
                <div className="grid grid-cols-3 gap-2 md:gap-4 mt-2 md:mt-3">
                  {[
                    { Icon: ShieldCheck, top: "Offer Never", bottom: "Changes" },
                    { Icon: MapPin, top: "Local", bottom: brand.marketName ? `${brand.marketName} Buyer` : "Cash Buyer" },
                    { Icon: DollarSign, top: "$0 Fees or", bottom: "Commissions" },
                  ].map(({ Icon, top, bottom }) => (
                    <div
                      key={top}
                      className="flex flex-col items-center justify-center gap-1 rounded-xl border border-gray-200 bg-white px-2 py-2.5 md:py-4 text-center shadow-sm"
                    >
                      <Icon className="h-6 w-6 md:h-8 md:w-8 text-[color:var(--brand-accent)]" aria-hidden="true" />
                      <span className="text-xs md:text-base font-bold leading-tight text-[#0F1D2F]">
                        {top}
                        <br />
                        {bottom}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="animate-scale-in">
                <SurveyCard initialAddress={initialAddress} brand={brand} />
              </div>
            )}
          </div>

          {/* Meet the team. Replaced the single owner headshot ("We review every offer
              personally."). Modeled on go.ibuykc.com: eyebrow, heading, one wide photo.
              width/height reserve the space so the page does not jump when it loads. */}
          <div className="mt-8 md:mt-12 mx-auto w-full max-w-3xl text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-[color:var(--brand-accent)]">
              Meet the Apollo Team
            </p>
            <h2 className="mt-1 text-xl font-bold text-[#0F1D2F] md:text-2xl text-balance">
              Local Charleston homebuyers helping homeowners sell as-is
            </h2>
            <Image
              src="/images/team-photo.jpg"
              alt="The Apollo Home Buyers team"
              width={1600}
              height={900}
              sizes="(max-width: 768px) 100vw, 672px"
              className="mt-4 h-auto w-full max-w-2xl mx-auto rounded-xl"
            />
          </div>
        </div>

      </div>
    </section>
  );
}
