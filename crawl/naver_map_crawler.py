from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager
import pandas as pd
import time

# 크롬 드라이버 설정
service = Service(ChromeDriverManager().install())
driver = webdriver.Chrome(service=service)

# 사이트 접속
url = "https://www.hira.or.kr/ra/hosp/getHealthMap.do?pgmid=HIRAA030002010000"
driver.get(url)
time.sleep(3)

# 병원 종류별 찾기 탭 클릭
view_tab = WebDriverWait(driver, 10).until(
    EC.element_to_be_clickable((By.ID, "viewTab2"))
)
view_tab.click()
time.sleep(2)

# 병원 종류 목록
hospital_types = [
    {"id": "gubun111294", "name": "상급종합병원"},
    {"id": "gubun111061", "name": "종합병원"},
    {"id": "gubun111109", "name": "요양병원"},
    {"id": "gubun116086", "name": "정신병원"},
    {"id": "gubun111121", "name": "병원"},
    {"id": "gubun111148", "name": "의원"},
    {"id": "gubun111176", "name": "치과"},
    {"id": "gubun111177", "name": "한방"},
    {"id": "gubun111178", "name": "보건기관"},
    {"id": "gubun111179", "name": "조산원"},
    {"id": "gubun111345", "name": "약국"}
]

# 방문 체크 리스트
visited = []

# 데이터를 저장할 리스트
data = []

# 병원 종류 순회
for hosp_type in hospital_types:
    try:
        # 이미 방문한 병원은 스킵
        if hosp_type["id"] in visited:
            continue

        print(f"병원 종류 선택: {hosp_type['name']}")

        # 병원 선택 처리
        if hosp_type["id"] == "gubun111294":
            # 상급종합병원은 기본 선택 상태이므로 처리 필요
            print("Default 병원(상급종합병원) 처리 중...")
            # 전체선택 클릭
            select_all = WebDriverWait(driver, 10).until(
                EC.element_to_be_clickable((By.ID, "chkAll_shwSbjtCds"))
            )
            select_all.click()
            time.sleep(2)

        else:
            # 다른 병원 선택 (label 클릭)
            label = WebDriverWait(driver, 10).until(
                EC.element_to_be_clickable((By.CSS_SELECTOR, f"label[for='{hosp_type['id']}']"))
            )
            label.click()
            time.sleep(2)

            # 선택 상태 확인
            is_selected = driver.find_element(By.ID, hosp_type["id"]).is_selected()
            print(f"병원 선택 여부: {is_selected}")

            # 선택되지 않았다면 다시 클릭 (예외 처리)
            if not is_selected:
                label.click()
                time.sleep(2)

            # 전체선택 클릭
            select_all_label = WebDriverWait(driver, 10).until(
                EC.element_to_be_clickable((By.CSS_SELECTOR, "label[for='chkAll_shwSbjtCds']"))
            )
            select_all_label.click()

            time.sleep(2)

        # 검색 버튼 클릭
        search_button = WebDriverWait(driver, 10).until(
            EC.element_to_be_clickable((By.CSS_SELECTOR, ".btn_black"))
        )
        search_button.click()
        time.sleep(5)

        # 데이터 크롤링 (검색 결과)
        hospital_list = driver.find_elements(By.CSS_SELECTOR, ".mapResult.homeResult li")

        for hospital in hospital_list:
            try:
                name = hospital.find_element(By.CLASS_NAME, "tit").text
                address_element = hospital.find_element(By.CSS_SELECTOR, "span.icon-home")
                address = address_element.text if address_element else "주소 없음"

                # 상세보기 클릭
                hospital.find_element(By.CLASS_NAME, "tit").click()
                time.sleep(3)

                # 상세 정보 추출
                details = driver.find_element(By.CLASS_NAME, "pop_hos_list").text

                # 데이터 저장
                data.append({
                    "종류": hosp_type["name"],
                    "병원명": name,
                    "주소": address,
                    "상세정보": details
                })

                # 뒤로가기
                driver.back()
                time.sleep(3)

            except Exception as e:
                print(f"Error with hospital details: {e}")
                driver.back()
                time.sleep(3)
                continue

        # 방문 리스트에 추가
        visited.append(hosp_type["id"])

    except Exception as e:
        print(f"Error with hospital type {hosp_type['name']}: {e}")
        continue

# 드라이버 종료
driver.quit()

# DataFrame으로 변환 후 엑셀 저장
df = pd.DataFrame(data)
df.to_excel("hira_hospitals_details.xlsx", index=False, encoding="utf-8")
print("크롤링 완료, 데이터가 hira_hospitals_details.xlsx에 저장되었습니다.")