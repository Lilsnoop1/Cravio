"use client"
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useCallback, useEffect, useState, useRef } from 'react';
import { usePathname } from 'next/navigation';
import useEmblaCarousel from 'embla-carousel-react';
import { useCategory } from '../context/categoriesContext';
import { useCompanies } from '../context/fetchCompanies';
import { CategoryFetch, Company } from '../Data/database';

export default function Categories() {
  // Shared "show all" state for both categories and companies
  const [showAll, setShowAll] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = sessionStorage.getItem("categories-show-all");
      return saved === "true";
    }
    return false;
  });
  
  const [slidesToScroll, setSlidesToScroll] = useState(1);
  const [visibleCompanies,setVisibleCompanies] = useState<Company[]>([]);
  const [visibleCategories,setVisibleCategories] = useState<CategoryFetch[]>([]);
  const {CategoryFetched} = useCategory();
  const {CompaniesFetch: companies, loading: companiesLoading} = useCompanies();
  const categoriesSlideRef = useRef<HTMLDivElement>(null);
  const companiesSlideRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const isInitialMount = useRef(true);
  const pathname = usePathname();
  const previousPathname = useRef<string | null>(null);
  const isNavigatingFromOtherPage = useRef(false);
  
  // Persist showAll state to sessionStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("categories-show-all", String(showAll));
    }
  }, [showAll]);
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: false,
    align: "start",
    slidesToScroll,
    watchDrag: false,
  });
  const [selectedIndex, setSelectedIndex] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = sessionStorage.getItem("categories-selected-index");
      return saved ? parseInt(saved, 10) : 0;
    }
    return 0;
  });
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);
  
  // Persist selectedIndex state to sessionStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("categories-selected-index", String(selectedIndex));
    }
  }, [selectedIndex]);
  
  // Detect navigation from another page
  useEffect(() => {
    // Check if we're on the home page and came from a different page
    if (pathname === '/' && previousPathname.current !== null && previousPathname.current !== '/') {
      isNavigatingFromOtherPage.current = true;
      // Reset after a short delay
      setTimeout(() => {
        isNavigatingFromOtherPage.current = false;
      }, 100);
    }
    // Update previous pathname
    previousPathname.current = pathname;
  }, [pathname]);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);
  const scrollTo = useCallback((i: number) => emblaApi?.scrollTo(i), [emblaApi]);


  useEffect(() => {
  if (!emblaApi) return;

  const handleSelect = () => {
    const index = emblaApi.selectedScrollSnap();
    setSelectedIndex(index);
    
    // Save scroll position directly to sessionStorage (skip on initial mount)
    if (typeof window !== "undefined" && !isInitialMount.current) {
      const container = emblaApi.containerNode();
      const currentTransform = container?.style.transform || '';
      
      sessionStorage.setItem("categories-selected-index", String(index));
      if (currentTransform) {
        sessionStorage.setItem("categories-scroll-transform", currentTransform);
      }
    }
    
    // Don't reset showAll when switching slides - keep it persistent
  };
  
  const handleScroll = () => {
    // Save scroll position during scroll for smoother restoration
    if (typeof window !== "undefined" && !isInitialMount.current) {
      const container = emblaApi.containerNode();
      const currentTransform = container?.style.transform || '';
      
      if (currentTransform) {
        sessionStorage.setItem("categories-scroll-transform", currentTransform);
      }
    }
  };
  
  emblaApi.on("select", handleSelect);
  emblaApi.on("scroll", handleScroll);

  setScrollSnaps(emblaApi.scrollSnapList());
  
  // Restore saved scroll position directly on initial mount
  if (isInitialMount.current && typeof window !== "undefined") {
    const savedScrollTransform = sessionStorage.getItem("categories-scroll-transform");
    const savedIndex = sessionStorage.getItem("categories-selected-index");
    
    if (savedScrollTransform && savedIndex !== null) {
      const index = parseInt(savedIndex, 10);
      
      if (!isNaN(index)) {
        // Check if we're navigating from another page
        const shouldDisableTransitions = isNavigatingFromOtherPage.current;
        
        // Wait for Embla to initialize, then restore scroll position
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            const container = emblaApi.containerNode();
            const viewport = container?.parentElement;
            
            // Only disable transitions if navigating from another page
            if (shouldDisableTransitions) {
              if (container) {
                container.style.setProperty('transition', 'none', 'important');
                container.style.setProperty('transition-duration', '0ms', 'important');
              }
              
              if (viewport) {
                viewport.style.setProperty('transition', 'none', 'important');
                viewport.style.setProperty('transition-duration', '0ms', 'important');
              }
            }
            
            // Temporarily remove event listeners to prevent saving during restoration
            emblaApi.off("select", handleSelect);
            emblaApi.off("scroll", handleScroll);
            
            // Use scrollTo to restore position and sync Embla's internal state
            if (index >= 0 && index < emblaApi.scrollSnapList().length) {
              // If navigating from another page, restore transform first to prevent animation
              if (shouldDisableTransitions && container && savedScrollTransform) {
                container.style.transform = savedScrollTransform;
              }
              
              // scrollTo will sync Embla's state
              emblaApi.scrollTo(index, !shouldDisableTransitions); // Use animation if not navigating
              
              // If navigating from another page, restore transform after scrollTo to prevent visual change
              if (shouldDisableTransitions && container && savedScrollTransform) {
                container.style.transform = savedScrollTransform;
                requestAnimationFrame(() => {
                  if (container) container.style.transform = savedScrollTransform;
                });
              }
            }
            
            // Sync state manually
            setSelectedIndex(index);
            
            // Re-attach event listeners
            emblaApi.on("select", handleSelect);
            emblaApi.on("scroll", handleScroll);
            
            // Re-enable transitions if they were disabled
            if (shouldDisableTransitions) {
              requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                  if (container) {
                    container.style.removeProperty('transition');
                    container.style.removeProperty('transition-duration');
                  }
                  if (viewport) {
                    viewport.style.removeProperty('transition');
                    viewport.style.removeProperty('transition-duration');
                  }
                  // Mark initial mount as complete after everything is set up
                  isInitialMount.current = false;
                });
              });
            } else {
              // Mark initial mount as complete immediately if no transition disabling
              isInitialMount.current = false;
            }
          });
        });
        return;
      }
    }
    
    // No saved state on initial mount, mark as complete
    isInitialMount.current = false;
  }
  
  // Sync current state (only if not initial mount with saved state)
  if (!isInitialMount.current) {
    handleSelect();
  }

  return () => {
    emblaApi.off("select", handleSelect);
    emblaApi.off("scroll", handleScroll);
  };
}, [emblaApi]);


  const getPageTitle = () => {
    return selectedIndex === 0 ? 'All categories' : 'Our Brands';
  };

  const getVisibleCategories = () => {
    if (!CategoryFetched) return [];
    if (showAll) return CategoryFetched;
    if (typeof window !== "undefined" && window.innerWidth >= 768) {
      return CategoryFetched.slice(0, 8); // ~2 rows on desktop
    }
    return CategoryFetched.slice(0, 4); // ~2 rows on mobile/tablet
  };

  const getVisibleCompanies = () => {
    if (!companies) return [];
    if (showAll) return companies;
    if (typeof window !== "undefined" && window.innerWidth >= 768) {
      return companies.slice(0, 10); // 2 rows on desktop
    }
    return companies.slice(0, 6); // 2 rows on mobile/tablet
  };

  useEffect(() => {
    // Update visible items whenever data or showAll state changes
    setVisibleCategories(getVisibleCategories());
    setVisibleCompanies(getVisibleCompanies());
  }, [CategoryFetched, companies, showAll]);

  // Update carousel height based on active slide content
  useEffect(() => {
    const updateHeight = (instant = false) => {
      if (!viewportRef.current) return;
      
      const activeSlide = selectedIndex === 0 
        ? categoriesSlideRef.current 
        : companiesSlideRef.current;
      
      if (activeSlide) {
        // Get the natural height of the content
        const height = activeSlide.scrollHeight;
        
        // Disable transition on initial mount or when instant is true
        if (isInitialMount.current || instant) {
          viewportRef.current.style.transition = 'none';
        } else {
          viewportRef.current.style.transition = 'height 0.2s ease-out';
        }
        
        // Set viewport height to match content
        viewportRef.current.style.height = `${height}px`;
        
        // Re-enable transitions after a brief moment if it was disabled
        if (isInitialMount.current || instant) {
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              if (viewportRef.current) {
                viewportRef.current.style.transition = 'height 0.2s ease-out';
              }
            });
          });
        }
        
        // Mark initial mount as complete after first height set
        if (isInitialMount.current) {
          isInitialMount.current = false;
        }
      }
    };

    // Use requestAnimationFrame to ensure DOM is ready
    const rafId = requestAnimationFrame(() => {
      // Always update height, use instant mode on initial mount
      updateHeight(isInitialMount.current);
    });
    
    // Also update after a very short delay as fallback
    const timeoutId = setTimeout(() => {
      updateHeight(isInitialMount.current);
    }, 10);
    
    // Use ResizeObserver for more reliable height tracking
    const activeSlide = selectedIndex === 0 
      ? categoriesSlideRef.current 
      : companiesSlideRef.current;
    
    let resizeObserver: ResizeObserver | null = null;
    
    if (activeSlide && typeof window !== 'undefined' && window.ResizeObserver) {
      resizeObserver = new ResizeObserver(() => {
        // Don't use instant for resize events after initial mount
        updateHeight(false);
      });
      resizeObserver.observe(activeSlide);
    }
    
    // Fallback for browsers without ResizeObserver
    const handleResize = () => updateHeight(false);
    window.addEventListener('resize', handleResize);
    
    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(timeoutId);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      window.removeEventListener('resize', handleResize);
    };
  }, [selectedIndex, visibleCategories, visibleCompanies, showAll]);

  useEffect(() => {
    const handleResize = () => {
        setVisibleCategories(getVisibleCategories());
        setVisibleCompanies(getVisibleCompanies());
    };

    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
}, [CategoryFetched, companies, showAll]);


  return (
    <section id="categories" className="md:py-8 md:px-8 px-1 pr-2 py-1">
      <div className="w-full mx-auto flex flex-col md:gap-6 gap-2">
        {/* Header */}
        <div className="flex items-center justify-between md:pb-3 pb-1">
          <div className="flex items-center gap-3">
            <div className="h-8 w-1.5 rounded-full bg-primary" />
            <h2 className="font-danson text-2xl md:text-3xl font-bold text-slate-900">
              {getPageTitle()}
            </h2>
          </div>
          <button 
            onClick={() => scrollTo(selectedIndex === 0 ? 1 : 0)}
            className="group flex items-center gap-1 text-slate-700 hover:text-amber-600 font-sifonn font-semibold transition-colors duration-300"
          >
            <span className="text-sm md:text-base">{selectedIndex === 0 ? "See brands" : "See categories"}</span>
            <ArrowRight className={`w-4 h-4 transition-transform group-hover:translate-x-1 ${selectedIndex === 1 ? "-scale-x-100" : ""}`} />
          </button>
        </div>

        {/* Carousel Container */}
        <div className={`relative w-full py-4 mx-auto px-0 sm:px-4 ${isInitialMount.current && isNavigatingFromOtherPage.current ? '[&_*]:!transition-none [&_*]:!duration-0' : ''}`}>
          {/* Carousel Viewport */}
          <div 
            className="overflow-hidden"
            style={isInitialMount.current && isNavigatingFromOtherPage.current ? { transition: 'none', transitionDuration: '0ms' } : undefined}
            ref={(node) => {
              emblaRef(node);
              viewportRef.current = node;
              // Only disable transitions if navigating from another page
              if (node && isInitialMount.current && isNavigatingFromOtherPage.current && typeof window !== "undefined") {
                node.style.setProperty('transition', 'none', 'important');
                node.style.setProperty('transition-duration', '0ms', 'important');
                
                // Try to restore transform early - will be applied once container exists
                const savedScrollTransform = sessionStorage.getItem("categories-scroll-transform");
                if (savedScrollTransform) {
                  // Wait for container to exist, then restore transform
                  requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                      const container = node.querySelector('.embla__container') || 
                                       node.querySelector('[class*="flex"]') as HTMLElement;
                      if (container && savedScrollTransform) {
                        (container as HTMLElement).style.setProperty('transition', 'none', 'important');
                        (container as HTMLElement).style.setProperty('transition-duration', '0ms', 'important');
                        (container as HTMLElement).style.transform = savedScrollTransform;
                      }
                    });
                  });
                }
                
                // Disable transitions on all children
                const allChildren = node.querySelectorAll('*');
                allChildren.forEach((child) => {
                  (child as HTMLElement).style.setProperty('transition', 'none', 'important');
                  (child as HTMLElement).style.setProperty('transition-duration', '0ms', 'important');
                });
              }
            }}
          >
            <div className="flex items-start" style={isInitialMount.current && isNavigatingFromOtherPage.current ? { transition: 'none', transitionDuration: '0ms' } : undefined}>
              {/* Categories Slide */}
              <div ref={categoriesSlideRef} className="flex-[0_0_100%] min-w-0 px-1 self-start">
                <div className="flex flex-wrap gap-3 md:gap-10 md:px-10 content-start">
                  {visibleCategories?visibleCategories.map((category, index) => (
                    <Link
                      href={`/category/${category.name}`}
                      key={index}
                    >
                      <div className="group flex flex-col items-center gap-2 w-24 md:w-24">
                        <div className="relative overflow-hidden w-24 h-24 md:w-28 md:h-28 rounded-2xl flex items-center justify-center">
                          <img
                            src={category.url}
                            alt={category.name}
                            className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                        <div className="text-center">
                          <p className="font-sifonn text-sm md:text-base font-semibold text-slate-800 group-hover:text-primary transition-colors duration-300 leading-snug">
                            {category.name}
                          </p>
                          {!showAll && (
                            <p className="text-[11px] md:text-xs text-muted-foreground mt-0.5">
                              {category.productCount} items
                            </p>
                          )}
                        </div>
                      </div>
                    </Link>
                  )):null}
                </div>
                {showAll && selectedIndex === 0 && (
                  <div className="flex justify-center mt-6">
                    <button
                      onClick={() => setShowAll(false)}
                      className="text-sm md:text-base text-slate-700 hover:text-amber-600 font-sifonn font-semibold transition-colors duration-300"
                    >
                      Show Less
                    </button>
                  </div>
                )}
              </div>

              {/* Companies Slide */}
                <div ref={companiesSlideRef} className="flex-[0_0_100%] min-w-0 px-1 self-start">
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 md:gap-3.5">
                    {visibleCompanies?visibleCompanies.map((company: Company, index:number) => (
                      <Link
                        href={`/companies/${company.name.toLowerCase().replace(/\s+/g, '-')}`}
                        key={index}
                        className="flex-shrink-0"
                      >
                        <div className="group flex flex-col items-center gap-2">
                            <img
                              src={company.image ?? "/images/dummyimage.png"}
                              alt={company.name}
                            className="w-16 h-16 md:w-18 md:h-18 object-contain group-hover:scale-105 transition-transform duration-300"
                            />
                          <p className="font-sifonn text-sm md:text-base font-semibold text-slate-800 group-hover:text-primary transition-colors duration-300 text-center line-clamp-2">
                              {company.name}
                            </p>
                        </div>
                      </Link>
                    )):null}
                  </div>
                  {showAll && selectedIndex === 1 && (
                    <div className="flex justify-center mt-6">
                      <button
                        onClick={() => setShowAll(false)}
                        className="text-sm md:text-base text-slate-700 hover:text-amber-600 font-sifonn font-semibold transition-colors duration-300"
                      >
                        Show Less
                      </button>
                    </div>
                  )}
                </div>
            </div>
          </div>

          {/* Bottom view-all - shared button for both categories and companies */}
          <div className="flex justify-center mt-6 ">
            {!showAll && (
              <button 
                onClick={() => setShowAll(true)}
                className={`inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:border-amber-400 hover:text-amber-600 transition ${
                  selectedIndex === 0 
                    ? 'px-3 py-1.5' // More compact for categories
                    : 'px-4 py-2'   // Standard for companies
                }`}
              >
                View All ({selectedIndex === 0 ? CategoryFetched?.length : companies?.length})
                <ArrowRight className="w-4 h-4 rotate-90" />
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
