from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.common.keys import Keys
import time

def convert_time(time_str):
    """
    예: "오전 07:00" → "0700", "오후 07:00" → "1900"로 변환
    """
    try:
        period, t = time_str.split()
        hour, minute = t.split(':')
        hour = int(hour)
        minute = int(minute)
        if period == "오후" and hour != 12:
            hour += 12
        elif period == "오전" and hour == 12:
            hour = 0
        return f"{hour:02d}{minute:02d}"
    except Exception as e:
        print("시간 변환 오류:", e)
        return ""

# 크롬 드라이버 설정 및 관리자 페이지 접속
service = Service(ChromeDriverManager().install())
driver = webdriver.Chrome(service=service)

# 1. 로그인 페이지 접속
login_url = "http://localhost:8081/admin"
driver.get(login_url)
time.sleep(2)

# 2. 아이디와 비밀번호 입력
username_input = driver.find_element(By.XPATH, "//input[@placeholder='아이디를 입력하세요']")
username_input.send_keys("admin")

password_input = driver.find_element(By.XPATH, "//input[@placeholder='비밀번호를 입력하세요']")
password_input.send_keys("1234")

# 3. 로그인 버튼 클릭
login_button = driver.find_element(By.XPATH, "//button[contains(text(),'로그인')]")
login_button.click()
time.sleep(3)

# 4. /admin/hospitals 페이지로 이동
hospitals_url = "http://localhost:8081/admin/hospitals"
driver.get(hospitals_url)
time.sleep(3)

