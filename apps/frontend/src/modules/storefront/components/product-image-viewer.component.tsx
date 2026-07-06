'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/shared/components/ui/dialog';

type ProductImageViewerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  images: string[];
  initialIndex?: number;
  imageAlt: string;
};

export function ProductImageViewer({
  open,
  onOpenChange,
  images,
  initialIndex = 0,
  imageAlt,
}: ProductImageViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  useEffect(() => {
    if (open) setCurrentIndex(initialIndex);
  }, [open, initialIndex]);

  const hasMultipleImages = images.length > 1;

  function goToPrevious() {
    setCurrentIndex((index) => (index - 1 + images.length) % images.length);
  }

  function goToNext() {
    setCurrentIndex((index) => (index + 1) % images.length);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="left-0 top-0 flex h-screen w-screen max-w-none translate-x-0 translate-y-0 flex-col rounded-none border-0 bg-black/95 p-0 [&>button]:hidden">
        <div className="flex items-center justify-between gap-2 p-4">
          <div className="flex items-center gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={() => onOpenChange(false)}>
              <ArrowLeft className="size-4" />
              Voltar
            </Button>
            <DialogTitle className="truncate text-sm font-medium text-white">{imageAlt}</DialogTitle>
          </div>
          {hasMultipleImages ? (
            <span className="shrink-0 text-sm text-white/70">
              {currentIndex + 1} / {images.length}
            </span>
          ) : null}
        </div>

        <div className="relative flex flex-1 items-center justify-center overflow-hidden p-4">
          {hasMultipleImages ? (
            <button
              type="button"
              onClick={goToPrevious}
              aria-label="Imagem anterior"
              className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-2 text-white hover:bg-black/80"
            >
              <ChevronLeft className="size-6" />
            </button>
          ) : null}

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={images[currentIndex]}
            alt={imageAlt}
            className="max-h-full max-w-full object-contain"
          />

          {hasMultipleImages ? (
            <button
              type="button"
              onClick={goToNext}
              aria-label="Próxima imagem"
              className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-2 text-white hover:bg-black/80"
            >
              <ChevronRight className="size-6" />
            </button>
          ) : null}
        </div>

        {hasMultipleImages ? (
          <div className="flex items-center justify-center gap-2 pb-4">
            {images.map((url, index) => (
              <button
                key={url}
                type="button"
                onClick={() => setCurrentIndex(index)}
                aria-label={`Ir para imagem ${index + 1}`}
                className={`size-2 rounded-full transition-colors ${
                  index === currentIndex ? 'bg-white' : 'bg-white/30'
                }`}
              />
            ))}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
