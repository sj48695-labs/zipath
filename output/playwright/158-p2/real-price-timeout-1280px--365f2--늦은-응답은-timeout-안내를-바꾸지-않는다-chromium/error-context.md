# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: real-price-timeout.spec.ts >> 1280px >> 45초 timeout 뒤 늦은 응답은 timeout 안내를 바꾸지 않는다
- Location: tests/real-price-timeout.spec.ts:13:11

# Error details

```
Error: clock.pauseAt: Error: Cannot fast-forward to the past
    at ClockController._innerFastForwardTo (eval at evaluate (:302:30), <anonymous>:201:13)
    at ClockController.pauseAt (eval at evaluate (:302:30), <anonymous>:132:16)
    at async <anonymous>:328:30
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - banner [ref=e3]:
      - generic [ref=e4]:
        - link "Zipath" [ref=e5] [cursor=pointer]:
          - /url: /
        - navigation [ref=e6]:
          - link "청약" [ref=e7] [cursor=pointer]:
            - /url: /subscription
          - link "대출" [ref=e8] [cursor=pointer]:
            - /url: /loan
          - link "체크리스트" [ref=e9] [cursor=pointer]:
            - /url: /checklist
    - main [ref=e10]:
      - generic [ref=e11]:
        - heading "실거래가 조회" [level=1] [ref=e12]
        - link "지역 간 비교 →" [ref=e13] [cursor=pointer]:
          - /url: /real-price/compare
      - paragraph [ref=e14]: 국토교통부 아파트 매매 실거래가 데이터를 조회합니다.
      - generic [ref=e15]:
        - button "테이블" [ref=e16] [cursor=pointer]
        - button "차트" [ref=e17] [cursor=pointer]
        - button "월별 추이" [ref=e18] [cursor=pointer]
      - generic [ref=e19]:
        - generic [ref=e20]:
          - generic [ref=e21]: 지역
          - combobox [ref=e22]:
            - option "서울 종로구"
            - option "서울 중구"
            - option "서울 용산구"
            - option "서울 성동구"
            - option "서울 광진구"
            - option "서울 동대문구"
            - option "서울 중랑구"
            - option "서울 성북구"
            - option "서울 강북구"
            - option "서울 도봉구"
            - option "서울 노원구"
            - option "서울 은평구"
            - option "서울 서대문구"
            - option "서울 마포구"
            - option "서울 양천구"
            - option "서울 강서구"
            - option "서울 구로구"
            - option "서울 금천구"
            - option "서울 영등포구"
            - option "서울 동작구"
            - option "서울 관악구"
            - option "서울 서초구"
            - option "서울 강남구" [selected]
            - option "서울 송파구"
            - option "서울 강동구"
            - option "경기 수원시 장안구"
            - option "경기 수원시 권선구"
            - option "경기 수원시 팔달구"
            - option "경기 수원시 영통구"
            - option "경기 성남시 수정구"
            - option "경기 성남시 중원구"
            - option "경기 성남시 분당구"
            - option "경기 고양시 덕양구"
            - option "경기 고양시 일산동구"
            - option "경기 고양시 일산서구"
            - option "경기 화성시"
            - option "경기 파주시"
            - option "경기 용인시 처인구"
            - option "경기 용인시 기흥구"
            - option "경기 용인시 수지구"
            - option "경기 김포시"
            - option "인천 중구"
            - option "인천 동구"
            - option "인천 미추홀구"
            - option "인천 연수구"
            - option "인천 남동구"
            - option "인천 부평구"
            - option "인천 계양구"
            - option "인천 서구"
            - option "부산 중구"
            - option "부산 서구"
            - option "부산 동구"
            - option "부산 영도구"
            - option "부산 부산진구"
            - option "부산 동래구"
            - option "부산 남구"
            - option "부산 북구"
            - option "부산 해운대구"
            - option "부산 사하구"
            - option "부산 금정구"
            - option "부산 강서구"
            - option "부산 연제구"
            - option "부산 수영구"
            - option "부산 사상구"
            - option "부산 기장군"
        - generic [ref=e23]:
          - generic [ref=e24]: 계약월
          - combobox [ref=e25]:
            - option "2026년 11월" [selected]
            - option "2026년 10월"
            - option "2026년 9월"
            - option "2026년 8월"
            - option "2026년 7월"
            - option "2026년 6월"
            - option "2026년 5월"
            - option "2026년 4월"
            - option "2026년 3월"
            - option "2026년 2월"
            - option "2026년 1월"
            - option "2025년 12월"
        - button "조회" [ref=e26] [cursor=pointer]
      - generic [ref=e28]:
        - heading "평형별 필터" [level=3] [ref=e29]
        - generic [ref=e30]:
          - button "전체" [ref=e31] [cursor=pointer]
          - button "~60㎡ (소형)" [ref=e32] [cursor=pointer]
          - button "60~85㎡ (중형)" [ref=e33] [cursor=pointer]
          - button "85~135㎡ (대형)" [ref=e34] [cursor=pointer]
          - button "135㎡~ (초대형)" [ref=e35] [cursor=pointer]
          - button "직접 입력" [ref=e36] [cursor=pointer]
  - alert [ref=e37]
```
