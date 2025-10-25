# 🤗 Hugging Face Daily Papers Bot

매일 아침 9시에 Hugging Face의 인기 AI/ML 논문을 크롤링하고, AI로 분석하여 한글 요약을 Google Chat으로 전송하는 Cloudflare Workers 기반 봇입니다.

## 주요 기능

- **자동 크롤링**: Hugging Face Daily Papers 페이지에서 인기 논문 수집
- **AI 분석**: Claude 3.5 Sonnet을 사용한 논문 분석 및 한글 요약
- **Google Chat 알림**: 매일 아침 9시 자동 요약 전송
- **Cron 스케줄링**: Cloudflare Workers Cron Triggers 활용
- **서버리스**: Cloudflare Workers로 완전 서버리스 운영

### 2. 환경 변수 설정

`.dev.vars` 파일을 생성하고 다음 내용을 입력하세요:

```env
ANTHROPIC_API_KEY=your_anthropic_api_key_here
GOOGLE_CHAT_WEBHOOK_URL=your_google_chat_webhook_url_here
```

### 3. Wrangler 설정

`wrangler.toml` 파일에서 다음을 수정하세요:

```toml
name = "huggingface-daily-trending"  # 원하는 Worker 이름으로 변경
```

**중요**: `ANTHROPIC_API_KEY`는 보안상 시크릿으로 설정해야 합니다:

```bash
npx wrangler secret put ANTHROPIC_API_KEY
```

### 4. 로컬 개발 서버 실행

```bash
npm run dev
```
