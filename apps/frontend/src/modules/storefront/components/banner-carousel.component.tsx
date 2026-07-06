'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import { listStorefrontBanners, type StorefrontBanner } from '../util/storefront-api.util';

type ArrowProps = {
  onClick?: () => void;
};

function PrevArrow({ onClick }: ArrowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Banner anterior"
      className="absolute left-3 top-1/2 z-10 flex size-9 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background/90 text-foreground shadow-md transition-colors hover:bg-background"
    >
      <ChevronLeft className="size-5" />
    </button>
  );
}

function NextArrow({ onClick }: ArrowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Próximo banner"
      className="absolute right-3 top-1/2 z-10 flex size-9 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background/90 text-foreground shadow-md transition-colors hover:bg-background"
    >
      <ChevronRight className="size-5" />
    </button>
  );
}

export function BannerCarousel() {
  const router = useRouter();
  const [banners, setBanners] = useState<StorefrontBanner[]>([]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await listStorefrontBanners();
        if (!cancelled) setBanners(data);
      } catch {
        // Silencioso: o carrossel simplesmente não aparece se os banners falharem ao carregar.
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const bannersWithImage = banners.filter((banner) => Boolean(banner.imageUrl));

  if (bannersWithImage.length === 0) {
    return null;
  }

  function handleBannerClick(banner: StorefrontBanner) {
    if (banner.linkUrl) {
      window.open(banner.linkUrl, '_blank', 'noopener,noreferrer');
      return;
    }
    router.push(`/loja?categoria=${banner.categoryId}`);
  }

  return (
    <div className="banner-carousel overflow-hidden rounded-xl">
      <Slider
        dots
        arrows={bannersWithImage.length > 1}
        prevArrow={<PrevArrow />}
        nextArrow={<NextArrow />}
        infinite={bannersWithImage.length > 1}
        autoplay={bannersWithImage.length > 1}
        autoplaySpeed={5000}
        speed={500}
        slidesToShow={1}
        slidesToScroll={1}
      >
        {bannersWithImage.map((banner) => (
          <button
            key={banner.id}
            type="button"
            onClick={() => handleBannerClick(banner)}
            className="aspect-3/2 w-full cursor-pointer border-0 bg-muted p-0 sm:aspect-7/2"
          >
            <picture>
              {banner.imageUrlMobile ? (
                <source media="(max-width: 639px)" srcSet={banner.imageUrlMobile} />
              ) : null}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={banner.imageUrl}
                alt="Banner promocional"
                className="size-full object-cover"
              />
            </picture>
          </button>
        ))}
      </Slider>
    </div>
  );
}
