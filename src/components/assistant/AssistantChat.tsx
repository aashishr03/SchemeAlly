"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import {
  Bot,
  ExternalLink,
  LoaderCircle,
  Plus,
  Send,
  UserRound,
} from "lucide-react";
import { useLanguage } from "@/components/layout/LanguageProvider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ASSISTANT_MESSAGE_MAX_LENGTH } from "@/services/assistant/schema";
import type { AssistantSource } from "@/services/assistant/schema";

const CONVERSATION_STORAGE_KEY = "schemeally_assistant_conversation";
const ASSISTANT_ERROR_CODES = [
  "GEMINI_NOT_CONFIGURED",
  "GEMINI_INVALID_KEY",
  "GEMINI_PERMISSION_DENIED",
  "GEMINI_QUOTA_EXCEEDED",
  "GEMINI_MODEL_UNAVAILABLE",
  "GEMINI_REQUEST_INVALID",
  "GEMINI_EMPTY_RESPONSE",
  "GEMINI_UNGROUNDED_RESPONSE",
  "GEMINI_UNAVAILABLE",
  "MESSAGE_TOO_LONG",
  "UNAUTHENTICATED",
  "CONVERSATION_NOT_FOUND",
  "REQUEST_FAILED",
] as const;

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources: AssistantSource[];
  createdAt: string;
  actionHref?: string;
}

interface AssistantApiResponse {
  conversationId: string;
  messages: ChatMessage[];
  actionHref?: string;
}

interface AssistantApiErrorResponse {
  error?: {
    code?: string;
  };
}

function getStoredConversationId(): string | null {
  try {
    return window.sessionStorage.getItem(CONVERSATION_STORAGE_KEY);
  } catch {
    return null;
  }
}

function storeConversationId(conversationId: string | null): void {
  try {
    if (conversationId) {
      window.sessionStorage.setItem(CONVERSATION_STORAGE_KEY, conversationId);
    } else {
      window.sessionStorage.removeItem(CONVERSATION_STORAGE_KEY);
    }
  } catch {
    // Chat remains usable when browser storage is unavailable.
  }
}

