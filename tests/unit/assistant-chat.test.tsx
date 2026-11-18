import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { AssistantChat } from "@/components/assistant/AssistantChat";
import { LanguageProvider } from "@/components/layout/LanguageProvider";

describe("AI Ally chat", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    window.sessionStorage.clear();
  });

  it("shows a model-specific error and retries the failed suggested question", async () => {
    Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
      configurable: true,
      value: vi.fn(),
    });
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            error: {
              code: "GEMINI_MODEL_UNAVAILABLE",
              message: "The configured Gemini model is unavailable.",
            },
          }),
          { status: 502, headers: { "Content-Type": "application/json" } }
        )
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            conversationId: "11111111-1111-4111-8111-111111111111",
            messages: [
              {
                id: "22222222-2222-4222-8222-222222222222",
                role: "user",
                content: "What documents are required for PM-KISAN?",
                sources: [],
                createdAt: "2026-11-17T00:00:00.000Z",
              },
              {
                id: "33333333-3333-4333-8333-333333333333",
                role: "assistant",
                content:
                  "PM-KISAN requires the documents listed in the verified catalogue.",
                sources: [],
                createdAt: "2026-11-17T00:00:01.000Z",
              },
            ],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        )
      );

    render(
      <LanguageProvider>
        <AssistantChat />
      </LanguageProvider>
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "What documents are required for PM-KISAN?",
      })
    );
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "AI Ally's configured Gemini model is unavailable."
    );

    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(
      await screen.findByText(
        "PM-KISAN requires the documents listed in the verified catalogue."
      )
    ).toBeInTheDocument();
    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(2));
    expect(JSON.parse(String(fetchSpy.mock.calls[1][1]?.body))).toMatchObject({
      message: "What documents are required for PM-KISAN?",
      locale: "en",
    });
  });

  it("starts a clean conversation and displays each response under its submitted question", async () => {
    Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
      configurable: true,
      value: vi.fn(),
    });
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            conversationId: "11111111-1111-4111-8111-111111111111",
            messages: [
              {
                id: "22222222-2222-4222-8222-222222222222",
                role: "user",
                content: "What documents are required for PM-KISAN?",
                sources: [],
                createdAt: "2026-11-17T00:00:00.000Z",
              },
              {
                id: "33333333-3333-4333-8333-333333333333",
                role: "assistant",
                content: "PM-KISAN document requirements are listed here.",
                sources: [],
                createdAt: "2026-11-17T00:00:00.000Z",
              },
            ],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        )
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            conversationId: "44444444-4444-4444-8444-444444444444",
            messages: [
              {
                id: "55555555-5555-4555-8555-555555555555",
                role: "user",
                content: "What are the benefits of Atal Pension Yojana?",
                sources: [],
                createdAt: "2026-11-17T00:00:01.000Z",
              },
              {
                id: "66666666-6666-4666-8666-666666666666",
                role: "assistant",
                content: "Atal Pension Yojana provides a monthly pension.",
                sources: [],
                createdAt: "2026-11-17T00:00:01.000Z",
              },
            ],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        )
      );

    render(
      <LanguageProvider>
        <AssistantChat />
      </LanguageProvider>
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "What documents are required for PM-KISAN?",
      })
    );
    expect(
      await screen.findByText("PM-KISAN document requirements are listed here.")
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "New chat" }));
    expect(
      screen.queryByText("PM-KISAN document requirements are listed here.")
    ).not.toBeInTheDocument();

    fireEvent.change(screen.getByRole("textbox", { name: "Your message" }), {
      target: { value: "What are the benefits of Atal Pension Yojana?" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send" }));
    expect(
      await screen.findByText("Atal Pension Yojana provides a monthly pension.")
    ).toBeInTheDocument();
    expect(
      screen.queryByText("PM-KISAN document requirements are listed here.")
    ).not.toBeInTheDocument();

    const submittedBodies = fetchSpy.mock.calls.map(([, options]) =>
      JSON.parse(String(options?.body))
    );
    expect(submittedBodies).toEqual([
      {
        message: "What documents are required for PM-KISAN?",
        locale: "en",
      },
      {
        message: "What are the benefits of Atal Pension Yojana?",
        locale: "en",
      },
    ]);
  });
});
