import { config } from "dotenv";
import { getDb } from "../src/db/client";
import { createDrizzleCatalogRepository } from "../src/db/repositories/drizzle-catalog-repository";

config({ path: ".env.local", quiet: true });

const DEMO_SLUG = "demo";
const DEMO_CONTACTS = {
  phone: "+353854927104",
  address: "42 Grafton Street\nDublin 2\nD02 R590\nIreland",
};

async function seed() {
  const catalog = createDrizzleCatalogRepository(getDb());

  const existing = await catalog.findBusinessBySlug(DEMO_SLUG);
  if (existing) {
    await catalog.setContacts(existing.id, DEMO_CONTACTS);
    console.log(`Business "${DEMO_SLUG}" already exists, updated its contacts`);
    return;
  }

  const business = await catalog.createBusiness({
    slug: DEMO_SLUG,
    name: "Demo Home Services",
    telegramChatId: null,
    ...DEMO_CONTACTS,
  });

  await catalog.createService({
    businessId: business.id,
    name: "Roller blinds",
    rule: { kind: "per_area", ratePerSqm: 5_000, minimumTotal: 8_000 },
    surcharges: [
      { id: "install", label: "Installation", kind: "flat", amount: 3_000 },
      { id: "blackout", label: "Blackout fabric", kind: "percent", percent: 15 },
    ],
  });

  await catalog.createService({
    businessId: business.id,
    name: "Apartment cleaning",
    rule: { kind: "per_hour", ratePerHour: 3_000, minimumHours: 3 },
    surcharges: [{ id: "windows", label: "Window cleaning", kind: "percent", percent: 20 }],
  });

  await catalog.createService({
    businessId: business.id,
    name: "Furniture assembly",
    rule: { kind: "fixed", price: 6_000 },
    surcharges: [{ id: "express", label: "Same-day visit", kind: "flat", amount: 2_500 }],
  });

  console.log(`Created business "${DEMO_SLUG}" with 3 services`);
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
