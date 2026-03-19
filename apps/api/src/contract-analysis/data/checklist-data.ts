/**
 * 계약서 분석 체크리스트 데이터
 * 월세/전세/매매 계약 전 확인해야 할 항목과 상세 설명
 */

type ContractType = "월세" | "전세" | "매매";

interface ChecklistItemData {
  id: string;
  category: string;
  title: string;
  description: string;
  why: string;
  isRequired: boolean;
  tip?: string;
}

interface ContractChecklist {
  contractType: ContractType;
  title: string;
  description: string;
  items: ChecklistItemData[];
}

const WOLSE_CHECKLIST: ContractChecklist = {
  contractType: "월세",
  title: "월세 계약 체크리스트",
  description:
    "월세 계약 전 반드시 확인해야 할 항목들입니다. 하나씩 체크하며 안전한 계약을 준비하세요.",
  items: [
    {
      id: "wolse-01",
      category: "서류 확인",
      title: "등기부등본 확인",
      description:
        "등기부등본의 갑구(소유권)와 을구(근저당 등)를 확인합니다. 실제 소유자가 계약 상대방과 일치하는지, 가압류나 압류가 없는지 확인하세요.",
      why: "등기부등본을 확인하지 않으면 실제 소유자가 아닌 사람과 계약하거나, 경매로 넘어갈 위험이 있는 집에 계약할 수 있습니다.",
      isRequired: true,
      tip: "인터넷등기소(iros.go.kr)에서 열람 가능합니다. 계약 당일 다시 확인하세요.",
    },
    {
      id: "wolse-02",
      category: "서류 확인",
      title: "건축물대장 확인",
      description:
        "건축물의 용도, 면적, 불법건축물 여부를 확인합니다. 등기부등본과 면적이 일치하는지 비교하세요.",
      why: "불법건축물인 경우 전입신고가 불가능할 수 있고, 대항력을 갖추지 못해 보증금을 보호받지 못할 수 있습니다.",
      isRequired: true,
      tip: "정부24(gov.kr)에서 무료 열람 가능합니다.",
    },
    {
      id: "wolse-03",
      category: "서류 확인",
      title: "임대인 신분증 확인",
      description:
        "계약 상대방이 등기부등본 상 소유자 본인인지 신분증으로 확인합니다. 대리인인 경우 위임장과 인감증명서를 요구하세요.",
      why: "소유자가 아닌 사람과 계약하면 법적 보호를 받지 못합니다.",
      isRequired: true,
    },
    {
      id: "wolse-04",
      category: "현장 확인",
      title: "수도/전기/가스 작동 확인",
      description:
        "수도, 전기, 가스가 정상적으로 작동하는지 직접 확인합니다. 온수도 나오는지 체크하세요.",
      why: "입주 후 수리가 필요한 경우 비용 부담 주체를 놓고 분쟁이 생길 수 있습니다.",
      isRequired: true,
      tip: "방문 시 모든 수도꼭지, 전등 스위치, 가스레인지를 직접 작동해보세요.",
    },
    {
      id: "wolse-05",
      category: "현장 확인",
      title: "곰팡이/누수 흔적 확인",
      description:
        "벽면, 천장, 창문 주변에 곰팡이나 누수 흔적이 없는지 확인합니다. 특히 겨울철에는 결로 여부도 체크하세요.",
      why: "곰팡이와 누수는 건강에 해로우며, 입주 후 발견하면 해결이 어렵습니다.",
      isRequired: true,
    },
    {
      id: "wolse-06",
      category: "현장 확인",
      title: "방음 상태 확인",
      description:
        "층간소음, 외부 소음 정도를 확인합니다. 가능하면 낮/밤 시간대에 각각 방문해보세요.",
      why: "소음 문제는 거주 만족도에 큰 영향을 미치지만, 계약 후 해결이 어렵습니다.",
      isRequired: false,
      tip: "평일 저녁이나 주말에 방문하면 실제 거주 환경을 더 잘 파악할 수 있습니다.",
    },
    {
      id: "wolse-07",
      category: "계약 조건",
      title: "보증금 및 월세 금액 확인",
      description:
        "보증금과 월세 금액이 주변 시세와 비교하여 적정한지 확인합니다. 계약서에 정확한 금액이 기재되었는지 확인하세요.",
      why: "시세보다 지나치게 저렴한 경우 사기일 수 있고, 비싼 경우 손해를 볼 수 있습니다.",
      isRequired: true,
      tip: "국토부 실거래가 공개시스템에서 주변 시세를 확인하세요.",
    },
    {
      id: "wolse-08",
      category: "계약 조건",
      title: "관리비 포함 항목 확인",
      description:
        "관리비에 포함되는 항목(수도, 인터넷, 주차 등)과 별도 부과 항목을 확인합니다.",
      why: "관리비 포함 항목에 따라 실제 월 지출이 크게 달라질 수 있습니다.",
      isRequired: true,
    },
    {
      id: "wolse-09",
      category: "계약 조건",
      title: "계약 기간 및 갱신 조건 확인",
      description:
        "계약 기간(보통 2년)과 만료 후 갱신 조건을 확인합니다. 임대차 3법에 따라 계약갱신청구권(2+2년)이 보장됩니다.",
      why: "계약 기간과 갱신 조건을 명확히 해야 나중에 분쟁을 예방할 수 있습니다.",
      isRequired: true,
    },
    {
      id: "wolse-10",
      category: "계약 조건",
      title: "특약사항 기재",
      description:
        "원상복구 범위, 도배/장판 상태, 반려동물 가능 여부, 수리 비용 부담 등을 특약으로 기재합니다.",
      why: "구두 약속은 법적 효력이 약합니다. 중요한 약속은 반드시 계약서에 특약으로 넣으세요.",
      isRequired: false,
      tip: "\"입주 전 도배·장판 교체\", \"에어컨 잔존\" 등 구체적으로 작성하세요.",
    },
    {
      id: "wolse-11",
      category: "입주 후",
      title: "전입신고 즉시 진행",
      description:
        "입주 당일 주민센터에서 전입신고를 합니다. 전입신고를 해야 대항력이 발생합니다.",
      why: "전입신고를 미루면 그 기간 동안 보증금이 보호받지 못합니다.",
      isRequired: true,
      tip: "이사 당일 바로 전입신고하세요. 대항력은 다음날 0시부터 발생합니다.",
    },
    {
      id: "wolse-12",
      category: "입주 후",
      title: "확정일자 받기",
      description:
        "전입신고 시 함께 확정일자를 받습니다. 확정일자가 있어야 경매 시 보증금을 우선변제받을 수 있습니다.",
      why: "확정일자 없이는 경매 시 보증금을 돌려받기 어렵습니다.",
      isRequired: true,
      tip: "주민센터에서 전입신고와 동시에 확정일자를 받을 수 있습니다 (수수료 600원).",
    },
  ],
};

