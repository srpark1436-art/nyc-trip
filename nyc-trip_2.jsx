import { useState, useEffect } from "react";

const MEMO_KEY = "nyc-trip-memos-v1";
const loadMemos = () => {
  try { return JSON.parse(localStorage.getItem(MEMO_KEY)) || {}; } catch { return {}; }
};

const WEATHER_CODE = {
  0: { icon: "☀️", label: "맑음" },
  1: { icon: "🌤️", label: "대체로 맑음" },
  2: { icon: "⛅", label: "부분적 흐림" },
  3: { icon: "☁️", label: "흐림" },
  45: { icon: "🌫️", label: "안개" }, 48: { icon: "🌫️", label: "짙은 안개" },
  51: { icon: "🌦️", label: "이슬비" }, 53: { icon: "🌦️", label: "이슬비" }, 55: { icon: "🌦️", label: "이슬비" },
  61: { icon: "🌧️", label: "약한 비" }, 63: { icon: "🌧️", label: "비" }, 65: { icon: "🌧️", label: "강한 비" },
  71: { icon: "🌨️", label: "약한 눈" }, 73: { icon: "🌨️", label: "눈" }, 75: { icon: "❄️", label: "강한 눈" },
  80: { icon: "🌦️", label: "소나기" }, 81: { icon: "🌧️", label: "소나기" }, 82: { icon: "⛈️", label: "강한 소나기" },
  95: { icon: "⛈️", label: "뇌우" }, 96: { icon: "⛈️", label: "우박+뇌우" }, 99: { icon: "⛈️", label: "강한 뇌우" },
};
const wxInfo = (code) => WEATHER_CODE[code] || { icon: "🌡️", label: "—" };

const mapsUrl = (address, location) => {
  const q = encodeURIComponent(address || location || "");
  return `https://www.google.com/maps/search/?api=1&query=${q}`;
};
const directionsUrl = (address, location) => {
  const q = encodeURIComponent(address || location || "");
  return `https://www.google.com/maps/dir/?api=1&destination=${q}&travelmode=transit`;
};

