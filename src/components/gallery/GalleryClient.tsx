"use client";

import { useMemo, useState, useEffect } from "react";
import { Images, Calendar, ChevronLeft, ChevronRight, X, Scissors, Heart, Star } from "lucide-react";
import type { GalleryPhotoRow } from "@/server/gallery";

type Pair = { pet_id: string; pet_name: string; pet_breed: string | null; pet_species: string; date: string; before: GalleryPhotoRow | null; after: GalleryPhotoRow | null; general: GalleryPhotoRow[]; service_name: string | null };

function buildPairs(photos: GalleryPhotoRow[]): Pair[] {
  const map = new Map<string, Pair>();
  for (const p of photos) {
    if (!map.has(p.pet_id)) {
      map.set(p.pet_id, { pet_id: p.pet_id, pet_name: p.pet_name, pet_breed: p.pet_breed, pet_species: p.pet_species, date: p.created_at, before: null, after: null, general: [], service_name: p.service_name });
    }
    const pair = map.get(p.pet_id)!;
    if (p.photo_type === "before" && !pair.before) pair.before = p;
    else if (p.photo_type === "after" && !pair.after) pair.after = p;
    else pair.general.push(p);
  }
  return Array.from(map.values());
}

export function GalleryClient({ photos }: { photos: GalleryPhotoRow[] }) {
  const [filter, setFilter] = useState("");
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  const filtered = useMemo(() => {
    const pairs = buildPairs(photos);
    return filter ? pairs.filter((p) => p.pet_species.toLowerCase() === filter) : pairs;
  }, [photos, filter]);

  const paired = filtered.filter((p) => p.before && p.after);
  const general = filtered.flatMap((p) => p.general);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (lightboxIdx === null) return;
      if (e.key === "Escape") setLightboxIdx(null);
      if (e.key === "ArrowRight" && lightboxIdx < photos.length - 1) setLightboxIdx(lightboxIdx + 1);
      if (e.key === "ArrowLeft" && lightboxIdx > 0) setLightboxIdx(lightboxIdx - 1);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [lightboxIdx, photos.length]);

  function openLightbox(photo: GalleryPhotoRow) {
    const idx = photos.findIndex((p) => p.id === photo.id);
    setLightboxIdx(Math.max(0, idx));
  }

  const lightboxPhoto = lightboxIdx !== null ? photos[lightboxIdx] : null;

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <div className="relative overflow-hidden bg-gradient-to-br from-[#1a0a3e] to-[#2C0F73] py-16 text-white">
        <div className="relative z-10 mx-auto max-w-5xl px-6 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f2c037]/15">
            <Images className="h-6 w-6 text-[#f2c037]" />
          </div>
          <h1 className="text-4xl font-black tracking-tight md:text-5xl">Our Happy Clients</h1>
          <p className="mt-3 text-lg text-white/60">Before &amp; after transformations</p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
            {[
              { val: "", label: "All Pets" },
              { val: "dog", label: "Dogs" },
              { val: "cat", label: "Cats" },
            ].map((opt) => (
              <button key={opt.val} onClick={() => setFilter(opt.val)} className={`rounded-full px-4 py-2 text-sm font-bold transition-all ${filter === opt.val ? "bg-[#f2c037] text-[#1a0a3e] shadow-md" : "bg-white/10 text-white/70 hover:bg-white/15"}`}>{opt.label}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-10 md:px-8">
        {paired.length === 0 && general.length === 0 ? (
          <div className="py-24 text-center text-sm text-gray-400">No photos yet</div>
        ) : (
          <>
            {paired.length > 0 && (
              <div className="mb-10">
                <h2 className="mb-6 flex items-center gap-2 text-xl font-black text-gray-800">Before &amp; After Transformations</h2>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {paired.map((pair) => (
                    <div key={pair.pet_id + pair.date} className="overflow-hidden rounded-2xl border bg-white shadow-sm">
                      <div className="grid grid-cols-2 gap-1 bg-gray-100 p-1">
                        {pair.before && (
                          <div className="relative overflow-hidden rounded-xl aspect-square cursor-zoom-in" onClick={() => openLightbox(pair.before!)}>
                            <img src={pair.before.photo_url} alt={`${pair.pet_name} before`} className="h-full w-full object-cover" />
                            <div className="absolute left-2 top-2 rounded-full bg-blue-500 px-2 py-0.5 text-[9px] font-black uppercase text-white">Before</div>
                          </div>
                        )}
                        {pair.after && (
                          <div className="relative overflow-hidden rounded-xl aspect-square cursor-zoom-in" onClick={() => openLightbox(pair.after!)}>
                            <img src={pair.after.photo_url} alt={`${pair.pet_name} after`} className="h-full w-full object-cover" />
                            <div className="absolute left-2 top-2 rounded-full bg-green-500 px-2 py-0.5 text-[9px] font-black uppercase text-white">After</div>
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="font-black text-gray-900">{pair.pet_name}</h3>
                        <p className="text-xs text-gray-400">{pair.pet_breed ?? pair.pet_species}</p>
                        {pair.service_name && (
                          <div className="mt-2 flex items-center gap-1.5 text-xs text-gray-500">
                            <Scissors className="h-3 w-3 text-[#2C0F73]" />
                            {pair.service_name}
                          </div>
                        )}
                        <div className="mt-1 flex items-center gap-1.5 text-xs text-gray-400">
                          <Calendar className="h-3 w-3" />
                          {new Date(pair.date).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {general.length > 0 && (
              <div className="mb-10">
                <h2 className="mb-6 flex items-center gap-2 text-xl font-black text-gray-800">More Happy Clients</h2>
                <div className="columns-2 gap-3 md:columns-3 lg:columns-4">
                  {general.map((photo) => (
                    <div key={photo.id} className="mb-3 cursor-zoom-in overflow-hidden rounded-2xl bg-gray-100 hover:shadow-lg" onClick={() => openLightbox(photo)}>
                      <img src={photo.photo_url} alt={photo.pet_name} className="w-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {lightboxPhoto && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90" onClick={() => setLightboxIdx(null)}>
          <button className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white" onClick={() => setLightboxIdx(null)}>
            <X className="h-5 w-5" />
          </button>
          {lightboxIdx! > 0 && (
            <button className="absolute left-4 top-1/2 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white" onClick={(e) => { e.stopPropagation(); setLightboxIdx(lightboxIdx! - 1); }}>
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}
          {lightboxIdx! < photos.length - 1 && (
            <button className="absolute right-4 top-1/2 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white" onClick={(e) => { e.stopPropagation(); setLightboxIdx(lightboxIdx! + 1); }}>
              <ChevronRight className="h-5 w-5" />
            </button>
          )}
          <div className="mx-auto max-h-[90vh] max-w-4xl px-16" onClick={(e) => e.stopPropagation()}>
            <img src={lightboxPhoto.photo_url} alt={lightboxPhoto.pet_name} className="max-h-[75vh] max-w-full rounded-2xl object-contain" />
            <div className="mt-4 text-center">
              <p className="text-base font-bold text-white">{lightboxPhoto.pet_name}</p>
              {lightboxPhoto.pet_breed && <p className="text-sm text-white/50">{lightboxPhoto.pet_breed}</p>}
              {lightboxPhoto.caption && <p className="mt-1 text-sm italic text-white/40">{lightboxPhoto.caption}</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