const JEONSE_CHECKLIST: ContractChecklist = {
  contractType: "전세",
  title: "전세 계약 체크리스트",
  description:
    "전세 계약은 큰 보증금이 걸려있어 더욱 신중해야 합니다. 전세사기 예방을 위해 꼼꼼히 확인하세요.",
  items: [
    {
      id: "jeonse-01",
      category: "서류 확인",
      title: "등기부등본 확인 (갑구/을구)",
      description:
        "갑구에서 소유자와 가압류/가처분을, 을구에서 근저당 설정액을 확인합니다. 근저당 + 전세보증금이 집값의 70%를 넘으면 위험합니다.",
      why: "근저당이 과도하면 깡통전세(집값 < 보증금+대출)가 되어 보증금을 돌려받지 못할 수 있습니다.",
      isRequired: true,
      tip: "계약 당일에도 반드시 다시 확인하세요. 하루 사이에 근저당이 추가될 수 있습니다.",
    },
    {
      id: "jeonse-02",
      category: "서류 확인",
      title: "건축물대장 확인",
      description:
        "건축물의 용도와 면적, 불법건축물 여부를 확인합니다. 등기부등본과 면적이 다르면 문제가 있을 수 있습니다.",
      why: "불법건축물이면 전입신고가 불가능하고, 전세보증보험 가입도 거절됩니다.",
      isRequired: true,
    },
    {
      id: "jeonse-03",
      category: "서류 확인",
      title: "임대인 신분증 및 인감증명서 확인",
      description:
        "소유자 본인인지 확인하고, 인감증명서를 받아둡니다. 대리인인 경우 위임장 + 소유자 인감증명서가 필요합니다.",
      why: "전세사기의 상당수가 가짜 소유자에 의해 발생합니다.",
      isRequired: true,
    },
    {
      id: "jeonse-04",
      category: "서류 확인",
      title: "국세/지방세 완납증명서 확인",
      description:
        "임대인의 국세/지방세 체납 여부를 확인합니다. 세금 체납이 있으면 해당 부동산이 압류될 수 있습니다.",
      why: "세금 체납 시 국세가 전세보증금보다 우선하여 배당받아, 보증금을 돌려받지 못할 수 있습니다.",
      isRequired: true,
      tip: "임대인에게 직접 요청하여 발급받으세요.",
    },
    {
      id: "jeonse-05",
      category: "안전장치",
      title: "전세보증보험 가입 가능 여부 확인",
      description:
        "HUG(주택도시보증공사) 또는 SGI서울보증의 전세보증금반환보증 가입이 가능한지 사전에 확인합니다.",
      why: "전세보증보험에 가입하면 임대인이 보증금을 돌려주지 않아도 보험사가 대신 반환해줍니다.",
      isRequired: true,
      tip: "HUG 홈페이지에서 사전 심사가 가능합니다. 계약 전에 반드시 확인하세요.",
    },
    {
      id: "jeonse-06",
      category: "안전장치",
      title: "전세가율 확인 (70% 이하 권장)",
      description:
        "전세보증금이 집값(시세)의 몇 퍼센트인지 확인합니다. 70%를 넘으면 깡통전세 위험이 높아집니다.",
      why: "전세가율이 높으면 집값이 하락했을 때 보증금을 돌려받지 못할 위험이 커집니다.",
      isRequired: true,
      tip: "KB시세나 국토부 실거래가를 기준으로 확인하세요.",
    },
    {
      id: "jeonse-07",
      category: "현장 확인",
      title: "주택 상태 점검",
      description:
        "누수, 결로, 곰팡이, 수도/전기/가스 작동 상태, 보일러 상태를 직접 확인합니다.",
      why: "전세는 장기 거주이므로 주택 상태가 생활 만족도에 큰 영향을 미칩니다.",
      isRequired: true,
    },
    {
      id: "jeonse-08",
      category: "계약 조건",
      title: "보증금 반환 조건 확인",
      description:
        "계약 만료 시 보증금 반환 시기와 방법을 명확히 합니다. 보증금 반환이 지연될 경우의 이자/위약금도 확인하세요.",
      why: "보증금 반환 분쟁은 전세 계약에서 가장 흔한 문제입니다.",
      isRequired: true,
    },
    {
      id: "jeonse-09",
      category: "계약 조건",
      title: "계약갱신청구권 안내 확인",
      description:
        "임대차 3법에 따라 1회 계약갱신청구권이 보장됩니다 (최대 4년 거주). 갱신 시 보증금 인상은 5% 이내로 제한됩니다.",
      why: "계약갱신청구권을 모르면 2년 후 부당하게 퇴거당할 수 있습니다.",
      isRequired: true,
    },
    {
      id: "jeonse-10",
      category: "입주 후",
      title: "전입신고 + 확정일자 즉시 진행",
      description:
        "입주 당일 전입신고와 확정일자를 반드시 받습니다. 이것이 보증금 보호의 핵심입니다.",
      why: "전입신고 + 확정일자가 없으면 경매 시 보증금을 우선변제받을 수 없습니다.",
      isRequired: true,
      tip: "잔금 지급일과 전입신고일을 같은 날로 맞추세요. 잔금보다 먼저 전입신고하면 더 안전합니다.",
    },
    {
      id: "jeonse-11",
      category: "입주 후",
      title: "전세권 설정 등기 검토",
      description:
        "전세권 설정 등기를 하면 확정일자보다 더 강력한 보호를 받을 수 있습니다. 임대인 동의가 필요합니다.",
      why: "전세권 설정 시 임대인 동의 없이도 경매 시 보증금을 우선 돌려받을 수 있습니다.",
      isRequired: false,
      tip: "전세권 설정 비용은 보증금의 약 0.2~0.4% 정도입니다.",
    },
  ],
};

