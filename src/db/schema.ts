import {
  bigint,
  boolean,
  index,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { LEAD_STATUSES } from "../domain/leads/lead-status";
import type { PricingRule, Quote, QuoteInput, Surcharge } from "../domain/pricing/types";

export const leadStatus = pgEnum("lead_status", LEAD_STATUSES);

const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: createdAt(),
});

export const sessions = pgTable(
  "sessions",
  {
    // SHA-256 of the cookie token: a leaked table cannot be replayed as live sessions.
    tokenHash: text("token_hash").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: createdAt(),
  },
  (t) => [index("sessions_user_idx").on(t.userId)],
);

export const businesses = pgTable(
  "businesses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    // Nullable: the demo business is seeded without an owner.
    ownerId: uuid("owner_id").references(() => users.id, { onDelete: "set null" }),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    telegramChatId: text("telegram_chat_id"),
    createdAt: createdAt(),
  },
  (t) => [index("businesses_owner_idx").on(t.ownerId)],
);

export const services = pgTable(
  "services",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    businessId: uuid("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    // jsonb keeps the rule as one discriminated union instead of a column per pricing kind.
    rule: jsonb("rule").$type<PricingRule>().notNull(),
    surcharges: jsonb("surcharges").$type<Surcharge[]>().notNull().default([]),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: createdAt(),
  },
  (t) => [index("services_business_idx").on(t.businessId)],
);

export const leads = pgTable(
  "leads",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    businessId: uuid("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    serviceId: uuid("service_id").references(() => services.id, { onDelete: "set null" }),
    customerName: text("customer_name").notNull(),
    phone: text("phone").notNull(),
    comment: text("comment"),
    input: jsonb("input").$type<QuoteInput>().notNull(),
    // Snapshot of the price the customer saw, so later price changes do not rewrite old leads.
    quote: jsonb("quote").$type<Quote>().notNull(),
    total: bigint("total", { mode: "number" }).notNull(),
    status: leadStatus("status").notNull().default("new"),
    idempotencyKey: text("idempotency_key").notNull().unique(),
    createdAt: createdAt(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("leads_business_status_idx").on(t.businessId, t.status, t.createdAt)],
);

export const leadStatusChanges = pgTable(
  "lead_status_changes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    leadId: uuid("lead_id")
      .notNull()
      .references(() => leads.id, { onDelete: "cascade" }),
    fromStatus: leadStatus("from_status").notNull(),
    toStatus: leadStatus("to_status").notNull(),
    note: text("note"),
    at: timestamp("at", { withTimezone: true }).notNull(),
  },
  (t) => [index("lead_status_changes_lead_idx").on(t.leadId, t.at)],
);
