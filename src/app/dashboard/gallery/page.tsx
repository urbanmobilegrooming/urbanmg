import { GalleryClient } from "@/components/gallery/GalleryClient";
import { listGalleryPhotos } from "@/server/gallery";

export const metadata = { title: "Gallery" };

export default async function GalleryPage() {
  const photos = await listGalleryPhotos();
  return <GalleryClient photos={photos} />;
}
