import { SectionDivider } from "@/components/marketing/SectionDivider";
import { HeroSection } from "@/components/marketing/home/HeroSection";
import { ProblemSection } from "@/components/marketing/home/ProblemSection";
import { HowItWorksSection } from "@/components/marketing/home/HowItWorksSection";
import { SeeItInActionSection } from "@/components/marketing/home/SeeItInActionSection";

export default function MarketingHomePage() {
  return (
    <>
      <HeroSection />
      <SectionDivider />
      <ProblemSection />
      <SectionDivider />
      <HowItWorksSection />
      <SectionDivider />
      <SeeItInActionSection />
    </>
  );
}
