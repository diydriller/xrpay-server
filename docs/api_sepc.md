# 유저

- `POST /auth/signup`
    - 회원가입
- `POST /auth/signin`
    - 로그인
- `GET /users/profile`
    - 프로필 조회
- `POST /users/trustline`
    - trustline 생성

## 에스크로

- `POST /iou/escrow`
    - 에스크로 전송 시작
- `POST /iou/escrow/finish`
    - 에스크로 전송 완료
- `GET /iou/escrow`
    - 에스크로 전송 내역 조회

## 환전

- `POST /amm/swap`
    - 환전하기
- `GET /amm/swap/info`
    - 환율 정보 조회