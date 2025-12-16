# Firebase 설정 가이드

이 게임은 실시간 동기화를 위해 Firebase Realtime Database를 사용합니다.

## Firebase 프로젝트 생성 및 설정

1. **Firebase Console 접속**
   - https://console.firebase.google.com 에 접속
   - Google 계정으로 로그인

2. **프로젝트 생성**
   - "프로젝트 추가" 클릭
   - 프로젝트 이름 입력 (예: "newyear-event")
   - Google Analytics 설정은 선택사항

3. **Realtime Database 활성화**
   - 좌측 메뉴에서 "Realtime Database" 선택
   - "데이터베이스 만들기" 클릭
   - 위치 선택 (asia-northeast3 권장)
   - 보안 규칙: "테스트 모드로 시작" 선택 (개발용)
   - 생성 완료

4. **웹 앱 등록**
   - 프로젝트 개요 페이지에서 웹 아이콘(</>) 클릭
   - 앱 닉네임 입력
   - Firebase Hosting은 선택사항
   - 등록 완료

5. **설정 정보 복사**
   - Firebase SDK 추가 화면에서 설정 정보 확인
   - `firebaseConfig` 객체의 값들을 복사

6. **index.html 파일 수정**
   - `index.html` 파일을 열기
   - `firebaseConfig` 객체를 찾아서 복사한 값들로 교체:
   ```javascript
   const firebaseConfig = {
       apiKey: "복사한_API_KEY",
       authDomain: "복사한_AUTH_DOMAIN",
       databaseURL: "복사한_DATABASE_URL",
       projectId: "복사한_PROJECT_ID",
       storageBucket: "복사한_STORAGE_BUCKET",
       messagingSenderId: "복사한_MESSAGING_SENDER_ID",
       appId: "복사한_APP_ID"
   };
   ```

7. **보안 규칙 설정 (중요!)**
   - Realtime Database > 규칙 탭으로 이동
   - 다음 규칙으로 변경:
   ```json
   {
     "rules": {
       ".read": true,
       ".write": true
     }
   }
   ```
   - **주의**: 이 규칙은 모든 사용자가 읽기/쓰기를 할 수 있습니다. 
     프로덕션 환경에서는 더 엄격한 규칙을 사용해야 합니다.

## 테스트

1. `index.html` 파일을 웹 브라우저로 열기
2. 부서명과 이름을 입력하고 "입장" 버튼 클릭
3. 다른 브라우저나 기기에서도 접속하여 여러 사용자 테스트
4. 관리자 모드로 접속하여 게임 시작 및 진행 상황 확인

## 문제 해결

- **"Firebase 설정이 필요합니다" 오류**: `firebaseConfig`가 제대로 설정되었는지 확인
- **데이터가 저장되지 않음**: Realtime Database 보안 규칙 확인
- **실시간 업데이트가 안 됨**: 인터넷 연결 확인 및 Firebase 프로젝트 상태 확인

