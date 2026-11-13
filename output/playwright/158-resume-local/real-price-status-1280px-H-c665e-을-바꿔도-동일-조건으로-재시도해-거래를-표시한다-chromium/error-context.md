# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: real-price-status.spec.ts >> 1280px >> HTTP 오류 후 입력을 바꿔도 동일 조건으로 재시도해 거래를 표시한다
- Location: tests/real-price-status.spec.ts:63:9

# Error details

```
Error: browserType.launch: Executable doesn't exist at /Users/sujeong/Library/Caches/ms-playwright/chromium_headless_shell-1223/chrome-headless-shell-mac-arm64/chrome-headless-shell
╔════════════════════════════════════════════════════════════╗
║ Looks like Playwright was just installed or updated.       ║
║ Please run the following command to download new browsers: ║
║                                                            ║
║     npx playwright install                                 ║
║                                                            ║
║ <3 Playwright Team                                         ║
╚════════════════════════════════════════════════════════════╝
```