const DAYS = [
  {
    date: "5월 14일", day: "목요일", title: "도착 & 첫 만남, 맨해튼", emoji: "✈️", accent: "#3b7dd8",
    events: [
      { time: "11:10", end: "12:00", title: "JFK 공항 도착", type: "transport", location: "John F. Kennedy International Airport", address: "Queens, NY 11430",
        description: "입국 심사 및 수하물 수취 (약 40~60분 소요)",
        photo: "https://images.unsplash.com/photo-1542296332-2e4473faf563?w=600&h=300&fit=crop",
        tip: "입국심사 후 Ground Transportation 표지판을 따라 나가세요",
        transit: null },
      { time: "12:30", end: "14:00", title: "JFK → 뉴저지 숙소 이동 (2명)", type: "transport", location: "Uber/Lyft 이용", address: "JFK → 5303 JFK Blvd East, West New York, NJ 07093",
        description: "⚡ 2명 이동 (나머지 1명은 별도 합류)\n\n🚗 Uber/Lyft (추천)\n• 예상 비용: $130~150 → 1인당 $65~75\n• 소요시간: 약 70~80분\n• Uber Reserve로 사전 예약 추천\n• JFK 터미널 밖 Ride App Pick Up 존에서 탑승",
        photo: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=600&h=300&fit=crop",
        tip: "2명이면 UberX로도 충분. 짐 넣고 편하게 이동하세요",
        transit: [
          { mode: "car", icon: "🚗", label: "Uber/Lyft (추천)", detail: "JFK → 숙소 직행 · 70~80분 · $130~150 (1인 $65~75)" },
          { mode: "bus", icon: "🚌", label: "대중교통 대안", detail: "AirTrain($8.25) → Jamaica Station → E train($2.90) → Penn Station → NJ Transit Bus 165/166($3.50) · 약 2시간 · $15/인" }
        ]},
      { time: "14:00", end: "15:30", title: "숙소 체크인 & 휴식", type: "rest", location: "숙소", address: "5303 JFK Blvd East, West New York, NJ 07093",
        description: "짐 풀고 간단히 정리.\nBoulevard East에서 맨해튼 스카이라인 조망!",
        photo: "https://images.unsplash.com/photo-1534430480872-3498386e7856?w=600&h=300&fit=crop",
        tip: "Boulevard East는 뉴욕 최고의 스카이라인 뷰 포인트 중 하나",
        transit: null },
      { time: "16:00", end: "17:00", title: "숙소 → 미드타운 이동", type: "transport", location: "158 직행 버스 또는 페리", address: "JFK Blvd East → Port Authority / W. 39th St",
        description: "🚌 가성비 1순위: NJ Transit 158번 직행 (환승 없음)\n⛴️ 뷰가 좋은 옵션: Port Imperial 페리 → W. 39th St",
        photo: "https://images.unsplash.com/photo-1518235506717-e1ed3306a89b?w=600&h=300&fit=crop",
        tip: "첫날엔 환승 없는 158번 직행 버스 추천!",
        transit: [
          { mode: "bus", icon: "🚌", label: "🟢 158번 직행 (추천)", detail: "숙소 앞 Blvd East 정류장 → Port Authority 42nd St\n약 25~35분 · $3.50 · Lincoln Tunnel 경유\n하차 후 타임스퀘어 도보 5분" },
          { mode: "ferry", icon: "⛴️", label: "페리 옵션 (뷰)", detail: "숙소 → Port Imperial(도보/Uber 8분) → 페리 8분 · $9\nW. 39th St 하차 후 타임스퀘어 도보 10분" },
          { mode: "car", icon: "🚗", label: "Uber 직행", detail: "숙소 → 타임스퀘어 · 약 15~25분 · $25~35 (1인 $8~12)" }
        ]},
      { time: "17:00", end: "18:30", title: "타임스퀘어 & 미드타운 산책", type: "sightseeing", location: "Times Square", address: "Broadway & 7th Ave, Manhattan, NY 10036",
        description: "첫날 뉴욕의 에너지를 느끼며 타임스퀘어 주변 산책.\n록펠러센터, 5번가도 근처에 있어요.",
        photo: "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=600&h=300&fit=crop",
        tip: "TKTS 부스에서 당일 브로드웨이 할인 티켓 체크!",
        transit: [
          { mode: "walk", icon: "🚶", label: "도보 산책", detail: "타임스퀘어 → 록펠러센터(도보 5분) → 5번가(도보 3분)" }
        ]},
      { time: "18:30", end: "19:45", title: "브라이언파크 맥주 한잔", type: "highlight", location: "The Porch at Bryant Park", address: "41 W 40th St, New York, NY 10018",
        description: "스트링 라이트 아래 나무 데크에서 맥주!\n크래프트 맥주, 위스키, 칵테일\n영업: 12:00~21:00\n\n🍺 도착 첫날 환영주 — 시차 풀고 가볍게!",
        photo: "https://thumbs.dreamstime.com/b/bryant-park-night-midtown-manhattan-new-york-city-147362561.jpg",
        tip: "그네 의자에 앉아 코파운더들과 도착 인사 + 일정 미팅 최적",
        transit: [
          { mode: "walk", icon: "🚶", label: "타임스퀘어 → Bryant Park", detail: "타임스퀘어 → 6th Ave & 40th St · 도보 약 7분" }
        ]},
      { time: "20:00", end: "20:45", title: "숙소 복귀", type: "transport", location: "미드타운 → 숙소", address: "Bryant Park → 5303 JFK Blvd East",
        description: "Bryant Park에서 숙소로 복귀.\n페리 W. 39th St이 가깝습니다 (도보 5분).",
        tip: "페리 또는 158번 직행 — 마지막 시간 확인",
        transit: [
          { mode: "ferry", icon: "⛴️", label: "페리 (가까움)", detail: "Bryant Park 도보 → W. 39th St 페리 터미널 (약 8분)\n→ Port Imperial · 8분 · $9 · 막차 시간 체크" },
          { mode: "bus", icon: "🚌", label: "🟢 158번 직행", detail: "Bryant Park 도보 → Port Authority (약 5분)\n→ 158번 → JFK Blvd East · 약 25~35분 · $3.50" },
          { mode: "car", icon: "🚗", label: "Uber/Lyft", detail: "미드타운 → 숙소 · 약 15~20분 · $25~35 (1인 $8~12)" }
        ]},
      { time: "20:00", end: "21:00", title: "Food Bazaar 장보기 (한남마트 옵션)", type: "food", location: "Food Bazaar Supermarket / 한남마트", address: "Bergenline Ave, West New York / Fort Lee, NJ",
        description: "🛒 Food Bazaar Supermarket (가까움 · 도보 가능)\n• 주소: 5901 Bergenline Ave, West New York, NJ\n• 숙소에서 도보 12~15분 또는 Uber 5분 ($6~9)\n• 영업: 보통 24시간 또는 ~24:00까지\n• 다국적 식료품 · 즉석 조리식 · 한국 라면도 일부 있음\n\n🇰🇷 한남마트 (Hannam Chain) - 한국 식재료 풀라인\n• 주소: 25 Lemoine Ave, Fort Lee, NJ 07024\n• 숙소에서 차량 12~18분 ($12~16)\n• 김치/반찬/즉석국/도시락/한국 빵\n• 한국 라면, 즉석밥, 컵밥 풍부\n\n💰 1인 $15~25 예산\n메뉴 추천: 즉석국+밥+반찬, 라면+김밥, 또는 즉석 회/도시락",
        photo: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&h=300&fit=crop",
        tip: "한국 음식 그리울 땐 한남마트, 빠르게 사고 싶으면 Food Bazaar!",
        transit: [
          { mode: "walk", icon: "🚶", label: "Food Bazaar 도보", detail: "숙소 → 5901 Bergenline Ave\n도보 12~15분 · 무료 · 짐 많으면 비추" },
          { mode: "car", icon: "🚗", label: "Food Bazaar Uber", detail: "숙소 → Food Bazaar 약 5분 · $6~9\n장보고 돌아올 때도 Uber 호출" },
          { mode: "car", icon: "🚗", label: "한남마트 Uber", detail: "숙소 → 한남마트 (Fort Lee) 약 12~18분\n$12~16 (편도) · 왕복 $25~32" },
          { mode: "bus", icon: "🚌", label: "한남마트 버스 대안", detail: "Bus 156 또는 158 (북쪽 방향) → Fort Lee\n환승 필요 · 약 30~40분 · 비추" }
        ]},
      { time: "21:00", end: "22:30", title: "🍺 숙소에서 맥주 타임", type: "highlight", location: "숙소", address: "5303 JFK Blvd East, West New York, NJ 07093",
        description: "첫날 도착 환영 맥주 타임!\nBoulevard East에서 맨해튼 스카이라인 야경 + 맥주.\n\n🍻 추천 안주\n• Food Bazaar에서 사 온 치즈/햄/올리브\n• 한국 라면 야식\n• 즉석 핫윙/감자튀김\n• 컵라면 + 맥주 클래식\n\n🍺 맥주 추천\n• 미국 크래프트 (Brooklyn Lager, Sam Adams)\n• 한국 (한남마트 가져온 카스/테라)\n• Mexican (Modelo, Corona)\n\n🌃 보너스: 서로 도착 인사 + 내일 일정 가볍게 확인",
        tip: "시차 적응 + 첫날 친목 + 야경 = 완벽한 마무리!",
        transit: null }
    ]
  },
  {
    date: "5월 15일", day: "금요일", title: "월스트리트 & 브루클린", emoji: "🗽", accent: "#c4863e",
    events: [
      { time: "09:30", end: "10:15", title: "페리로 월스트리트 직행", type: "highlight", location: "Port Imperial → Pier 11/Wall Street", address: "South St & Wall St, Manhattan",
        description: "유람선처럼 페리로 월스트리트 직행!\n• 소요시간: 약 25분 · 요금: 편도 $9\n• 허드슨 강 위에서 자유의 여신상 감상",
        photo: "https://images.unsplash.com/photo-1669221190861-beb5200a2ca5?w=600&h=300&fit=crop&auto=format",
        tip: "페리 우측 자리에 앉으면 자유의 여신상이 보입니다!",
        transit: [
          { mode: "bus", icon: "🚌", label: "숙소 → Port Imperial", detail: "NJ Transit Bus 158 탑승 (Boulevard East) · 약 10분" },
          { mode: "ferry", icon: "⛴️", label: "Port Imperial → Pier 11/Wall St", detail: "NY Waterway 페리 · 약 25분 · $9 · 평일 AM 운행" }
        ]},
      { time: "10:30", end: "12:30", title: "월스트리트 워킹 투어", type: "sightseeing", location: "Wall Street Financial District", address: "Wall St & Broad St, New York, NY 10005",
        description: "• Charging Bull (황소 동상) - Broadway & Morris St\n• Federal Hall - 26 Wall St\n• NYSE 외관 · Trinity Church\n• 9/11 Memorial & Museum ($29/인)",
        photo: "https://images.unsplash.com/photo-1747893062300-dd53c62893ef?w=600&h=300&fit=crop&auto=format",
        tip: "M&A 어드바이저로서 월가의 에너지를 직접 느껴보세요!",
        transit: [
          { mode: "walk", icon: "🚶", label: "Pier 11에서 도보", detail: "Pier 11 → Wall St 도보 2분 → Charging Bull 도보 5분\n→ Federal Hall & NYSE 도보 3분 → Trinity Church 도보 4분\n→ 9/11 Memorial 도보 10분 (원하면)" }
        ]},
      { time: "13:00", end: "14:30", title: "Stone Street 점심", type: "food", location: "Stone Street Historic District", address: "Stone St, New York, NY 10004",
        description: "역사적인 자갈길 레스토랑 거리.\nAdrienne's Pizzabar, The Growler 등.",
        photo: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&h=300&fit=crop",
        tip: "5월 날씨에 야외 테이블이 최고!",
        transit: [
          { mode: "walk", icon: "🚶", label: "Wall St에서 도보", detail: "Wall St → Stone St · 도보 3분 · Hanover Square 방향" }
        ]},
      { time: "15:00", end: "16:00", title: "브루클린 브릿지 도보 횡단", type: "sightseeing", location: "Brooklyn Bridge", address: "Brooklyn Bridge, New York, NY 10038",
        description: "맨해튼 → 브루클린 방향으로 도보 횡단\n약 30~40분 소요",
        photo: "https://commons.wikimedia.org/wiki/Special:FilePath/Brooklyn_Bridge_Postdlf.jpg?width=600",
        tip: "오후 햇살에 브루클린 방향 사진이 예쁘게 나옵니다",
        transit: [
          { mode: "walk", icon: "🚶", label: "Stone St → 브루클린 브릿지 입구", detail: "Stone St → Park Row 방향 북쪽 도보 · 약 15분\nCity Hall Park 지나서 Brooklyn Bridge 보행자 입구" },
          { mode: "walk", icon: "🚶", label: "다리 횡단", detail: "보행자 전용 데크 · 맨해튼→브루클린 방향 · 약 30~40분\nDUMBO 출구로 하차" }
        ]},
      { time: "16:30", end: "18:30", title: "DUMBO & Brooklyn Bridge Park", type: "sightseeing", location: "DUMBO, Brooklyn", address: "Washington St & Water St, Brooklyn, NY 11201",
        description: "워싱턴 스트리트의 인생샷 포인트\nBrooklyn Bridge Park 강변 산책",
        photo: "https://plus.unsplash.com/premium_photo-1681558921634-f73645bde42f?w=600&h=300&fit=crop&auto=format",
        tip: "Washington St에서 Manhattan Bridge 프레임 인생샷!",
        transit: [
          { mode: "walk", icon: "🚶", label: "브릿지 출구에서 도보", detail: "다리 하차 → Washington St 사진 포인트 도보 5분\n→ Brooklyn Bridge Park 도보 3분\n→ Jane's Carousel 도보 2분" }
        ]},
      { time: "21:00", end: "22:30", title: "St. Anselm 스테이크 디너", type: "highlight", location: "St. Anselm", address: "355 Metropolitan Ave, Brooklyn, NY 11211 (Williamsburg)",
        description: "✅ 예약 완료 (Resy)\n• 일시: 5월 15일(금) 21:00\n• 인원: 3명\n• 좌석: Heated Patio\n• 취소 정책: 5월 14일 21:00 전 무료\n💳 결제 카드 끝자리 0766\n\n🍽️ 3명 추천 주문 (가성비 + 다양성)\n\n🍷 애피타이저 (1~2개 셰어)\n• Bone Marrow + Toast — 시그니처, 꼭!\n• 또는 Oysters (반다스)\n\n🥩 메인 (각 1개씩, 3명 → 3종 셰어 가능)\n• Butcher's Steak $34 — 시그니처, 1개는 필수\n• Lamb Saddle Chops — 다른 풍미 추가\n• Bone-in Ribeye 또는 Roast Chicken (취향)\n\n🥗 사이드 (2~3개 셰어)\n• Grilled Asparagus\n• Mashed Potatoes 또는 Roasted Potatoes\n• Creamed Spinach\n\n🍷 음료\n• Red Wine 1병 (Pinot Noir / Cabernet)\n• 또는 크래프트 맥주\n\n💰 1인 예산: $70~90 (팁 포함, 와인 별도)",
        photo: "https://lh3.googleusercontent.com/gps-cs-s/APNQkAGAeF8DR8bA22P1R9BNuJg81LgCMSLliF3tGNYD92OlYp-MtkIyTdUY2hs2vutn30xge1eS2_WbsLvByuaLyI5OVpAYTp_6vPNSRnGKC4ZDXRBnHqQ8APLHrYjEUPCPdyRaI13N=w600-h300-n-k-no",
        links: [
          { icon: "📅", label: "Resy 예약 관리", href: "https://resy.com/cities/ny/st-anselm" },
          { icon: "🌐", label: "공식 사이트", href: "https://stanselm.nyc/" }
        ],
        tip: "Butcher's Steak 반드시 주문! Patio 자리니 5월 밤 쌀쌀할 수 있어 가벼운 겉옷 추천",
        transit: [
          { mode: "subway", icon: "🚇", label: "DUMBO → Williamsburg", detail: "York St역 (F line) → East Broadway 환승 → Lorimer St역 하차\n또는 DUMBO에서 Uber · 약 10분 · $12~15" },
          { mode: "walk", icon: "🚶", label: "Lorimer St역 → St. Anselm", detail: "역에서 Metropolitan Ave 방향 도보 · 약 5분" }
        ]},
      { time: "22:30", title: "Williamsburg & 숙소 복귀", type: "transport", location: "Williamsburg → 숙소", address: "Bedford Ave, Brooklyn",
        description: "Bedford Ave 바 거리 산책 후 Uber로 복귀",
        tip: "뉴욕에서 가장 트렌디한 동네",
        transit: [
          { mode: "walk", icon: "🚶", label: "St. Anselm → Bedford Ave", detail: "도보 5분 · 바 호핑 즐기기" },
          { mode: "car", icon: "🚗", label: "Uber/Lyft", detail: "Williamsburg → 숙소 · 약 25분 · $35~45 (1인 $12~15)" }
        ]}
    ]
  },
  {
    date: "5월 16일", day: "토요일", title: "센트럴파크 & 재즈의 밤", emoji: "🌳", accent: "#3a9a4f",
    events: [
      { time: "09:00", end: "09:45", title: "숙소 → 센트럴파크", type: "transport", location: "Port Imperial → Central Park", address: "59th St & 5th Ave",
        description: "페리 + 지하철로 센트럴파크 남쪽 입구까지",
        tip: "토요일 아침 페리는 여유로워요",
        transit: [
          { mode: "ferry", icon: "⛴️", label: "Port Imperial → W. 39th St", detail: "NY Waterway · 8분 · $9" },
          { mode: "subway", icon: "🚇", label: "미드타운 → 센트럴파크", detail: "42nd St-Times Sq역 → N/R line 북쪽 → 5th Ave-59th St역 하차\n약 10분 · 센트럴파크 남동쪽 입구 바로 앞" }
        ]},
      { time: "10:00", end: "13:00", title: "센트럴파크 워킹 투어", type: "highlight", location: "Central Park", address: "59th St → Belvedere Castle",
        description: "추천 루트 (약 2~3시간):\n① Gapstow Bridge\n② The Mall & Literary Walk\n③ Bethesda Terrace & Fountain\n④ Bow Bridge\n⑤ Strawberry Fields - 'IMAGINE'\n⑥ Belvedere Castle",
        photo: "https://images.unsplash.com/photo-1568515387631-8b650bbcdb90?w=600&h=300&fit=crop",
        tip: "Bethesda Fountain에서 버스킹 공연을 즐기세요!",
        transit: [
          { mode: "walk", icon: "🚶", label: "공원 내 도보 루트", detail: "59th St 입구 → Gapstow Bridge(5분) → The Mall(10분)\n→ Bethesda Fountain(5분) → Bow Bridge(5분)\n→ Strawberry Fields(10분) → Belvedere Castle(15분)\n총 도보 약 3km · 쉬엄쉬엄 2~3시간" }
        ]},
      { time: "13:00", end: "14:00", title: "점심", type: "food", location: "Columbus Circle 주변", address: "10 Columbus Cir",
        description: "Shake Shack, Tavern on the Green, Sarabeth's",
        tip: "Columbus Circle Shake Shack이 가장 가까워요",
        transit: [
          { mode: "walk", icon: "🚶", label: "Belvedere Castle → Columbus Circle", detail: "공원 내 서쪽 방향 도보 · 약 15분\n또는 72nd St 출구 → 남쪽 도보 10분" }
        ]},
      { time: "14:30", end: "17:30", title: "🏛️ 미술관 택1 — MoMA 또는 The Met", type: "highlight", location: "Museum of Modern Art / Metropolitan Museum", address: "MoMA: 11 W 53rd St / The Met: 1000 5th Ave",
        description: "오후 미술관 — 둘 중 취향대로 선택!\n\n🏛️ The Met (메트로폴리탄) — 추천\n• 입장료: $30/인\n• 이집트관 덴두르 신전, 인상파, 5월 루프탑 가든\n• ✅ 토요일 10AM~9PM (늦게까지 운영)\n• Columbus Circle에서 1 line 5분, 센트럴파크 산책 직후 동선 최적\n• 휴관일 없음 (연중 정상 운영)\n\n🎨 MoMA (현대미술관)\n• 입장료: $30/인\n• 고흐, 피카소, 워홀, 모네\n• ✅ 토요일 10:30AM~5:30PM (정시 마감)\n• 미드타운 53rd St (Columbus Circle에서 N/R line 약 10분)\n• ⚠️ 일부 휴관일 있을 수 있어 moma.org 사전 확인\n\n💡 늦게까지 보고 싶으면 The Met (9PM까지)\n💡 둘 다 5월 16일(토) 정상 운영 확인됨 — 예매 추천",
        photo: "https://images.unsplash.com/photo-1739021424458-fb31d89c424b?w=600&h=300&fit=crop&auto=format",
        links: [
          { icon: "🎟️", label: "The Met 티켓", href: "https://www.metmuseum.org/visit/plan-your-visit" },
          { icon: "🎟️", label: "MoMA 티켓", href: "https://www.moma.org/tickets/" }
        ],
        tip: "동선 베스트는 The Met (Columbus Circle에서 1 line 직행)",
        transit: [
          { mode: "subway", icon: "🚇", label: "Columbus Circle → The Met", detail: "59th St-Columbus Cir역 → 1 line 북쪽 → 86th St역 하차\n→ 5th Ave 방향 동쪽 도보 10분 · 또는 M86 버스" },
          { mode: "walk", icon: "🚶", label: "Met — 공원 내 도보", detail: "Columbus Circle → 공원 East Drive → The Met\n약 30분 산책 (날씨 좋을 때)" },
          { mode: "subway", icon: "🚇", label: "Columbus Circle → MoMA", detail: "59th St-Columbus Cir역 → N/R line 동쪽 → 5 Av/53 St역 하차\n도보 1분 · 약 10분" }
        ]},
      { time: "18:00", end: "19:00", title: "Columbus Circle", type: "sightseeing", location: "Columbus Circle", address: "10 Columbus Cir, NY 10019",
        description: "The Shops에서 쇼핑 · Dizzy's Club 준비",
        photo: "https://images.unsplash.com/photo-1587162147120-430be9b33be3?w=600&h=300&fit=crop&auto=format",
        tip: "Jazz at Lincoln Center가 바로 이 건물 5층!",
        transit: [
          { mode: "subway", icon: "🚇", label: "The Met → Columbus Circle", detail: "86th St역 → 1 line 남쪽 → 59th St-Columbus Cir역\n약 10분" }
        ]},
      { time: "19:30", end: "22:00", title: "Dizzy's Club 재즈 디너", type: "highlight", location: "Dizzy's Club", address: "10 Columbus Cir, 5FL, NY 10019",
        description: "센트럴파크 뷰 + 월드클래스 재즈!\n• 커버차지: $20~45\n• 1인 예산: $80~120\n• 7:30PM / 9:30PM 2회 공연",
        photo: "https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=600&h=300&fit=crop",
        links: [
          { icon: "🎷", label: "공연/예약", href: "https://www.jazz.org/dizzys/" },
          { icon: "📅", label: "공연 캘린더", href: "https://www.jazz.org/calendar/" }
        ],
        tip: "2층 중앙 테이블이 최고의 뷰!",
        transit: [
          { mode: "walk", icon: "🚶", label: "Columbus Circle 건물 내", detail: "Deutsche Bank Center(Time Warner Center) 5층\n로비에서 엘리베이터 이용" }
        ]},
      { time: "22:30", title: "숙소 복귀", type: "transport", location: "Columbus Circle → 숙소", address: "Uber/Lyft",
        description: "Uber로 편하게 복귀",
        tip: "내일을 위해 적당히!",
        transit: [
          { mode: "car", icon: "🚗", label: "Uber/Lyft", detail: "Columbus Circle → 숙소 · 약 15~20분 · $25~35 (1인 $8~12)" }
        ]}
    ]
  },
  {
    date: "5월 17일", day: "일요일", title: "다운타운 빌리지 & Dian's Dinner", emoji: "🎨", accent: "#9b5fbf",
    events: [
      { time: "09:00", end: "10:00", title: "숙소 → SoHo 이동", type: "transport", location: "숙소 → SoHo", address: "5303 JFK Blvd East → Broadway & Prince St",
        description: "🎯 최적 동선: SoHo → West Village → Greenwich Village\n\n도보 흐름 (총 1.2km):\n1️⃣ SoHo (Prince/Broadway) — 모닝 쇼핑\n2️⃣ → 서쪽 도보 10분 → West Village (Bleecker St) — 점심\n3️⃣ → 동쪽 도보 5~10분 → Greenwich Village (Washington Sq) — 휴식\n\n💡 SoHo 매장은 보통 10:30~11:00 오픈, 오전이 한적함",
        tip: "🟢 158번 + N/R/W line이 SoHo Prince St 직결",
        transit: [
          { mode: "bus", icon: "🚌", label: "🟢 158번 + N/R/W (추천 · 가성비)", detail: "STEP 1: 숙소 앞 Blvd East → 158번 직행 → Port Authority\n약 25~35분 · $3.50\n\nSTEP 2: 42nd St-Times Sq역 → N/R/W line 남쪽 → Prince St 하차\n약 12분 · $2.90\n\n총 40~50분 · $6.40\n하차 즉시 SoHo 한복판" },
          { mode: "subway", icon: "🚇", label: "🚇 PATH 직행 (빠름)", detail: "STEP 1: 숙소 → Hoboken Terminal\n• 22번 버스 또는 Lyft 약 10~15분 ($2.25 / $10~15)\n\nSTEP 2: PATH (HOB-WTC line) → Christopher St 하차\n약 10분 · $2.75\n\nSTEP 3: Christopher St → SoHo 도보 약 12분 (남쪽)\n또는 1 line 한 정거장 → Houston St\n\n총 30~40분 · $5~18" },
          { mode: "ferry", icon: "⛴️", label: "⛴️ 페리 (뷰 옵션)", detail: "STEP 1: 숙소 → Port Imperial · Bus 158/159 약 10분\n\nSTEP 2: Port Imperial → W. 39th St · NY Waterway 8분 · $9\n\nSTEP 3: 42nd St역 → N/R/W 남쪽 → Prince St · 약 12분\n\n총 약 50분 · $14" },
          { mode: "car", icon: "🚗", label: "🚗 Uber 직행 (편의)", detail: "숙소 → SoHo Broadway/Prince 직행\n약 20~25분 · $30~40 (3인 $10~13)" }
        ]},
      { time: "10:00", end: "12:00", title: "SoHo 모닝 쇼핑", type: "sightseeing", location: "SoHo", address: "Broadway & Prince St, NY 10012",
        description: "캐스트 아이언 건축물 + 부티크 숍 (오전 한적)\n• Broadway 메인 쇼핑 거리\n• Prince St · Spring St · Mercer St\n• Aimé Leon Dore, Kith, MoMA Design Store\n• 갤러리 + 부티크 인테리어 샵",
        photo: "https://images.unsplash.com/photo-1499092346589-b9b6be3e94b2?w=600&h=300&fit=crop",
        tip: "Mercer St에 숨은 갤러리/하이엔드 부티크 多",
        transit: [
          { mode: "walk", icon: "🚶", label: "Prince St역에서", detail: "Prince St역 → Broadway 출구 · 도보 1분\n바로 SoHo 한복판" }
        ]},
      { time: "12:00", end: "14:00", title: "West Village 점심 & 카페", type: "food", location: "West Village", address: "Bleecker St, NY 10014",
        description: "🍽️ 점심 추천\n• Buvette (42 Grove St) - 프렌치 비스트로 (예약 추천)\n• Joe's Pizza (7 Carmine St) - 클래식 슬라이스 (워크인)\n• Joseph Leonard (170 Waverly Pl) - 미국식 브런치 (예약 추천)\n\n☕ 카페/디저트\n• Magnolia Bakery (401 Bleecker) - 컵케이크\n• Dante (79 MacDougal) - 네그로니",
        photo: "https://images.unsplash.com/photo-1634874495432-cb368c167e9b?w=600&h=300&fit=crop&auto=format",
        links: [
          { icon: "📅", label: "Buvette 예약", href: "https://resy.com/cities/ny/buvette" },
          { icon: "📅", label: "Joseph Leonard", href: "https://resy.com/cities/ny/joseph-leonard" },
          { icon: "🍕", label: "Joe's Pizza", href: "https://www.joespizzanyc.com/" }
        ],
        tip: "Buvette의 Croque Monsieur + 라떼 강추!",
        transit: [
          { mode: "walk", icon: "🚶", label: "SoHo → West Village", detail: "Broadway/Prince → 서쪽 도보 약 10분\nHouston St 건너 → Bleecker St 진입" }
        ]},
      { time: "14:00", end: "15:30", title: "Greenwich Village 산책", type: "sightseeing", location: "Greenwich Village", address: "Washington Square Park, NY 10012",
        description: "워싱턴 스퀘어 파크 + NYU 캠퍼스\n• Washington Square Arch (개선문 + 분수)\n• 거리 공연/체스 두는 사람 구경\n• MacDougal St 보헤미안 거리\n• Comedy Cellar (코미디 클럽 외관)\n\n💡 Dian's House 출발 전 휴식 명소",
        photo: "https://plus.unsplash.com/premium_photo-1681868376745-0565b18b4c8c?w=600&h=300&fit=crop&auto=format",
        tip: "Washington Square Arch 앞이 사진 명소! 벤치에서 잠시 쉬어가기",
        transit: [
          { mode: "walk", icon: "🚶", label: "West Village → Greenwich", detail: "Bleecker St → 동쪽 도보 약 5~10분\nMacDougal St 따라가면 Washington Square 도착" }
        ]},
      { time: "17:00", end: "21:00", title: "🏡 Dian's House Dinner Invitation", type: "highlight", location: "Dian's House", address: "300 E 59th St, New York, NY",
        description: "Dian의 집 디너 초대 — 이날의 하이라이트!\n\n🎁 손님 매너 체크리스트\n• 와인 (red/white 1병씩) 또는 꽃다발 지참\n• 한국 디저트/티/전통주 선물 옵션\n• 드레스 코드: 깔끔한 캐주얼\n• 알레르기/식단 제한 미리 공유\n\n💬 미국식 디너 매너\n• 5~10분 정도만 늦는 정도 OK\n• 식사 후 정리 도와주기 제안\n• 머무르는 시간: 식사 후 1~2시간 정도\n• 다음 날 감사 메시지/카드 보내기\n\n🎉 이런 시간이 진짜 뉴욕 추억",
        tip: "Dian에게 알레르기, 도착 시간, 선물 호불호 미리 확인!",
        transit: [
          { mode: "subway", icon: "🚇", label: "Greenwich Village → Dian's House", detail: "W 4th St-Washington Sq역 → A/C/E line 북쪽 → 59 St-Columbus Cir\n또는 R/W → Lexington Av/59 St역 (Dian's House 근처)\n약 15~20분 · $2.90" },
          { mode: "car", icon: "🚗", label: "Uber/Lyft", detail: "Washington Sq → 300 E 59th St\n약 12~18분 · $15~22 (1인 $5~7)" }
        ]},
      { time: "21:00", title: "숙소 복귀", type: "transport", location: "Dian's House → 숙소", address: "300 E 59th St → 5303 JFK Blvd East",
        description: "Dian의 집(300 E 59th St)에서 숙소로 복귀.\n저녁 시간은 Uber가 가장 편안하고 안전!",
        tip: "내일 일정 위해 적당한 시간에 마무리",
        transit: [
          { mode: "car", icon: "🚗", label: "Uber/Lyft (추천)", detail: "300 E 59th St → 숙소\n약 20~30분 · $30~40 (1인 $10~13)\nQueensboro Bridge 또는 Lincoln Tunnel 경로" },
          { mode: "subway", icon: "🚇", label: "지하철 + 158번 (가성비)", detail: "Lexington Av/59 St역 → N/R/W 또는 4/5/6 → Times Sq\n→ Port Authority → 158번 → 숙소\n약 50~60분 · $6.40" }
        ]}
    ]
  },
  {
    date: "5월 18일", day: "월요일", title: "Hudson Yards · 하이라인 · Little Island", emoji: "🌆", accent: "#cf6a45",
    events: [
      { time: "09:30", end: "10:30", title: "숙소 → Hudson Yards 이동", type: "transport", location: "숙소 → Hudson Yards", address: "5303 JFK Blvd East → 20 Hudson Yards, NY 10001",
        description: "마지막 관광일! 짐 정리도 미리 해두세요.\n북→남 도보 동선으로 효율적으로 즐기기.\n\n3가지 옵션:\n🚌 158번 직행 (가성비)\n⛴️ 페리 (뷰 + 분위기)\n🚗 Uber (편의/짐 많을 때)",
        tip: "마지막 날 분위기는 페리 루트가 최고!",
        transit: [
          { mode: "bus", icon: "🚌", label: "🟢 158번 직행 (가성비)", detail: "숙소 앞 Blvd East → Port Authority Bus Terminal\n약 25~35분 · $3.50 · 환승 없음\n하차 후 7 line 한 정거장 → 34th St-Hudson Yards" },
          { mode: "ferry", icon: "⛴️", label: "⛴️ 페리 1/3 — 숙소 → Port Imperial", detail: "Port Imperial Ferry Terminal까지\n• NJ Bus 158/159 (Blvd East) · 약 10분 · $2.25\n• 또는 Uber · 약 8분 · $8~12\n• 또는 도보 · 약 15분 (날씨 좋으면 강추)" },
          { mode: "ferry", icon: "⛴️", label: "⛴️ 페리 2/3 — Port Imperial → W. 39th St", detail: "NY Waterway 페리 · 약 8분 · $9 (편도)\n주말 운행 시간 6:20~21:00 (확인)\n허드슨강 위에서 맨해튼 스카이라인 + 자유의 여신상 조망" },
          { mode: "walk", icon: "🚶", label: "⛴️ 페리 3/3 — W. 39th St → Hudson Yards", detail: "W. 39th St 터미널 → Hudson Yards\n12th Ave 따라 남쪽 도보 약 7~10분\n도착지: Vessel/Edge 입구 광장" },
          { mode: "car", icon: "🚗", label: "🚗 Uber 직행 (편의)", detail: "숙소 → Hudson Yards · 약 15~20분\n$25~35 (1인 $8~12)\n짐 많거나 날씨 안 좋을 때 추천" }
        ]},
      { time: "10:30", end: "12:00", title: "Hudson Yards 브런치 & Edge", type: "highlight", location: "Hudson Yards", address: "20 Hudson Yards, NY 10001",
        description: "🍳 브런치 추천\n• Mercado Little Spain (José Andrés의 스페인 푸드 코트)\n• Bar Wayō (일식 브런치)\n• Citarella Gourmet Market 카페\n• Whole Foods 데일리 메뉴\n\n🏙️ Edge 전망대 (옵션)\n• $44/인 · 100층 야외 전망대\n• Hudson Yards 빌딩 5층 통해 진입\n\n💰 브런치 예산: 1인 $25~40",
        photo: "https://kr.img.news.koreanair.com/wp-content/uploads/2019/08/NR201908_living_JFK_3-768x509.png",
        links: [
          { icon: "🥘", label: "Mercado Little Spain", href: "https://www.littlespain.com/" },
          { icon: "🏙️", label: "Edge 전망대 예매", href: "https://www.edgenyc.com/" },
          { icon: "🌐", label: "Hudson Yards", href: "https://www.hudsonyardsnewyork.com/" }
        ],
        tip: "Mercado Little Spain의 하몽+상그리아가 최고!",
        transit: [
          { mode: "walk", icon: "🚶", label: "34th St-Hudson Yards역 → 광장", detail: "역 출구 바로 앞 · Vessel 광장 · 도보 1~2분" }
        ]},
      { time: "12:00", end: "13:30", title: "하이라인 공원 산책 (북→남)", type: "highlight", location: "The High Line", address: "34th St → Gansevoort St",
        description: "폐 고가 철도 위 공원!\n• 2.3km · 45분~1시간\n• 5월 꽃이 만발하는 최적 시즌\n• 북쪽(Hudson Yards) → 남쪽(Gansevoort) 방향",
        photo: "https://images.unsplash.com/photo-1701353592956-3247fd68d999?w=600&h=300&fit=crop&auto=format",
        tip: "10th Ave 전망대(17th St)에서 풍경 감상!",
        transit: [
          { mode: "walk", icon: "🚶", label: "Hudson Yards → 하이라인 진입", detail: "Hudson Yards 광장에서 하이라인 직결 · 도보 0분" },
          { mode: "walk", icon: "🚶", label: "하이라인 산책 루트", detail: "북→남 방향 (34th St → Gansevoort St)\n23rd St 잔디밭 · 17th St 10th Ave 전망대\n· Chelsea Thicket · 약 45분" }
        ]},
      { time: "13:30", end: "17:00", title: "Meatpacking District 산책 + 자유시간", type: "sightseeing", location: "Meatpacking District", address: "Gansevoort St & 9th Ave 일대",
        description: "Hudson Yards 브런치로 이미 든든하니, 천천히 둘러보는 오후.\n\n🛍️ 산책/쇼핑\n• Diane von Furstenberg 플래그십\n• Restoration Hardware 옥상 (탁 트인 뷰)\n• Gansevoort St 자갈길 사진 포인트\n\n🏛️ 미술관 옵션\n• Whitney Museum 외관/입장 ($30)\n• 옥상에서 하이라인 + 허드슨강 뷰\n• ⏰ 운영: 수~월 10:30~18:00 (화요일 휴관)\n• ✅ 5월 18일 월요일 정상 운영\n\n☕ 카페/와인 옵션\n• Pastis (52 Gansevoort St) - 와인/커피\n• Bubby's High Line - 가벼운 스낵\n• 또는 그냥 벤치/공원에서 휴식\n\n💡 일몰 전 여유로운 산책 + 휴식 시간",
        photo: "https://image.newyork.kr/wp-content/uploads/2012/06/Meatpacking-District-in-New-York.jpg.webp",
        tip: "Whitney Museum 옥상에서 하이라인+허드슨강 뷰가 압권!",
        links: [
          { icon: "🏛️", label: "Whitney Museum", href: "https://whitney.org/visit" },
          { icon: "☕", label: "Pastis 카페", href: "https://resy.com/cities/ny/pastis-9" }
        ],
        transit: [
          { mode: "walk", icon: "🚶", label: "하이라인 끝 → Meatpacking", detail: "하이라인 남쪽 끝 (Gansevoort St 출구)\n→ Meatpacking 지구 도보 0~3분" }
        ]},
      { time: "17:30", end: "20:30", title: "Little Island 일몰 & 저녁", type: "highlight", location: "Little Island at Pier 55", address: "Pier 55, Hudson River Park (W 13th St & 11th Ave)",
        description: "🌅 허드슨강 위 떠 있는 인공 섬 공원!\n• 입장 무료 · 06:00~24:00 운영\n• 132개 튤립 모양 콘크리트 기둥 위 정원\n• The Glade 야외극장 (주말 무료 공연)\n• 일몰 뷰 명소 (5월 일몰 ~20:00)\n\n🍽️ 저녁 옵션\n• The Play Ground 푸드 카트 (피자/타코/맥주)\n• 또는 근처 Pastis(52 Gansevoort St) / Catch(21 9th Ave) 식당\n• 또는 Meatpacking 동네 식당 포장 → 피크닉\n\n💰 1인 $25~50 (옵션에 따라)",
        photo: "https://kor.theasian.asia/wp-content/uploads/2021/11/K-town.jpg",
        links: [
          { icon: "🌐", label: "Little Island 공식", href: "https://littleisland.org/" },
          { icon: "🎭", label: "공연 일정", href: "https://littleisland.org/whats-on" },
          { icon: "📅", label: "Pastis 예약", href: "https://resy.com/cities/ny/pastis-9" },
          { icon: "📅", label: "Catch 예약", href: "https://resy.com/cities/ny/catch-nyc" }
        ],
        tip: "5월 일몰 시간(~20:00)에 맞춰 도착하면 인생샷!",
        transit: [
          { mode: "walk", icon: "🚶", label: "Meatpacking → Little Island", detail: "Gansevoort St → 서쪽 끝 (Hudson River Park)\n도보 5~7분 · 입구는 W 13th St 다리" }
        ]},
      { time: "21:00", title: "숙소 복귀 & 짐 정리", type: "transport", location: "맨해튼 → 숙소", address: "Little Island → 5303 JFK Blvd East",
        description: "내일 아침 JFK 출발 준비!\nUber로 편하게 복귀.",
        tip: "내일 9시 출발 — 일찍 자고 짐 미리 정리!",
        transit: [
          { mode: "car", icon: "🚗", label: "Uber/Lyft (추천)", detail: "Little Island → 숙소 · 약 15분 · $25~35 (1인 $8~12)\n야간 Uber가 가장 편함" },
          { mode: "ferry", icon: "⛴️", label: "페리 대안", detail: "도보로 W. 39th St 페리(약 30분) → Port Imperial 8분\n도보로 짐 무거우면 비추" }
        ]}
    ]
  },
  {
    date: "5월 19일", day: "화요일", title: "귀국", emoji: "🛫", accent: "#7b8a9e",
    events: [
      { time: "08:00", end: "09:00", title: "기상 & 최종 준비", type: "rest", location: "숙소", address: "5303 JFK Blvd East, West New York, NJ",
        description: "체크아웃 · 마지막 스카이라인 감상",
        tip: "여권, 탑승권, 충전기 최종 체크!",
        transit: null },
      { time: "09:00", end: "10:30", title: "숙소 → JFK 공항 (3명)", type: "transport", location: "Uber/Lyft → JFK Airport", address: "West New York, NJ → JFK, Queens, NY",
        description: "⚡ 3명 이동 (모두 함께)\n\n🚗 Uber/Lyft로 JFK 직행\n• 비용: $140~160 → 1인당 약 $47~53\n• 소요: 70~90분 (화요일 러시아워)\n• 11:00까지 공항 도착 목표\n• UberXL/Comfort 추천 (3명+캐리어)\n\n💡 Uber Reserve로 전날 밤 미리 예약!",
        photo: "https://images.unsplash.com/photo-1436491865332-7a61a109db05?w=600&h=300&fit=crop",
        tip: "3명+캐리어는 UberXL이 안전. 화요일 러시아워 대비 일찍 출발!",
        transit: [
          { mode: "car", icon: "🚗", label: "UberXL/Comfort (추천)", detail: "숙소 → JFK 직행 · 70~90분 · $140~160 (1인 $47~53)\nLincoln Tunnel → BQE → Belt Pkwy → JFK\n3명+캐리어는 큰 차량 필수" },
          { mode: "bus", icon: "🚌", label: "대중교통 대안", detail: "NJ Bus 165/166 → Port Authority → A train → JFK AirTrain\n약 2.5시간 · $15/인 · 짐 많으면 비추천" }
        ]},
      { time: "11:00", end: "13:00", title: "JFK 공항 & 체크인", type: "transport", location: "JFK International Airport", address: "Queens, NY 11430",
        description: "체크인, 보안검색, 면세점",
        tip: "마지막 쇼핑은 면세점에서!",
        transit: null },
      { time: "13:20", title: "출발 ✈️", type: "highlight", location: "JFK Airport", address: "JFK International Airport",
        description: "안녕 뉴욕! 다음에 또 만나요 👋",
        tip: "안전한 비행 되세요!",
        transit: null }
    ]
  }
];

