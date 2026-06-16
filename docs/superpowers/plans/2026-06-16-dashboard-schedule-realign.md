# 대시보드 일정 재정렬 (W→MD) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** workflow-dashboard를 주차(W1~W24) 기준에서 단계(DONE·MD1~MD4) + 수직 슬라이스 기준으로 전면 재정렬한다.

**Architecture:** 데이터 모델 계층(tracks→weeks→steps→phases→items)은 유지하고 `periods`만 교체한다. 슬라이스 #1~12는 각 repo의 MD-week 안 Step으로 들어간다. SSoT 마크다운은 이번 플랜에서 **대시보드 레포 내 `docs/seed/<repo-id>/workflow/`에 작성·커밋**해 재현 가능한 재시드 소스로 쓰고(9개 서비스 레포로의 SSoT 이관은 후속 플랜), 거기서 `npm run sync`로 `data/*.json`을 클린 재생성한다.

**Tech Stack:** Node ESM 파서(`scripts/parsers/github-markdown.mjs`), React 19 + Vite + Tailwind 4 + Chart.js, GitHub Pages.

**Branch:** `feat/dashboard-schedule-realign` (develop 분기, 이미 생성됨). 검증 게이트 = `node scripts/parsers/__fixtures__/test-parsers.mjs` + `npm run lint` + `npm run validate:data` + `npm run build`. develop PR엔 자동 CI 없음(build.yml은 main push 전용) → 로컬 검증이 게이트.

**스코프 결정(브레인스토밍):** D-A periods=DONE+MD1~MD4·슬라이스=Step / D-B track=repo / D-C per-repo md(이번엔 dashboard seed) / D-D 클린 재시드.

**비범위:** PRD 컬럼 데이터, 슬라이스 1급 축 재모델, 단일 17 파서, 9개 서비스 레포 직접 커밋(후속), `week`/`Week` 필드·타입·컴포넌트 파일명 리네임(내부 식별자 — YAGNI).

---

## File Structure

| 파일 | 책임 | 작업 |
|---|---|---|
| `scripts/parsers/github-markdown.mjs` | WORKFLOW 파일명→track/period 파싱 | Modify (정규식 일반화) |
| `scripts/parsers/__fixtures__/github-markdown/input/WORKFLOW_testtrack_MD1.md` | MD period id 픽스처 | Create |
| `scripts/parsers/__fixtures__/test-parsers.mjs` | 파서 테스트 러너 | Modify (MD/DONE 단언 추가) |
| `docs/seed/<repo-id>/workflow/WORKFLOW_<track>_<period>.md` | 재시드 소스(SSoT seed) | Create ×다수 |
| `data/config.json` | periods 정의 | Modify (W1~W24→DONE+MD1~MD4) |
| `data/<repo-id>.json` ×9 | 트랙 진척 데이터 | Regenerate (클린 재시드) |
| `src/hooks/useData.ts` | periods 폴백 | Modify (W1~W5→DONE+MD1~MD4) |
| `src/components/WeekTabs.tsx` | 탭 폴백 | Modify |
| `src/components/ProgressTable.tsx`·`TrackCard.tsx`·`TimelineChart.tsx`·`settings/DataEditor.tsx`·`pages/Detail.tsx` | 사용자 카피 "주차"→"단계" | Modify |
| `CLAUDE.md`·`README.md` | 기준 문구 | Modify |

---

## Task 1: 파서 파일명 정규식 일반화 (TDD)

**문제:** `github-markdown.mjs` `transform()`이 파일명 period를 `W\d+`로 하드코딩 → `MD1`·`DONE`을 못 잡는다.

**Files:**
- Test fixture Create: `scripts/parsers/__fixtures__/github-markdown/input/WORKFLOW_testtrack_MD1.md`
- Test Modify: `scripts/parsers/__fixtures__/test-parsers.mjs`
- Modify: `scripts/parsers/github-markdown.mjs:136`

- [ ] **Step 1: 실패 픽스처 작성**

Create `scripts/parsers/__fixtures__/github-markdown/input/WORKFLOW_testtrack_MD1.md`:

```markdown
## Step 1: #1 OAuth
### 1.1 Setup
- [x] done item
- [ ] todo item
```

