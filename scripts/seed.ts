import { config } from "dotenv";
import { getDb } from "../src/db/client";
import { createDrizzleCatalogRepository } from "../src/db/repositories/drizzle-catalog-repository";

config({ path: ".env.local", quiet: true });

const DEMO_SLUG = "demo";

async function seed() {
  const catalog = createDrizzleCatalogRepository(getDb());

  if (await catalog.findBusinessBySlug(DEMO_SLUG)) {
    console.log(`Business "${DEMO_SLUG}" already exists, nothing to do`);
    return;
  }

  const business = await catalog.createBusiness({
    slug: DEMO_SLUG,
    name: "Demo Home Services",
    telegramChatId: null,
  });

  await catalog.createService({
    businessId: business.id,
    name: "Roller blinds",
    rule: { kind: "per_area", ratePerSqm: 120_000, minimumTotal: 150_000 },
    surcharges: [
      { id: "install", label: "Installation", kind: "flat", amount: 30_000 },
      { id: "blackout", label: "Blackout fabric", kind: "percent", percent: 15 },
    ],
  });

  await catalog.createService({
    businessId: business.id,
    name: "Apartment cleaning",
    rule: { kind: "per_hour", ratePerHour: 45_000, minimumHours: 3 },
    surcharges: [{ id: "windows", label: "Window cleaning", kind: "percent", percent: 20 }],
  });

  await catalog.createService({
    businessId: business.id,
    name: "Furniture assembly",
    rule: { kind: "fixed", price: 80_000 },
    surcharges: [{ id: "express", label: "Same-day visit", kind: "flat", amount: 50_000 }],
  });

  console.log(`Created business "${DEMO_SLUG}" with 3 services`);
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
