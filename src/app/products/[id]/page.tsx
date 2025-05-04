
import { doc, getDoc, Timestamp } from 'firebase/firestore'; // Import Timestamp
import { db } from '@/lib/firebase/firebase';
import type { Product } from '@/types';
import { notFound } from 'next/navigation';
import ProductDetailClient from '@/components/product-detail-client';
import { Skeleton } from '@/components/ui/skeleton';

interface ProductDetailPageProps {
  params: { id: string };
}

async function getProduct(id: string): Promise<Product | null> {
  if (!db) {
    console.error("Database service is not available.");
    return null;
  }
  try {
    const productRef = doc(db, 'products', id);
    const productSnap = await getDoc(productRef);

    if (!productSnap.exists()) {
      return null;
    }

    const data = productSnap.data();
    let createdAtMillis: number | null = null;

    // Convert Firestore Timestamp to milliseconds (number) for serialization
    if (data.createdAt && data.createdAt instanceof Timestamp) {
        createdAtMillis = data.createdAt.toMillis();
    } else if (data.createdAt instanceof Date) {
        // Handle case where it might already be a Date (less likely from Firestore directly)
        createdAtMillis = data.createdAt.getTime();
    }

    // Construct the Product object with serializable data
    const productData: Product = {
      id: productSnap.id,
      name: data.name,
      description: data.description,
      price: data.price,
      imageUrl: data.imageUrl,
      imageHint: data.imageHint,
      createdAt: createdAtMillis, // Pass milliseconds or null
    };
    return productData;
  } catch (error) {
    console.error("Error fetching product:", error);
    return null; // Return null on error
  }
}

// Add dynamic metadata generation
export async function generateMetadata({ params }: ProductDetailPageProps) {
  const product = await getProduct(params.id);

  if (!product) {
    return {
      title: 'Product Not Found',
      description: 'The product you are looking for could not be found.',
    };
  }

  return {
    title: `${product.name} - ShopEasy`,
    description: product.description.substring(0, 160), // Use first 160 chars for meta description
    openGraph: {
        title: product.name,
        description: product.description.substring(0, 160),
        images: [
            {
             url: product.imageUrl,
             width: 800, // Provide dimensions if known
             height: 600,
             alt: product.name,
            },
        ],
    },
  };
}


export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const product = await getProduct(params.id);

  if (!product) {
    notFound(); // Trigger 404 page if product not found
  }

   // ProductDetailClient handles the client-side interactions
   // Product object now contains serializable data (createdAt as number | null)
  return <ProductDetailClient product={product} />;
}

// Optional: Add a Loading component specific to this route
// export function Loading() {
//   return (
//     <div className="container mx-auto px-4 py-12 md:px-6 lg:py-16">
//       <div className="grid md:grid-cols-2 gap-8 lg:gap-12 items-start">
//         <Skeleton className="aspect-square w-full rounded-lg" />
//         <div className="space-y-4">
//           <Skeleton className="h-8 w-3/4" />
//           <Skeleton className="h-6 w-1/4" />
//           <Skeleton className="h-20 w-full" />
//           <div className="flex gap-4">
//             <Skeleton className="h-12 w-40" />
//             <Skeleton className="h-12 w-12" />
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }


