import { ReviewsClient } from "@/components/reviews/ReviewsClient";
import { getReviewSettings, listReviewRequests } from "@/server/reviews";

export const metadata = { title: "Reviews" };

export default async function ReviewsPage() {
  const [settings, requests] = await Promise.all([getReviewSettings(), listReviewRequests()]);
  return (
    <div className="p-6">
      <ReviewsClient
        settings={settings ?? { auto_send: false, delay_hours: 1, channel: "whatsapp", template: "Hi {client_name}! Please leave us a review: {review_link}", google_review_link: "" }}
        requests={requests}
      />
    </div>
  );
}