export function AssistantChat() {
  const { locale, t } = useLanguage();
  const text = t.assistantChat;
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [retryMessage, setRetryMessage] = useState<string | null>(null);
  const endOfMessagesRef = useRef<HTMLDivElement>(null);
  const restoringConversationRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    const storedId = getStoredConversationId();

    if (!storedId) {
      return () => {
        cancelled = true;
      };
    }

    restoringConversationRef.current = true;
    fetch(`/api/assistant?conversationId=${encodeURIComponent(storedId)}`)
      .then(async (response) => {
        const payload = (await response.json()) as
          | AssistantApiResponse
          | AssistantApiErrorResponse;
        if (!response.ok) {
          const code = (payload as AssistantApiErrorResponse).error?.code;
          if (code === "CONVERSATION_NOT_FOUND") {
            storeConversationId(null);
          }
          throw new Error(code ?? "default");
        }
        return payload as AssistantApiResponse;
      })
      .then((payload) => {
        if (cancelled) return;
        setConversationId(payload.conversationId);
        setMessages(payload.messages);
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setErrorCode(error instanceof Error ? error.message : "default");
        }
      })
      .finally(() => {
        restoringConversationRef.current = false;
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSending]);

  function getErrorMessage(code: string): string {
    return ASSISTANT_ERROR_CODES.includes(
      code as (typeof ASSISTANT_ERROR_CODES)[number]
    )
      ? text.errors[code as (typeof ASSISTANT_ERROR_CODES)[number]]
      : text.errors.default;
  }

  async function sendMessage(messageOverride?: string) {
    const message = (messageOverride ?? draft).trim();
    if (!message || isSending || restoringConversationRef.current) return;

    setErrorCode(null);
    setIsSending(true);

    try {
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          locale,
          ...(conversationId ? { conversationId } : {}),
        }),
      });
      const payload = (await response.json()) as
        | AssistantApiResponse
        | AssistantApiErrorResponse;

      if (!response.ok) {
        throw new Error(
          (payload as AssistantApiErrorResponse).error?.code ?? "default"
        );
      }

      const successPayload = payload as AssistantApiResponse;
      if (
        !successPayload.conversationId ||
        !Array.isArray(successPayload.messages)
      ) {
        throw new Error("default");
      }

      setConversationId(successPayload.conversationId);
      storeConversationId(successPayload.conversationId);
      setRetryMessage(null);
      setMessages((current) => [
        ...current,
        ...successPayload.messages.map((item) => ({
          ...item,
          ...(item.role === "assistant" && successPayload.actionHref
            ? { actionHref: successPayload.actionHref }
            : {}),
        })),
      ]);
      setDraft("");
    } catch (error) {
      setErrorCode(error instanceof Error ? error.message : "default");
      setRetryMessage(message);
    } finally {
      setIsSending(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendMessage();
  }

  function startNewChat() {
    setMessages([]);
    setConversationId(null);
    setDraft("");
    setErrorCode(null);
    setRetryMessage(null);
    storeConversationId(null);
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <Card className="overflow-hidden border border-white/80">
        <div className="flex flex-col gap-4 border-b border-slate-200/70 bg-white/55 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <div>
            <Badge variant="emeraldSoft" className="mb-2">
              {text.badge}
            </Badge>
            <h1 className="text-2xl font-extrabold tracking-tight text-[#0b172a] sm:text-3xl">
              {text.title}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
              {text.description}
            </p>
          </div>
          {(conversationId || messages.length > 0) && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="shrink-0 self-start sm:self-center"
              onClick={startNewChat}
              disabled={isSending}
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              {text.newChat}
            </Button>
          )}
        </div>

        <div
          className="max-h-[58vh] min-h-[260px] space-y-5 overflow-y-auto px-4 py-6 sm:px-8"
          aria-live="polite"
          aria-label={text.title}
        >
          {messages.length === 0 && (
            <div className="mx-auto max-w-2xl py-5 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-[#b7e7ce]/70 bg-[#e6f6ee] text-[#0e8a4f]">
                <Bot className="h-6 w-6" aria-hidden="true" />
              </div>
              <p className="text-base font-semibold leading-relaxed text-[#0b172a]">
                {text.welcome}
              </p>
              <p className="mt-2 text-sm text-slate-500">
                {text.welcomeSubtitle}
              </p>

              <div className="mt-6 text-left">
                <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500">
                  {text.suggestionsLabel}
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {Object.values(text.suggestedQuestions).map((question) => (
                    <button
                      key={question}
                      type="button"
                      disabled={isSending}
                      onClick={() => void sendMessage(question)}
                      className="rounded-2xl border border-slate-200/80 bg-white/75 px-4 py-3 text-left text-sm font-medium leading-relaxed text-slate-700 transition hover:border-[#0e8a4f]/40 hover:bg-[#f4fbf7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0e8a4f] disabled:opacity-50"
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {message.role === "assistant" && (
                <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#e6f6ee] text-[#0e8a4f]">
                  <Bot className="h-4 w-4" aria-hidden="true" />
                </div>
              )}
              <div
                className={`max-w-[88%] rounded-2xl px-4 py-3 sm:max-w-[78%] ${
                  message.role === "user"
                    ? "rounded-br-md bg-[#0b172a] text-white"
                    : "rounded-bl-md border border-slate-200/70 bg-white/85 text-[#0b172a] shadow-sm"
                }`}
                lang={locale}
              >
                <p className="whitespace-pre-wrap text-sm leading-relaxed">
                  {message.content}
                </p>

                {message.actionHref && (
                  <Link
                    href={message.actionHref}
                    className="mt-3 inline-flex items-center gap-2 rounded-full bg-[#0e8a4f] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0b7241] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0e8a4f] focus-visible:ring-offset-2"
                  >
                    {text.viewOpportunities}
                    <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                  </Link>
                )}

                {message.sources.length > 0 && (
                  <div className="mt-4 border-t border-slate-200/80 pt-3">
                    <p className="mb-2 text-xs font-bold text-slate-500">
                      {text.sourceHeading}
                    </p>
                    <ul className="space-y-2">
                      {message.sources.map((source) => (
                        <li key={`${source.schemeSlug}:${source.url}`}>
                          <a
                            href={source.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-start gap-2 text-xs font-semibold leading-relaxed text-[#0e8a4f] underline-offset-2 hover:underline"
                          >
                            <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                            <span>
                              {source.schemeName}: {source.title || (source.kind === "application" ? text.applicationPortal : text.officialInformation)}
                              {source.verifiedAt && (
                                <span className="block font-normal text-slate-500">
                                  {text.verifiedOn}: {new Date(source.verifiedAt).toLocaleDateString(locale === "ta" ? "ta-IN" : "en-IN")}
                                </span>
                              )}
                            </span>
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              {message.role === "user" && (
                <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                  <UserRound className="h-4 w-4" aria-hidden="true" />
                </div>
              )}
            </div>
          ))}

          {isSending && (
            <div className="flex items-center gap-3" role="status">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#e6f6ee] text-[#0e8a4f]">
                <Bot className="h-4 w-4" aria-hidden="true" />
              </div>
              <div className="flex items-center gap-2 rounded-2xl rounded-bl-md border border-slate-200/70 bg-white/85 px-4 py-3 text-sm text-slate-500">
                <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
                {text.sending}
              </div>
            </div>
          )}

          <div ref={endOfMessagesRef} />
        </div>

        <div className="border-t border-slate-200/70 bg-white/55 px-4 py-4 sm:px-8">
          {errorCode && (
            <div
              className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
              role="alert"
            >
              <span>{getErrorMessage(errorCode)}</span>
              {retryMessage && (
                <button
                  type="button"
                  className="shrink-0 font-semibold underline underline-offset-2 disabled:opacity-50"
                  onClick={() => void sendMessage(retryMessage)}
                  disabled={isSending}
                >
                  {text.retry}
                </button>
              )}
            </div>
          )}
          <form onSubmit={handleSubmit} className="flex items-end gap-2 sm:gap-3">
            <label className="sr-only" htmlFor="assistant-message">
              {text.composerLabel}
            </label>
            <textarea
              id="assistant-message"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder={text.placeholder}
              maxLength={ASSISTANT_MESSAGE_MAX_LENGTH}
              rows={2}
              disabled={isSending}
              className="min-h-11 max-h-36 min-w-0 flex-1 resize-y rounded-2xl border border-slate-200/90 bg-white/95 px-4 py-3 text-sm text-[#0b172a] shadow-2xs transition placeholder:text-slate-400 focus-visible:border-[#0e8a4f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0e8a4f] disabled:cursor-not-allowed disabled:opacity-60"
            />
            <Button
              type="submit"
              variant="emerald"
              size="icon"
              aria-label={text.send}
              disabled={!draft.trim() || isSending}
            >
              {isSending ? (
                <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Send className="h-4 w-4" aria-hidden="true" />
              )}
            </Button>
          </form>
          <p className="mt-2 text-xs text-slate-500">
            {draft.length}/{ASSISTANT_MESSAGE_MAX_LENGTH}
          </p>
        </div>
      </Card>
    </div>
  );
}