const TRANSPORT = {
  airport: { title: "공항 ↔ 숙소 (2명 이동)", icon: "✈️", routes: [
    { name: "Uber/Lyft (추천)", detail: "JFK → West New York, NJ · 2명", info: ["소요: 약 70~90분 · 비용: $130~150", "2인 분담 시 1인당 $65~75", "Uber Reserve로 사전 예약 추천", "UberX로도 2명+짐 충분"] },
    { name: "대중교통", detail: "AirTrain + NJ Transit Bus", info: ["JFK AirTrain ($8.25) → Jamaica Station", "E train ($2.90) → Penn Station", "Penn Station → Port Authority 도보 5분", "NJ Transit Bus 165/166 ($3.50) → Blvd East", "총 약 2시간 · $15/인"] }
  ]},
  ferry: { title: "뉴저지 → 맨해튼 페리", icon: "⛴️", routes: [
    { name: "Wall St 행 (평일)", detail: "Port Imperial → Pier 11 · 25분 · $9", info: ["AM 6:20~ / PM ~7:00 운행", "허드슨 강에서 자유의 여신상 조망", "숙소→Port Imperial: 158번(10분) 또는 Uber(8분)"] },
    { name: "Midtown 행 (매일)", detail: "Port Imperial → W. 39th St · 8분 · $9", info: ["주말 포함 매일 운행", "무료 셔틀버스 미드타운 연결", "도착 후 도보 10분이면 타임스퀘어"] }
  ]},
  bus158: { title: "NJ Transit 158번 (직행 버스)", icon: "🚌", routes: [
    { name: "숙소 → 미드타운 직행", detail: "JFK Blvd East → Port Authority · 25~35분 · $3.50", info: [
      "환승 없이 맨해튼 42nd St까지 한 번에",
      "Lincoln Tunnel 경유 · 평일 5~15분 간격",
      "Port Authority 하차 → 타임스퀘어 도보 5분",
      "→ 브라이언파크/MoMA/코리아타운 도보 7~10분",
      "NJ Transit 앱으로 모바일 티켓 구매 가능",
      "현금 탑승 시 잔돈 준비 ($3.50 정확히)"
    ], links: [
      { icon: "🚏", label: "숙소 앞 158 정류장", href: "https://www.google.com/maps/search/?api=1&query=Blvd+East+at+JFK+Blvd+West+New+York+NJ+bus+stop" },
      { icon: "🧭", label: "숙소 → PABT 길찾기", href: "https://www.google.com/maps/dir/?api=1&origin=5303+JFK+Blvd+East,+West+New+York,+NJ+07093&destination=Port+Authority+Bus+Terminal,+New+York,+NY&travelmode=transit" },
      { icon: "📅", label: "운행 시간표", href: "https://www.njtransit.com/bus/158" },
    ]},
    { name: "미드타운 → 숙소 (귀가)", detail: "Port Authority → JFK Blvd East · 25~35분 · $3.50", info: [
      "PABT 3층 Gate 218~223번 근처에서 158번 탑승",
      "야간(22:00 이후)에는 배차 30~60분 → 시간 확인 필수",
      "주말/심야에는 Uber($25~35)가 더 편할 수 있음",
    ], links: [
      { icon: "🚏", label: "Port Authority Bus Terminal", href: "https://www.google.com/maps/search/?api=1&query=Port+Authority+Bus+Terminal+New+York" },
      { icon: "🧭", label: "PABT → 숙소 길찾기", href: "https://www.google.com/maps/dir/?api=1&origin=Port+Authority+Bus+Terminal,+New+York,+NY&destination=5303+JFK+Blvd+East,+West+New+York,+NJ+07093&travelmode=transit" },
    ]}
  ]}
};

