from transformers import GPT2LMHeadModel, GPT2Tokenizer
from pymongo import MongoClient
from datetime import datetime, timedelta

# GPT-2 모델 및 토크나이저 로드
tokenizer = GPT2Tokenizer.from_pretrained("gpt2")
model = GPT2LMHeadModel.from_pretrained("gpt2")

# MongoDB 연결 설정
client = MongoClient("mongodb://localhost:27017/")
db = client["horoscope_db"]
collection = db["horoscope"]

# 띠 리스트
zodiacs = [
    "쥐띠", "소띠", "범띠", "토끼띠", 
    "용띠", "뱀띠", "말띠", "양띠", 
    "원숭이띠", "닭띠", "개띠", "돼지띠"
]

# 띠 계산 함수
def calculate_zodiac(year):
    return zodiacs[(year - 4) % 12]

# 운세 생성 함수
def generate_horoscope(prompt):
    inputs = tokenizer.encode(prompt, return_tensors="pt")
    outputs = model.generate(inputs, max_length=100, num_return_sequences=1)
    generated_text = tokenizer.decode(outputs[0], skip_special_tokens=True)
    return generated_text

# 시작 날짜 및 종료 날짜 설정
start_date = datetime(2011, 1, 1)
end_date = datetime(2025, 1, 1)
current_date = start_date

# 날짜별 데이터 생성 및 저장
while current_date <= end_date:
    year = current_date.year
    zodiac = calculate_zodiac(year)
    prompt = f"{zodiac} {current_date.strftime('%Y년 %m월 %d일')}의 운세는"
    
    print(f"Generating for: {prompt}")

    # GPT-2를 사용해 운세 생성
    horoscope = generate_horoscope(prompt)

    # MongoDB에 저장할 데이터
    data = {
        "date": current_date.strftime('%Y-%m-%d'),
        "year": year,
        "zodiac": zodiac,
        "horoscope": horoscope
    }
    collection.insert_one(data)  # MongoDB에 데이터 저장
    print(f"Saved: {data}")

    # 다음 날짜로 이동
    current_date += timedelta(days=1)

print("운세 데이터 생성 및 저장 완료!")
