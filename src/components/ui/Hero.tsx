import Image from "next/image";

import { homeContent } from "@/content/home";

export default function Hero() {
  return (
    <section className="relative h-[60vh] min-h-[420px] w-full sm:h-[calc(100vh-5rem)]">
      <Image
        src={homeContent.hero.image}
        alt={homeContent.hero.imageAlt}
        fill
        priority
        className="object-cover object-center"
        sizes="100vw"
      />
      <div className="absolute inset-0 bg-black/20" aria-hidden="true" />
    </section>
  );
}
