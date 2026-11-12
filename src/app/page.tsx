import { BuilderCTA } from "@/components/home/BuilderCTA";
import { FeaturedPCs } from "@/components/home/FeaturedPCs";
import { HeroSlides } from "@/components/home/HeroSlides";
import { InfoStrip, QuoteSection, Reviews } from "@/components/home/InfoSections";
import { PaymentMethods } from "@/components/home/PaymentMethods";
import { NewProducts, TopMonitors, TopPeripherals } from "@/components/home/ProductSections";
import { TrendingGaming } from "@/components/home/TrendingGaming";
import { site } from "@/config/site";
import { JsonLd } from "@/components/seo/JsonLd";
import { getHomeData } from "@/lib/home";
import { organizationJsonLd, websiteJsonLd } from "@/lib/seo";

/** Home: secciones en el orden de REQUISITOS.txt. */
export default async function HomePage() {
  const data = await getHomeData();

  return (
    <>
      <JsonLd data={organizationJsonLd()} />
      <JsonLd data={websiteJsonLd()} />
      <h1 className="sr-only">
        {site.name}: {site.tagline}
      </h1>
      {/* 1 */}
      <HeroSlides pc={data.heroPc} gpu={data.heroGpu} />
      {/* 2 */}
      <PaymentMethods />
      {/* 3 */}
      <FeaturedPCs tiers={data.tiers} />
      {/* 4 */}
      <NewProducts products={data.nuevos} />
      {/* 5 */}
      <TopMonitors products={data.monitores} />
      {/* 6 */}
      <TopPeripherals products={data.perifericos} />
      {/* 7 */}
      <BuilderCTA pcs={data.pcs} />
      {/* 8 */}
      <TrendingGaming products={data.streaming} />
      {/* 9 */}
      <QuoteSection />
      {/* 10 */}
      <Reviews />
      {/* 11 */}
      <InfoStrip />
    </>
  );
}
