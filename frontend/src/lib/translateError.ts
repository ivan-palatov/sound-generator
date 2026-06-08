import i18n from "../i18n/index.ts";

export type ApiErrorParams = Record<string, string | number>;

export class ApiClientError extends Error {
  code: string;
  params?: ApiErrorParams;

  constructor(code: string, params?: ApiErrorParams) {
    super(code);
    this.name = "ApiClientError";
    this.code = code;
    this.params = params;
  }
}

export function isApiClientError(err: unknown): err is ApiClientError {
  return err instanceof ApiClientError;
}

export function translateError(
  code: string | undefined,
  params?: ApiErrorParams,
  fallback?: string,
): string {
  if (code) {
    const key = `errors.${code}`;
    if (i18n.exists(key)) {
      return i18n.t(key, params);
    }
  }
  return fallback ?? i18n.t("errors.UNKNOWN");
}

export function translateEntryError(entry: {
  errorCode?: string;
  errorParams?: ApiErrorParams;
  error?: string;
}): string | undefined {
  if (entry.errorCode) {
    return translateError(entry.errorCode, entry.errorParams, entry.error);
  }
  return entry.error;
}
