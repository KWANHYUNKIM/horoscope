from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
import time

# 🚀 크롬 드라이버 설정
service = Service(ChromeDriverManager().install())
driver = webdriver.Chrome(service=service)

# 1️⃣ 관리자 페이지 로그인
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

# 2️⃣ 병원 리스트 페이지 이동
hospitals_url = "http://localhost:8081/admin/hospitals"
driver.get(hospitals_url)
time.sleep(3)

# 3️⃣ 직접 350번째 페이지로 이동
try:
    # 페이지 입력 필드 찾기
    page_input = WebDriverWait(driver, 5).until(
        EC.presence_of_element_located((By.XPATH, "//input[@type='number' and contains(@class,'text-center')]"))
    )

    # JavaScript로 값 변경
    driver.execute_script("arguments[0].value = arguments[1];", page_input, 350)

    # "이동" 버튼 클릭 (버튼이 존재하면 클릭)
    go_button = WebDriverWait(driver, 5).until(
        EC.element_to_be_clickable((By.XPATH, "//button[contains(text(),'이동')]"))
    )
    go_button.click()

    print("✅ 350번째 페이지로 이동 완료!")
    time.sleep(3)  # 페이지 로딩 대기

except Exception as e:
    print(f"🚨 페이지 입력 필드 또는 버튼을 찾을 수 없음: {e}")
    # JavaScript 강제 실행 (입력 필드가 없는 경우 대비)
    driver.execute_script("""
        let pageInput = document.querySelector("input[type='number'].text-center");
        if (pageInput) {
            pageInput.value = '350';
            let goButton = document.querySelector("button");
            if (goButton && goButton.innerText.includes('이동')) {
                goButton.click();
            }
        } else {
            console.error('🚨 페이지 입력 필드가 존재하지 않습니다.');
        }
    """)
    time.sleep(5)  # 로딩 대기
    
print("✅ 350번째 페이지에서 병원 입력 처리 시작")

# 4️⃣ 350번째 페이지부터 입력 시작
hospital_count = 0  # 진행 카운트
while True:
    try:
        # 테이블 로딩 대기
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.XPATH, "//table[contains(@class,'min-w-full')]"))
        )

        # 현재 페이지에서 '입력' 버튼이 있는 병원 찾기
        rows = driver.find_elements(By.XPATH, "//table//tbody/tr[.//td[contains(@class, 'time-value')]//button[contains(text(),'입력')]]")

        if not rows:
            print("📌 현재 페이지에 '입력' 버튼이 없습니다. 다음 페이지로 이동합니다.")

            # '다음 페이지' 버튼이 있는지 확인 후 클릭
            try:
                next_page = WebDriverWait(driver, 3).until(
                    EC.element_to_be_clickable((By.XPATH, "//button[contains(text(),'다음') and not(@disabled)]"))
                )
                print("➡️ '다음 페이지' 버튼을 클릭합니다.")
                next_page.click()
                time.sleep(3)  # 페이지 로딩 대기
                continue  # 다음 페이지 처리
            except:
                print("✅ 모든 병원 처리 완료!")
                break  # 모든 병원 처리 완료 → 종료

        print(f"🔹 현재 페이지 처리할 병원 수: {len(rows)}")

        for row in rows:
            try:
                hospital_name = row.find_element(By.XPATH, "./td[1]").text
                print(f"\n🏥 처리 중: {hospital_name} ({hospital_count+1}번째)")

                # '입력' 버튼 클릭
                input_button = row.find_element(By.XPATH, ".//td[contains(@class, 'time-value')]//button[contains(text(),'입력')]")
                input_button.click()

                # 5️⃣ 팝업이 열릴 때까지 대기
                WebDriverWait(driver, 10).until(
                    EC.presence_of_element_located((By.XPATH, "//h2[contains(text(),'Time 입력/수정')]"))
                )

                # '저장' 버튼 클릭
                save_button = driver.find_element(By.XPATH, "//button[contains(text(),'저장')]")
                save_button.click()

                # 병원 처리 카운트 증가
                hospital_count += 1
                time.sleep(2)  # 저장 후 딜레이

            except Exception as e:
                print(f"❌ {hospital_name} 처리 중 오류 발생: {e}")

        # 6️⃣ '다음 페이지' 버튼 클릭 (없으면 종료)
        try:
            next_page = WebDriverWait(driver, 3).until(
                EC.element_to_be_clickable((By.XPATH, "//button[contains(text(),'다음') and not(@disabled)]"))
            )
            print("➡️ '다음 페이지' 버튼을 클릭합니다.")
            next_page.click()
            time.sleep(3)  # 페이지 로딩 대기
        except:
            print("✅ 마지막 페이지 도달, 모든 병원 입력 완료")
            break

    except Exception as e:
        print(f"🚨 오류 발생: {e}")
        break

# 크롤러 종료
driver.quit()