const CHECKS = [
  { id: "default-jazz",     t: "재즈 공연 + 디너",   s: "Day4 Dizzy's Club",            ic: "🎷" },
  { id: "default-ferry",    t: "페리로 월스트리트",   s: "Day2 Port Imperial → Pier 11", ic: "⛴️" },
  { id: "default-steak",    t: "브루클린 스테이크",   s: "Day2 St. Anselm, Williamsburg",ic: "🥩" },
  { id: "default-park",     t: "센트럴파크 산책",     s: "Day4 Bethesda · Bow Bridge",   ic: "🌿" },
  { id: "default-museum",   t: "뮤지엄 2곳",          s: "Day3 MoMA + Day4 The Met",     ic: "🏛️" },
  { id: "default-bryant",   t: "브라이언파크 맥주",   s: "Day3 The Porch",               ic: "🍺" },
  { id: "default-brunch",   t: "브런치",              s: "Day3 Balthazar, SoHo",         ic: "🥞" },
];

const TODO_KEY = "nyc-trip-todos-v1";
const loadTodos = () => {
  try { return JSON.parse(localStorage.getItem(TODO_KEY)) || { checked: {}, custom: [] }; }
  catch { return { checked: {}, custom: [] }; }
};

const TM = { transport:"#5b8fc7", sightseeing:"#3a9a4f", food:"#d4965a", highlight:"#1a1a18", rest:"#999" };
const MI = { walk:"#3a9a4f", subway:"#3b7dd8", ferry:"#1a8fb5", bus:"#e8963a", car:"#888" };

