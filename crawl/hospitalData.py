from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
import time
import json

# 🚀 크롬 드라이버 설정
service = Service(ChromeDriverManager().install())
driver = webdriver.Chrome(service=service)

# 1️⃣ 관리자 페이지 로그인
"""
login_url = "http://localhost:8081/admin"
driver.get(login_url)
time.sleep(2)


username_input = driver.find_element(By.XPATH, "//input[@placeholder='아이디를 입력하세요']")
username_input.send_keys("admin")

password_input = driver.find_element(By.XPATH, "//input[@placeholder='비밀번호를 입력하세요']")
password_input.send_keys("1234")

login_button = driver.find_element(By.XPATH, "//button[contains(text(),'로그인')]")
login_button.click()
time.sleep(3)
"""

admin_window = driver.current_window_handle


# 2️⃣ 새로운 창에서 ChatGPT 로그인
driver.execute_script("window.open('https://chatgpt.com/auth/login', '_blank');")
time.sleep(3)

# 모든 창 핸들 가져오기
window_handles = driver.window_handles

# ChatGPT 로그인 페이지 열기
driver.execute_script("window.open('https://chatgpt.com/auth/login', '_blank');")
time.sleep(3)

# 모든 창 핸들 가져오기
admin_window = driver.current_window_handle
window_handles = driver.window_handles

# 새 창으로 전환
for handle in window_handles:
    if handle != admin_window:
        driver.switch_to.window(handle)
        break

# 페이지 로딩 완료 대기
WebDriverWait(driver, 10).until(
    lambda driver: driver.execute_script("return document.readyState") == "complete"
)

# 로그인 버튼 존재 확인 및 클릭
try:
    login_button = WebDriverWait(driver, 10).until(
        EC.element_to_be_clickable((By.XPATH, "//button[contains(text(), '로그인')] | //button[contains(text(), 'Log in')]"))
    )
    print("✅ 로그인 버튼 찾기 성공!")
    login_button.click()
    print("✅ 로그인 버튼 클릭 완료")
except Exception as e:
    print("❌ 로그인 버튼을 찾을 수 없음:", str(e))
    driver.quit()
    exit()

# 로그인 성공 여부 확인 (로그인 페이지에서 이메일/비밀번호 입력 필드가 나오는지 확인)
try:
    WebDriverWait(driver, 10).until(
        EC.presence_of_element_located((By.NAME, "email"))
    )
    print("✅ 로그인 페이지 로딩 완료")
except:
    print("❌ 로그인 페이지가 로드되지 않음")
    driver.quit()
    exit()
    
# 이메일 입력
email_input = WebDriverWait(driver, 10).until(
    EC.presence_of_element_located((By.XPATH, "//input[@type='email']"))
)
email_input.send_keys("molba06@naver.com")
email_input.send_keys(Keys.RETURN)

# 비밀번호 입력
password_input = WebDriverWait(driver, 10).until(
    EC.presence_of_element_located((By.XPATH, "//input[@type='password']"))
)
password_input.send_keys("ehsqjfwk123!")
password_input.send_keys(Keys.RETURN)# 2️⃣ 병원 리스트 페이지 이동

driver.switch_to.window(admin_window)
hospitals_url = "http://localhost:8081/admin/hospitals"
driver.get(hospitals_url)
time.sleep(3)


# 3️⃣ 전체 병원 목록 처리 시작
hospital_count = 0
while True:
    try:
        # 테이블 로딩 대기
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.XPATH, "//table[contains(@class,'min-w-full')]")
        ))

        # 현재 페이지에서 '수정' 버튼이 있는 병원 찾기
        rows = driver.find_elements(By.XPATH, "//table//tbody/tr[.//td[contains(@class, 'time-value')]//button[contains(text(),'입력')]]")

        if not rows:
            print("📌 현재 페이지에 '수정' 버튼이 없습니다.")
            try:
                next_page = WebDriverWait(driver, 3).until(
                    EC.element_to_be_clickable((By.XPATH, "//button[contains(text(),'다음') and not(@disabled)]"))
                )
                print("➡️ '다음 페이지' 버튼을 클릭합니다.")
                next_page.click()
                time.sleep(3)
                continue
            except:
                print("✅ 모든 병원 처리 완료!")
                break

        print(f"🔹 현재 페이지 처리할 병원 수: {len(rows)}")

        for row in rows:
            try:
                hospital_name = row.find_element(By.XPATH, "./td[1]").text
                hospital_address = row.find_element(By.XPATH, "./td[2]").text
                print(f"\n🏥 처리 중: {hospital_name} ({hospital_count+1}번째)")

                # '수정' 버튼 클릭
                edit_button = row.find_element(By.XPATH, ".//button[contains(text(),'수정')]")
                edit_button.click()

                # 팝업이 열릴 때까지 대기
                WebDriverWait(driver, 10).until(
                    EC.presence_of_element_located((By.XPATH, "//h2[contains(text(),'Time 입력/수정')]")
                ))

                # JSON 데이터 가져오기
                json_textarea = driver.find_element(By.XPATH, "//textarea[contains(@class,'border rounded px-2 py-1 w-full h-32')]")
                json_data = json.loads(json_textarea.get_attribute("value"))
                
                # 필수 키 확인
                required_keys = {"_id", "ykiho", "__v"}
                if set(json_data.keys()) != required_keys:
                    print(f"🚨 {hospital_name}의 JSON 데이터가 요구된 형식과 다릅니다. 수정 취소.")
                    cancel_button = driver.find_element(By.XPATH, "//button[contains(text(),'취소')]")
                    cancel_button.click()
                    time.sleep(2)
                    continue
                
                hospital_id = json_data.get("_id")
                ykiho = json_data.get("ykiho")
                print(f"🆔 병원 ID: {hospital_id}, YKIHO: {ykiho}")
                
                # 저장 버튼 클릭
                save_button = driver.find_element(By.XPATH, "//button[contains(text(),'저장')]")
                save_button.click()
                
                hospital_count += 1
                time.sleep(2)

            except Exception as e:
                print(f"❌ {hospital_name} 처리 중 오류 발생: {e}")

        try:
            next_page = WebDriverWait(driver, 3).until(
                EC.element_to_be_clickable((By.XPATH, "//button[contains(text(),'다음') and not(@disabled)]"))
            )
            print("➡️ '다음 페이지' 버튼을 클릭합니다.")
            next_page.click()
            time.sleep(3)
        except:
            print("✅ 마지막 페이지 도달, 모든 병원 입력 완료")
            break

    except Exception as e:
        print(f"🚨 오류 발생: {e}")
        break

driver.quit()
