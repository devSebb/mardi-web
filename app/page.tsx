import { Nav } from "@/components/sections/Nav";
import { Hero } from "@/components/sections/Hero";
import { Triptych } from "@/components/sections/Triptych";
import { MemoryTypes } from "@/components/sections/MemoryTypes";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { UnderTheHood } from "@/components/sections/UnderTheHood";
import { Footer } from "@/components/sections/Footer";

export default function Home() {
  return (
    <main className="relative min-h-screen scanlines">
      <Nav />
      <Hero />
      <Triptych />
      <MemoryTypes />
      <HowItWorks />
      <UnderTheHood />
      <Footer />
    </main>
  );
}
