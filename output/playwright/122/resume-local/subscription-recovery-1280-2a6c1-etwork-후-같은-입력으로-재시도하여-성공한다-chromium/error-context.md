# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: subscription-recovery.spec.ts >> 1280px 청약 복구 >> network 후 같은 입력으로 재시도하여 성공한다
- Location: apps/web-e2e/tests/subscription-recovery.spec.ts:79:11

# Error details

```
Error: expect(locator).toContainText(expected) failed

Locator: getByRole('alert')
Expected substring: "네트워크 연결이 불안정해요"
Error: strict mode violation: getByRole('alert') resolved to 2 elements:
    1) <div role="alert" class="mt-8 rounded-lg border border-red-200 bg-red-50 p-6">…</div> aka getByText('네트워크 연결이 불안정해요인터넷 연결이 끊기거나 너무 불안정해서 요청을 완료하지 못했어요.Wi-Fi')
    2) <div role="alert" aria-live="assertive" id="__next-route-announcer__"></div> aka locator('[id="__next-route-announcer__"]')

Call log:
  - Expect "toContainText" with timeout 5000ms
  - waiting for getByRole('alert')

```

```
Error: Channel closed
```

```
Error: browserContext.close: Target page, context or browser has been closed
```