- [ ] **Step 2: 러너에 MD/DONE 단언 추가 (실패 테스트)**

`scripts/parsers/__fixtures__/test-parsers.mjs`의 `await testGitHubMarkdown()` 호출 줄(L82) **앞**에 함수 추가하고, 그 줄 **뒤**에 호출을 추가한다.

함수 정의(파일 내 `console.log('Running parser tests...\n')` 위, L80 앞에 삽입):

```javascript
async function testPeriodIdFormats() {
  console.log('Testing period id formats (MD/DONE)...')
  const { default: parser } = await import('../github-markdown.mjs')
  const inputDir = join(__dirname, 'github-markdown', 'input')

  const raw = {
    workflowFiles: [
      { name: 'WORKFLOW_testtrack_MD1.md', path: join(inputDir, 'WORKFLOW_testtrack_MD1.md') },
      { name: 'WORKFLOW_testtrack_DONE.md', path: join(inputDir, 'WORKFLOW_testtrack_W1.md') },
    ],
    prdFiles: [],
    taskFiles: [],
  }
  const result = parser.transform(raw)
  assert(result.tracks.length === 1, `track count: got ${result.tracks.length}, expected 1`)
  const weeks = result.tracks[0].weeks.map(w => w.week).sort()
  assert(weeks.includes('MD1'), `should parse MD1 period, got weeks=${JSON.stringify(weeks)}`)
  assert(weeks.includes('DONE'), `should parse DONE period, got weeks=${JSON.stringify(weeks)}`)
  console.log('✅ period id formats: all assertions checked')
}
```

호출 추가(`await testGitHubMarkdown()` 다음 줄):

```javascript
await testPeriodIdFormats()
```

- [ ] **Step 3: 테스트 실행 → 실패 확인**

Run: `node scripts/parsers/__fixtures__/test-parsers.mjs`
Expected: FAIL — `track count: got 0, expected 1` 및 MD1/DONE 단언 실패 (정규식이 MD1/DONE 파일명을 매치 못 해 trackMap이 빔).

- [ ] **Step 4: 정규식 일반화**

`scripts/parsers/github-markdown.mjs:136` 변경:

```javascript
    const match = file.name.match(/^WORKFLOW_(.+)_([A-Za-z0-9]+)\.md$/)
```

(기존: `/^WORKFLOW_(.+)_(W\d+)\.md$/`. greedy `(.+)`가 마지막 `_` 토큰을 period로 넘긴다. `W1`·`MD1`·`DONE` 모두 매치.)

- [ ] **Step 5: 테스트 실행 → 통과 확인 (회귀 포함)**

Run: `node scripts/parsers/__fixtures__/test-parsers.mjs`
Expected: PASS — `github-markdown parser: all assertions checked` + `period id formats: all assertions checked`, `0 failed`. (기존 `WORKFLOW_testtrack_W1.md` fixture 회귀 통과 동시 확인.)

- [ ] **Step 6: node:test 회귀 확인**

Run: `node --test scripts/parsers/__fixtures__/`
Expected: PASS (parse-workflow-md·done-guard·change-types 영향 없음).

- [ ] **Step 7: 커밋**

```bash
git add scripts/parsers/github-markdown.mjs scripts/parsers/__fixtures__/test-parsers.mjs scripts/parsers/__fixtures__/github-markdown/input/WORKFLOW_testtrack_MD1.md
git commit -m "feat: WORKFLOW 파일명 period 정규식 일반화 (W/MD/DONE 지원)"
```

---

## Task 2: 재시드 소스 마크다운 작성 (docs/seed/)

> 17_스케줄 §0(DONE)·§2(슬라이스) 본문 기반. 각 repo md엔 그 repo 참여 슬라이스만 Step으로. 파일 경로: `docs/seed/<repo-id>/workflow/WORKFLOW_<track>_<period>.md`. 코드 변경 없음 → 테스트는 Task 3의 sync+validate.

> **포맷 계약:** `## Step N: <제목>` → `### N.N <phase>` → `- [x]/- [ ]`. DONE 기준선은 전부 `- [x]`.

- [ ] **Step 1: shared (track=shared) 작성**

