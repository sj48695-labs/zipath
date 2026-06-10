"use client";

import { useEffect, useState } from "react";

/**
 * 클라이언트 마운트 여부를 반환한다.
 *
 * SSR(서버 렌더)과 첫 클라이언트 렌더에서는 항상 `false`를 반환해
 * 두 결과가 일치하도록 보장한다. 마운트 이후(`useEffect` 실행 후)에만
 * `true`가 되므로, `new Date()`처럼 서버/클라이언트 값이 달라질 수 있는
 * 동적 데이터를 안전하게 렌더링할 때 사용한다.
 */
export function useIsClient(): boolean {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return isClient;
}
