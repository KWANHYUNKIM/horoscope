import sys
import json
import tensorflow as tf

def main():
    input_data = json.loads(sys.argv[1])
    
    try:
        model = tf.keras.models.load_model('model/model.h5')
        input_text = input_data['general_horoscope'] + ' ' + input_data['specific_horoscope']
        # 여기서 예측을 위해 input_text를 모델에 맞게 전처리
        prediction = model.predict([input_text])
        
        # 예측 결과를 JSON 형태로 반환
        print(json.dumps(prediction.tolist()))
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()