Create `docs/seed/devpath-shared/workflow/WORKFLOW_shared_DONE.md`:
```markdown
## Step 1: W1 인프라 기준선
### 1.1 PostgreSQL 전환 + 중앙 스키마
- [x] MySQL→PostgreSQL(SSOT 5432 + pgvector 5433)
- [x] 중앙 Flyway 스키마(공통 규약 set_updated_at)
- [x] users 골격 + 법적 분리보관 dormant_user_archives(정보통신망법 §29)
### 1.2 GitHub Packages
- [x] shared GitHub Packages(Maven) 배포
```
Create `docs/seed/devpath-shared/workflow/WORKFLOW_shared_MD1.md`:
```markdown
## Step 1: #1 OAuth/인증 — 스키마
### 1.1 인증 도메인 Flyway
- [ ] users·user_oauth_identities·user_profiles 스키마(W1 users 골격 확장)
```
Create `docs/seed/devpath-shared/workflow/WORKFLOW_shared_MD3.md`:
```markdown
## Step 1: #9 LCS — 공통 스키마
### 1.1 LCS 공통/브릿지
- [ ] learning_context_snapshots 공통 스키마 + Post 서비스 브릿지 공통부
```

- [ ] **Step 2: gateway (track=gateway) 작성**

Create `docs/seed/devpath-gateway/workflow/WORKFLOW_gateway_DONE.md`:
```markdown
## Step 1: W1 백엔드 기준선
### 1.1 PG·shared 연동
- [x] PG 드라이버 + shared 의존 + DB 연결 테스트
- [x] postgres service container CI
```
Create `docs/seed/devpath-gateway/workflow/WORKFLOW_gateway_MD1.md`:
```markdown
## Step 1: #1 OAuth/인증 — 엣지
### 1.1 OAuth2 엣지 + JWT 라우팅
- [ ] OAuth2 엣지 + JWT 검증 라우팅
```

- [ ] **Step 3: platform (track=platform) 작성**

Create `docs/seed/devpath-platform-svc/workflow/WORKFLOW_platform_DONE.md`:
```markdown
## Step 1: W1 백엔드 기준선
### 1.1 PG·shared 연동
- [x] PG 드라이버 + shared 의존 + DB 연결 테스트
- [x] postgres service container CI
```
Create `docs/seed/devpath-platform-svc/workflow/WORKFLOW_platform_MD1.md`:
```markdown
## Step 1: #1 OAuth/인증 (게이트)
### 1.1 Spring Security + OAuth2 Client
- [ ] Spring Security 7 + OAuth2 Client (GitHub → Google → 카카오 순)
- [ ] JWT + Refresh Cookie
### 1.2 이벤트
- [ ] UserRegisteredEvent Outbox
### 1.3 외부 의존성(횡단)
- [ ] 카카오/Google OAuth 앱 심사 신청
- [ ] Anthropic 프로덕션 한도 신청
```
Create `docs/seed/devpath-platform-svc/workflow/WORKFLOW_platform_MD2.md`:
```markdown
## Step 1: #6 결제
### 1.1 토스페이먼츠
- [ ] 토스페이먼츠 연동(월 14,900원 구독 진입)
```
Create `docs/seed/devpath-platform-svc/workflow/WORKFLOW_platform_MD4.md`:
```markdown
## Step 1: #12 보안 — OAuth 키
### 1.1 키 rotation
- [ ] OAuth 키 rotation 리허설
```

- [ ] **Step 4: learning (track=learning) 작성**

