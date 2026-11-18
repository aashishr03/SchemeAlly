import { z } from "zod";

export const ASSISTANT_MESSAGE_MAX_LENGTH = 1200;

export const AssistantRequestSchema = z.object({
  message: z.string().trim().min(1).max(ASSISTANT_MESSAGE_MAX_LENGTH),
  locale: z.enum(["en", "ta"]),
  conversationId: z.string().uuid().optional(),
});

export type AssistantLocale = "en" | "ta";
export type AssistantRequest = z.infer<typeof AssistantRequestSchema>;

export interface AssistantSource {
  schemeSlug: string;
  schemeName: string;
  title: string;
  url: string;
  verifiedAt: string;
  kind: "information" | "application";
}

export interface AssistantHistoryItem {
  role: "user" | "assistant";
  content: string;
}
