"use client";

import Link from "next/link";
import React, { useEffect, useState, useCallback } from "react";
import { fetchApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import SiteHeader from "@/components/layout/SiteHeader";
import { formatKoreanDateTime } from "@/lib/dateFormat";

interface NotificationPreference {
  id: number;
  userId: number;
  regions: string[];
  priceThresholdMin: number | null;
  priceThresholdMax: number | null;
  announcementKeywords: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface NotificationItem {
  id: number;
  userId: number;
  type: string;
  title: string;
  message: string;
  referenceId: string | null;
  readAt: string | null;
  createdAt: string;
}

interface NotificationListResponse {
  notifications: NotificationItem[];
  total: number;
}

type NotificationType = "announcement" | "price_change" | "subscription" | "system";

const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  announcement: "공고 알림",
  price_change: "가격 변동",
  subscription: "청약 알림",
  system: "시스템",
};

const NOTIFICATION_TYPE_COLORS: Record<NotificationType, string> = {
  announcement: "bg-blue-100 text-blue-700",
  price_change: "bg-green-100 text-green-700",
  subscription: "bg-purple-100 text-purple-700",
  system: "bg-gray-100 text-gray-700",
};

const SAMPLE_REGIONS = [
  "서울 강남구",
  "서울 서초구",
  "서울 송파구",
  "서울 마포구",
  "서울 용산구",
  "서울 성동구",
  "경기 성남시",
  "경기 수원시",
  "경기 고양시",
  "경기 용인시",
  "인천 연수구",
  "인천 부평구",
];

/** 알림 타입/referenceId 기반으로 이동 경로를 결정한다. */
function getNotificationHref(item: NotificationItem): string | null {
  if (item.type === "announcement") {
    // referenceId 형식: "announcement:<id>" — 상세 페이지로 이동.
    if (item.referenceId?.startsWith("announcement:")) {
      const id = item.referenceId.slice("announcement:".length);
      if (id) return `/announcements/${id}`;
    }
    return "/announcements";
  }
  if (item.type === "price_change") return "/real-price";
  return null;
}

const SAMPLE_KEYWORDS = [
  "신혼",
  "생애최초",
  "다자녀",
  "청년",
  "신생아",
  "무주택",
  "국민임대",
  "행복주택",
];

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <SiteHeader maxWidth="max-w-4xl" />
      <main className="mx-auto flex max-w-md flex-col items-center px-4 py-20">
        {children}
      </main>
    </div>
  );
}

