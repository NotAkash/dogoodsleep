"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import type { R2Image } from "@/lib/gallery-types";

type GalleryLightboxProps = {
    images: R2Image[];
};

export function GalleryLightbox({ images }: GalleryLightboxProps) {
    const [selectedImage, setSelectedImage] = useState<R2Image | null>(null);
    const [isHighResLoaded, setIsHighResLoaded] = useState(false);

    useEffect(() => {
        if (!selectedImage) {
            return;
        }

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                setSelectedImage(null);
            }
        };

        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [selectedImage]);

    return (
        <>
            <section className="columns-1 gap-4 sm:columns-2 lg:columns-3">
                <article className="mb-4 break-inside-avoid rounded-xl border border-white/5 bg-[#0b0b0b] p-6">
                    <p className="text-xs uppercase tracking-[0.2em] text-white/50">do-good-sleep</p>
                    <h2 className="mt-3 text-4xl font-semibold leading-tight text-white">Places & Faces</h2>
                    <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/70">
                        Quiet frames from streets, landscapes, and people I meet along the way.
                    </p>
                </article>
                {images.map((image) => (
                    <article key={image.key} className="mb-4 break-inside-avoid">
                        <button
                            type="button"
                            onClick={() => {
                                setIsHighResLoaded(false);
                                setSelectedImage(image);
                            }}
                            className="block w-full"
                            aria-label={`Open ${image.alt}`}
                        >
                            <motion.img
                                layoutId={`image-${image.key}`}
                                src={image.thumbUrl}
                                alt={image.alt}
                                className="h-auto w-full rounded-xl border border-white/5"
                                loading="lazy"
                            />
                        </button>
                    </article>
                ))}
            </section>

            <AnimatePresence>
                {selectedImage ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-50 bg-black/85"
                        onClick={() => setSelectedImage(null)}
                    >
                        <button
                            type="button"
                            onClick={() => setSelectedImage(null)}
                            className="absolute right-5 top-5 z-50 rounded border border-white/20 px-3 py-1 text-sm text-white/90"
                            aria-label="Close image"
                        >
                            X
                        </button>

                        <div className="flex h-full w-full items-center justify-center p-4 md:p-8">
                            <div
                                className="relative h-full w-full max-w-[92vw]"
                                onClick={(event) => event.stopPropagation()}
                            >
                                <img
                                    src={selectedImage.thumbUrl}
                                    alt=""
                                    aria-hidden="true"
                                    className="pointer-events-none absolute inset-0 h-full w-full object-contain blur-2xl opacity-60"
                                />

                                {!isHighResLoaded ? (
                                    <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
                                        <span className="h-10 w-10 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                                    </div>
                                ) : null}

                                <motion.img
                                    layoutId={`image-${selectedImage.key}`}
                                    src={selectedImage.fullUrl}
                                    alt={selectedImage.alt}
                                    className={`relative z-10 h-full w-full object-contain transition-opacity duration-300 ${isHighResLoaded ? "opacity-100" : "opacity-0"
                                        }`}
                                    onLoad={() => setIsHighResLoaded(true)}
                                />
                            </div>
                        </div>
                    </motion.div>
                ) : null}
            </AnimatePresence>
        </>
    );
}
