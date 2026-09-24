"use client";

import type { Brand } from "@/lib/brand";

const titles = [
  "Our Offer Never Changes.",
  "No Inspection Tricks.",
  "A Fair Cash Offer.",
];

const descriptionText =
  "Most cash buyers quote high to get you locked in. Then they send someone to inspect the property and chip away at the number. By the time they are done adjusting, the offer barely resembles what they promised. We do our homework first. The number we give you is the number you get at closing. Every single time.";

/**
 * Static. This section used to be a 150vh sticky block whose headings rotated in
 * on scroll and whose paragraph revealed word by word from a 40px blur. Every
 * word started at opacity 0, so the copy was invisible until the reader scrolled
 * it into range, and it never appeared at all in a screenshot or on a short
 * screen. The words are the point; they are now simply readable.
 */
export function PhilosophySection({ brand }: { brand: Brand }) {
  void brand;
  return (
    <section id="promise" className="bg-background px-6 py-20 md:px-12 md:py-28 lg:px-20">
      <div className="mx-auto max-w-4xl text-center">
        <h2 className="text-3xl font-bold leading-tight tracking-tight text-[#0F1D2F] md:text-5xl text-balance">
          {titles.map((title) => (
            <span key={title} className="block">
              {title}
            </span>
          ))}
        </h2>
        <p className="mt-8 text-lg leading-relaxed text-muted-foreground md:text-2xl">
          {descriptionText}
        </p>
      </div>
    </section>
  );
}
