"use client"

import { THANKYOU_VIDEOS } from "@/lib/thankyou-videos"

// Two portrait thank-you videos framed in one container: side by side on desktop
// (equal width), stacked full-width on mobile, same order. Each <video> reserves
// its own measured aspect ratio; width is constrained (never height); #t=0.1 paints
// a first frame instead of black. No accordion, no object-cover.
export function ThankYouVideos({ accentColor }: { accentColor: string }) {
  if (!THANKYOU_VIDEOS.length) return null
  return (
    <section className="bg-white px-4 py-8 md:py-12">
      <div className="mx-auto max-w-3xl">
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-6 md:p-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 justify-items-center">
            {THANKYOU_VIDEOS.map((v) => (
              <div key={v.url} className="w-full max-w-[360px] mx-auto">
                <h3 className="text-base md:text-lg font-bold text-center mb-3" style={{ color: accentColor }}>
                  {v.label}
                </h3>
                <video
                  src={`${v.url}#t=0.1`}
                  controls
                  playsInline
                  preload="metadata"
                  className="w-full block rounded-xl border border-gray-200 shadow bg-black"
                  style={{ aspectRatio: v.ratio }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
