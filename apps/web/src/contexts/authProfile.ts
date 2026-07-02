import type { UserProfile } from "@zipath/types";

type FetchLike = typeof fetch;

interface RefreshAuthProfileParams {
  fetchImpl?: FetchLike;
  getAccessToken: () => string | null;
  clearTokens: () => void;
  setUser: (user: UserProfile | null) => void;
  setIsLoading: (isLoading: boolean) => void;
}

export async function refreshAuthProfile({
  fetchImpl = fetch,
  getAccessToken,
  clearTokens,
  setUser,
  setIsLoading,
}: RefreshAuthProfileParams): Promise<void> {
  const accessToken = getAccessToken();
  if (!accessToken) {
    setUser(null);
    setIsLoading(false);
    return;
  }

  try {
    const res = await fetchImpl("/api/auth/profile", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!res.ok) {
      clearTokens();
      setUser(null);
      return;
    }

    const data: unknown = await res.json();
    setUser(data as UserProfile);
  } catch {
    setUser(null);
  } finally {
    setIsLoading(false);
  }
}
