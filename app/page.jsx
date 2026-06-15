import SmoothScroll from "../components/SmoothScroll";
import Preloader from "../components/Preloader";
import Lightbox from "../components/Lightbox";
import Nav from "../components/Nav";
import Hero from "../components/Hero";
import Manifesto from "../components/Manifesto";
import Projects from "../components/Projects";
import Interiors from "../components/Interiors";
import Estates from "../components/Estates";
import Portraits from "../components/Portraits";
import Commercial from "../components/Commercial";
import Published from "../components/Published";
import About from "../components/About";
import Newsletter from "../components/Newsletter";
import Contact from "../components/Contact";
import { getContent } from "../lib/cms";

export const revalidate = 60;

export default async function Home() {
  const cms = (await getContent()) || {};

  return (
    <SmoothScroll>
      <Preloader />
      <Lightbox />
      <Nav />
      <div className="grain" aria-hidden="true" />
      <main>
        <Hero data={cms.hero} />
        <Manifesto />
        <Projects data={cms.projects} />
        <Interiors data={cms.interiors} captions={cms.interiorCaptions} />
        <Estates data={cms.estates} />
        <Portraits data={cms.portraits} wide={cms.portraitWide} />
        <Commercial data={cms.commercial} />
        <Published />
        <About photo={cms.about} />
        <Newsletter />
        <Contact />
      </main>
    </SmoothScroll>
  );
}