while True:
    # 페이지 내 테이블 로딩 대기
    WebDriverWait(driver, 10).until(
        EC.presence_of_element_located((By.XPATH, "//table[contains(@class,'min-w-full')]"))
    )

    rows = driver.find_elements(By.XPATH, "//table//tbody/tr[.//td[contains(@class, 'time-value')]//button[contains(text(),'입력')]]")
 
    if rows:
        print(f"현재 페이지 처리할 병원 수: {len(rows)}")
        for row in rows:
            try:
                # 병원명 추출 (첫 번째 <td>)
                hospital_name = row.find_element(By.XPATH, "./td[1]").text
                print(f"\n처리 중: {hospital_name}")
                
                # '입력' 버튼 찾기 (행 내)
                input_button = row.find_element(By.XPATH, ".//button[contains(text(),'입력')]")
                
                # 새 탭을 열어 네이버 맵에서 영업시간 정보 가져오기
                driver.execute_script("window.open('');")
                driver.switch_to.window(driver.window_handles[-1])
                query = hospital_name;
                # ※ 네이버 맵 검색
                navermap_url = "https://map.naver.com/"
                driver.get(navermap_url)
                
                # 🟢 **1. iframe 내부로 이동 (네이버 지도는 iframe에서 동작)**
                WebDriverWait(driver, 10).until(EC.presence_of_element_located((By.TAG_NAME, "iframe")))
                iframe = driver.find_element(By.TAG_NAME, "iframe")
                driver.switch_to.frame(iframe)

                # 🔍 **2. 검색창 찾기 및 입력**
                search_input = WebDriverWait(driver, 10).until(
                    EC.presence_of_element_located((By.CSS_SELECTOR, "input.input_search1740621822549"))
                )
                search_input.clear()
                search_input.send_keys(query)
                search_input.send_keys(Keys.ENTER)
                
                # 2. 검색 결과 목록이 로딩되었는지 확인 (목록 컨테이너 ID: _pcmap_list_scroll_container)
                list_container = WebDriverWait(driver, 10).until(
                    EC.presence_of_element_located((By.ID, "_pcmap_list_scroll_container"))
                )

               # 🏥 **4. 검색 결과 목록 중 첫 번째 병원 클릭 (다른 방법으로 시도)**
                try:
                    first_hospital = WebDriverWait(driver, 10).until(
                        EC.element_to_be_clickable((By.XPATH, "(//li[contains(@class, 'VLTHu')]//a)[1]"))
                    )
                    first_hospital.click()
                except:
                    print("첫 번째 병원 클릭 실패, 대체 방법 사용")
                    hospitals = driver.find_elements(By.XPATH, "//li[contains(@class, 'VLTHu')]//a")
                    if hospitals:
                        hospitals[0].click()
                    else:
                        print("병원 리스트를 찾을 수 없음.")

                time.sleep(3)  # 상세 정보 패널 로딩 대기

                # ⏰ **5. 영업시간 정보 가져오기**
                try:
                    opening_hours = WebDriverWait(driver, 10).until(
                        EC.presence_of_element_located((By.XPATH, "//div[contains(@class, 'U7pYf')]"))
                    )
                    print("영업시간:", opening_hours.text)
                except:
                    print("영업시간 정보를 찾을 수 없습니다.")
                    
                working_hours = {}
                try:
                    # 검색 결과 리스트 컨테이너 로딩 대기
                    list_container = WebDriverWait(driver, 10).until(
                        EC.presence_of_element_located((By.ID, "_pcmap_list_scroll_container"))
                    )
                    time.sleep(2)  # 추가 로딩 대기
                    # 각 요일 정보가 포함된 요소들(예: div.w9QyJ)을 모두 찾음
                    day_elements = driver.find_elements(By.CSS_SELECTOR, "div.w9QyJ")
                    for elem in day_elements:
                        try:
                            day = elem.find_element(By.CSS_SELECTOR, "span.i8cJw").text.strip()
                            # 요일이 월, 화, 수, 목, 금, 토, 일 중 하나인지 확인
                            if day not in ["월", "화", "수", "목", "금", "토", "일"]:
                                continue
                            schedule_text = elem.find_element(By.CSS_SELECTOR, "span.H3ua4").text.strip()
                            # schedule_text 예: "08:30 - 17:30" 또는 "08:30 - 17:30\n12:30 - 13:30 휴게시간"
                            times = schedule_text.split("-")
                            if len(times) >= 2:
                                start_time = times[0].strip()
                                # 추가 텍스트(예: '휴게시간') 제거: 첫번째 단어만 사용
                                end_time = times[1].strip().split()[0]
                                
                                # 24시간 형식을 convert_time 함수가 처리할 수 있도록 오전/오후 표기로 변환
                                def convert_24_to_korean(time24):
                                    h, m = time24.split(":")
                                    h = int(h)
                                    period = "오전" if h < 12 else "오후"
                                    return f"{period} {h:02d}:{m}"
                                
                                start_korean = convert_24_to_korean(start_time)
                                end_korean = convert_24_to_korean(end_time)
                                converted_start = convert_time(start_korean)
                                converted_end = convert_time(end_korean)
                                working_hours[day] = f"{converted_start}~{converted_end}"
                        except Exception as inner_e:
                            print("하루 영업시간 추출 오류:", inner_e)
                    print("네이버 영업시간:", working_hours)
                except Exception as e:
                    print("네이버 맵에서 영업시간 정보를 찾지 못했습니다:", e)
                
                # 네이버 탭 닫고 메인 탭으로 전환
                driver.close()
                driver.switch_to.window(driver.window_handles[0])
                
                # '입력' 버튼 클릭 → 모달 팝업 열기
                input_button.click()
                WebDriverWait(driver, 10).until(
                    EC.presence_of_element_located((By.XPATH, "//h2[contains(text(),'Time 입력/수정')]"))
                )
                time.sleep(1)  # 모달 애니메이션 대기
                
                # 모달 내의 컨테이너를 기준으로 입력 필드 선택 (Subject 영역 제외)
                modal = WebDriverWait(driver, 10).until(
                    EC.presence_of_element_located((
                        By.XPATH, "//h2[contains(text(),'Time 입력/수정')]/ancestor::div[1]"
                    ))
                )
                
                # 요일별로 네이버에서 추출한 영업시간을 모달에 입력
                days_mapping = {
                    "월": "월요일",
                    "화": "화요일",
                    "수": "수요일",
                    "목": "목요일",
                    "금": "금요일",
                    "토": "토요일",
                    "일": "일요일"
                }
                for eng_day in ["월", "화", "수", "목", "금", "토", "일"]:
                    label_day = days_mapping.get(eng_day, eng_day)
                    if eng_day in working_hours:
                        try:
                            time_range = working_hours[eng_day]  # 예: "0800~1730"
                            start_str, end_str = time_range.split("~")
                            
                            # 모달 컨테이너 내에서만 검색하며, placeholder에 "Subject"가 포함된 입력은 제외
                            start_input = modal.find_element(By.XPATH, f".//label[contains(text(), '{label_day} 진료 시작')]/following-sibling::input[not(contains(@placeholder, 'Subject'))]")
                            end_input = modal.find_element(By.XPATH, f".//label[contains(text(), '{label_day} 진료 종료')]/following-sibling::input[not(contains(@placeholder, 'Subject'))]")
                            
                            start_input.clear()
                            start_input.send_keys(start_str)
                            end_input.clear()
                            end_input.send_keys(end_str)
                            print(f"{label_day}: 시작 {start_str}, 종료 {end_str}")
                        except Exception as e:
                            print(f"{label_day} 처리 중 오류 발생:", e)
                    else:
                        print(f"{label_day} 영업시간 정보 없음")
                
                # 모달에서 '저장' 버튼 클릭
                save_button = WebDriverWait(driver, 10).until(
                    EC.element_to_be_clickable((By.XPATH, "//button[contains(text(),'저장')]"))
                )
                save_button.click()
                time.sleep(2)
            except Exception as e:
                print("행 처리 중 오류 발생:", e)
    else:
        print("현재 페이지에 '입력' 처리할 항목이 없습니다.")
    
    # 다음 페이지로 이동 (활성화된 '다음' 버튼이 있으면)
    try:
        next_button = driver.find_element(By.XPATH, "//button[contains(text(),'다음') and not(@disabled)]")
        print("다음 페이지로 이동합니다.\n")
        next_button.click()
        time.sleep(3)
    except Exception as e:
        print("다음 페이지 버튼을 찾지 못했거나 더 이상 페이지가 없습니다:", e)
        break

driver.quit()
