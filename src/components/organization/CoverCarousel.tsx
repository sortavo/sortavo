import { useState, useEffect, useCallback, useRef } from "react";
import { cn } from "@/lib/utils";
import { Play, Pause } from "lucide-react";

export interface CoverMediaItem {
  type: "image" | "video";
  url: string;
  order?: number;
}

interface CoverCarouselProps {
  media: CoverMediaItem[];
  brandColor?: string;
  autoPlayInterval?: number;
  className?: string;
}

export function CoverCarousel({
  media,
  brandColor = "#2563EB",
  autoPlayInterval = 5000,
  className,
}: CoverCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const sortedMedia = [...media].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const currentItem = sortedMedia[currentIndex];
  const hasMultipleItems = sortedMedia.length > 1;

  const goToNext = useCallback(() => {
    if (sortedMedia.length <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % sortedMedia.length);
  }, [sortedMedia.length]);

  const goToIndex = (index: number) => {
    setCurrentIndex(index);
  };

  // Auto-advance timer
  useEffect(() => {
    if (!hasMultipleItems || isPaused || isVideoPlaying) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    timerRef.current = setInterval(goToNext, autoPlayInterval);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [hasMultipleItems, isPaused, isVideoPlaying, autoPlayInterval, goToNext]);

  // Handle video end - advance to next
  const handleVideoEnded = () => {
    setIsVideoPlaying(false);
    if (hasMultipleItems) {
      goToNext();
    }
  };

  // Handle video play state
  useEffect(() => {
    if (currentItem?.type === "video" && videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {
        // Autoplay may be blocked
      });
      setIsVideoPlaying(true);
    } else {
      setIsVideoPlaying(false);
    }
  }, [currentIndex, currentItem?.type]);

  // No media - show gradient fallback
  if (!sortedMedia.length) {
    return (
      <div
        className={cn("h-48 sm:h-64 w-full", className)}
        style={{
          background: `linear-gradient(135deg, ${brandColor}40 0%, ${brandColor}10 100%)`,
        }}
      />
    );
  }

  return (
    <div
      className={cn("relative h-48 sm:h-64 w-full overflow-hidden group", className)}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Media items */}
      {sortedMedia.map((item, index) => (
        <div
          key={item.url}
          className={cn(
            "absolute inset-0 transition-opacity duration-700",
            index === currentIndex ? "opacity-100 z-10" : "opacity-0 z-0"
          )}
        >
          {item.type === "video" ? (
            <video
              ref={index === currentIndex ? videoRef : null}
              src={item.url}
              className="w-full h-full object-cover"
              muted
              playsInline
              loop={!hasMultipleItems}
              onEnded={handleVideoEnded}
              onPlay={() => setIsVideoPlaying(true)}
              onPause={() => setIsVideoPlaying(false)}
            />
          ) : (
            <img
              src={item.url}
              alt={`Cover ${index + 1}`}
              className="w-full h-full object-cover"
            />
          )}
        </div>
      ))}

      {/* Gradient overlay for better text readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent z-20 pointer-events-none" />

      {/* Navigation dots */}
      {hasMultipleItems && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2">
          {sortedMedia.map((_, index) => (
            <button
              key={index}
              onClick={() => goToIndex(index)}
              className={cn(
                "w-2 h-2 rounded-full transition-all",
                index === currentIndex
                  ? "bg-white w-4"
                  : "bg-white/50 hover:bg-white/75"
              )}
              aria-label={`Ir a imagen ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Pause indicator */}
      {hasMultipleItems && isPaused && !isVideoPlaying && (
        <div className="absolute top-4 right-4 z-30 bg-black/50 rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Pause className="h-4 w-4 text-white" />
        </div>
      )}

      {/* Video playing indicator */}
      {currentItem?.type === "video" && isVideoPlaying && (
        <div className="absolute top-4 right-4 z-30 bg-black/50 rounded-full p-2">
          <Play className="h-4 w-4 text-white fill-white" />
        </div>
      )}
    </div>
  );
}