Create `docs/seed/devpath-learning-svc/workflow/WORKFLOW_learning_DONE.md`:
```markdown
## Step 1: W1 백엔드 기준선
### 1.1 PG·shared 연동
- [x] PG 드라이버 + shared 의존 + DB 연결 테스트
- [x] postgres service container CI
```
Create `docs/seed/devpath-learning-svc/workflow/WORKFLOW_learning_MD1.md`:
```markdown
## Step 1: #2 진단
### 1.1 진단 스키마·알고리즘
- [ ] question_bank + Bloom 태깅 스키마
- [ ] 적응형 진단 알고리즘(난이도 ±)
### 1.2 비회원 세션
- [ ] 비회원 진단 세션(Redis 30분) + 결과 회원 이관
## Step 2: #3 학습경로 (1st Aha)
### 2.1 임베딩·경로
- [ ] 콘텐츠 임베딩(text-embedding-3-small) + HNSW 인덱스
- [ ] milestone.target_skills 매칭 + path_milestones·path_weekly_tasks
```
Create `docs/seed/devpath-learning-svc/workflow/WORKFLOW_learning_MD2.md`:
```markdown
## Step 1: #4 콘텐츠
### 1.1 콘텐츠 API
- [ ] content 뷰어 API(Markdown) + 진척 자동 추적(스크롤·체류)
- [ ] 다음 콘텐츠 추천
```
Create `docs/seed/devpath-learning-svc/workflow/WORKFLOW_learning_MD3.md`:
```markdown
## Step 1: #9 LCS — 학습활동
### 1.1 학습활동 스트림
- [ ] Kafka 학습활동 스트림 + Redis 스냅샷(TTL 7일) 학습측 연동
```

- [ ] **Step 5: ai (track=ai) 작성**

Create `docs/seed/devpath-ai-svc/workflow/WORKFLOW_ai_DONE.md`:
```markdown
## Step 1: W1 백엔드 기준선
### 1.1 PG·shared 연동
- [x] PG 드라이버 + shared 의존 + DB 연결 테스트
- [x] postgres service container CI
```
Create `docs/seed/devpath-ai-svc/workflow/WORKFLOW_ai_MD1.md`:
```markdown
## Step 1: #3 학습경로 (1st Aha)
### 1.1 Claude 경로 생성
- [ ] Claude API 클라이언트(Sonnet 4.6)
- [ ] Path 생성 프롬프트 v1(버전 관리) + JSON strict 파싱
- [ ] SSE 스트리밍(4단계) + LearningPathGeneratedEvent
```
Create `docs/seed/devpath-ai-svc/workflow/WORKFLOW_ai_MD2.md`:
```markdown
## Step 1: #6 AI 코드리뷰 (2nd Aha)
### 1.1 [법적 필수] 인젝션 방어
- [ ] 입력 필터링 + system prompt 방어 + 탈옥 방지(AI 기능 활성화 전 필수)
### 1.2 코드 리뷰
- [ ] Claude 코드 리뷰 프롬프트 + 골든 50 케이스
- [ ] ai_code_reviews 비동기 + 👍👎 피드백
```
Create `docs/seed/devpath-ai-svc/workflow/WORKFLOW_ai_MD3.md`:
```markdown
## Step 1: #7 AI 멘토
### 1.1 멘토 세션
- [ ] ai_mentor_sessions + context_snapshot(현재 콘텐츠 + 최근 5 Sandbox 자동 주입)
- [ ] SSE 스트리밍 + 참고자료 링크
```
Create `docs/seed/devpath-ai-svc/workflow/WORKFLOW_ai_MD4.md`:
```markdown
## Step 1: #12 FinOps
### 1.1 비용·캐시·킬스위치
- [ ] ai_cost_logs + Grafana 대시보드
- [ ] Semantic Cache(Redis TTL 7일) + 3계층 Kill-switch + 사용량 한도 가드
- [ ] 2 Aha 퍼널 대시보드
### 1.2 모더레이션
- [ ] AI 자동 모더레이션 4단계(Haiku)
```

- [ ] **Step 6: sandbox (track=sandbox) 작성**

Create `docs/seed/devpath-sandbox-svc/workflow/WORKFLOW_sandbox_DONE.md`:
```markdown
## Step 1: W1 백엔드 기준선
### 1.1 PG·shared 연동
- [x] PG 드라이버 + shared 의존 + DB 연결 테스트
- [x] postgres service container CI
```
Create `docs/seed/devpath-sandbox-svc/workflow/WORKFLOW_sandbox_MD2.md`:
```markdown
## Step 1: #5 Sandbox
### 1.1 컨테이너 격리 실행
- [ ] Docker 컨테이너 풀(Java21/Node20/Python3.12) + gVisor(runsc)
- [ ] 리소스 제한(CPU/MEM/30s/네트워크 차단) + sandbox_sessions
- [ ] 실행 로그 SSE + SandboxRunSubmittedEvent
```
Create `docs/seed/devpath-sandbox-svc/workflow/WORKFLOW_sandbox_MD4.md`:
```markdown
## Step 1: #12 보안 — Sandbox
### 1.1 pentest
- [ ] Sandbox pentest(격리 탈출 자동 테스트)
```

