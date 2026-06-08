export type ApiErrorCode =
  | "INVALID_JSON"
  | "INVALID_REQUEST_BODY"
  | "NOT_FOUND"
  | "ENTRY_NOT_FOUND"
  | "UNKNOWN_FIELDS"
  | "TITLE_NOT_STRING"
  | "TITLE_EMPTY"
  | "TITLE_TOO_LONG"
  | "PINNED_NOT_BOOLEAN"
  | "NO_VALID_FIELDS"
  | "COVER_MODEL_WRONG_ENDPOINT"
  | "TTS_MODEL_WRONG_ENDPOINT"
  | "MODEL_REQUIRED"
  | "UNSUPPORTED_MODEL"
  | "UNSUPPORTED_COVER_MODEL"
  | "UNSUPPORTED_TTS_MODEL"
  | "VALID_COVER_MODEL_REQUIRED"
  | "VALID_TTS_MODEL_REQUIRED"
  | "STYLE_PROMPT_REQUIRED_INSTRUMENTAL"
  | "STYLE_PROMPT_TOO_LONG"
  | "LYRICS_REQUIRED"
  | "LYRICS_TOO_LONG"
  | "REFERENCE_AUDIO_REQUIRED"
  | "REFERENCE_AUDIO_BOTH"
  | "REFERENCE_AUDIO_TOO_LARGE"
  | "STYLE_PROMPT_LENGTH"
  | "COVER_FEATURE_WITH_AUDIO"
  | "COVER_LYRICS_LENGTH"
  | "SPEECH_TEXT_REQUIRED"
  | "SPEECH_TEXT_TOO_LONG"
  | "VOICE_SOURCE_REQUIRED"
  | "VOICE_PROMPT_TOO_LONG"
  | "VOICE_SAMPLE_BOTH"
  | "VOICE_SAMPLE_TOO_LARGE"
  | "API_KEY_NOT_CONFIGURED"
  | "RATE_LIMIT"
  | "AUTH_FAILED"
  | "INSUFFICIENT_BALANCE"
  | "CONTENT_FLAGGED"
  | "INVALID_PARAMETERS"
  | "INVALID_API_KEY"
  | "NO_COVER_FEATURE_DATA"
  | "NO_AUDIO_URL"
  | "NO_FILE_ID"
  | "VOICE_SAMPLE_FETCH_FAILED"
  | "NO_VOICE_CLONE_AUDIO"
  | "NO_TTS_AUDIO"
  | "EXTERNAL_SERVICE_ERROR";

export type ApiErrorParams = Record<string, string | number>;

export class ApiError extends Error {
  constructor(
    public code: ApiErrorCode,
    public params?: ApiErrorParams,
    public traceId?: string,
  ) {
    super(code);
    this.name = "ApiError";
  }
}

export function isApiError(err: unknown): err is ApiError {
  return err instanceof ApiError;
}

export function apiErrorResponse(
  err: ApiError,
  extra?: Record<string, unknown>,
): Record<string, unknown> {
  return {
    errorCode: err.code,
    ...(err.params ? { errorParams: err.params } : {}),
    ...(err.traceId ? { traceId: err.traceId } : {}),
    ...extra,
  };
}

const MINIMAX_ERROR_CODES: Record<number, ApiErrorCode> = {
  1002: "RATE_LIMIT",
  1004: "AUTH_FAILED",
  1008: "INSUFFICIENT_BALANCE",
  1026: "CONTENT_FLAGGED",
  2013: "INVALID_PARAMETERS",
  2049: "INVALID_API_KEY",
};

export function mapMiniMaxErrorCode(statusCode: number, statusMsg: string): ApiError {
  const code = MINIMAX_ERROR_CODES[statusCode];
  if (code) {
    return new ApiError(code);
  }
  return new ApiError("EXTERNAL_SERVICE_ERROR", { message: statusMsg || "Unknown error" });
}
