import Hero from "@/components/Hero";
import { About, Approach, Contact, Toolkit, Work } from "@/components/HomeSections";

const careerStartDate = new Date(2021, 6, 1);

function getAge(date: Date) {
  const today = new Date();
  let age = today.getFullYear() - date.getFullYear();
  const m = today.getMonth() - date.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < date.getDate())) {
    age--;
  }
  return age;
}

export default function Home() {
  const years = getAge(careerStartDate);

  return (
    <div className="font-sans">
      <Hero years={years} />
      {/* Quiet stretch: only the background moves while the samurai blows away and the moon wanes. */}
      <div aria-hidden="true" className="h-[max(560px,calc(100lvh-280px))] xl:h-[max(640px,calc(100lvh-260px))]" />
      <About years={years} />
      <Approach />
      <Work />
      <Toolkit />
      <Contact />
    </div>
  );
}