- [ ] **Step 7: community (track=community) 작성**

Create `docs/seed/devpath-community-svc/workflow/WORKFLOW_community_DONE.md`:
```markdown
## Step 1: W1 백엔드 기준선
### 1.1 PG·shared 연동
- [x] PG 드라이버 + shared 의존 + DB 연결 테스트
- [x] postgres service container CI
```
Create `docs/seed/devpath-community-svc/workflow/WORKFLOW_community_MD3.md`:
```markdown
## Step 1: #8 커뮤니티 Q&A
### 1.1 Q&A
- [ ] Q&A CRUD(목록/상세/작성/답변/채택) + 태그 자동완성 + ES 검색 인덱스
- [ ] AI 시드 답변 Worker(질문 즉시 Claude→community_ai_answers) + 유사 질문 탐지(pgvector 0.80)
- [ ] 자유게시판 + 프로젝트 공유 게시판
## Step 2: #9 LCS (moat)
### 2.1 스냅샷·Sanitize
- [ ] learning_context_snapshots 자동 수집(질문 작성 시 Opt-in 토글)
- [ ] 에러 로그 민감정보 3단계 Sanitize 파이프라인(API 키·이메일·토큰 마스킹)
- [ ] 답변자 UI 맥락 패널(학습 경로·현재 콘텐츠·최근 에러) + 개별 on/off·미리보기·공개범위
## Step 3: 평판 기초
### 3.1 평판·스트릭
- [ ] 평판 엔진(upvote/downvote/채택) + 태그별 평판(user_tag_reputation)
- [ ] 레벨별 권한(15/125/500/1000) + Bronze 배지 9종 + 일일 +40 상한·sockpuppet 탐지
- [ ] 스트릭(TZ)·주간 리포트 배치·3일 미접속 AI 제안·선호 시간대 푸시
```

- [ ] **Step 8: frontend (track=frontend) 작성**

Create `docs/seed/devpath-frontend/workflow/WORKFLOW_frontend_DONE.md`:
```markdown
## Step 1: 목 API 프로토타입 기준선
### 1.1 셸·web 골든패스
- [x] React→Flutter 전환, melos 모노레포(dp_core·dp_design + apps/web·admin·mobile)
- [x] web 골든패스 전체(P4a~f: 셸·인증/온보딩·경로 SSE/콘텐츠·Sandbox·Monaco/AI리뷰·KILL_SWITCH·Quota/멘토 SSE/대시보드·커뮤니티)
### 1.2 admin
- [x] admin 대표 3화면(P5: 운영 대시보드·사용자 관리·신고 처리)
```
Create `docs/seed/devpath-frontend/workflow/WORKFLOW_frontend_MD1.md`:
```markdown
## Step 1: #1 OAuth 실API
### 1.1 AuthController
- [ ] web AuthController 목→실API 전환 + 통합테스트
## Step 2: #2 진단 실API
### 2.1 온보딩
- [ ] 온보딩 진단 실API 전환
## Step 3: #3 학습경로 실API
### 3.1 PathController SSE
- [ ] PathController SSE 목→실API 전환 + 온보딩→PATH 골든 스모크(정상 + 중단→resume)
```
Create `docs/seed/devpath-frontend/workflow/WORKFLOW_frontend_MD2.md`:
```markdown
## Step 1: #4 콘텐츠 실API
### 1.1 ContentPage
- [ ] ContentPage 실API 전환
## Step 2: #5 Sandbox 실API
### 2.1 RunController
- [ ] RunController 실API 전환(Monaco는 이미 web)
## Step 3: #6 AI리뷰 실API
### 3.1 ReviewPanel
- [ ] ReviewPanel 실API 전환
```
Create `docs/seed/devpath-frontend/workflow/WORKFLOW_frontend_MD3.md`:
```markdown
## Step 1: #7 멘토 실API
### 1.1 MentorController
- [ ] MentorController SSE 실API 전환
## Step 2: #8 커뮤니티 실API
### 2.1 커뮤니티
- [ ] 커뮤니티 실API 전환(질문 작성 FAB·답변 스레드·투표 활성)
## Step 3: #10 모바일 (P6)
### 3.1 apps/mobile
- [ ] apps/mobile 실API 전환(공유 dp_core 재사용) + StatefulShellRoute + drift 캐시(오프라인 읽기)
- [ ] 재연결 동기화 + FCM 푸시 + OAuth 콜백 딥링크(devpath://callback) + secure_storage TokenStore
- [ ] 홈 대시보드(스트릭·진척률·다음 과제) + 모바일 학습 뷰어 + 퀵 캡처
## Step 4: #11 랜딩 (P7)
### 4.1 landing
- [ ] landing(Jaspr SSG, standalone) 마케팅 페이지 + 전용 CI job + <html lang="ko"> 주입
```

