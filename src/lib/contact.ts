/** Site-wide contact channels (single source of truth). */
export const SITE_PHONE_DISPLAY = "+44 744190 9000";
export const SITE_PHONE_TEL = "tel:+447441909000";
export const SITE_EMAIL = "support@cryptowiseuk.com";

/** Official messenger channels — links exactly as provided by the client. */
export const CONTACT_LINKS = [
  { id: "whatsapp", label: "WhatsApp", href: "https://wa.me/447591274617" },
  { id: "telegram", label: "Telegram", href: "https://t.me/+447591274617" },
  { id: "imo", label: "imo", href: "https://imo.im/?number=447591274617" },
] as const;
