import type { CoverGenerateRequest, GenerateRequest } from "./types.ts";
import { COVER_MODELS } from "./types.ts";

const CHAT_URL = "https://api.minimax.io/v1/chat/completions";
const MODEL = "MiniMax-M3";

export interface SongMetadata {
  title: string;
  styleTags: string[];
}

interface ChatCompletionResponse {
  choices?: Array<{
    message?: {
      content?: string | null;
      reasoning_content?: string | null;
    };
    finish_reason?: string;
  }>;
  base_resp?: {
    status_code: number;
    status_msg: string;
  };
  error?: {
    message?: string;
  };
}

function buildUserMessage(req: GenerateRequest): string {
  const parts = [`Style prompt: ${req.prompt || "(none)"}`];

  if (COVER_MODELS.has(req.model)) {
    parts.push("This is a music cover (restyled rendition of a reference track).");
    if (req.lyrics?.trim()) {
      const lyrics = req.lyrics.trim();
      const excerpt = lyrics.length > 1200 ? `${lyrics.slice(0, 1200)}…` : lyrics;
      parts.push(`Cover lyrics:\n${excerpt}`);
    } else {
      parts.push("Lyrics were auto-extracted from the reference audio.");
    }
    return parts.join("\n\n");
  }

  if (req.isInstrumental) {
    parts.push("This is an instrumental track (no vocals).");
  } else if (req.lyrics?.trim()) {
    const lyrics = req.lyrics.trim();
    const excerpt = lyrics.length > 1200 ? `${lyrics.slice(0, 1200)}…` : lyrics;
    parts.push(`Lyrics:\n${excerpt}`);
  } else if (req.lyricsOptimizer) {
    parts.push("Lyrics were auto-generated from the style prompt.");
  }

  return parts.join("\n\n");
}

function buildCoverUserMessage(req: CoverGenerateRequest): string {
  const parts = [
    `Cover style prompt: ${req.prompt || "(none)"}`,
    "This is a music cover (restyled rendition of a reference track).",
  ];

  if (req.lyrics?.trim()) {
    const lyrics = req.lyrics.trim();
    const excerpt = lyrics.length > 1200 ? `${lyrics.slice(0, 1200)}…` : lyrics;
    parts.push(`Cover lyrics:\n${excerpt}`);
  } else {
    parts.push("Lyrics were auto-extracted from the reference audio.");
  }

  if (req.coverFeatureId) {
    parts.push("User edited the extracted lyrics before generating.");
  }

  return parts.join("\n\n");
}

function stripMarkdownFences(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  return (fenced ? fenced[1] : text).trim();
}

function stripThinkingBlocks(text: string): string {
  return text
    .replace(/<think>[\s\S]*?<\/redacted_thinking>/gi, "")
    .replace(/[\s\S]*?<\/think>/gi, "")
    .trim();
}

export function fallbackStyleTags(prompt: string): string[] {
  return prompt
    .split(/[,;|]/)
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0 && tag.length <= 40)
    .slice(0, 5);
}

export function deriveTitleFallback(req: GenerateRequest): string {
  if (req.lyrics?.trim()) {
    const line = req.lyrics
      .split("\n")
      .map((l) => l.trim())
      .find((l) => l.length > 0 && !/^\[[\w\s]+\]$/.test(l));
    if (line) {
      const cleaned = line.replace(/^\[[\w\s]+\]\s*/, "").trim();
      if (cleaned.length > 0) {
        return cleaned.length > 60 ? `${cleaned.slice(0, 60)}…` : cleaned;
      }
    }
  }

  const prompt = req.prompt?.trim();
  if (prompt) {
    return prompt.length > 60 ? `${prompt.slice(0, 60)}…` : prompt;
  }

  return "Untitled";
}

function parseMetadataContent(content: string, prompt: string): SongMetadata | null {
  const cleaned = stripThinkingBlocks(stripMarkdownFences(content));
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;

  try {
    const parsed = JSON.parse(jsonMatch[0]) as {
      title?: unknown;
      styleTags?: unknown;
      style_tags?: unknown;
    };

    if (typeof parsed.title !== "string" || !parsed.title.trim()) {
      return null;
    }

    const rawTags = parsed.styleTags ?? parsed.style_tags;
    const styleTags = Array.isArray(rawTags)
      ? rawTags
          .filter((tag): tag is string => typeof tag === "string" && tag.trim().length > 0)
          .map((tag) => tag.trim())
          .slice(0, 5)
      : fallbackStyleTags(prompt);

    return {
      title: parsed.title.trim(),
      styleTags: styleTags.length > 0 ? styleTags : fallbackStyleTags(prompt),
    };
  } catch {
    return null;
  }
}

function extractMessageContent(result: ChatCompletionResponse): string | null {
  const message = result.choices?.[0]?.message;
  if (!message) return null;

  const content = typeof message.content === "string" ? message.content.trim() : "";
  return content || null;
}

function isApiSuccess(response: Response, result: ChatCompletionResponse): boolean {
  if (result.base_resp && result.base_resp.status_code !== 0) {
    return false;
  }
  if (!response.ok) {
    return false;
  }
  if (result.error?.message) {
    return false;
  }
  return true;
}

async function fetchMetadata(userContent: string, prompt: string): Promise<SongMetadata | null> {
  const apiKey = Deno.env.get("MINIMAX_API_KEY");
  if (!apiKey) {
    console.warn("MINIMAX_API_KEY not configured; skipping metadata generation");
    return null;
  }

  try {
    const response = await fetch(CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        thinking: { type: "disabled" },
        max_completion_tokens: 256,
        temperature: 0.3,
        messages: [
          {
            role: "system",
            content: `You name songs and extract style tags for a music library UI.
Respond with strict JSON only, no markdown, no explanation, no thinking text.
Format: {"title":"Song Name Here","styleTags":["Tag One","Tag Two"]}
Rules:
- title: 2-6 words, evocative song name
- styleTags: 2-5 short tags (genre, mood, tempo, instruments, vocal type)`,
          },
          {
            role: "user",
            content: userContent,
          },
        ],
      }),
    });

    const result = (await response.json()) as ChatCompletionResponse;
    const finishReason = result.choices?.[0]?.finish_reason;

    if (!isApiSuccess(response, result)) {
      console.warn(
        "Metadata generation failed:",
        result.base_resp?.status_msg ?? result.error?.message ?? response.status,
        `finish_reason=${finishReason}`,
        JSON.stringify(result).slice(0, 500),
      );
      return null;
    }

    const rawContent = extractMessageContent(result);
    if (!rawContent) {
      console.warn(
        "Metadata generation returned empty content:",
        `finish_reason=${finishReason}`,
        JSON.stringify(result).slice(0, 500),
      );
      return null;
    }

    const metadata = parseMetadataContent(rawContent, prompt);
    if (!metadata) {
      console.warn(
        "Failed to parse metadata JSON:",
        `finish_reason=${finishReason}`,
        rawContent.slice(0, 300),
      );
    }
    return metadata;
  } catch (err) {
    console.warn("Metadata generation error:", err);
    return null;
  }
}

export async function generateSongMetadata(
  req: GenerateRequest,
): Promise<SongMetadata | null> {
  return fetchMetadata(buildUserMessage(req), req.prompt ?? "");
}

export async function generateCoverMetadata(
  req: CoverGenerateRequest,
): Promise<SongMetadata | null> {
  return fetchMetadata(buildCoverUserMessage(req), req.prompt ?? "");
}