- [ ] **Step 9: gitops (track=team-lead) 작성**

> trackName은 config상 `team-lead` → 파일명 `WORKFLOW_team-lead_<period>.md`.

Create `docs/seed/devpath-gitops/workflow/WORKFLOW_team-lead_DONE.md`:
```markdown
## Step 1: CI/CD 기준선
### 1.1 파이프라인
- [x] 9개 서비스 postgres service container CI + 이미지 빌드·push
- [x] gitops 배포 job + GitHub App 자동 SHA 갱신(node24 actions)
```
Create `docs/seed/devpath-gitops/workflow/WORKFLOW_team-lead_MD4.md`:
```markdown
## Step 1: #12 안정화·릴리즈
### 1.1 Canary·부하·품질
- [ ] staging→prod Canary(10→50→100%) + 릴리즈 노트
- [ ] Chaos(Claude·CDN·Sandbox 풀 고갈) + OWASP ZAP
- [ ] k6 부하 시나리오 + SonarQube Quality Gate + 회귀 체크리스트
```

- [ ] **Step 10: 커밋**

```bash
git add docs/seed/
git commit -m "feat: 재시드 소스 마크다운(DONE+MD1~MD4 슬라이스) 작성"
```

---

## Task 3: config.json periods 재정의 + 클린 재시드 (통합)

