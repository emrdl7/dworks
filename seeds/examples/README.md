# 좋은 예시 (Few-shot 자산)

LLM 프롬프트의 few-shot 자산. 카탈로그가 "스펙"이라면 여기는 "사용된 모습".

## 디렉터리 구조 (예정)

```
seeds/examples/
├── jabworks/
│   ├── button-primary-cta.html
│   ├── login-card-stack.html
│   └── ...
└── krds/                          # KRDS 어댑터 가동 시
    ├── tab-with-aria/
    └── ...
```

## 작성 원칙

각 예시는 다음을 만족.
- 카탈로그 컴포넌트만 사용 (free-form 금지)
- Hard fail 검증 통과
- Soft warn 0개 또는 의도된 잔존만
- "왜 이 의도가 좋은 디자인인가" 한 줄 주석

## 사용처

1. LLM few-shot 동적 주입 (의도 임베딩 검색 후)
2. Storybook 카탈로그 "사용 예" 섹션
3. 카탈로그 룰의 positive 케이스 회귀 테스트
