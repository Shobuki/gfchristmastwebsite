const PUBLIC_TOKEN = process.env.NEXT_PUBLIC_API_TOKEN || "change-me";

export const getPublicHeaders = (): HeadersInit | undefined => {
  return PUBLIC_TOKEN ? { Authorization: `Bearer ${PUBLIC_TOKEN}` } : undefined;
};

export const withPublicToken = (url: string) => {
  if (!PUBLIC_TOKEN) return url;
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}token=${PUBLIC_TOKEN}`;
};
