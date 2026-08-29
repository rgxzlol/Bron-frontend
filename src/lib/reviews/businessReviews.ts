import { reviewsApi } from "@/lib/api";
import type { Review } from "@/lib/api/types";

export function getBusinessReviewStats(reviews: Array<{ rating: number }>) {
  if (reviews.length === 0) {
    return { rating: 0, reviews: 0 };
  }

  const rating =
    reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;

  return { rating, reviews: reviews.length };
}

export async function fetchBusinessReviewStats(businessId: number) {
  try {
    const reviews = await reviewsApi.listByBusiness(businessId);
    return {
      reviews,
      stats: getBusinessReviewStats(reviews),
    };
  } catch {
    return {
      reviews: [] as Review[],
      stats: { rating: 0, reviews: 0 },
    };
  }
}