export default function App() {
  const [day, setDay] = useState(0);
  const [open, setOpen] = useState(null);
  const [panel, setPanel] = useState(null);
  const [memos, setMemos] = useState(loadMemos);
  const [draft, setDraft] = useState("");
  const [editing, setEditing] = useState(null);
  const [savedFlash, setSavedFlash] = useState(null);
  const [weather, setWeather] = useState({ loading: true, error: false, data: null });
  const [todoState, setTodoState] = useState(loadTodos);
  const [todoInput, setTodoInput] = useState("");
  const d = DAYS[day];

  useEffect(() => {
    localStorage.setItem(TODO_KEY, JSON.stringify(todoState));
  }, [todoState]);

  const allTodos = [
    ...CHECKS.filter(c => !todoState.removed?.includes(c.id)),
    ...todoState.custom,
  ];
  const toggleTodo = (id) => setTodoState(s => ({ ...s, checked: { ...s.checked, [id]: !s.checked[id] } }));
  const addTodo = () => {
    const v = todoInput.trim();
    if (!v) return;
    const item = { id: `c-${Date.now()}`, t: v, s: "직접 추가", ic: "📌", custom: true };
    setTodoState(s => ({ ...s, custom: [...s.custom, item] }));
    setTodoInput("");
  };
  const removeTodo = (id, isCustom) => setTodoState(s => {
    const nextChecked = { ...s.checked }; delete nextChecked[id];
    if (isCustom) {
      return { ...s, checked: nextChecked, custom: s.custom.filter(c => c.id !== id) };
    }
    return { ...s, checked: nextChecked, removed: [...(s.removed || []), id] };
  });
  const restoreDefaults = () => setTodoState(s => ({ ...s, removed: [] }));
  const doneCount = allTodos.filter(c => todoState.checked[c.id]).length;

  useEffect(() => {
    localStorage.setItem(MEMO_KEY, JSON.stringify(memos));
  }, [memos]);

  useEffect(() => {
    let cancelled = false;
    const fetchWeather = () => {
      fetch("https://api.open-meteo.com/v1/forecast?latitude=40.7128&longitude=-74.0060&current=temperature_2m,weather_code,wind_speed_10m,relative_humidity_2m&hourly=temperature_2m,weather_code,precipitation_probability&daily=temperature_2m_max,temperature_2m_min,weather_code,precipitation_probability_max&temperature_unit=celsius&timezone=America/New_York&forecast_days=7")
        .then(r => r.json())
        .then(j => {
          if (cancelled) return;
          setWeather({ loading: false, error: false, data: j });
        })
        .catch(() => { if (!cancelled) setWeather({ loading: false, error: true, data: null }); });
    };
    fetchWeather();
    const id = setInterval(fetchWeather, 10 * 60 * 1000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  const [weatherExpanded, setWeatherExpanded] = useState(false);
  const getNextHours = (data, n = 12) => {
    if (!data?.hourly || !data?.current) return [];
    const prefix = data.current.time.slice(0, 13);
    let idx = data.hourly.time.findIndex(t => t.startsWith(prefix));
    if (idx < 0) idx = 0;
    idx += 1;
    return data.hourly.time.slice(idx, idx + n).map((t, i) => ({
      time: t,
      temp: data.hourly.temperature_2m[idx + i],
      code: data.hourly.weather_code[idx + i],
      precip: data.hourly.precipitation_probability?.[idx + i] ?? 0,
    }));
  };

  const memoKey = (di, ei) => `${di}-${ei}`;
  const startEdit = (k) => { setDraft(memos[k] || ""); setEditing(k); };
  const cancelEdit = () => { setDraft(""); setEditing(null); };
  const saveMemo = (k) => {
    const v = draft.trim();
    setMemos(prev => {
      const next = { ...prev };
      if (v) next[k] = v; else delete next[k];
      return next;
    });
    setEditing(null);
    setDraft("");
    setSavedFlash(k);
    setTimeout(() => setSavedFlash(s => s === k ? null : s), 1500);
  };
  const deleteMemo = (k) => {
    setMemos(prev => { const next = { ...prev }; delete next[k]; return next; });
    setEditing(null);
    setDraft("");
  };

  return (
    <div style={{ fontFamily:"'Pretendard',-apple-system,sans-serif", background:"#fff", color:"#333", minHeight:"100vh", maxWidth:480, margin:"0 auto" }}>
      <style>{`
        @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css');
        *{box-sizing:border-box;margin:0;padding:0}::-webkit-scrollbar{width:0}
        @keyframes fin{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        button{font-family:inherit}
      `}</style>

      <header style={{ padding:"40px 18px 0" }}>
        <p style={{ fontSize:12, letterSpacing:4, color:d.accent, fontWeight:700, marginBottom:12, transition:"color 0.4s" }}>NEW YORK · MAY 2026</p>
        <h1 style={{ fontSize:30, fontWeight:800, color:"#111", letterSpacing:-0.8, marginBottom:6 }}>뉴욕 여행 스케줄</h1>
        <p style={{ fontSize:16, color:"#999", marginBottom:16 }}>씨오 코파운더가 함께하는 5박 6일</p>

        {/* 실시간 뉴욕 날씨 */}
        <div style={{ borderRadius:8, background:`linear-gradient(135deg, ${d.accent}10, ${d.accent}05)`, border:`1px solid ${d.accent}20`, overflow:"hidden" }}>
          {weather.loading ? (
            <p style={{ fontSize:15, color:"#aaa", padding:"12px 16px" }}>🌎 뉴욕 날씨 불러오는 중...</p>
          ) : weather.error || !weather.data ? (
            <p style={{ fontSize:15, color:"#aaa", padding:"12px 16px" }}>🌎 날씨 정보를 불러올 수 없습니다</p>
          ) : (
            <>
              <button onClick={()=>setWeatherExpanded(!weatherExpanded)} style={{
                width:"100%", display:"flex", alignItems:"center", gap:12, padding:"12px 16px",
                border:"none", background:"transparent", cursor:"pointer", textAlign:"left",
              }}>
                <span style={{ fontSize:38 }}>{wxInfo(weather.data.current.weather_code).icon}</span>
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ fontSize:12, fontWeight:700, color:d.accent, letterSpacing:1.2, marginBottom:2 }}>NYC NOW · 실시간</p>
                  <div style={{ display:"flex", alignItems:"baseline", gap:6 }}>
                    <span style={{ fontSize:25, fontWeight:800, color:"#111" }}>{Math.round(weather.data.current.temperature_2m)}°</span>
                    <span style={{ fontSize:15, color:"#666", fontWeight:500 }}>{wxInfo(weather.data.current.weather_code).label}</span>
                  </div>
                  <p style={{ fontSize:12, color:"#999", marginTop:2 }}>
                    습도 {Math.round(weather.data.current.relative_humidity_2m)}% · 바람 {Math.round(weather.data.current.wind_speed_10m)}km/h
                  </p>
                </div>
                <svg width="14" height="14" viewBox="0 0 10 10" style={{ transform:weatherExpanded?"rotate(180deg)":"", transition:"transform 0.2s", opacity:0.4, flexShrink:0 }}>
                  <path d="M2 3.5L5 6.5L8 3.5" stroke={d.accent} strokeWidth="1.5" fill="none" strokeLinecap="round"/>
                </svg>
              </button>

              {weatherExpanded && (
                <>
                  <div style={{ borderTop:`1px solid ${d.accent}20`, padding:"10px 16px 12px" }}>
                    <p style={{ fontSize:11, fontWeight:700, color:"#888", letterSpacing:0.8, marginBottom:8 }}>⏰ 시간별 (다음 12시간)</p>
                    <div style={{ display:"flex", overflowX:"auto", gap:6, scrollbarWidth:"none", margin:"0 -4px", padding:"0 4px" }}>
                      {getNextHours(weather.data, 12).map((h)=>{
                        const hr = h.time.slice(11, 13);
                        return (
                          <div key={h.time} style={{
                            flex:"0 0 auto", minWidth:54, padding:"7px 8px", borderRadius:5,
                            background:"#fff", border:`1px solid ${d.accent}15`,
                            display:"flex", flexDirection:"column", alignItems:"center", gap:2,
                          }}>
                            <span style={{ fontSize:11, color:"#888", fontWeight:600 }}>{hr}시</span>
                            <span style={{ fontSize:18 }}>{wxInfo(h.code).icon}</span>
                            <span style={{ fontSize:13, fontWeight:700, color:"#222" }}>{Math.round(h.temp)}°</span>
                            {h.precip >= 30 && <span style={{ fontSize:10, color:"#3b7dd8", fontWeight:600 }}>💧{h.precip}%</span>}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div style={{ borderTop:`1px solid ${d.accent}20`, padding:"10px 16px 12px" }}>
                    <p style={{ fontSize:11, fontWeight:700, color:"#888", letterSpacing:0.8, marginBottom:8 }}>📅 주간 예보 (7일)</p>
                    <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
                      {weather.data.daily.time.map((t, i) => {
                        const dt = new Date(t + "T12:00");
                        const dayName = ["일","월","화","수","목","금","토"][dt.getDay()];
                        const dateStr = `${dt.getMonth()+1}/${dt.getDate()}`;
                        const isToday = i === 0;
                        const code = weather.data.daily.weather_code[i];
                        const tmax = Math.round(weather.data.daily.temperature_2m_max[i]);
                        const tmin = Math.round(weather.data.daily.temperature_2m_min[i]);
                        const precip = weather.data.daily.precipitation_probability_max?.[i] ?? 0;
                        return (
                          <div key={t} style={{
                            display:"flex", alignItems:"center", gap:8, padding:"6px 10px", borderRadius:5,
                            background: isToday ? `${d.accent}12` : "#fff",
                            border: `1px solid ${d.accent}15`,
                          }}>
                            <span style={{ fontSize:13, fontWeight:700, color: isToday?d.accent:"#444", width:38 }}>
                              {isToday ? "오늘" : dayName}
                            </span>
                            <span style={{ fontSize:11, color:"#999", width:34 }}>{dateStr}</span>
                            <span style={{ fontSize:18, width:24, textAlign:"center" }}>{wxInfo(code).icon}</span>
                            <span style={{ flex:1, fontSize:12, color:"#888", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{wxInfo(code).label}</span>
                            {precip >= 30 && <span style={{ fontSize:11, color:"#3b7dd8", fontWeight:600 }}>💧{precip}%</span>}
                            <span style={{ fontSize:13, fontWeight:700, color:"#222" }}>{tmax}°</span>
                            <span style={{ fontSize:12, color:"#aaa" }}>{tmin}°</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </header>

      <nav style={{ display:"flex", gap:2, padding:"22px 16px 16px", overflowX:"auto", scrollbarWidth:"none", justifyContent:"space-between" }}>
        {DAYS.map((dd,i)=>{const on=day===i;return <button key={i} onClick={()=>{setDay(i);setOpen(null);setPanel(null)}} style={{
          flex:"1 1 0", display:"flex", flexDirection:"column", alignItems:"center", gap:3,
          padding:"9px 4px", borderRadius:7, minWidth:0, cursor:"pointer", transition:"all 0.3s", border:"none",
          background:on?dd.accent:"transparent", color:on?"#fff":"#aaa",
        }}>
          <span style={{ fontSize:20, filter:on?"brightness(10)":"none", lineHeight:1 }}>{dd.emoji}</span>
          <span style={{ fontSize:13, fontWeight:on?700:500, whiteSpace:"nowrap" }}>{dd.date.replace("5월 ","")}</span>
          <span style={{ fontSize:10, opacity:0.7 }}>{dd.day}</span>
        </button>})}
      </nav>

      <div style={{ display:"flex", gap:8, padding:"0 16px 14px" }}>
        {[
          { k:"transport", l:"이동 가이드", ic:"🧭" },
          { k:"checklist", l:"To do list", ic:"✓" },
        ].map(b=>{
          const on = panel===b.k;
          return (
            <button key={b.k} onClick={()=>setPanel(on?null:b.k)} style={{
              flex:1, minWidth:0, padding:"10px 10px", borderRadius:8, cursor:"pointer", transition:"all 0.25s",
              border: on ? `1.5px solid ${d.accent}` : "1.5px solid #ececec",
              background: on ? `${d.accent}0c` : "#fff",
              boxShadow: on ? `0 3px 10px -4px ${d.accent}40` : "0 1px 2px rgba(0,0,0,0.03)",
              display:"flex", alignItems:"center", gap:7, textAlign:"left",
            }}>
              <div style={{
                width:24, height:24, borderRadius:5, flexShrink:0,
                background: on ? d.accent : "#f5f5f3",
                color: on ? "#fff" : d.accent,
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:14, fontWeight:800, transition:"all 0.25s",
              }}>{b.ic}</div>
              <span style={{ flex:1, minWidth:0, fontSize:15, fontWeight:700, color: on ? d.accent : "#333", lineHeight:1, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{b.l}</span>
              <svg width="10" height="10" viewBox="0 0 10 10" style={{ transform: on ? "rotate(180deg)" : "", transition:"transform 0.2s", flexShrink:0, opacity:0.4 }}>
                <path d="M2 3.5L5 6.5L8 3.5" stroke={on?d.accent:"#999"} strokeWidth="1.5" fill="none" strokeLinecap="round"/>
              </svg>
            </button>
          );
        })}
      </div>

      {panel==="transport"&&<div style={{ padding:"0 16px 20px", animation:"fin 0.3s" }}>
        {Object.values(TRANSPORT).map((s,si)=><div key={si} style={{ marginBottom:16 }}>
          <p style={{ fontSize:16, fontWeight:700, color:"#333", marginBottom:10 }}>{s.icon} {s.title}</p>
          {s.routes.map((r,ri)=><div key={ri} style={{ background:"#fafaf8", borderRadius:8, padding:"16px 18px", marginBottom:8, border:"1px solid #f0efe8" }}>
            <p style={{ fontSize:16, fontWeight:700, color:"#222", marginBottom:2 }}>{r.name}</p>
            <p style={{ fontSize:13, color:"#aaa", marginBottom:10 }}>{r.detail}</p>
            {r.info.map((t,ti)=><p key={ti} style={{ fontSize:15, color:"#666", lineHeight:1.7, paddingLeft:10, borderLeft:`2px solid ${d.accent}30` }}>{t}</p>)}
            {r.links && r.links.length > 0 && (
              <div style={{ display:"flex", gap:6, marginTop:10, flexWrap:"wrap" }}>
                {r.links.map((ln,li)=>(
                  <a key={li} href={ln.href} target="_blank" rel="noopener noreferrer" style={{
                    fontSize:13, fontWeight:600, padding:"7px 11px", borderRadius:6,
                    background:"#fff", border:`1px solid ${d.accent}33`, color:d.accent,
                    textDecoration:"none", display:"inline-flex", alignItems:"center", gap:4,
                    whiteSpace:"nowrap",
                  }}>{ln.icon||"🗺️"} {ln.label}</a>
                ))}
              </div>
            )}
          </div>)}
        </div>)}
      </div>}

      {panel==="checklist"&&<div style={{ padding:"0 16px 20px", animation:"fin 0.3s" }}>
        {/* 항목 추가 입력창 (상단) */}
        <div style={{ display:"flex", gap:6, marginBottom:12 }}>
          <input
            type="text"
            value={todoInput}
            onChange={e=>setTodoInput(e.target.value)}
            onKeyDown={e=>{ if(e.key==="Enter") addTodo(); }}
            placeholder="새 할 일 입력 후 Enter 또는 추가"
            style={{
              flex:1, padding:"12px 14px", borderRadius:7, fontSize:16,
              border:`1.5px solid ${d.accent}33`, background:"#fff", color:"#333",
              fontFamily:"inherit", outline:"none",
            }}
            onFocus={e=>e.currentTarget.style.borderColor=d.accent}
            onBlur={e=>e.currentTarget.style.borderColor=`${d.accent}33`}
          />
          <button onClick={addTodo} disabled={!todoInput.trim()} style={{
            padding:"0 16px", borderRadius:7, fontSize:15, fontWeight:700,
            cursor: todoInput.trim() ? "pointer" : "not-allowed",
            border:"none", background: todoInput.trim() ? d.accent : "#e7e7e3",
            color:"#fff", transition:"all 0.15s",
            whiteSpace:"nowrap", flexShrink:0, minWidth:64,
          }}>+ 추가</button>
        </div>

        {/* 진행률 */}
        {allTodos.length > 0 && (
          <div style={{ marginBottom:10, padding:"10px 14px", borderRadius:7, background:`${d.accent}08`, display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ flex:1 }}>
              <p style={{ fontSize:13, color:"#888", fontWeight:600, marginBottom:5 }}>진행 {doneCount}/{allTodos.length}</p>
              <div style={{ height:5, borderRadius:2, background:"#eee", overflow:"hidden" }}>
                <div style={{ height:"100%", width: `${(doneCount/allTodos.length)*100}%`, background:d.accent, transition:"width 0.3s" }}/>
              </div>
            </div>
            <span style={{ fontSize:13, fontWeight:700, color:d.accent }}>{Math.round((doneCount/allTodos.length)*100)}%</span>
          </div>
        )}

        {/* 항목 리스트 */}
        <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
          {allTodos.length === 0 && (
            <div style={{ padding:"32px 16px", textAlign:"center", color:"#bbb", fontSize:16, background:"#fafaf8", borderRadius:8, border:"1px dashed #e7e7e3" }}>
              할 일이 비어 있습니다.<br/>위에서 새 항목을 추가하세요.
            </div>
          )}
          {allTodos.map((c)=>{
            const done = !!todoState.checked[c.id];
            return (
              <div key={c.id} onClick={()=>toggleTodo(c.id)} style={{
                display:"flex", alignItems:"center", gap:13, padding:"12px 14px",
                background: done ? "#f4f4f2" : "#fafaf8",
                borderRadius:8, border:`1px solid ${done?"#e8e8e4":"#f0efe8"}`,
                cursor:"pointer", transition:"all 0.15s",
              }}>
                <div style={{
                  width:34, height:34, borderRadius:6, flexShrink:0, fontSize:20,
                  background: done ? "#ececea" : `${d.accent}10`,
                  display:"flex", alignItems:"center", justifyContent:"center",
                  filter: done ? "grayscale(0.6) opacity(0.6)" : "none",
                }}>{c.ic}</div>
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ fontSize:16, fontWeight:700, color: done?"#aaa":"#222", textDecoration: done?"line-through":"none", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{c.t}</p>
                  <p style={{ fontSize:13, color:"#aaa", marginTop:2, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{c.s}</p>
                </div>
                <button onClick={(e)=>{e.stopPropagation(); removeTodo(c.id, !!c.custom);}} title="삭제" style={{
                  width:22, height:22, borderRadius:4, border:"none", background:"transparent",
                  color:"#ccc", fontSize:19, cursor:"pointer", flexShrink:0, padding:0, lineHeight:1,
                }}
                  onMouseEnter={e=>e.currentTarget.style.color="#c44"}
                  onMouseLeave={e=>e.currentTarget.style.color="#ccc"}
                >×</button>
                <div style={{
                  width:22, height:22, borderRadius:5, flexShrink:0,
                  background: done ? d.accent : "#fff",
                  border: `1.5px solid ${done?d.accent:"#ddd"}`,
                  display:"flex", alignItems:"center", justifyContent:"center",
                  fontSize:13, color:"#fff", fontWeight:700, transition:"all 0.15s",
                }}>{done && "✓"}</div>
              </div>
            );
          })}
        </div>

        {/* 기본 항목 복원 */}
        {todoState.removed?.length > 0 && (
          <button onClick={restoreDefaults} style={{
            marginTop:10, width:"100%", padding:"9px 0", borderRadius:6, fontSize:14, fontWeight:600,
            border:"1px dashed #ddd", background:"transparent", color:"#888", cursor:"pointer",
          }}>↺ 삭제한 기본 항목 복원 ({todoState.removed.length}개)</button>
        )}
      </div>}

      <div style={{ padding:"4px 18px 2px", display:"flex", alignItems:"baseline", gap:10 }}>
        <span style={{ fontSize:23, fontWeight:800, color:"#111" }}>{d.date}</span>
        <span style={{ fontSize:15, color:d.accent, fontWeight:500 }}>{d.title}</span>
      </div>

      <div style={{ padding:"10px 12px 130px 12px" }}>
        {d.events.map((ev,i)=>{
          const isO=open===`${day}-${i}`, isH=ev.type==="highlight", col=TM[ev.type]||TM.sightseeing;
          return <div key={`${day}-${i}`} style={{
            animation:`fin 0.35s ease ${i*0.03}s both`, marginBottom:2,
            border: isO?"1.5px solid #eee":"1.5px solid transparent",
            borderRadius: 6, transition:"border-color 0.2s",
          }}>
            <button onClick={()=>setOpen(isO?null:`${day}-${i}`)} style={{
              width:"100%", textAlign:"left", cursor:"pointer", display:"flex", gap:10, alignItems:"flex-start",
              padding:"14px 16px", borderRadius:6, transition:"all 0.2s",
              border:"none", background:"transparent",
            }}>
              <div style={{ width:38, flexShrink:0, textAlign:"right", paddingTop:1 }}>
                <div style={{ fontSize:17, fontWeight:700, color:"#bbb", fontVariantNumeric:"tabular-nums", letterSpacing:-0.5 }}>{ev.time}</div>
                {ev.end&&<div style={{ fontSize:12, color:"#ddd", marginTop:1, fontVariantNumeric:"tabular-nums" }}>{ev.end}</div>}
              </div>
              <div style={{ display:"flex", flexDirection:"column", alignItems:"center", paddingTop:6, width:10, flexShrink:0 }}>
                <div style={{ width:6, height:6, borderRadius:"50%", background:col+"44" }}/>
                {i<d.events.length-1&&!isO&&<div style={{ width:1.5, flex:1, minHeight:8, background:"#f0f0ec", marginTop:4 }}/>}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                  <span style={{ flex:1, fontSize:17, fontWeight:500, color:"#444", lineHeight:1.4 }}>{ev.title}</span>
                  <svg width="10" height="10" viewBox="0 0 10 10" style={{ transform:isO?"rotate(180deg)":"", transition:"transform 0.2s", flexShrink:0, opacity:0.2 }}><path d="M2 3.5L5 6.5L8 3.5" stroke="#333" strokeWidth="1.5" fill="none" strokeLinecap="round"/></svg>
                </div>
                <p style={{ fontSize:14, color:"#aaa", marginTop:3, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                  {memos[memoKey(day,i)] && <span style={{ marginRight:5 }}>📝</span>}
                  {ev.location}
                </p>
              </div>
            </button>
            {isO && <div style={{ animation:"fin 0.25s", padding:"4px 16px 16px 16px" }}>
                  {ev.photo&&<div style={{ borderRadius:8, overflow:"hidden", marginBottom:14, height:150, background:`linear-gradient(135deg, ${d.accent}25, ${d.accent}55)`, position:"relative", display:"flex", alignItems:"center", justifyContent:"center" }}>
                    <span style={{ fontSize:60, opacity:0.45, position:"absolute", filter:"grayscale(0.2)" }}>{d.emoji}</span>
                    <img src={ev.photo} alt="" loading="lazy" referrerPolicy="no-referrer" style={{ width:"100%", height:"100%", objectFit:"cover", display:"block", position:"relative", zIndex:1 }} onError={e=>{e.currentTarget.style.display="none"}}/>
                  </div>}
                  <p style={{ fontSize:14, color:"#aaa", marginBottom:10, display:"flex", gap:5, lineHeight:1.5 }}>
                    <span style={{ color:d.accent }}>⌖</span>{ev.address}
                  </p>

                  {/* 구글 지도 버튼 */}
                  <div style={{ display:"flex", gap:6, marginBottom:ev.links?.length ? 8 : 12 }}>
                    <a href={mapsUrl(ev.address, ev.location)} target="_blank" rel="noopener noreferrer" style={{
                      flex:1, padding:"10px 8px", borderRadius:6, fontSize:13, fontWeight:600,
                      background:"#fff", border:`1px solid ${d.accent}33`, color:d.accent,
                      textAlign:"center", textDecoration:"none", display:"flex", alignItems:"center", justifyContent:"center", gap:4,
                      whiteSpace:"nowrap", minWidth:0,
                    }}>📍 지도</a>
                    <a href={directionsUrl(ev.address, ev.location)} target="_blank" rel="noopener noreferrer" style={{
                      flex:1, padding:"10px 8px", borderRadius:6, fontSize:13, fontWeight:600,
                      background:d.accent, border:`1px solid ${d.accent}`, color:"#fff",
                      textAlign:"center", textDecoration:"none", display:"flex", alignItems:"center", justifyContent:"center", gap:4,
                      whiteSpace:"nowrap", minWidth:0,
                    }}>🧭 길찾기</a>
                  </div>

                  {/* 외부 링크 (예약/공식 사이트 등) */}
                  {ev.links && ev.links.length > 0 && (
                    <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:12 }}>
                      {ev.links.map((ln, li) => (
                        <a key={li} href={ln.href} target="_blank" rel="noopener noreferrer" style={{
                          flex:"1 1 auto", padding:"10px 12px", borderRadius:6, fontSize:13, fontWeight:600,
                          background:`${d.accent}10`, border:`1px solid ${d.accent}40`, color:d.accent,
                          textAlign:"center", textDecoration:"none", display:"inline-flex", alignItems:"center", justifyContent:"center", gap:5,
                          whiteSpace:"nowrap",
                        }}>{ln.icon || "🔗"} {ln.label}</a>
                      ))}
                    </div>
                  )}

                  <p style={{ fontSize:16, color:"#555", lineHeight:1.9, whiteSpace:"pre-line" }}>{ev.description}</p>

                  {/* ── TRANSIT INFO ── */}
                  {ev.transit && ev.transit.length > 0 && (
                    <div style={{ marginTop:14, background:"#f8f8f6", borderRadius:7, padding:"14px 16px", border:"1px solid #f0efe8" }}>
                      <p style={{ fontSize:13, fontWeight:700, color:"#888", marginBottom:10, letterSpacing:0.5 }}>🧭 이동 경로</p>
                      <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                        {ev.transit.map((tr,ti)=>(
                          <div key={ti} style={{ display:"flex", gap:10, alignItems:"flex-start" }}>
                            <div style={{
                              width:28, height:28, borderRadius:5, flexShrink:0, marginTop:1,
                              background: `${MI[tr.mode]||"#888"}12`,
                              border: `1px solid ${MI[tr.mode]||"#888"}25`,
                              display:"flex", alignItems:"center", justifyContent:"center",
                              fontSize:17,
                            }}>{tr.icon}</div>
                            <div style={{ flex:1, minWidth:0 }}>
                              <p style={{ fontSize:15, fontWeight:700, color:"#444", marginBottom:2 }}>{tr.label}</p>
                              <p style={{ fontSize:14, color:"#888", lineHeight:1.65, whiteSpace:"pre-line" }}>{tr.detail}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {ev.tip&&<div style={{ marginTop:12, padding:"11px 14px", background:`${d.accent}08`, borderRadius:7, fontSize:15, color:d.accent, lineHeight:1.6, display:"flex", gap:6, fontWeight:500 }}>
                    <span style={{ flexShrink:0 }}>💡</span><span>{ev.tip}</span>
                  </div>}

                  {/* ── MEMO ── */}
                  {(() => {
                    const k = memoKey(day, i);
                    const has = !!memos[k];
                    const isEdit = editing === k;
                    const flash = savedFlash === k;
                    return (
                      <div style={{ marginTop:12 }}>
                        {!isEdit && has && (
                          <div style={{ padding:"12px 14px", background:"#fffbe9", border:"1px solid #f3e7b8", borderRadius:7, position:"relative" }}>
                            <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:6 }}>
                              <span style={{ fontSize:13, fontWeight:700, color:"#a07b1e", letterSpacing:0.3 }}>📝 내 메모</span>
                              {flash && <span style={{ fontSize:12, color:"#3a9a4f", fontWeight:600 }}>저장됨 ✓</span>}
                              <span style={{ flex:1 }} />
                              <button onClick={()=>startEdit(k)} title="편집" style={{
                                background:"transparent", border:"none", color:"#bbb", fontSize:13, fontWeight:500,
                                cursor:"pointer", padding:"2px 4px", opacity:0.6, transition:"opacity 0.2s",
                              }}
                                onMouseEnter={e=>e.currentTarget.style.opacity=1}
                                onMouseLeave={e=>e.currentTarget.style.opacity=0.6}
                              >편집</button>
                            </div>
                            <p style={{ fontSize:16, color:"#5a4a1d", lineHeight:1.7, whiteSpace:"pre-wrap", wordBreak:"break-word" }}>{memos[k]}</p>
                          </div>
                        )}
                        {!isEdit && !has && (
                          <button onClick={()=>startEdit(k)} style={{
                            width:"100%", padding:"11px 14px", borderRadius:7, fontSize:15, fontWeight:600,
                            border:`1px dashed ${d.accent}55`, background:`${d.accent}06`, color:d.accent, cursor:"pointer",
                            display:"flex", alignItems:"center", justifyContent:"center", gap:6,
                          }}>📝 메모 추가</button>
                        )}
                        {isEdit && (
                          <div style={{ padding:"12px 14px", background:"#fffbe9", border:"1px solid #f3e7b8", borderRadius:7 }}>
                            <p style={{ fontSize:13, fontWeight:700, color:"#a07b1e", letterSpacing:0.3, marginBottom:8 }}>📝 메모 작성</p>
                            <textarea
                              value={draft}
                              onChange={e=>setDraft(e.target.value)}
                              placeholder="예약 번호, 동행자 메모, 변경사항 등을 자유롭게 적어두세요..."
                              autoFocus
                              style={{
                                width:"100%", minHeight:80, resize:"vertical", padding:"10px 12px",
                                fontSize:16, fontFamily:"inherit", lineHeight:1.6, color:"#3a2f10",
                                border:"1px solid #e7d99a", borderRadius:5, background:"#fff", outline:"none",
                              }}
                            />
                            <div style={{ display:"flex", gap:6, marginTop:10, alignItems:"center" }}>
                              {has && (
                                <button onClick={()=>deleteMemo(k)} style={{ padding:"7px 11px", borderRadius:5, border:"1px solid #f0d3d3", background:"#fff", color:"#c44", fontSize:14, fontWeight:600, cursor:"pointer", whiteSpace:"nowrap", flexShrink:0 }}>삭제</button>
                              )}
                              <span style={{ flex:1 }} />
                              <button onClick={cancelEdit} style={{ padding:"7px 13px", borderRadius:5, border:"1px solid #ddd", background:"#fff", color:"#666", fontSize:14, fontWeight:600, cursor:"pointer", whiteSpace:"nowrap", flexShrink:0 }}>취소</button>
                              <button onClick={()=>saveMemo(k)} style={{ padding:"7px 13px", borderRadius:5, border:"none", background:d.accent, color:"#fff", fontSize:14, fontWeight:700, cursor:"pointer", whiteSpace:"nowrap", flexShrink:0 }}>저장</button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>}
          </div>
        })}
      </div>

      <div style={{ position:"fixed", bottom:0, left:"50%", transform:"translateX(-50%)", width:"100%", maxWidth:480, background:"linear-gradient(transparent, #fff 40%)", padding:"40px 0 22px", display:"flex", justifyContent:"center", gap:6, pointerEvents:"none" }}>
        {DAYS.map((dd,i)=><button key={i} onClick={()=>{setDay(i);setOpen(null);setPanel(null)}} style={{
          width:day===i?24:6, height:6, borderRadius:2, border:"none",
          background:day===i?dd.accent:"#ddd", cursor:"pointer", transition:"all 0.35s", pointerEvents:"auto",
        }}/>)}
      </div>
    </div>
  );
}