> config 변경과 data 재시드는 함께 그린이어야 한다(validate-data가 데이터 week를 config.periods로 검사). 클린 재시드 위해 기존 data/*.json을 먼저 삭제(prd/history 폴백 회귀 방지).

**Files:**
- Modify: `data/config.json` (periods)
- Regenerate: `data/devpath-*.json` ×9

- [ ] **Step 1: config.json periods 교체**

`data/config.json`의 `periods` 배열 전체를 아래로 교체(기존 W1~W24 삭제):

```json
  "periods": [
    { "id": "DONE", "label": "DONE", "start": "2026-06-01", "end": "2026-06-16" },
    { "id": "MD1", "label": "MD1", "start": "2026-06-16", "end": "2026-07-20" },
    { "id": "MD2", "label": "MD2", "start": "2026-07-21", "end": "2026-08-31" },
    { "id": "MD3", "label": "MD3", "start": "2026-09-01", "end": "2026-11-30" },
    { "id": "MD4", "label": "MD4", "start": "2026-12-01", "end": "2026-12-31" }
  ],
```

- [ ] **Step 2: validate:data로 현재 깨짐 확인 (재시드 필요 입증)**

Run: `npm run validate:data`
Expected: FAIL — 각 data 파일에 `unknown week "W1"`(등) 에러. 옛 데이터가 새 periods와 불일치함을 확인.

- [ ] **Step 3: 기존 data 파일 삭제 + 클린 재시드**

Run (PowerShell):
```powershell
$repos = 'devpath-shared','devpath-gateway','devpath-platform-svc','devpath-learning-svc','devpath-community-svc','devpath-ai-svc','devpath-sandbox-svc','devpath-frontend','devpath-gitops'
foreach ($r in $repos) {
  Remove-Item "data/$r.json" -ErrorAction SilentlyContinue
  $env:DOCS_DIR = "docs/seed/$r"
  npm run sync -- $r
}
Remove-Item Env:\DOCS_DIR
```
Expected: 각 repo `✅ Synced: N checks, M done (P%)`. (oldData 없음 → prd=[], history=오늘 1건, changelog=[].)

- [ ] **Step 4: validate:data 통과 확인**

Run: `npm run validate:data`
Expected: PASS — `Data validation passed with N warning(s).` (MD3 미참여 repo의 `missing MD3` 등은 경고이며 통과. `unknown week` 에러 0.)

- [ ] **Step 5: build 통과 확인**

Run: `npm run build`
Expected: PASS (`tsc -b && vite build` 에러 없음).

- [ ] **Step 6: 커밋**

```bash
git add data/config.json data/devpath-*.json
git commit -m "feat: periods DONE+MD1~MD4 재정의 + data 클린 재시드"
```

---

## Task 4: src 폴백·카피 갱신 (주차→단계)

> `week`/`Week`/`weeks`는 내부 필드명이라 유지. 변경 대상 = 하드코딩 W 폴백 + 사용자 카피.

**Files:** `src/hooks/useData.ts`, `src/components/WeekTabs.tsx`, `ProgressTable.tsx`, `TrackCard.tsx`, `TimelineChart.tsx`, `settings/DataEditor.tsx`, `pages/Detail.tsx`

- [ ] **Step 1: useData.ts 폴백 교체**

`src/hooks/useData.ts:8-14` `WEEKS_META` 교체:
```javascript
export const WEEKS_META = [
  { week: 'DONE', period: '' },
  { week: 'MD1', period: '' },
  { week: 'MD2', period: '' },
  { week: 'MD3', period: '' },
  { week: 'MD4', period: '' },
]
```
`src/hooks/useData.ts:16-22` `LEGACY_WEEKS` 동일 교체:
```javascript
const LEGACY_WEEKS = [
  { week: 'DONE', period: '' },
  { week: 'MD1', period: '' },
  { week: 'MD2', period: '' },
  { week: 'MD3', period: '' },
  { week: 'MD4', period: '' },
]
```

- [ ] **Step 2: WeekTabs.tsx 폴백 교체**

`src/components/WeekTabs.tsx:10`:
```javascript
  const weeks = config?.periods?.map(p => p.id) || ['DONE', 'MD1', 'MD2', 'MD3', 'MD4']
```

- [ ] **Step 3: 사용자 카피 "주차"→"단계"**

- `src/components/ProgressTable.tsx:35`: `주차별 상세` → `단계별 상세`
- `src/components/TimelineChart.tsx:69`: `작업이 진행되면 주차별 추이가 여기에 표시됩니다.` → `작업이 진행되면 단계별 추이가 여기에 표시됩니다.`
- `src/components/TrackCard.tsx:59`: title 문자열 `주차별 진행률 (${weeklyData.length}주, 좌→우 = W1→)` → `단계별 진행률 (${weeklyData.length}개 단계, 좌→우 = DONE→MD4)`
- `src/components/settings/DataEditor.tsx:85`: `주차 데이터 없음` → `단계 데이터 없음`
- `src/components/settings/DataEditor.tsx:143`: label `주차` → `단계`
- `src/pages/Detail.tsx:29-30`: 주석 `첫 주차`/`주차 탭` → `첫 단계`/`단계 탭` (주석, 가독성)

- [ ] **Step 4: lint + build 통과 확인**

Run: `npm run lint && npm run build`
Expected: PASS (ESLint 에러 0, 빌드 성공).

- [ ] **Step 5: 로컬 프리뷰로 탭/차트 육안 확인**

Run: `npm run build && npm run preview` → 브라우저에서 탭이 `DONE MD1 MD2 MD3 MD4`로 뜨고 DONE 진척률이 채워졌는지, 차트 x축이 5개로 정상인지 확인.
Expected: 탭 5개·DONE 100%대 진척·차트 정상.

- [ ] **Step 6: 커밋**

```bash
git add src/
git commit -m "feat: src periods 폴백 DONE+MD1~MD4 + 카피 주차→단계"
```

---

## Task 5: 문서 갱신 (CLAUDE.md·README)

**Files:** `CLAUDE.md`, `README.md`

- [ ] **Step 1: CLAUDE.md 기준 문구 갱신**

`CLAUDE.md`의 빌드·테스트 절 마지막 줄 `- 기준: 24주(W1~W24) / 마일스톤 M1~M6.` 을 교체:
```markdown
- 기준: 단계 DONE·MD1~MD4 (모두의 창업 라운드 정렬). 작업 단위 = 수직 슬라이스 #1~12(repo별 Step).
```

- [ ] **Step 2: README 점검·갱신**

`README.md`에서 `W1~W24`·`24주`·`M1~M6` 문구를 찾아 `DONE·MD1~MD4` 기준으로 갱신.
Run: `grep -nE "W1~W24|24주|M1~M6|마일스톤" README.md`
없으면 변경 불필요(커밋 스킵). 있으면 위 기준으로 수정.

- [ ] **Step 3: 커밋**

```bash
git add CLAUDE.md README.md
git commit -m "docs: 대시보드 기준 문구 W1~W24/M1~M6 → DONE·MD1~MD4"
```

---

## Task 6: 최종 검증 + develop PR

- [ ] **Step 1: 전체 게이트 일괄 실행**

Run:
```bash
node scripts/parsers/__fixtures__/test-parsers.mjs && node --test scripts/parsers/__fixtures__/ && npm run lint && npm run validate:data && npm run build
```
Expected: 전부 PASS (파서 테스트·node:test·lint·validate:data·build).

- [ ] **Step 2: 커밋 범위 self-검증 (Scope Lock)**

Run: `git log --oneline develop..HEAD` 및 `git diff --stat develop..HEAD`
Expected: Task 1~5 커밋만 존재. workflow-dashboard 밖 파일 변경 0(서비스 레포 미변경 확인 — md는 dashboard `docs/seed/`에만).

- [ ] **Step 3: push + develop PR**

```bash
git push -u origin feat/dashboard-schedule-realign
gh pr create --base develop --title "feat: 대시보드 일정 전면 재정렬 (W1~W24 → DONE·MD1~MD4)" --body "$(cat <<'EOF'
## 요약
주차(W1~W24)/마일스톤(M1~M6) → 단계(DONE·MD1~MD4) + 수직 슬라이스 #1~12 재정렬.

## 변경
- 파서 WORKFLOW 파일명 period 정규식 일반화(W/MD/DONE) + 테스트
- config.json periods 재정의 + data/*.json 클린 재시드
- 재시드 소스 md(docs/seed/, SSoT 이관은 후속)
- src periods 폴백·카피(주차→단계)
- CLAUDE.md/README 기준 문구

## 검증
- test-parsers / node:test / lint / validate:data / build 전부 PASS

## 후속(별도 플랜)
- docs/seed/* md를 9개 서비스 레포 docs/project-management/로 SSoT 이관

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

- [ ] **Step 4: PR 확인 보고**

PR URL을 사용자에게 보고. develop 머지 → (릴리스 시) develop→main PR로 Pages 배포는 별도 단계.

---

## Self-Review (작성자 점검 결과)

- **Spec 커버리지:** 스펙 §1~§8 전부 태스크 매핑됨(§5 파서=T1, §3·§6 config/완료=T3+T2, §4 md=T2, §7 src=T4, §8 검증=T3·T6, 문서=T5). ✅
- **플레이스홀더:** 모든 코드/콘텐츠 블록 실내용 포함, "TBD" 없음. ✅
- **타입/식별자 정합:** `WEEKS_META`(export, DataEditor 소비)·`LEGACY_WEEKS`·`config.periods` id(`DONE`,`MD1`~`MD4`)가 파서·validate(`WEEKS=periods.map(id)`)·src 폴백 전반에서 일관. 파일명 `WORKFLOW_<trackName>_<period>.md`의 trackName은 config trackName(gitops=`team-lead`)과 일치. ✅
- **주의:** Task 1 Step 2의 DONE 픽스처는 기존 `WORKFLOW_testtrack_W1.md` 내용을 `WORKFLOW_testtrack_DONE.md` 파일명으로 재사용(파일명 파싱만 검증, 내용 무관).
