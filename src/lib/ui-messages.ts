type ApiLikeError = Error & {
  status?: number;
  body?: unknown;
};

function extractMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return null;
}

export function getUiErrorMessage(error: unknown, fallback: string) {
  const status = (error as ApiLikeError)?.status;
  const message = extractMessage(error);

  if (status === 401) {
    return "Сессия истекла. Войдите заново.";
  }

  if (status === 403) {
    return "Недостаточно прав для этого действия.";
  }

  if (status === 404) {
    return "Заявка не найдена. Обновите список.";
  }

  if (status === 409 && message) {
    return message;
  }

  if (status === 400 && message) {
    return message;
  }

  return message ?? fallback;
}
