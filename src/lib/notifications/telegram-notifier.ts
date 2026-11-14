/*import type { LeadEventListener } from "@/domain/leads/lead-events";

export function telegramNotifier(botToken: string, chatId: string): LeadEventListener  {
  return {
    async handle({ lead, businessName }) {
      await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`,  {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text: `${businessName}: ${lead.customerName}, ${lead.phone}` }),
      });
    },
  };
}*/
// на тг ліди