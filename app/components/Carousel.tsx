"use client";
import React, { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Card from "./Card";


const Carousel: React.FC = () => {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: "start",
    slidesToScroll: 1,
  });

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);
  const scrollTo = useCallback((i: number) => emblaApi?.scrollTo(i), [emblaApi]);

  useEffect(() => {
  if (!emblaApi) return;

  const onSelect = () => setSelectedIndex(emblaApi.selectedScrollSnap());
  emblaApi.on("select", onSelect);

  setScrollSnaps(emblaApi.scrollSnapList());
  onSelect();

  return () => {
    emblaApi.off("select", onSelect);
  };
}, [emblaApi]);

  const cards = Array.from({ length: 6 }).map((_, i) => ({
    image: `https://images.deliveryhero.io/image/adtech-display/campaigns/fp_pk/111a39be-a4fb-11f0-9640-6aed15985d42.jpeg?height=272&dpi=2`,
    title: `Snack ${i + 1}`,
  }));

  const bannerHeight = "h-[320px] md:h-[380px] lg:h-[420px]";

  return (
    <div className="w-full py-10 md:py-12 px-4 sm:px-8 lg:px-14">
      <div className="flex flex-col lg:flex-row gap-6 items-stretch">
        {/* Carousel */}
        <div className={`relative w-full lg:w-2/3 max-w-5xl ${bannerHeight}`}>
          <div className="overflow-hidden rounded-3xl h-full" ref={emblaRef}>
            <div className="flex h-full">
              {cards.map((card, i) => (
                <Card key={i} {...card} />
              ))}
            </div>
          </div>

          <button
            onClick={scrollNext}
            className="hidden md:flex items-center justify-center absolute -right-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 rounded-full p-3 shadow transition"
          >
            <img src="./images/right-arrow.png" className="w-5" />
          </button>

          {/* Progress bars */}
          <div className="flex justify-center gap-2 mt-6">
            {scrollSnaps.map((_, i) => (
              <button
                key={i}
                onClick={() => scrollTo(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === selectedIndex ? "w-10 bg-gray-800" : "w-6 bg-gray-300"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Promo Banner */}
        <div
          className={`hidden w-full lg:w-1/3 rounded-2xl bg-primary text-accents p-6 shadow-md md:flex flex-col ${bannerHeight}`}
        >
          <div className="flex-1 flex items-center justify-center">
            <img
              src="/images/snacksimagebanner.jpeg"
              alt="Snacks"
              className="h-full w-full object-contain drop-shadow-2xl rounded-2xl"
            />
          </div>
          <div className="mt-4 space-y-3">
            <p className="text-sm font-semibold uppercase tracking-wide opacity-80">
              Place an order now
            </p>
            <h3 className="text-2xl font-bold leading-tight">
              Find your favourite snacks and get them delivered fast.
            </h3>
            <p className="text-sm opacity-80">
              Fresh picks, quick delivery, and exclusive deals every day.
            </p>
            <button className="mt-1 inline-flex items-center justify-center rounded-full bg-accents text-primary px-4 py-2 text-sm font-semibold shadow hover:shadow-lg transition">
              Start shopping
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Carousel;
