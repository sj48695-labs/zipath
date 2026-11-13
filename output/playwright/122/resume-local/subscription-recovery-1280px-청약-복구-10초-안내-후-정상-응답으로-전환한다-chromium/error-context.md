# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: subscription-recovery.spec.ts >> 1280px 청약 복구 >> 10초 안내 후 정상 응답으로 전환한다
- Location: apps/web-e2e/tests/subscription-recovery.spec.ts:54:9

# Error details

```
Test timeout of 30000ms exceeded.
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - generic [ref=e3]:
      - generic [ref=e5]:
        - generic [ref=e6]: 법적 고지
        - paragraph [ref=e7]: 참고용이며 법적 효력 없음. 실제 계약, 청약, 대출 판단 전에는 반드시 공식 문서와 담당 기관 안내를 확인하세요.
      - banner [ref=e8]:
        - generic [ref=e9]:
          - link "Zipath" [ref=e10] [cursor=pointer]:
            - /url: /
          - navigation [ref=e11]:
            - generic [ref=e12]:
              - link "청약" [ref=e13] [cursor=pointer]:
                - /url: /subscription
              - link "대출" [ref=e14] [cursor=pointer]:
                - /url: /loan
              - link "체크리스트" [ref=e15] [cursor=pointer]:
                - /url: /checklist
              - link "실거래가" [ref=e16] [cursor=pointer]:
                - /url: /real-price
    - main [ref=e17]:
      - heading "청약 자격 시뮬레이션" [level=1] [ref=e18]
      - paragraph [ref=e19]: 기본 정보를 입력하면 청약 가능 여부와 예상 가점을 확인할 수 있어요.
      - generic [ref=e20]:
        - generic [ref=e21]:
          - generic [ref=e22]:
            - generic [ref=e23]: 나이
            - spinbutton [ref=e24]: "31"
          - generic [ref=e25]:
            - generic [ref=e26]: 연소득 (만원)
            - spinbutton [ref=e27]: "4500"
          - generic [ref=e28]:
            - generic [ref=e29]: 무주택 기간 (개월)
            - spinbutton [ref=e30]: "24"
          - generic [ref=e31]:
            - generic [ref=e32]: 부양가족 수
            - spinbutton [ref=e33]: "2"
          - generic [ref=e34]:
            - generic [ref=e35]: 청약통장 가입기간 (개월)
            - spinbutton [ref=e36]: "36"
        - generic [ref=e37]:
          - generic [ref=e38]:
            - checkbox "혼인 상태" [checked] [ref=e39]
            - text: 혼인 상태
          - generic [ref=e40]:
            - checkbox "생애최초 주택 구입" [checked] [ref=e41]
            - text: 생애최초 주택 구입
        - button "자격 확인하기" [ref=e42] [cursor=pointer]
      - generic [ref=e43]:
        - generic [ref=e44]:
          - heading "청약 자격 확인 결과" [level=2] [ref=e45]
          - generic [ref=e47]:
            - generic [ref=e48]:
              - generic [ref=e49]: 일반공급
              - generic [ref=e50]: 가능
            - paragraph [ref=e51]: 테스트용 자격 결과
        - generic [ref=e52]:
          - 'heading "예상 가점: 4점 / 84점" [level=2] [ref=e53]'
          - generic [ref=e55]:
            - generic [ref=e56]:
              - generic [ref=e57]: 무주택 기간
              - generic [ref=e58]: 4 / 32점
            - paragraph [ref=e61]: 테스트용 가점
        - paragraph [ref=e62]: "* 가점은 참고용이며 실제 청약 시 청약통장 가입기간, 납입 횟수 등에 따라 달라질 수 있습니다."
      - paragraph [ref=e63]: "* 본 시뮬레이션 결과는 참고용이며 법적 효력이 없습니다."
  - alert [ref=e64]
  - generic [ref=e66]:
    - paragraph [ref=e67]:
      - text: 이 사이트는 서비스 개선과 광고를 위해 쿠키를 사용합니다.
      - link "개인정보처리방침" [ref=e68] [cursor=pointer]:
        - /url: /privacy
    - button "동의" [ref=e69] [cursor=pointer]
```