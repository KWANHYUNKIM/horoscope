from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException
from webdriver_manager.chrome import ChromeDriverManager
import pandas as pd
import time
from datetime import datetime
import logging
from pathlib import Path
import re

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class HospitalCrawler:
    def __init__(self):
        self.data = []
        self.output_dir = Path(__file__).parent / "crawl_results"
        self.output_dir.mkdir(exist_ok=True)
        self.timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        self.intermediate_file = self.output_dir / "hospital_data_intermediate.xlsx"
        self.driver = None
        self.error_count = 0
        self.max_errors = 3  # 연속 에러 최대 허용 횟수
        
        # 기존 중간 파일이 있다면 데이터 로드
        if self.intermediate_file.exists():
            try:
                existing_df = pd.read_excel(self.intermediate_file)
                self.data = existing_df.to_dict('records')
                logger.info(f"기존 데이터 {len(self.data)}개를 로드했습니다.")
            except Exception as e:
                logger.error(f"기존 파일 로드 중 오류: {str(e)}")

    def setup_driver(self):
        """Chrome 드라이버 설정"""
        chrome_options = Options()
        chrome_options.add_argument('--headless')
        chrome_options.add_argument('--no-sandbox')
        chrome_options.add_argument('--disable-dev-shm-usage')
        chrome_options.add_argument('--window-size=1920,1080')
        chrome_options.add_argument('--disable-gpu')
        chrome_options.add_argument('--disable-features=NetworkService')
        chrome_options.add_argument('--disable-features=VizDisplayCompositor')
        chrome_options.add_argument('--disable-dev-shm-usage')
        chrome_options.add_argument('--no-sandbox')
        chrome_options.add_argument('--disable-software-rasterizer')
        
        if self.driver is not None:
            try:
                self.driver.quit()
            except:
                pass
        
        self.driver = webdriver.Chrome(
            service=Service(ChromeDriverManager().install()),
            options=chrome_options
        )
        self.wait = WebDriverWait(self.driver, 10)

    def convert_time_format(self, time_str):
        """시간 형식을 변환 (09:30 -> 0930)"""
        if not time_str or time_str == '-':
            return None
        return re.sub(r'[^0-9]', '', time_str)

    def parse_time_range(self, time_range):
        """시간 범위를 시작/종료 시간으로 분리"""
        if not time_range or time_range == '-':
            return None, None
        
        # "09:30 - 18:00" 형식 파싱
        times = time_range.split('-')
        if len(times) == 2:
            start_time = self.convert_time_format(times[0].strip())
            end_time = self.convert_time_format(times[1].strip())
            return start_time, end_time
        return None, None

    def parse_lunch_time(self, lunch_text):
        """점심시간 파싱"""
        if not lunch_text:
            return None, None
        
        match = re.search(r'점심\s+(\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})', lunch_text)
        if match:
            start_time = self.convert_time_format(match.group(1))
            end_time = self.convert_time_format(match.group(2))
            return start_time, end_time
        return None, None
        
    def save_single_record(self, hospital_data):
        """단일 병원 데이터를 저장"""
        try:
            # 기존 데이터가 있으면 로드
            if self.intermediate_file.exists():
                try:
                    df = pd.read_excel(self.intermediate_file)
                    records = df.to_dict('records')
                except Exception:
                    records = []
            else:
                records = []
            
            # 새 데이터 추가
            records.append(hospital_data)
            
            # DataFrame 생성 및 저장
            df = pd.DataFrame(records)
            
            # 컬럼 순서 지정
            columns = [
                'hospital_id', 'name', 'addr',
                'rcvWeek', 'rcvSat',
                'trmtMonStart', 'trmtMonEnd',
                'trmtTueStart', 'trmtTueEnd',
                'trmtWedStart', 'trmtWedEnd',
                'trmtThuStart', 'trmtThuEnd',
                'trmtFriStart', 'trmtFriEnd',
                'trmtSatStart', 'trmtSatEnd',
                'trmtSunStart', 'trmtSunEnd',
                'trmtHolStart', 'trmtHolEnd',
                'lunchStart', 'lunchEnd'
            ]
            
            df = df[columns]
            df.to_excel(self.intermediate_file, index=False)
            logger.info(f"병원 ID {hospital_data['hospital_id']} 데이터 저장 완료")
            
        except Exception as e:
            logger.error(f"데이터 저장 중 오류 발생: {str(e)}")

    def get_operating_hours(self, hospital_id):
        """병원 정보 크롤링"""
        try:
            # 이미 수집된 데이터인지 확인
            if any(d['hospital_id'] == hospital_id for d in self.data):
                logger.info(f"병원 ID {hospital_id}는 이미 수집되었습니다.")
                return True

            if self.driver is None:
                self.setup_driver()

            url = f"https://www.modoodoc.com/hospital/{hospital_id}"
            self.driver.get(url)
            
            # 페이지가 존재하는지 확인
            try:
                error_element = self.driver.find_element(By.CSS_SELECTOR, "div.error-page")
                if error_element:
                    logger.info(f"병원 ID {hospital_id}는 존재하지 않는 페이지입니다.")
                    return True
            except NoSuchElementException:
                pass
            
            time.sleep(2)  # 페이지 로딩을 위한 대기 시간
            
            # 주소 정보 가져오기
            try:
                address = self.driver.find_element(By.CSS_SELECTOR, "div.styles_addressInfo__nKmZ9 address").text
            except NoSuchElementException:
                address = None
                
            # 병원 이름 가져오기
            try:
                hospital_name = self.driver.find_element(By.TAG_NAME, "h1").text
            except NoSuchElementException:
                hospital_name = None

            # 기본 데이터 구조
            hospital_data = {
                'hospital_id': hospital_id,
                'name': hospital_name,
                'addr': address,
                'rcvWeek': None,
                'rcvSat': None,
                'trmtMonStart': None,
                'trmtMonEnd': None,
                'trmtTueStart': None,
                'trmtTueEnd': None,
                'trmtWedStart': None,
                'trmtWedEnd': None,
                'trmtThuStart': None,
                'trmtThuEnd': None,
                'trmtFriStart': None,
                'trmtFriEnd': None,
                'trmtSatStart': None,
                'trmtSatEnd': None,
                'trmtSunStart': None,
                'trmtSunEnd': None,
                'trmtHolStart': None,
                'trmtHolEnd': None,
                'lunchStart': None,
                'lunchEnd': None
            }

            try:
                # 진료시간 버튼이 있는지 확인하고 클릭
                try:
                    time_button = WebDriverWait(self.driver, 5).until(
                        EC.presence_of_element_located((By.CSS_SELECTOR, "button.styles_todayTime__kNW_v"))
                    )
                    time_button.click()
                    time.sleep(1)  # 클릭 후 테이블이 나타날 때까지 대기
                except TimeoutException:
                    logger.info(f"병원 ID {hospital_id}의 진료시간 버튼을 찾을 수 없습니다.")
                    # 기본 정보만 저장하고 진행
                    self.save_single_record(hospital_data)
                    return True
                except Exception as e:
                    logger.error(f"진료시간 버튼 클릭 중 오류: {str(e)}")

                # 진료시간 테이블 찾기 (여러 가지 선택자 시도)
                table = None
                selectors = [
                    "div.styles_operatingTimeTable__9H21q table",
                    "div[class*='operatingTimeTable'] table",
                    "table"  # 마지막 시도로 모든 테이블 검색
                ]
                
                for selector in selectors:
                    try:
                        table = WebDriverWait(self.driver, 3).until(
                            EC.presence_of_element_located((By.CSS_SELECTOR, selector))
                        )
                        break
                    except TimeoutException:
                        continue
                
                if table is None:
                    logger.info(f"병원 ID {hospital_id}의 진료시간 테이블을 찾을 수 없습니다.")
                    # 기본 정보만 저장하고 진행
                    self.save_single_record(hospital_data)
                    return True

                rows = table.find_elements(By.TAG_NAME, "tr")
                
                weekday_hours = None
                saturday_hours = None
                sunday_hours = None
                holiday_hours = None
                lunch_time = None
                
                for row in rows:
                    try:
                        day = row.find_element(By.TAG_NAME, "th").text
                        time_cell = row.find_element(By.TAG_NAME, "td")
                        
                        # 진료시간 정보 추출
                        try:
                            time_info = time_cell.find_element(By.CLASS_NAME, "styles_timeInfo__Jh0Z6")
                            time_div = time_info.find_element(By.TAG_NAME, "div")
                            hours = time_div.find_element(By.TAG_NAME, "p").text.strip()
                            
                            # 점심시간 정보 추출
                            try:
                                lunch_span = time_div.find_element(By.TAG_NAME, "span").text
                                if not lunch_time and '점심' in lunch_span:
                                    lunch_start, lunch_end = self.parse_lunch_time(lunch_span)
                                    hospital_data['lunchStart'] = lunch_start
                                    hospital_data['lunchEnd'] = lunch_end
                                    lunch_time = lunch_span
                            except NoSuchElementException:
                                pass
                                
                        except NoSuchElementException:
                            try:
                                hours = time_cell.find_element(By.TAG_NAME, "p").text.strip()
                            except:
                                hours = time_cell.text.strip()

                        if hours and hours != '-':
                            start_time, end_time = self.parse_time_range(hours)
                            
                            # 요일별 시간 저장
                            if day == '월':
                                hospital_data['trmtMonStart'] = start_time
                                hospital_data['trmtMonEnd'] = end_time
                                if not weekday_hours:
                                    weekday_hours = f"{hours} {lunch_time if lunch_time else ''}"
                            elif day == '화':
                                hospital_data['trmtTueStart'] = start_time
                                hospital_data['trmtTueEnd'] = end_time
                            elif day == '수':
                                hospital_data['trmtWedStart'] = start_time
                                hospital_data['trmtWedEnd'] = end_time
                            elif day == '목':
                                hospital_data['trmtThuStart'] = start_time
                                hospital_data['trmtThuEnd'] = end_time
                            elif day == '금':
                                hospital_data['trmtFriStart'] = start_time
                                hospital_data['trmtFriEnd'] = end_time
                            elif day == '토':
                                hospital_data['trmtSatStart'] = start_time
                                hospital_data['trmtSatEnd'] = end_time
                                saturday_hours = hours
                            elif day == '일':
                                hospital_data['trmtSunStart'] = start_time
                                hospital_data['trmtSunEnd'] = end_time
                                sunday_hours = hours
                            elif day == '공휴일':
                                hospital_data['trmtHolStart'] = start_time
                                hospital_data['trmtHolEnd'] = end_time
                                holiday_hours = hours

                    except Exception as e:
                        logger.error(f"행 처리 중 오류: {str(e)}")
                        continue

                # 주중/토요일 진료시간 설정
                hospital_data['rcvWeek'] = weekday_hours
                hospital_data['rcvSat'] = saturday_hours

            except Exception as e:
                logger.error(f"진료시간 테이블 처리 중 오류: {str(e)}")

            # 데이터 저장
            self.save_single_record(hospital_data)
            logger.info(f"병원 정보 수집 완료: {hospital_id}")
            
            self.error_count = 0  # 성공하면 에러 카운트 리셋
            return True
            
        except Exception as e:
            logger.error(f"병원 ID {hospital_id} 처리 중 오류 발생: {str(e)}")
            self.error_count += 1
            
            # 연속 에러가 max_errors를 초과하면 브라우저 재시작
            if self.error_count >= self.max_errors:
                logger.info("연속 에러 발생으로 브라우저를 재시작합니다.")
                self.setup_driver()
                self.error_count = 0
            
            return False

    def crawl_hospitals(self, start_id=1, end_id=100):
        """여러 병원 정보 수집"""
        try:
            self.setup_driver()
            
            for hospital_id in range(start_id, end_id + 1):
                logger.info(f"병원 ID {hospital_id} 처리 중...")
                retry_count = 0
                max_retries = 3
                
                while retry_count < max_retries:
                    if self.get_operating_hours(hospital_id):
                        break
                    retry_count += 1
                    time.sleep(1)  # 재시도 전 대기 시간 단축
                
                time.sleep(0.5)  # 다음 병원 처리 전 대기 시간 단축
                
        except Exception as e:
            logger.error(f"크롤링 중 오류 발생: {str(e)}")
        finally:
            if self.driver:
                self.driver.quit()

def main():
    crawler = HospitalCrawler()
    crawler.crawl_hospitals(start_id=5918, end_id=80000)  # 5027번부터 8만개 수집

if __name__ == "__main__":
    main() 