// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import type { AppSupabaseClient, Json } from "@/types/database";

const mocks = vi.hoisted(() => ({
  createServerSupabaseClient: vi.fn(),
  requireAuthenticatedServerUser: vi.fn(),
  generateGroundedAssistantReply: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/infrastructure/supabase/server", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/infrastructure/supabase/server")>();
  return {
    ...actual,
    createServerSupabaseClient: mocks.createServerSupabaseClient,
    requireAuthenticatedServerUser: mocks.requireAuthenticatedServerUser,
  };
});
vi.mock("@/services/assistant/assistant-service", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/services/assistant/assistant-service")>();
  return {
    ...actual,
    generateGroundedAssistantReply: mocks.generateGroundedAssistantReply,
  };
});

import { GET, POST } from "@/app/api/assistant/route";
import { UnauthorizedError } from "@/infrastructure/supabase/server";

interface QueryResult {
  data: unknown;
  error: Error | null;
}

interface MockQuery {
  insertValues?: unknown;
  updateValues?: unknown;
  insert: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
}

function createQuery(result: QueryResult): MockQuery {
  const query = {} as MockQuery & Record<string, unknown>;
  const chain = () => query;

  query.insert = vi.fn((value: unknown) => {
    query.insertValues = value;
    return query;
  });
  query.update = vi.fn((value: unknown) => {
    query.updateValues = value;
    return query;
  });
  query.delete = vi.fn(chain);
  query.select = vi.fn(chain) as unknown as MockQuery["insert"];
  query.eq = vi.fn(chain) as unknown as MockQuery["insert"];
  query.order = vi.fn(chain) as unknown as MockQuery["insert"];
  query.limit = vi.fn(chain) as unknown as MockQuery["insert"];
  query.single = vi.fn(async () => result);
  query.maybeSingle = vi.fn(async () => result);
  query.then = (
    onFulfilled: (value: QueryResult) => unknown,
    onRejected?: (reason: unknown) => unknown
  ) => Promise.resolve(result).then(onFulfilled, onRejected);

  return query;
}

function createSupabase(queries: Record<string, MockQuery[]>) {
  const from = vi.fn((table: string) => queries[table]?.shift() ?? createQuery({
    data: null,
    error: null,
  }));
  return {
    client: { from } as unknown as AppSupabaseClient,
    from,
  };
}

function request(
  body: unknown,
  method = "POST",
  path = "/api/assistant"
): NextRequest {
  return new NextRequest(`http://localhost${path}`, {
    method,
    ...(method === "POST"
      ? {
          headers: { "content-type": "application/json" },
          body: JSON.stringify(body),
        }
      : {}),
  });
}

const user = { id: "11111111-1111-4111-8111-111111111111" };
const conversationId = "22222222-2222-4222-8222-222222222222";
const source = {
  schemeSlug: "pm-kisan",
  schemeName: "PM-KISAN",
  title: "Official scheme page",
  url: "https://pmkisan.gov.in/",
  verifiedAt: "2026-11-15T00:00:00.000Z",
  kind: "information" as const,
};
const sourceJson: Json = {
  schemeSlug: source.schemeSlug,
  schemeName: source.schemeName,
  title: source.title,
  url: source.url,
  verifiedAt: source.verifiedAt,
  kind: source.kind,
};
const unsafeSourceJson: Json = {
  schemeSlug: source.schemeSlug,
  schemeName: source.schemeName,
  title: source.title,
  url: "javascript:alert(1)",
  verifiedAt: source.verifiedAt,
  kind: source.kind,
};

