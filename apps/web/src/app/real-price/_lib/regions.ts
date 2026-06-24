export interface Region {
  code: string;
  name: string;
}

export const REGIONS: Region[] = [
  { code: "11110", name: "서울 종로구" },
  { code: "11140", name: "서울 중구" },
  { code: "11170", name: "서울 용산구" },
  { code: "11200", name: "서울 성동구" },
  { code: "11215", name: "서울 광진구" },
  { code: "11230", name: "서울 동대문구" },
  { code: "11260", name: "서울 중랑구" },
  { code: "11290", name: "서울 성북구" },
  { code: "11305", name: "서울 강북구" },
  { code: "11320", name: "서울 도봉구" },
  { code: "11350", name: "서울 노원구" },
  { code: "11380", name: "서울 은평구" },
  { code: "11410", name: "서울 서대문구" },
  { code: "11440", name: "서울 마포구" },
  { code: "11470", name: "서울 양천구" },
  { code: "11500", name: "서울 강서구" },
  { code: "11530", name: "서울 구로구" },
  { code: "11545", name: "서울 금천구" },
  { code: "11560", name: "서울 영등포구" },
  { code: "11590", name: "서울 동작구" },
  { code: "11620", name: "서울 관악구" },
  { code: "11650", name: "서울 서초구" },
  { code: "11680", name: "서울 강남구" },
  { code: "11710", name: "서울 송파구" },
  { code: "11740", name: "서울 강동구" },
  { code: "41111", name: "경기 수원시 장안구" },
  { code: "41113", name: "경기 수원시 권선구" },
  { code: "41115", name: "경기 수원시 팔달구" },
  { code: "41117", name: "경기 수원시 영통구" },
  { code: "41131", name: "경기 성남시 수정구" },
  { code: "41133", name: "경기 성남시 중원구" },
  { code: "41135", name: "경기 성남시 분당구" },
  { code: "41281", name: "경기 고양시 덕양구" },
  { code: "41285", name: "경기 고양시 일산동구" },
  { code: "41287", name: "경기 고양시 일산서구" },
  { code: "41390", name: "경기 화성시" },
  { code: "41410", name: "경기 파주시" },
  { code: "41461", name: "경기 용인시 처인구" },
  { code: "41463", name: "경기 용인시 기흥구" },
  { code: "41465", name: "경기 용인시 수지구" },
  { code: "41480", name: "경기 김포시" },
  { code: "28110", name: "인천 중구" },
  { code: "28140", name: "인천 동구" },
  { code: "28177", name: "인천 미추홀구" },
  { code: "28185", name: "인천 연수구" },
  { code: "28200", name: "인천 남동구" },
  { code: "28237", name: "인천 부평구" },
  { code: "28245", name: "인천 계양구" },
  { code: "28260", name: "인천 서구" },
  { code: "26110", name: "부산 중구" },
  { code: "26140", name: "부산 서구" },
  { code: "26170", name: "부산 동구" },
  { code: "26200", name: "부산 영도구" },
  { code: "26230", name: "부산 부산진구" },
  { code: "26260", name: "부산 동래구" },
  { code: "26290", name: "부산 남구" },
  { code: "26320", name: "부산 북구" },
  { code: "26350", name: "부산 해운대구" },
  { code: "26380", name: "부산 사하구" },
  { code: "26410", name: "부산 금정구" },
  { code: "26440", name: "부산 강서구" },
  { code: "26470", name: "부산 연제구" },
  { code: "26500", name: "부산 수영구" },
  { code: "26530", name: "부산 사상구" },
  { code: "26710", name: "부산 기장군" },
];

export const SUPPORTED_SIDO = ["서울", "경기", "인천", "부산"] as const;

export const SUPPORTED_REGION_LABEL = "수도권·부산";

// 오타로 0건이 나오는 경우도 동일 안내가 합리적이므로 시도명 정밀 매칭은 생략한다.
export function isUnsupportedRegionQuery(
  query: string,
  filteredCount: number,
): boolean {
  return query.trim().length > 0 && filteredCount === 0;
}
