from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager
import pandas as pd
import time
from bs4 import BeautifulSoup

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
            print("Default 병원(상급종합병원) 처리 중...")
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

            time.sleep(2)
            
            hospitals = WebDriverWait(driver, 10).until(
            EC.visibility_of_all_elements_located((By.CSS_SELECTOR, "ul.mapResult li"))
            )
            
            print(f"병원 목록 로드 완료: {len(hospitals)}개 병원")

            time.sleep(2);
            for hospital in hospitals:
                title_tag = hospital.find_element(By.CSS_SELECTOR, "a.tit")
                title_text = title_tag.text.strip()
                # 병원 상세 페이지 이동
                driver.execute_script("arguments[0].click();", title_tag)

                original_window = driver.current_window_handle # 기존 창 저장 

                WebDriverWait(driver, 10).until(EC.new_window_is_opened)

                # 새 창 핸들로 전환
                for handle in driver.window_handles:
                    if handle != original_window:
                        driver.switch_to.window(handle)
                        break
                
                # 상세 페이지 로드 대기
                WebDriverWait(driver, 10).until(
                    EC.visibility_of_element_located((By.CSS_SELECTOR, "ul.pop_hos_list li"))
                )
                # 기본 정보 가져오기
                details_list = driver.find_elements(By.CSS_SELECTOR, "ul.pop_hos_list li")
                
                # 요소가 비어 있는지 확인
                if details_list:
                    print(f"디테일 값의 개수: {len(details_list)}")
                    address, phone, homepage, grade = None, None, None, None
                    for idx, detail in enumerate(details_list):
                        try:
                            span_elements = detail.find_elements(By.CSS_SELECTOR, "span")
                            p_elements = detail.find_elements(By.CSS_SELECTOR, "p")

                            if span_elements and p_elements:
                                label = span_elements[0].text.strip()
                                value = p_elements[0].text.strip()
                                print(f"디테일 {idx + 1}: {label} - {value}")
                                # 필요한 정보만 저장
                                if "주소" in label:
                                    address = value
                                elif "전화번호" in label:
                                    phone = value
                                elif "홈페이지" in label:
                                    homepage = value
                                elif "병원구분" in label:
                                    grade = value
                            else:
                                print(f"디테일 {idx + 1}: 비어 있는 항목입니다.")
                        except Exception as e:
                            print(f"디테일 {idx + 1}: 처리 중 오류 발생 - {e}")
                else:
                    print("디테일 값을 찾을 수 없습니다.")

                # 이후 로직에서 추가 DOM 탐색 방지
                print("모든 항목 처리가 완료되었습니다.")
                # 진료 시간 클릭
                link_element = WebDriverWait(driver, 10).until(
                    EC.presence_of_element_located((By.CSS_SELECTOR, "a[href='#stab01-2']"))
                )
                driver.execute_script("arguments[0].click();", link_element)
                # 진료시간 크롤링
                
                # 진료시간 정보를 가져오기 위한 딕셔너리
                schedule_info = {
                    "월요일": "trmtMon",
                    "화요일": "trmtTue",
                    "수요일": "trmtWed",
                    "목요일": "trmtThu",
                    "금요일": "trmtFri",
                    "토요일": "trmtSat",
                    "일요일": "trmtSun",
                }

                # 점심시간 정보를 가져오기 위한 딕셔너리
                lunch_info = {
                    "월~금": "lunchWeek",
                    "토요일": "lunchSat",
                    "일요일": "lunchSun",
                }

                # 접수시간 정보를 가져오기 위한 딕셔너리
                reception_info = {
                    "월~금": "rcvWeek",
                    "토요일": "rcvSat",
                    "일요일": "rcvSun",
                }

                # 진료시간 가져오기
                print("진료시간:")
                for day, element_id in schedule_info.items():
                    try:
                        time_element = driver.find_element(By.ID, element_id)
                        time_text = time_element.text.strip() if time_element.text.strip() else "-"
                    except Exception as e:
                        time_text = "-"  # 요소가 없거나 에러 발생 시 기본값 '-'
                    print(f"{day}: {time_text}")

                # 점심시간 가져오기
                print("\n점심시간:")
                for day, element_id in lunch_info.items():
                    try:
                        lunch_element = driver.find_element(By.ID, element_id)
                        lunch_text = lunch_element.text.strip() if lunch_element.text.strip() else "-"
                    except Exception as e:
                        lunch_text = "-"
                    print(f"{day}: {lunch_text}")

                # 접수시간 가져오기
                print("\n접수시간:")
                for day, element_id in reception_info.items():
                    try:
                        reception_element = driver.find_element(By.ID, element_id)
                        reception_text = reception_element.text.strip() if reception_element.text.strip() else "-"
                    except Exception as e:
                        # 요소가 없거나 예외 발생 시 빈 값으로 처리
                        print(f"오류 발생 (day: {day}, element_id: {element_id}) - {e}")
                        reception_text = "-"
                    print(f"{day}: {reception_text}")
                    
                # 데이터 저장
                data.append({
                    "병원명": title_text,
                    "종류": grade,
                    "전화번호": phone,
                    "주소": address,
                    "홈페이지": homepage
                })
                print(data);
                # 뒤로가기
                driver.back()
                
                # 방문한 병원 ID 추가
                #visited.append(hosp_type["id"])
        else:
            label = WebDriverWait(driver, 10).until(
                EC.element_to_be_clickable((By.CSS_SELECTOR, f"label[for='{hosp_type['id']}']"))
            )
            label.click()
            time.sleep(2)

            is_selected = driver.find_element(By.ID, hosp_type["id"]).is_selected()
            if not is_selected:
                label.click()
                time.sleep(2)

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
        soup = BeautifulSoup(driver.page_source, "html.parser")
        hospitals = soup.select("ul.mapResult li")

        for hospital in hospitals:
            title_tag = hospital.select_one("a.tit")
            title = title_tag.text.strip()

            # 세부정보 추출
            info_tag = hospital.select_one("p.subInfo")
            details = info_tag.find_all("span")
            grade = details[1].text.strip()
            phone = details[3].text.strip()
            address = details[5].text.strip()

            # 병원 상세 페이지 이동
            driver.execute_script("arguments[0].click();", title_tag)
            time.sleep(3)

            # 진료시간 크롤링
            detail_soup = BeautifulSoup(driver.page_source, "html.parser")
            time_table = detail_soup.select("table.tbl_default tbody tr")
            treatment_times = {}

            for row in time_table:
                columns = row.find_all("td")
                if len(columns) == 2:
                    day = row.find("th").text.strip()
                    time_info = columns[1].text.strip()
                    treatment_times[day] = time_info

            # 데이터 저장
            data.append({
                "병원명": title,
                "종류": grade,
                "전화번호": phone,
                "주소": address,
                "진료시간": treatment_times
            })

            # 뒤로가기
            driver.back()
            time.sleep(2)

        # 방문한 병원 ID 추가
        visited.append(hosp_type["id"])

    except Exception as e:
        print(f"오류 발생: {e}")

# 드라이버 종료
driver.quit()

# DataFrame으로 변환 후 엑셀 저장# DataFrame으로 변환 후 CSV 저장
df = pd.DataFrame(data)
df.to_csv("hira_hospitals_details.csv", index=False, encoding="utf-8-sig")  # UTF-8 인코딩으로 CSV 저장
print("크롤링 완료, 데이터가 hira_hospitals_details.csv에 저장되었습니다.")

