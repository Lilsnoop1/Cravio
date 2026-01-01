"use client"
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { useCategory } from '../context/categoriesContext';
import { useCompanies } from '../context/fetchCompanies';
import { CategoryFetch, Company } from '../Data/database';

export default function Categories() {
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [showAllCompanies, setShowAllCompanies] = useState(false);
  const [slidesToScroll, setSlidesToScroll] = useState(1);
  const [visibleCompanies,setVisibleCompanies] = useState<Company[]>([]);
  const [visibleCategories,setVisibleCategories] = useState<CategoryFetch[]>([]);
  const {CategoryFetched} = useCategory();
  const {CompaniesFetch: companies, loading: companiesLoading} = useCompanies();
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: false,
    align: "start",
    slidesToScroll,
  });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);
  const scrollTo = useCallback((i: number) => emblaApi?.scrollTo(i), [emblaApi]);


  useEffect(() => {
  if (!emblaApi) return;

  const onSelect = () => {
    const index = emblaApi.selectedScrollSnap();
    setSelectedIndex(index);
    
    // Reset showAll states when switching slides
    setShowAllCategories(false);
    setShowAllCompanies(false);
  };
  
  emblaApi.on("select", onSelect);

  setScrollSnaps(emblaApi.scrollSnapList());
  onSelect();

  return () => {
    emblaApi.off("select", onSelect);
  };
}, [emblaApi]);


  const getPageTitle = () => {
    return selectedIndex === 0 ? 'All categories' : 'Our Brands';
  };

  const getVisibleCategories = () => {
    if (!CategoryFetched) return [];
    if (showAllCategories) return CategoryFetched;
    if (typeof window !== "undefined" && window.innerWidth >= 768) {
      return CategoryFetched.slice(0, 12); // ~2 rows on desktop
    }
    return CategoryFetched.slice(0, 8); // ~2 rows on mobile/tablet
  };

  const getVisibleCompanies = () => {
    if (!companies) return [];
    if (showAllCompanies) return companies;
    if (typeof window !== "undefined" && window.innerWidth >= 768) {
      return companies.slice(0, 10); // 2 rows on desktop
    }
    return companies.slice(0, 6); // 2 rows on mobile/tablet
  };

  useEffect(() => {
    const handleResize = () => {
        setVisibleCategories(getVisibleCategories());
        setVisibleCompanies(getVisibleCompanies());
    };

    handleResize(); // run once on mount

    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
}, [CategoryFetched, companies, showAllCategories, showAllCompanies]);


  return (
    <section className="md:py-8 md:px-8 px-3 py-3">
      <div className="w-full mx-auto flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="h-8 w-1.5 rounded-full bg-primary" />
            <h2 className="font-danson text-2xl md:text-3xl font-bold text-slate-900">
              {getPageTitle()}
            </h2>
          </div>
          {selectedIndex === 0 && !showAllCategories && (
            <button 
              onClick={() => setShowAllCategories(true)}
              className="group flex items-center gap-1 text-slate-700 hover:text-amber-600 font-sifonn font-semibold transition-colors duration-300"
            >
              <span className="text-sm md:text-base">View All ({CategoryFetched?.length})</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
            </button>
          )}
          {selectedIndex === 1 && !showAllCompanies && (
            <button 
              onClick={() => setShowAllCompanies(true)}
              className="group flex items-center gap-2 text-slate-700 hover:text-amber-600 font-sifonn font-semibold transition-colors duration-300"
            >
              <span className="text-sm md:text-base">View All ({companies?.length})</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
            </button>
          )}
        </div>

        {/* Carousel Container */}
        <div className="relative w-full py-4 mx-auto px-0 sm:px-4">
          {/* Carousel Viewport */}
          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex">
              {/* Categories Slide */}
              <div className="flex-[0_0_100%] min-w-0 px-1">
                <div className="flex flex-wrap gap-2 md:gap-15 md:px-10">
                  {visibleCategories?visibleCategories.map((category, index) => (
                    <Link
                      href={`/category/${category.name}`}
                      key={index}
                    >
                      <div className="group flex flex-col items-center gap-2 w-24 md:w-24">
                        <div className="relative overflow-hidden rounded-2xl bg-slate-50 border border-slate-200 w-20 h-20 md:w-20 md:h-20 shadow-sm hover:shadow-md transition-all duration-300 flex items-center justify-center">
                          <img
                            src={category.url}
                            alt={category.name}
                            className="w-14 h-14 md:w-16 md:h-16 object-contain group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        </div>
                        <div className="text-center">
                          <p className="font-sifonn text-sm md:text-base font-semibold text-slate-800 group-hover:text-primary transition-colors duration-300 leading-snug">
                            {category.name}
                          </p>
                          {!showAllCategories && (
                            <p className="text-[11px] md:text-xs text-muted-foreground mt-0.5">
                              {category.productCount} items
                            </p>
                          )}
                        </div>
                      </div>
                    </Link>
                  )):null}
                </div>
                {showAllCategories && (
                  <div className="flex justify-center mt-6">
                    <button
                      onClick={() => setShowAllCategories(false)}
                      className="text-sm md:text-base text-slate-700 hover:text-amber-600 font-sifonn font-semibold transition-colors duration-300"
                    >
                      Show Less
                    </button>
                  </div>
                )}
              </div>

              {/* Companies Slide */}
                <div className="flex-[0_0_100%] min-w-0 px-1">
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 md:gap-2.5">
                    {visibleCompanies?visibleCompanies.map((company: Company, index:number) => (
                      <Link
                        href={`/companies/${company.name.toLowerCase().replace(/\s+/g, '-')}`}
                        key={index}
                        className="flex-shrink-0"
                      >
                        <div className="group flex flex-col items-center gap-2 p-3 bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 border border-slate-200 hover:border-amber-300">
                          <div className="relative overflow-hidden rounded-xl bg-slate-100 w-16 h-16 md:w-18 md:h-18 shadow-sm">
                            <img
                              src={company.image ?? "/images/dummyimage.png"}
                              alt={company.name}
                              className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                          <div className="text-center">
                            <p className="font-sifonn text-sm md:text-base font-semibold text-slate-800 group-hover:text-primary transition-colors duration-300 line-clamp-2">
                              {company.name}
                            </p>
                            {!showAllCompanies && (
                              <p className="text-[11px] md:text-xs text-muted-foreground mt-0.5">
                              {company.productCount} products
                              </p>
                            )}
                          </div>
                        </div>
                      </Link>
                    )):null}
                  </div>
                  {showAllCompanies && (
                    <div className="flex justify-center mt-6">
                      <button
                        onClick={() => setShowAllCompanies(false)}
                        className="text-sm md:text-base text-slate-700 hover:text-amber-600 font-sifonn font-semibold transition-colors duration-300"
                      >
                        Show Less
                      </button>
                    </div>
                  )}
                </div>
            </div>
          </div>

          {/* Hint arrow toggle */}
          <div className="flex justify-end mt-3">
            <button
              onClick={() => scrollTo(selectedIndex === 0 ? 1 : 0)}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-sm font-semibold text-slate-700 hover:border-amber-400 hover:text-amber-600 transition"
            >
              {selectedIndex === 0 ? "See brands" : "See categories"}
              <ArrowRight className={`w-4 h-4 transition-transform ${selectedIndex === 1 ? "-scale-x-100" : ""}`} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