describe("AI Ally authenticated chat API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAuthenticatedServerUser.mockResolvedValue(user);
    mocks.generateGroundedAssistantReply.mockResolvedValue({
      answer: "Check the official scheme information.",
      sources: [source],
    });
  });

  it("rejects empty and oversized messages before making backend calls", async () => {
    const empty = await POST(request({ message: "  ", locale: "en" }));
    const oversized = await POST(
      request({ message: "x".repeat(1201), locale: "en" })
    );

    expect(empty.status).toBe(400);
    expect((await empty.json()).error.code).toBe("INVALID_REQUEST");
    expect(oversized.status).toBe(400);
    expect((await oversized.json()).error.code).toBe("MESSAGE_TOO_LONG");
    expect(mocks.createServerSupabaseClient).not.toHaveBeenCalled();
  });

  it("rejects unauthenticated citizens", async () => {
    mocks.createServerSupabaseClient.mockResolvedValue({ from: vi.fn() });
    mocks.requireAuthenticatedServerUser.mockRejectedValue(
      new UnauthorizedError()
    );

    const response = await POST(
      request({ message: "Explain PM-KISAN", locale: "en" })
    );

    expect(response.status).toBe(401);
    expect((await response.json()).error.code).toBe("UNAUTHENTICATED");
  });

  it("also requires authentication to load conversation history", async () => {
    mocks.createServerSupabaseClient.mockResolvedValue({ from: vi.fn() });
    mocks.requireAuthenticatedServerUser.mockRejectedValue(
      new UnauthorizedError()
    );

    const response = await GET(
      request(
        undefined,
        "GET",
        `/api/assistant?conversationId=${conversationId}`
      )
    );

    expect(response.status).toBe(401);
    expect((await response.json()).error.code).toBe("UNAUTHENTICATED");
  });

  it("persists both messages together and returns only database-backed source links", async () => {
    const conversationQuery = createQuery({
      data: { id: conversationId },
      error: null,
    });
    const savedMessagesQuery = createQuery({
      data: [
        {
          id: "33333333-3333-4333-8333-333333333333",
          role: "user",
          content: "What documents are required for PM-KISAN?",
          sources_json: [],
          created_at: "2026-11-17T00:00:00.000Z",
        },
        {
          id: "44444444-4444-4444-8444-444444444444",
          role: "assistant",
          content: "Check the official scheme information.",
          sources_json: [sourceJson],
          created_at: "2026-11-17T00:00:01.000Z",
        },
      ],
      error: null,
    });
    const { client, from } = createSupabase({
      chat_conversations: [conversationQuery],
      chat_messages: [savedMessagesQuery],
    });
    mocks.createServerSupabaseClient.mockResolvedValue(client);

    const response = await POST(
      request({
        message: "What documents are required for PM-KISAN?",
        locale: "en",
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.conversationId).toBe(conversationId);
    expect(payload.messages).toHaveLength(2);
    expect(payload.messages[1].sources[0].url).toBe(source.url);
    expect(conversationQuery.insertValues).toMatchObject({
      user_id: user.id,
      language: "en",
    });
    expect(savedMessagesQuery.insertValues).toEqual([
      expect.objectContaining({
        conversation_id: conversationId,
        role: "user",
      }),
      expect.objectContaining({
        conversation_id: conversationId,
        role: "assistant",
        sources_json: [source],
      }),
    ]);
    expect(from).toHaveBeenNthCalledWith(1, "chat_conversations");
    expect(from).toHaveBeenNthCalledWith(2, "chat_messages");
  });

  it("uses ordered prior turns only as context and returns the current answer pair in order", async () => {
    const firstTurnTimestamp = "2026-11-17T00:00:00.000Z";
    const secondTurnTimestamp = "2026-11-17T00:00:01.000Z";
    const ownershipQuery = createQuery({
      data: { id: conversationId },
      error: null,
    });
    const updateQuery = createQuery({ data: null, error: null });
    const previousMessagesQuery = createQuery({
      data: [
        { role: "assistant", content: "Earlier answer two.", created_at: secondTurnTimestamp },
        { role: "user", content: "Earlier question two.", created_at: secondTurnTimestamp },
        { role: "assistant", content: "Earlier answer one.", created_at: firstTurnTimestamp },
        { role: "user", content: "Earlier question one.", created_at: firstTurnTimestamp },
      ],
      error: null,
    });
    const savedMessagesQuery = createQuery({
      data: [
        {
          id: "44444444-4444-4444-8444-444444444444",
          role: "assistant",
          content: "The current Atal Pension Yojana benefits are listed here.",
          sources_json: [sourceJson],
          created_at: secondTurnTimestamp,
        },
        {
          id: "33333333-3333-4333-8333-333333333333",
          role: "user",
          content: "What are the benefits of Atal Pension Yojana?",
          sources_json: [],
          created_at: secondTurnTimestamp,
        },
      ],
      error: null,
    });
    const { client } = createSupabase({
      chat_conversations: [ownershipQuery, updateQuery],
      chat_messages: [previousMessagesQuery, savedMessagesQuery],
    });
    mocks.createServerSupabaseClient.mockResolvedValue(client);

    const response = await POST(
      request({
        message: "What are the benefits of Atal Pension Yojana?",
        locale: "en",
        conversationId,
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(mocks.generateGroundedAssistantReply).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "What are the benefits of Atal Pension Yojana?",
        history: [
          { role: "user", content: "Earlier question one." },
          { role: "assistant", content: "Earlier answer one." },
          { role: "user", content: "Earlier question two." },
          { role: "assistant", content: "Earlier answer two." },
        ],
      })
    );
    expect(payload.messages.map((message: { role: string }) => message.role)).toEqual([
      "user",
      "assistant",
    ]);
    expect(payload.messages[1].content).toContain(
      "current Atal Pension Yojana benefits"
    );
  });

  it("does not allow another citizen to post to an owned conversation", async () => {
    const ownershipQuery = createQuery({ data: null, error: null });
    const { client } = createSupabase({
      chat_conversations: [ownershipQuery],
      chat_messages: [],
    });
    mocks.createServerSupabaseClient.mockResolvedValue(client);

    const response = await POST(
      request({
        message: "Explain PM-KISAN",
        locale: "en",
        conversationId,
      })
    );

    expect(response.status).toBe(404);
    expect((await response.json()).error.code).toBe("CONVERSATION_NOT_FOUND");
    expect(mocks.generateGroundedAssistantReply).not.toHaveBeenCalled();
  });

  it("loads only an owned conversation and its persisted messages", async () => {
    const ownershipQuery = createQuery({
      data: { id: conversationId },
      error: null,
    });
    const messagesQuery = createQuery({
      data: [
        {
          id: "44444444-4444-4444-8444-444444444444",
          role: "assistant",
          content: "Official details are available.",
          sources_json: [sourceJson, unsafeSourceJson],
          created_at: "2026-11-17T00:00:01.000Z",
        },
      ],
      error: null,
    });
    const { client } = createSupabase({
      chat_conversations: [ownershipQuery],
      chat_messages: [messagesQuery],
    });
    mocks.createServerSupabaseClient.mockResolvedValue(client);

    const response = await GET(
      request(
        undefined,
        "GET",
        `/api/assistant?conversationId=${conversationId}`
      )
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.messages[0].sources).toHaveLength(1);
    expect(payload.messages[0].sources[0].url).toBe(source.url);
  });

  it("does not disclose another citizen's conversation when loading history", async () => {
    const ownershipQuery = createQuery({ data: null, error: null });
    const { client } = createSupabase({
      chat_conversations: [ownershipQuery],
      chat_messages: [],
    });
    mocks.createServerSupabaseClient.mockResolvedValue(client);

    const response = await GET(
      request(
        undefined,
        "GET",
        `/api/assistant?conversationId=${conversationId}`
      )
    );

    expect(response.status).toBe(404);
  });

  it("does not persist a failed Gemini response", async () => {
    const { client, from } = createSupabase({
      chat_conversations: [],
      chat_messages: [],
    });
    mocks.createServerSupabaseClient.mockResolvedValue(client);
    mocks.generateGroundedAssistantReply.mockRejectedValue(
      new Error("provider failure")
    );

    const response = await POST(
      request({ message: "Explain PM-KISAN", locale: "ta" })
    );

    expect(response.status).toBe(500);
    expect((await response.json()).error.message).not.toContain("provider failure");
    expect(from).not.toHaveBeenCalled();
  });
});
