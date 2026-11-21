import { describe, expect, it } from "vitest";
import type { Business } from "@/domain/catalog/catalog";
import type { Lead } from "@/domain/leads/lead";
import type { LeadEvent } from "@/domain/leads/lead-events";
import { formatMoney } from "@/lib/format-money";
import { telegramNotifier } from "./telegram-notifier";

const lead = {
  customerName: "Aoife",
  phone: "+353871234567",
  comment: "After 6 pm, please",
  quote: { lines: [], total: 180_000 },
} as unknown as Lead;

function eventFor(telegramChatId: string | null): LeadEvent {
  const business: Business = { id: "b1", slug: "blinds", name: "Blinds", telegramChatId, telegramChatName: null, phone: null, address: null };
  return { type: "lead.created", lead, business, serviceName: "Roller blinds" };
}

function recordingFetch(status = 200) {
  const calls: { url: string; body: unknown }[] = [];
  const fetchImpl = (async (url: string, init: RequestInit) => {
    calls.push({ url, body: JSON.parse(String(init.body)) });
    return new Response("{}", { status });
  }) as typeof fetch;
  return { calls, fetchImpl };
}

describe("telegramNotifier", () => {
  it("sends the lead to the business chat", async () => {
    const { calls, fetchImpl } = recordingFetch();

    await telegramNotifier("bot-token", fetchImpl).handle(eventFor("123456789"));

    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe("https://api.telegram.org/botbot-token/sendMessage");
    expect(calls[0].body).toEqual({
      chat_id: "123456789",
      text: `New request: Roller blinds\nAoife, +353871234567\nTotal: ${formatMoney(180_000)}\nComment: After 6 pm, please`,
    });
  });

  it("skips a business that has not connected Telegram", async () => {
    const { calls, fetchImpl } = recordingFetch();

    await telegramNotifier("bot-token", fetchImpl).handle(eventFor(null));

    expect(calls).toEqual([]);
  });

  it("fails without leaking the bot token when Telegram rejects the message", async () => {
    const { fetchImpl } = recordingFetch(403);
    const sending = telegramNotifier("secret-token", fetchImpl).handle(eventFor("123456789"));

    await expect(sending).rejects.toThrow("status 403");
    await expect(sending).rejects.not.toThrow("secret-token");
  });
});
