# CLAUDE.md

Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

## 5. Project Structure

### Tech Stack
- **Next.js 16** (App Router) + **React 19** + **TypeScript 5**
- **Tailwind CSS 4** / **Geist Font**
- **youtubei.js** - YouTube Innertube 클라이언트
- **puppeteer** - Chrome 자동화 (쿠키 기반 인증)
- **jose** - JWT 세션 관리
- **@google/genai** / **OpenRouter** - AI 요약 (Gemini)

### Directory Layout
```
src/
├── app/                    # Next.js App Router
│   ├── layout.tsx          # 루트 레이아웃
│   ├── page.tsx            # 홈 (비디오 피드 + 요약)
│   ├── api/                # API Routes
│   │   ├── auth/           # 인증 (OAuth2, Puppeteer, Cookie)
│   │   ├── feed/           # 홈 피드 페이지네이션
│   │   ├── search/         # 검색
│   │   ├── channel/        # 채널 정보
│   │   ├── history/        # 시청 기록
│   │   └── summary/        # AI 영상 요약
│   ├── login/              # 로그인 페이지
│   ├── search/             # 검색 결과 페이지
│   ├── channel/[id]/       # 채널 상세 페이지
│   └── history/            # 시청 기록 페이지
├── components/             # React 컴포넌트
├── hooks/                  # 커스텀 React Hooks
├── lib/                    # 핵심 유틸리티
│   ├── innertube.ts        # YouTube 인증 + 클라이언트
│   ├── gemini.ts           # Gemini API (멀티키 로테이션)
│   ├── openrouter.ts       # OpenRouter API
│   └── extractVideo.ts     # 비디오 데이터 추출
├── types/                  # TypeScript 타입 정의
└── middleware.ts           # JWT 인증 미들웨어
```

### Key Conventions
- 언어: 한국어 (UI, 커밋 메시지, 주석)
- 포트: 3434 (dev/start)
- 경로 별칭: `@/*` → `./src/*`
- 출력: standalone (Docker 배포용)
- 요약 캐시: 클라이언트 localStorage (`mytube_summary_v3_*`)

### Environment Variables
```
JWT_SECRET                  # 세션 토큰 시크릿
OPENROUTER_API_KEY          # OpenRouter API 키
OPENROUTER_MODEL            # OpenRouter 모델명
GEMINI_API_KEYS             # Gemini API 키 (콤마 구분, 멀티키)
GEMINI_MODEL                # Gemini 모델명
```

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.
