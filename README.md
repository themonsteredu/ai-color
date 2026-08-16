# 컬러메이트

전문가가 지정한 퍼스널컬러를 학생의 실제 사진에서 체험하는 모바일 웹앱입니다. 의상은 실제 상품사진 카탈로그에서 고른 뒤 OpenAI 이미지 편집 API로 가상착의하고, 메이크업은 브라우저에서 얼굴 랜드마크와 Canvas 레이어로 처리합니다.

## 실행

```bash
npm install
npm run dev
```

테스트 학생은 `김하늘 / COLOR01`, `윤보라 / COOL02`입니다. 전문가 화면은 `/expert`입니다.

## OpenAI 설정

OpenAI API 키는 브라우저 입력창이나 `VITE_` 환경변수에 넣지 않습니다. Vercel 프로젝트의 **Settings → Environment Variables**에 다음 값을 등록한 뒤 재배포합니다.

```text
OPENAI_API_KEY=발급받은 OpenAI API 키
SETTINGS_PIN=3035
SETTINGS_ENCRYPTION_KEY=24자 이상의 길고 예측 불가능한 임의 문자열
OPENAI_IMAGE_MODEL=gpt-image-1.5
OPENAI_IMAGE_QUALITY=medium
OPENAI_IMAGE_SIZE=1024x1536
TRYON_GENERATION_LIMIT=2
VITE_TRYON_LIMIT=2
```

`OPENAI_IMAGE_MODEL`, `OPENAI_IMAGE_QUALITY`, `OPENAI_IMAGE_SIZE`를 변경하면 코드 수정 없이 모델 설정을 교체할 수 있습니다. 학생당 500원 목표에서는 `medium`을 권장하며, `high`는 2회 출력 비용만으로 목표를 넘을 수 있습니다.

OpenAI API는 Vercel AI SDK나 AI Gateway를 거치지 않고 `/api/try-on` 서버 함수에서 직접 호출합니다. 학생 사진과 생성 결과는 서버 파일이나 로컬 저장소에 보관하지 않습니다.

### 앱 설정 메뉴에서 API 키 등록

Vercel에 `SETTINGS_PIN`과 `SETTINGS_ENCRYPTION_KEY`를 최초 한 번 등록하면 `/settings`에서 비밀번호를 입력하고 OpenAI API 키·모델·품질·크기를 변경할 수 있습니다. API 키는 브라우저 JavaScript가 읽을 수 없는 암호화된 HttpOnly 쿠키에 30일간 저장됩니다. 이 설정은 현재 브라우저에만 적용되므로 학생들이 같은 기기에서 활동하는 환경에 적합합니다.

학생은 활동 코드 없이 전문가가 등록한 이름만 입력해 입장합니다. 같은 이름은 중복 등록할 수 없습니다.

## 비용 제한 참고

학생 화면은 활동 코드별 가상착의 생성 횟수를 2회로 제한합니다. 프로토타입에서는 브라우저 저장소를 함께 사용하므로, 운영 전에는 OpenAI 프로젝트의 월 사용 한도를 반드시 설정해야 합니다. 여러 기기에서도 학생별 제한을 강제하려면 추후 서버 데이터베이스에 생성 횟수를 기록해야 합니다.

## 검증

```bash
npm run lint
npm run build
```