export default function NotificationsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<"preferences" | "history">("preferences");

  // Preference state
  const [preference, setPreference] = useState<NotificationPreference | null>(null);
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [priceMin, setPriceMin] = useState<string>("");
  const [priceMax, setPriceMax] = useState<string>("");
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);
  const [prefLoading, setPrefLoading] = useState(false);
  const [prefSaving, setPrefSaving] = useState(false);
  const [prefError, setPrefError] = useState<string | null>(null);
  const [prefSuccess, setPrefSuccess] = useState<string | null>(null);

  // Notification history state
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [notifTotal, setNotifTotal] = useState(0);
  const [notifPage, setNotifPage] = useState(1);
  const [notifLoading, setNotifLoading] = useState(false);
  const [notifError, setNotifError] = useState<string | null>(null);

  const fetchPreference = useCallback(async () => {
    setPrefLoading(true);
    setPrefError(null);
    try {
      const data = await fetchApi<NotificationPreference | null>(
        `/notifications/preferences`,
        { auth: true },
      );
      if (data) {
        setPreference(data);
        setSelectedRegions(data.regions);
        setPriceMin(data.priceThresholdMin ? String(data.priceThresholdMin) : "");
        setPriceMax(data.priceThresholdMax ? String(data.priceThresholdMax) : "");
        setSelectedKeywords(data.announcementKeywords);
      }
    } catch {
      setPrefError("알림 설정을 불러오는 데 실패했습니다.");
    } finally {
      setPrefLoading(false);
    }
  }, []);

  const fetchNotifications = useCallback(async (page: number) => {
    setNotifLoading(true);
    setNotifError(null);
    try {
      const data = await fetchApi<NotificationListResponse>(
        `/notifications?page=${page}&limit=20`,
        { auth: true },
      );
      setNotifications(data.notifications);
      setNotifTotal(data.total);
    } catch {
      setNotifError("알림 목록을 불러오는 데 실패했습니다.");
    } finally {
      setNotifLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchPreference();
  }, [isAuthenticated, fetchPreference]);

  useEffect(() => {
    if (!isAuthenticated) return;
    if (activeTab === "history") {
      fetchNotifications(notifPage);
    }
  }, [isAuthenticated, activeTab, notifPage, fetchNotifications]);

  const toggleRegion = (region: string) => {
    setSelectedRegions((prev) =>
      prev.includes(region)
        ? prev.filter((r) => r !== region)
        : [...prev, region],
    );
  };

  const toggleKeyword = (keyword: string) => {
    setSelectedKeywords((prev) =>
      prev.includes(keyword)
        ? prev.filter((k) => k !== keyword)
        : [...prev, keyword],
    );
  };

  const savePreference = async () => {
    setPrefSaving(true);
    setPrefError(null);
    setPrefSuccess(null);
    try {
      const body = {
        regions: selectedRegions,
        priceThresholdMin: priceMin ? parseInt(priceMin, 10) : null,
        priceThresholdMax: priceMax ? parseInt(priceMax, 10) : null,
        announcementKeywords: selectedKeywords,
      };

      if (preference) {
        const updated = await fetchApi<NotificationPreference>(
          `/notifications/preferences/${preference.id}`,
          { method: "PUT", body: JSON.stringify(body), auth: true },
        );
        setPreference(updated);
      } else {
        const created = await fetchApi<NotificationPreference>(
          `/notifications/preferences`,
          { method: "POST", body: JSON.stringify(body), auth: true },
        );
        setPreference(created);
      }
      setPrefSuccess("알림 설정이 저장되었습니다.");
      setTimeout(() => setPrefSuccess(null), 3000);
    } catch {
      setPrefError("알림 설정 저장에 실패했습니다.");
    } finally {
      setPrefSaving(false);
    }
  };

  const markAsRead = async (notifId: number) => {
    try {
      await fetchApi<NotificationItem>(
        `/notifications/${notifId}/read`,
        { method: "PUT", auth: true },
      );
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notifId ? { ...n, readAt: new Date().toISOString() } : n,
        ),
      );
    } catch {
      // 읽음 처리 실패는 무시
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetchApi<unknown>(
        `/notifications/read-all`,
        { method: "PUT", auth: true },
      );
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })),
      );
    } catch {
      // 전체 읽음 처리 실패는 무시
    }
  };

  if (authLoading) {
    return (
      <PageShell>
        <p className="text-muted-foreground">로딩 중...</p>
      </PageShell>
    );
  }

  if (!isAuthenticated) {
    return (
      <PageShell>
        <h1 className="mb-4 text-2xl font-bold">로그인이 필요합니다</h1>
        <p className="mb-6 text-sm text-muted-foreground">
          맞춤 알림 설정을 보려면 먼저 로그인해주세요.
        </p>
        <Link
          href="/login"
          className="rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          로그인하기
        </Link>
      </PageShell>
    );
  }

  const totalPages = Math.ceil(notifTotal / 20);

  return (
    <div className="min-h-screen">
      <SiteHeader maxWidth="max-w-4xl" />

      <main className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="mb-2 text-3xl font-bold">맞춤 알림</h1>
        <p className="mb-8 text-muted-foreground">
          관심 지역과 가격대를 설정하면 새 공고, 실거래가 변동 등을 알려드립니다.
        </p>

        {/* 법적 고지 */}
        <div className="mb-8 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          이 서비스는 참고용이며 법적 효력이 없습니다. 부동산 거래 시 반드시
          전문가의 조언을 받으세요.
        </div>

        {/* 탭 */}
        <div className="mb-8 flex border-b">
          <button
            onClick={() => setActiveTab("preferences")}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === "preferences"
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            알림 설정
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === "history"
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            알림 내역
          </button>
        </div>

        {/* 알림 설정 탭 */}
        {activeTab === "preferences" && (
          <div className="space-y-8">
            {prefLoading ? (
              <div className="flex justify-center py-20">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : (
              <>
                {/* 관심 지역 */}
                <div className="rounded-lg border bg-card p-6">
                  <h2 className="mb-1 text-lg font-bold">관심 지역</h2>
                  <p className="mb-4 text-sm text-muted-foreground">
                    알림을 받고 싶은 지역을 선택하세요.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {SAMPLE_REGIONS.map((region) => (
                      <button
                        key={region}
                        onClick={() => toggleRegion(region)}
                        className={`rounded-full border px-4 py-2 text-sm transition-colors ${
                          selectedRegions.includes(region)
                            ? "border-primary bg-primary/10 text-primary font-medium"
                            : "border-gray-200 bg-white text-muted-foreground hover:border-gray-300"
                        }`}
                      >
                        {region}
                      </button>
                    ))}
                  </div>
                  {selectedRegions.length > 0 && (
                    <p className="mt-3 text-sm text-muted-foreground">
                      {selectedRegions.length}개 지역 선택됨
                    </p>
                  )}
                </div>

                {/* 가격대 설정 */}
                <div className="rounded-lg border bg-card p-6">
                  <h2 className="mb-1 text-lg font-bold">가격대 설정</h2>
                  <p className="mb-4 text-sm text-muted-foreground">
                    관심 있는 매매 가격대를 설정하세요. (만원 단위)
                  </p>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <label
                        htmlFor="priceMin"
                        className="mb-1 block text-sm font-medium"
                      >
                        최소 가격
                      </label>
                      <div className="relative">
                        <input
                          id="priceMin"
                          type="number"
                          value={priceMin}
                          onChange={(e) => setPriceMin(e.target.value)}
                          placeholder="예: 10000"
                          className="w-full rounded-lg border px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                          만원
                        </span>
                      </div>
                    </div>
                    <span className="mt-6 text-muted-foreground">~</span>
                    <div className="flex-1">
                      <label
                        htmlFor="priceMax"
                        className="mb-1 block text-sm font-medium"
                      >
                        최대 가격
                      </label>
                      <div className="relative">
                        <input
                          id="priceMax"
                          type="number"
                          value={priceMax}
                          onChange={(e) => setPriceMax(e.target.value)}
                          placeholder="예: 50000"
                          className="w-full rounded-lg border px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                          만원
                        </span>
                      </div>
                    </div>
                  </div>
                  {priceMin && priceMax && (
                    <p className="mt-3 text-sm text-muted-foreground">
                      {Number(priceMin).toLocaleString()}만원 ~ {Number(priceMax).toLocaleString()}만원
                    </p>
                  )}
                </div>

                {/* 공고 키워드 */}
                <div className="rounded-lg border bg-card p-6">
                  <h2 className="mb-1 text-lg font-bold">공고 키워드</h2>
                  <p className="mb-4 text-sm text-muted-foreground">
                    관심 있는 공고 유형의 키워드를 선택하세요.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {SAMPLE_KEYWORDS.map((keyword) => (
                      <button
                        key={keyword}
                        onClick={() => toggleKeyword(keyword)}
                        className={`rounded-full border px-4 py-2 text-sm transition-colors ${
                          selectedKeywords.includes(keyword)
                            ? "border-primary bg-primary/10 text-primary font-medium"
                            : "border-gray-200 bg-white text-muted-foreground hover:border-gray-300"
                        }`}
                      >
                        {keyword}
                      </button>
                    ))}
                  </div>
                  {selectedKeywords.length > 0 && (
                    <p className="mt-3 text-sm text-muted-foreground">
                      {selectedKeywords.length}개 키워드 선택됨
                    </p>
                  )}
                </div>

                {/* 에러/성공 메시지 */}
                {prefError && (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                    {prefError}
                  </div>
                )}
                {prefSuccess && (
                  <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
                    {prefSuccess}
                  </div>
                )}

                {/* 저장 버튼 */}
                <div className="flex justify-end">
                  <button
                    onClick={savePreference}
                    disabled={prefSaving}
                    className="rounded-lg bg-primary px-8 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                  >
                    {prefSaving ? "저장 중..." : "설정 저장"}
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* 알림 내역 탭 */}
        {activeTab === "history" && (
          <div>
            {notifLoading ? (
              <div className="flex justify-center py-20">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : notifError ? (
              <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
                <p className="font-medium text-red-800">{notifError}</p>
                <button
                  onClick={() => fetchNotifications(notifPage)}
                  className="mt-3 text-sm text-red-600 underline hover:text-red-800"
                >
                  다시 시도
                </button>
              </div>
            ) : notifications.length === 0 ? (
              <div className="rounded-lg border bg-card p-12 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-muted-foreground"
                  >
                    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
                  </svg>
                </div>
                <h3 className="mb-2 text-lg font-semibold">알림이 없습니다</h3>
                <p className="text-sm text-muted-foreground">
                  알림 설정을 완료하면 관심 지역의 새 공고, 실거래가 변동 등을
                  알려드립니다.
                </p>
                <button
                  onClick={() => setActiveTab("preferences")}
                  className="mt-4 text-sm font-medium text-primary hover:underline"
                >
                  알림 설정하러 가기
                </button>
              </div>
            ) : (
              <>
                {/* 전체 읽음 버튼 */}
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    총 {notifTotal}개의 알림
                  </p>
                  <button
                    onClick={markAllAsRead}
                    className="text-sm text-primary hover:underline"
                  >
                    전체 읽음 처리
                  </button>
                </div>

                {/* 알림 목록 */}
                <div className="space-y-3">
                  {notifications.map((notif) => {
                    const notifType = notif.type as NotificationType;
                    const href = getNotificationHref(notif);
                    const baseClassName = `block cursor-pointer rounded-lg border p-4 transition-colors ${
                      notif.readAt
                        ? "bg-card"
                        : "border-primary/20 bg-primary/5"
                    }`;
                    const content = (
                      <>
                        <div className="mb-2 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {!notif.readAt && (
                              <span className="h-2 w-2 rounded-full bg-primary" />
                            )}
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                NOTIFICATION_TYPE_COLORS[notifType] ??
                                "bg-gray-100 text-gray-700"
                              }`}
                            >
                              {NOTIFICATION_TYPE_LABELS[notifType] ?? notif.type}
                            </span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {formatKoreanDateTime(notif.createdAt)}
                          </span>
                        </div>
                        <h3 className="mb-1 font-medium">{notif.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {notif.message}
                        </p>
                      </>
                    );

                    const handleClick = () => {
                      if (!notif.readAt) void markAsRead(notif.id);
                    };

                    if (href) {
                      return (
                        <Link
                          key={notif.id}
                          href={href}
                          onClick={handleClick}
                          className={baseClassName}
                        >
                          {content}
                        </Link>
                      );
                    }

                    return (
                      <div
                        key={notif.id}
                        onClick={handleClick}
                        className={baseClassName}
                      >
                        {content}
                      </div>
                    );
                  })}
                </div>

                {/* 페이지네이션 */}
                {totalPages > 1 && (
                  <div className="mt-6 flex items-center justify-center gap-2">
                    <button
                      onClick={() => setNotifPage((p) => Math.max(1, p - 1))}
                      disabled={notifPage === 1}
                      className="rounded-md border px-3 py-1.5 text-sm disabled:opacity-50"
                    >
                      이전
                    </button>
                    <span className="text-sm text-muted-foreground">
                      {notifPage} / {totalPages}
                    </span>
                    <button
                      onClick={() => setNotifPage((p) => Math.min(totalPages, p + 1))}
                      disabled={notifPage === totalPages}
                      className="rounded-md border px-3 py-1.5 text-sm disabled:opacity-50"
                    >
                      다음
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
