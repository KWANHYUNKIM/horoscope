from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.common.keys import Keys
import time

# 1️⃣ Chrome WebDriver 실행
options = webdriver.ChromeOptions()
options.add_argument("--start-maximized")  # 브라우저 최대화
driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)

# 2️⃣ ChatGPT 로그인 페이지 열기
driver.get("https://chat.openai.com/auth/login")

# 3️⃣ 로그인 버튼 클릭 (최초 페이지에 로그인 버튼이 존재할 경우)
try:
    login_button = WebDriverWait(driver, 10).until(
        EC.element_to_be_clickable((By.XPATH, "//button[contains(text(), 'Log in')]"))
    )
    login_button.click()
    time.sleep(2)
except:
    print("로그인 버튼을 찾을 수 없습니다.")

# 4️⃣ 이메일 입력
EMAIL = "molba06@naver.com"  # ✅ 자신의 이메일 입력
PASSWORD = "ehsqjfwk123!"        # ✅ 자신의 비밀번호 입력

try:
    email_input = WebDriverWait(driver, 10).until(
        EC.presence_of_element_located((By.XPATH, "//input[@name='username']"))
    )
    email_input.send_keys(EMAIL)
    email_input.send_keys(Keys.RETURN)
    time.sleep(3)
except:
    print("이메일 입력란을 찾을 수 없습니다.")

# 5️⃣ 비밀번호 입력
try:
    password_input = WebDriverWait(driver, 10).until(
        EC.presence_of_element_located((By.XPATH, "//input[@name='password']"))
    )
    password_input.send_keys(PASSWORD)
    password_input.send_keys(Keys.RETURN)
    time.sleep(5)
except:
    print("비밀번호 입력란을 찾을 수 없습니다.")

# 6️⃣ 로그인 완료 확인 (홈페이지가 로드되었는지 체크)
try:
    WebDriverWait(driver, 10).until(
        EC.presence_of_element_located((By.XPATH, "//div[contains(text(), 'ChatGPT')]"))
    )
    print("✅ 로그인 성공!")
except:
    print("❌ 로그인 실패 또는 CAPTCHA/MFA 확인 필요.")

# 🚀 이후 원하는 자동화 작업 수행 가능
