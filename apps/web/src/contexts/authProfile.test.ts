import type { UserProfile } from "@zipath/types";
import { refreshAuthProfile } from "./authProfile";

describe("refreshAuthProfile", () => {
  function makeResponse(ok: boolean, body: unknown): Response {
    return {
      ok,
      json: async () => body,
    } as unknown as Response;
  }

  it("clears loading and user when access token is missing", async () => {
    const setUser = jest.fn();
    const setIsLoading = jest.fn();
    const clearTokens = jest.fn();
    const fetchImpl = jest.fn();

    await refreshAuthProfile({
      fetchImpl,
      getAccessToken: () => null,
      clearTokens,
      setUser,
      setIsLoading,
    });

    expect(fetchImpl).not.toHaveBeenCalled();
    expect(setUser).toHaveBeenCalledWith(null);
    expect(setIsLoading).toHaveBeenCalledWith(false);
    expect(clearTokens).not.toHaveBeenCalled();
  });

  it("clears tokens and stops loading when the profile request fails", async () => {
    const setUser = jest.fn();
    const setIsLoading = jest.fn();
    const clearTokens = jest.fn();
    const fetchImpl = jest.fn().mockResolvedValue(makeResponse(false, null));

    await refreshAuthProfile({
      fetchImpl,
      getAccessToken: () => "token-123",
      clearTokens,
      setUser,
      setIsLoading,
    });

    expect(fetchImpl).toHaveBeenCalledWith("/api/auth/profile", {
      headers: {
        Authorization: "Bearer token-123",
      },
    });
    expect(clearTokens).toHaveBeenCalled();
    expect(setUser).toHaveBeenCalledWith(null);
    expect(setIsLoading).toHaveBeenCalledWith(false);
  });

  it("stops loading when fetch throws", async () => {
    const setUser = jest.fn();
    const setIsLoading = jest.fn();
    const clearTokens = jest.fn();
    const fetchImpl = jest.fn().mockRejectedValue(new Error("network error"));

    await refreshAuthProfile({
      fetchImpl,
      getAccessToken: () => "token-123",
      clearTokens,
      setUser,
      setIsLoading,
    });

    expect(clearTokens).not.toHaveBeenCalled();
    expect(setUser).toHaveBeenCalledWith(null);
    expect(setIsLoading).toHaveBeenCalledWith(false);
  });

  it("passes the shared UserProfile shape through on success", async () => {
    const setUser = jest.fn();
    const setIsLoading = jest.fn();
    const clearTokens = jest.fn();
    const profile: UserProfile = {
      id: 1,
      email: "test@example.com",
      nickname: "tester",
      provider: "google",
      interestRegions: ["Seoul Gangnam"],
      createdAt: "2026-01-01T00:00:00.000Z",
      lastActiveAt: "2026-01-02T00:00:00.000Z",
    };
    const fetchImpl = jest.fn().mockResolvedValue(makeResponse(true, profile));

    await refreshAuthProfile({
      fetchImpl,
      getAccessToken: () => "token-123",
      clearTokens,
      setUser,
      setIsLoading,
    });

    expect(setUser).toHaveBeenCalledWith(profile);
    expect(clearTokens).not.toHaveBeenCalled();
    expect(setIsLoading).toHaveBeenCalledWith(false);
  });
});