const MAEMAE_CHECKLIST: ContractChecklist = {
  contractType: "매매",
  title: "매매 계약 체크리스트",
  description:
    "내 집 마련의 첫걸음! 매매 계약은 금액이 크므로 모든 항목을 꼼꼼히 확인하세요.",
  items: [
    {
      id: "maemae-01",
      category: "서류 확인",
      title: "등기부등본 확인 (소유권/근저당/가압류)",
      description:
        "갑구에서 소유자와 권리 제한(가압류, 가처분 등)을, 을구에서 근저당 설정액을 확인합니다. 잔금 시까지 권리 변동이 없는지 확인하세요.",
      why: "등기부등본 미확인 시 소유권 분쟁이나 숨겨진 채무에 휘말릴 수 있습니다.",
      isRequired: true,
      tip: "계약일, 중도금 납부일, 잔금일에 각각 등기부등본을 확인하세요.",
    },
    {
      id: "maemae-02",
      category: "서류 확인",
      title: "건축물대장 확인 (용도/면적/위반)",
      description:
        "건축물의 용도, 면적, 위반건축물 여부를 확인합니다. 등기부등본 면적과 일치하는지 비교하세요.",
      why: "위반건축물은 이행강제금이 부과되거나, 대출이 제한될 수 있습니다.",
      isRequired: true,
    },
    {
      id: "maemae-03",
      category: "서류 확인",
      title: "토지이용계획확인서 확인",
      description:
        "토지의 용도지역, 용도지구, 도시계획시설 여부를 확인합니다. 향후 개발 제한이나 도로 편입 여부를 알 수 있습니다.",
      why: "도시계획도로에 편입된 토지는 건물이 철거될 수 있고, 용도지역에 따라 증축/개축이 제한됩니다.",
      isRequired: true,
      tip: "토지이음(eum.go.kr)에서 확인 가능합니다.",
    },
    {
      id: "maemae-04",
      category: "서류 확인",
      title: "매도인 신분증 및 인감증명서 확인",
      description:
        "매도인이 등기부등본 상 소유자 본인인지 확인합니다. 대리인인 경우 위임장 + 인감증명서가 필수입니다.",
      why: "본인 확인 없이 계약하면 무효가 될 수 있습니다.",
      isRequired: true,
    },
    {
      id: "maemae-05",
      category: "자금 계획",
      title: "대출 사전승인 확인",
      description:
        "은행에서 대출 사전승인(가승인)을 받아 실제 대출 가능 금액을 확인합니다. LTV, DSR 규제를 고려해야 합니다.",
      why: "계약 후 대출이 안 나오면 잔금을 치르지 못해 계약금을 잃을 수 있습니다.",
      isRequired: true,
      tip: "여러 은행에 사전 상담하여 금리와 한도를 비교하세요.",
    },
    {
      id: "maemae-06",
      category: "자금 계획",
      title: "취득세 및 부대비용 계산",
      description:
        "취득세(1~3%), 중개수수료, 법무사 비용, 이사비 등 부대비용을 미리 계산합니다.",
      why: "부대비용을 간과하면 자금 부족으로 잔금 납부에 차질이 생길 수 있습니다.",
      isRequired: true,
      tip: "1주택자 6억 이하: 취득세 1%, 6~9억: 1~3%, 9억 초과: 3%",
    },
    {
      id: "maemae-07",
      category: "현장 확인",
      title: "주택 내부 상태 점검",
      description:
        "벽면 균열, 누수, 곰팡이, 배관 상태, 창호 상태 등을 직접 확인합니다.",
      why: "매매 후 하자 보수는 원칙적으로 매수인 부담이므로 사전에 확인해야 합니다.",
      isRequired: true,
    },
    {
      id: "maemae-08",
      category: "현장 확인",
      title: "주변 환경 및 소음 확인",
      description:
        "교통, 편의시설, 학군, 소음, 일조량 등 주변 환경을 확인합니다.",
      why: "주변 환경은 거주 만족도와 향후 집값에 큰 영향을 미칩니다.",
      isRequired: false,
      tip: "평일/주말, 낮/밤 각각 방문하여 환경을 직접 확인하세요.",
    },
    {
      id: "maemae-09",
      category: "계약 조건",
      title: "계약금/중도금/잔금 일정 확인",
      description:
        "계약금(보통 10%), 중도금, 잔금 납부 일정과 금액을 명확히 합니다. 각 일정을 계약서에 기재합니다.",
      why: "일정이 불명확하면 계약 불이행 분쟁이 발생할 수 있습니다.",
      isRequired: true,
    },
    {
      id: "maemae-10",
      category: "계약 조건",
      title: "소유권 이전 등기 일정 확인",
      description:
        "잔금 납부 후 소유권 이전 등기를 언제까지 완료할지 확인합니다. 보통 잔금일에 바로 진행합니다.",
      why: "소유권 이전이 지연되면 매도인이 중간에 다른 사람에게 매도하거나 근저당을 설정할 위험이 있습니다.",
      isRequired: true,
      tip: "잔금일에 법무사가 즉시 등기 신청하도록 미리 준비하세요.",
    },
    {
      id: "maemae-11",
      category: "계약 조건",
      title: "하자 보수 책임 범위 확인",
      description:
        "기존 하자에 대한 보수 책임, 입주 후 발견된 하자의 처리 방법을 특약으로 정합니다.",
      why: "하자 보수 책임이 불명확하면 입주 후 수리비 분쟁이 발생합니다.",
      isRequired: false,
      tip: "\"잔금 전까지 발견된 하자는 매도인이 보수\" 등의 특약을 넣으세요.",
    },
    {
      id: "maemae-12",
      category: "계약 조건",
      title: "세입자 확인 (임차인이 있는 경우)",
      description:
        "기존 세입자가 있는 경우, 보증금 반환 의무 승계 여부와 퇴거 일정을 확인합니다.",
      why: "세입자의 보증금 반환 의무를 모르고 매수하면 예상치 못한 비용이 발생합니다.",
      isRequired: true,
      tip: "세입자의 전입일, 확정일자, 보증금 금액을 반드시 확인하세요.",
    },
  ],
};

export const CHECKLIST_DATA: Record<string, ContractChecklist> = {
  월세: WOLSE_CHECKLIST,
  전세: JEONSE_CHECKLIST,
  매매: MAEMAE_CHECKLIST,
};

export const CONTRACT_TYPES = Object.keys(CHECKLIST_DATA);
