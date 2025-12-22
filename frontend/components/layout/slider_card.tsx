"use client";
import Image from "next/image";
import { useEffect, useState, useMemo } from "react";
import { Star } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export const SliderCard = () => {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const slides = useMemo(() => [
    "/images/slide_1.jpg",
    "/images/slide_2.jpg",
    "/images/slide_3.jpg",
  ], []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlideIndex((prevIndex) => (prevIndex + 1) % slides.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [slides.length]);

  return (
    <div className="relative w-full h-full min-h-[400px] lg:min-h-[500px] bg-secondary/20 rounded-[2rem] overflow-hidden shadow-2xl">
      {/* Badge "Top-Rated Foods" */}
      <div className="absolute top-4 left-4 md:top-6 md:left-6 z-20 flex items-center gap-3">
        <div className="bg-white/60 dark:bg-black/60 backdrop-blur-md p-2.5 rounded-full shadow-sm">
          <Star className="text-primary h-5 w-5 fill-current" />
        </div>
        <div className="bg-white/60 dark:bg-black/60 backdrop-blur-md px-5 py-2.5 rounded-full shadow-sm">
          <span className="text-sm font-bold tracking-wide text-foreground">Top-Rated Foods</span>
        </div>
      </div>

      {/* Title Overlay */}
      <div className="absolute bottom-4 left-4 right-4 md:bottom-6 md:left-6 md:right-6 z-20">
        <div className="bg-white/60 dark:bg-black/60 backdrop-blur-md p-4 md:p-6 rounded-3xl shadow-lg">
          <h3 className="text-xl md:text-2xl font-bold text-foreground leading-tight">
            Savor Healthy Eats - Keep it Casual and Easy-Going!
          </h3>
        </div>
      </div>

      {/* Image Slider */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSlideIndex}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className="absolute inset-0 w-full h-full"
        >
          <Image
            src={slides[currentSlideIndex]}
            alt={`Slide ${currentSlideIndex + 1}`}
            fill
            priority
            className="object-cover"
          />
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        </motion.div>
      </AnimatePresence>
    </div>
  );
};