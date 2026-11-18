import { NextResponse, type NextRequest } from "next/server";
import {
  createServerSupabaseClient,
  requireAuthenticatedServerUser,
  UnauthorizedError,
} from "@/infrastructure/supabase/server";
import {
  AssistantServiceError,
  generateGroundedAssistantReply,
} from "@/services/assistant/assistant-service";
import {
  ASSISTANT_MESSAGE_MAX_LENGTH,
  AssistantRequestSchema,
  type AssistantHistoryItem,
  type AssistantSource,
} from "@/services/assistant/schema";
import type { Json } from "@/types/database";

const HISTORY_LIMIT = 8;
const RESPONSE_HISTORY_LIMIT = 100;

interface StoredMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources: AssistantSource[];
  createdAt: string;
}

function isRecord(value: Json): value is { [key: string]: Json | undefined } {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function parseStoredSources(value: Json): AssistantSource[] {
  const rows = Array.isArray(value)
    ? value
    : isRecord(value) && Array.isArray(value.sources)
      ? value.sources
      : [];

  return rows.flatMap((row) => {
    if (!row || typeof row !== "object" || Array.isArray(row)) return [];
    const source = row as Record<string, Json | undefined>;
    if (
      typeof source.schemeSlug !== "string" ||
      typeof source.schemeName !== "string" ||
      typeof source.title !== "string" ||
      typeof source.url !== "string" ||
      typeof source.verifiedAt !== "string" ||
      (source.kind !== "information" && source.kind !== "application")
    ) {
      return [];
    }
    try {
      const url = new URL(source.url);
      if (url.protocol !== "https:" && url.protocol !== "http:") return [];
    } catch {
      return [];
    }
    return [{
      schemeSlug: source.schemeSlug,
      schemeName: source.schemeName,
      title: source.title,
      url: source.url,
      verifiedAt: source.verifiedAt,
      kind: source.kind,
    }];
  });
}

function toStoredMessage(row: {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources_json: Json;
  created_at: string;
}): StoredMessage {
  return {
    id: row.id,
    role: row.role,
    content: row.content,
    sources: row.role === "assistant" ? parseStoredSources(row.sources_json) : [],
    createdAt: row.created_at,
  };
}

function compareMessageOrder(
  left: Pick<StoredMessage, "role" | "createdAt">,
  right: Pick<StoredMessage, "role" | "createdAt">
): number {
  const timestampDifference =
    Date.parse(left.createdAt) - Date.parse(right.createdAt);
  if (timestampDifference !== 0) return timestampDifference;
  if (left.role === right.role) return 0;
  return left.role === "user" ? -1 : 1;
}

function errorResponse(
  status: number,
  code: string,
  message: string
): NextResponse {
  return NextResponse.json({ error: { code, message } }, { status });
}

function handleUnexpectedError(error: unknown): NextResponse {
  if (error instanceof UnauthorizedError) {
    return errorResponse(401, "UNAUTHENTICATED", "Sign in to use AI Ally.");
  }
  if (error instanceof AssistantServiceError) {
    return errorResponse(error.status, error.code, error.message);
  }
  console.error(
    "[AI Ally] Request failed:",
    error instanceof Error ? error.name : "Unknown error"
  );
  return errorResponse(
    500,
    "REQUEST_FAILED",
    "AI Ally could not complete that request. Please try again."
  );
}

async function getAuthenticatedContext() {
  const supabase = await createServerSupabaseClient();
  const user = await requireAuthenticatedServerUser(supabase);
  return { supabase, user };
}

export async function GET(request: NextRequest) {
  const conversationId = new URL(request.url).searchParams.get("conversationId");
  if (!conversationId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(conversationId)) {
    return errorResponse(400, "INVALID_CONVERSATION", "Choose a valid conversation.");
  }

  try {
    const { supabase, user } = await getAuthenticatedContext();
    const { data: conversation, error: conversationError } = await supabase
      .from("chat_conversations")
      .select("id")
      .eq("id", conversationId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (conversationError) throw conversationError;
    if (!conversation) {
      return errorResponse(404, "CONVERSATION_NOT_FOUND", "Conversation not found.");
    }

    const { data, error } = await supabase
      .from("chat_messages")
      .select("id, role, content, sources_json, created_at")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: false })
      .limit(RESPONSE_HISTORY_LIMIT);

    if (error) throw error;
    const messages = (data ?? [])
      .map(toStoredMessage)
      .sort(compareMessageOrder);
    return NextResponse.json({ conversationId, messages });
  } catch (error) {
    return handleUnexpectedError(error);
  }
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse(400, "INVALID_REQUEST", "Enter a message and try again.");
  }

  const parsed = AssistantRequestSchema.safeParse(body);
  if (!parsed.success) {
    const tooLong =
      typeof body === "object" &&
      body !== null &&
      "message" in body &&
      typeof body.message === "string" &&
      body.message.length > ASSISTANT_MESSAGE_MAX_LENGTH;
    return errorResponse(
      400,
      tooLong ? "MESSAGE_TOO_LONG" : "INVALID_REQUEST",
      tooLong
        ? `Messages must be ${ASSISTANT_MESSAGE_MAX_LENGTH} characters or fewer.`
        : "Enter a message in English or Tamil and try again."
    );
  }

  try {
    const { supabase, user } = await getAuthenticatedContext();
    let conversationId = parsed.data.conversationId;
    let isNewConversation = !conversationId;
    let history: AssistantHistoryItem[] = [];

    if (conversationId) {
      const { data: conversation, error } = await supabase
        .from("chat_conversations")
        .select("id")
        .eq("id", conversationId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      if (!conversation) {
        return errorResponse(404, "CONVERSATION_NOT_FOUND", "Conversation not found.");
      }

      const { data: previousMessages, error: historyError } = await supabase
        .from("chat_messages")
        .select("role, content, created_at")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: false })
        .limit(HISTORY_LIMIT);

      if (historyError) throw historyError;
      history = (previousMessages ?? [])
        .sort((left, right) =>
          compareMessageOrder(
            { role: left.role, createdAt: left.created_at },
            { role: right.role, createdAt: right.created_at }
          )
        )
        .map((item) => ({ role: item.role, content: item.content }));
    }

    const { answer, sources, actionHref } = await generateGroundedAssistantReply({
      message: parsed.data.message,
      locale: parsed.data.locale,
      history,
      client: supabase,
    });

    if (isNewConversation) {
      const { data: conversation, error } = await supabase
        .from("chat_conversations")
        .insert({
          user_id: user.id,
          title: parsed.data.message.slice(0, 80),
          language: parsed.data.locale,
        })
        .select("id")
        .single();

      if (error) throw error;
      conversationId = conversation.id;
      isNewConversation = true;
    } else {
      const { error } = await supabase
        .from("chat_conversations")
        .update({ language: parsed.data.locale })
        .eq("id", conversationId!)
        .eq("user_id", user.id);
      if (error) throw error;
    }

    const { data: savedMessages, error: saveError } = await supabase
      .from("chat_messages")
      .insert([
        {
          conversation_id: conversationId!,
          role: "user",
          content: parsed.data.message,
          sources_json: [],
        },
        {
          conversation_id: conversationId!,
          role: "assistant",
          content: answer,
          sources_json: sources.map(
            (source): Json => ({
              schemeSlug: source.schemeSlug,
              schemeName: source.schemeName,
              title: source.title,
              url: source.url,
              verifiedAt: source.verifiedAt,
              kind: source.kind,
            })
          ),
        },
      ])
      .select("id, role, content, sources_json, created_at");

    if (saveError) {
      if (isNewConversation) {
        const { error: cleanupError } = await supabase
          .from("chat_conversations")
          .delete()
          .eq("id", conversationId!)
          .eq("user_id", user.id);
        if (cleanupError) {
          console.error("[AI Ally] Failed to clean up an empty conversation.");
        }
      }
      throw saveError;
    }

    return NextResponse.json({
      conversationId,
      messages: (savedMessages ?? [])
        .map(toStoredMessage)
        .sort(compareMessageOrder),
      ...(actionHref ? { actionHref } : {}),
    });
  } catch (error) {
    return handleUnexpectedError(error);
  }
}
