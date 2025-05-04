
import { Skeleton } from "@/components/ui/skeleton";

export default function ProductDetailLoading() {
  return (
    <div className="container mx-auto px-4 py-12 md:px-6 lg:py-16">
      <div className="grid md:grid-cols-2 gap-8 lg:gap-16 items-start">
        {/* Image Skeleton */}
        <Skeleton className="aspect-square w-full rounded-lg shadow-lg" />

        {/* Details Skeleton */}
        <div className="space-y-6">
          <Skeleton className="h-10 w-3/4" /> {/* Title */}
          <Skeleton className="h-6 w-1/3" /> {/* Rating Placeholder */}
          <Skeleton className="h-8 w-1/4" /> {/* Price */}
          <Skeleton className="h-px w-full bg-muted" /> {/* Separator */}
          <Skeleton className="h-6 w-1/5 mb-2" /> {/* Description Title */}
          <Skeleton className="h-4 w-full" /> {/* Description Line 1 */}
          <Skeleton className="h-4 w-full" /> {/* Description Line 2 */}
          <Skeleton className="h-4 w-5/6" /> {/* Description Line 3 */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Skeleton className="h-12 flex-1" /> {/* Add to Cart Button */}
            <Skeleton className="h-12 w-48" /> {/* Wishlist Button */}
          </div>
        </div>
      </div>
    </div>
  );
}
