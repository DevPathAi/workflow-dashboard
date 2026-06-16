# 설계 — workflow-dashboard 일정 전면 재정렬 (W1~W24 → MD1~MD4)

> **작성일**: 2026-06-16 · **브랜치**: `feat/dashboard-schedule-realign` (develop 분기)
> **목적**: `documents/17_스케줄.md`가 주차(W1~W24)/마일스톤(M1~M6) 기준에서 **단계(MD1~MD4) + 수직 슬라이스 #1~12** 기준으로 전면 재작성됨. 대시보드(React)를 새 일정으로 전면 수정한다.
> **선행 핸드오프**: `docs/superpowers/handoff-2026-06-16-dashboard-schedule-realign.md`
> **원칙**: 이 레포 CLAUDE.md 절대 조건(추측 금지·테스트 우선·코드 분석 우선) + 브랜치 전략(main 보호·develop 경유 2단계 PR).
> **그라운딩**: 본 설계의 모든 "현재 상태"는 실제 파일(`scripts/parsers/github-markdown.mjs`, `scripts/sync.mjs`, `data/config.json`, `src/components/WeekTabs.tsx`, `documents/17_스케줄.md`)로 검증됨.

---

## 0. 확정된 결정 (브레인스토밍 §4)

| ID | 결정 | 선택 | 근거 |
|---|---|---|---|
| D-A | periods 입도 | **MD1~MD4 (+ DONE 기준선), 슬라이스=Step** | WeekTabs/차트 변경 최소, 마일스톤-앵커 로드맵·Tier 컷라인과 정렬 |
| D-B | 작업 축 | **track=repo 유지 (9개)**, 슬라이스는 repo별 Step | D-A의 자연 귀결. 슬라이스 1급 재모델 안 함 |
| D-C | SSoT 위치 | **각 repo `docs/project-management/` 마크다운** | 현 sync 구조·CI 유지, repo 소유권 정렬 |
| D-D | 완료 데이터 가드 | **클린 재시드** | periods가 W→MD로 바뀌어 done-guard 키 불일치. 현재 전부 done=0 |

---

## 1. 데이터 모델

모델 계층은 **변경 없음**:

```
tracks(=repo) → weeks[].week(=period id) → steps(=슬라이스) → phases → items{text,done}
```

- `periods`만 W1~W24 → `DONE`·MD1~MD4로 교체.
- 각 슬라이스 #N은 해당 repo가 참여하는 경우 그 repo의 MD-week 안 **Step**으로 들어간다.
- `track=repo` 9개 유지: shared·gateway·platform·learning·community·ai·sandbox·frontend·gitops.

## 2. 슬라이스 ↔ repo ↔ MD 매핑 (17_스케줄 §2 본문 기준)

> 핸드오프 §3-2의 "예"가 아니라 17_스케줄 §2 단계별 상세 본문에서 확정. 각 repo md에는 **그 repo가 참여하는 슬라이스만** Step으로 작성한다.

| MD | 슬라이스 | 참여 repo(track) |
|---|---|---|
| MD1 | #1 OAuth/인증 (게이트) | platform, gateway, shared, frontend |
| MD1 | #2 진단 | learning, frontend |
| MD1 | #3 학습경로 (1st Aha) | ai, learning, frontend |
| MD2 | #4 콘텐츠 | learning, frontend |
| MD2 | #5 Sandbox | sandbox, frontend |
| MD2 | #6 AI 코드리뷰 (2nd Aha) + 결제 | ai, frontend, platform(결제) |
| MD3 | #7 AI 멘토 | ai, frontend |
| MD3 | #8 커뮤니티 Q&A | community, frontend |
| MD3 | #9 LCS (moat) | community, learning, shared |
| MD3 | #10 모바일 (P6) | frontend |
| MD3 | #11 랜딩 (P7) | frontend |
| MD3 | 평판 기초 | community |
| MD4 | #12 사업화·완성도 (FinOps·보안·부하·안정화) | ai, gitops, sandbox, platform |

> 결제(토스페이먼츠)는 17 §2에서 repo 미명시 → platform-svc 가정(스펙 검토 시 확정 필요). gitops는 주로 MD4(Canary·배포) + 상시 CI.

## 3. 완료(DONE) 기준선

17_스케줄 §0의 DONE은 MD1 **이전 기준선**이다. → **`DONE` period(탭) 1개를 MD1 앞에 추가**한다. 탭: `[DONE] [MD1] [MD2] [MD3] [MD4]` (총 5).

`DONE` 기준선에 박을 완료분(전부 `- [x]`):

- **인프라 (전 repo 해당분)**: W1 인프라 — MySQL→PostgreSQL(SSOT 5432 + pgvector 5433), shared GitHub Packages(Maven), 중앙 Flyway 스키마(`set_updated_at`·users 골격·`dormant_user_archives`).
- **CI/CD (gitops)**: 9개 서비스 postgres service container CI + 이미지 빌드·push + gitops 배포 job + GitHub App 자동 SHA 갱신(node24 actions).
- **백엔드 W1 (각 svc)**: PG 드라이버·shared 의존·DB 연결 테스트.
- **프론트 목 프로토 (frontend)**: React→Flutter 전환·melos 모노레포, web 골든패스 P4a~f, admin 대표 3화면 P5.

repo별로 자신이 기여한 DONE 항목만 `WORKFLOW_<track>_DONE.md`에 Step으로 작성한다.

## 4. SSoT 마크다운 포맷 (실제 파서 기준)

- 파일 경로: 각 repo `docs/project-management/workflow/WORKFLOW_<track>_<period>.md`
  - 예: `WORKFLOW_platform_MD1.md`, `WORKFLOW_frontend_DONE.md`
  - (track, period)당 1파일. `<track>`은 `config.repos[].trackName`(예: platform, gateway, shared, learning, community, ai, sandbox, frontend, team-lead).
- 파일 내부 구조(파서 `parseWorkflowContent` 계약):
  ```markdown
  ## Step 1: #1 OAuth/인증
  ### 1.1 Spring Security + OAuth2 Client
  - [x] 완료된 항목
  - [ ] 미완료 항목
  ```
  - `## Step N: <제목>` → `### N.N <phase>` → `- [x]/- [ ]` 체크박스.
- **PRD 컬럼은 이번 범위에서 보류**(YAGNI) — 진척 구동은 workflow 체크리스트로 충분. PRD 파일 미작성 시 파서는 빈 prd 반환(기존 oldData.prd 유지).

## 5. 파서 코드 변경 (TDD — 핵심 코드 작업)

**문제**: `scripts/parsers/github-markdown.mjs`가 파일명에서 period id를 정규식 `W\d+`로 하드코딩한다.
- L136 `transform()`: `file.name.match(/^WORKFLOW_(.+)_(W\d+)\.md$/)`
- L178 PRD: `file.name.match(/PRD_(W\d+)/)`

→ `MD1`·`DONE`을 못 잡음. **정규식을 일반화**해야 한다.

**변경**:
- `WORKFLOW_(.+)_(W\d+)\.md` → period id를 마지막 `_` 토큰으로 받도록 일반화. 권장 패턴: `^WORKFLOW_(.+)_([A-Za-z0-9]+)\.md$` (마지막 토큰 = period id). `MD1`·`DONE`·기존 `W1` 모두 매치.
- PRD 정규식도 동일하게 `PRD_([A-Za-z0-9]+)\.md` 일반화(보류 범위지만 회귀 방지 위해 함께 일반화).
- **`done-guard`·`sync.mjs`는 변경 불필요**: `sync.mjs`의 `periodMap`은 이미 `config.periods`에서 제네릭 생성(L44), done-guard는 period id를 불투명 키로 사용.

**TDD 절차** (절대 조건 2):
1. `scripts/parsers/__fixtures__/parse-workflow-md.test.mjs` + `github-markdown` 픽스처에 `WORKFLOW_<track>_MD1.md`·`_DONE.md` 케이스를 **실패 테스트로 먼저** 추가.
2. `node scripts/test-parsers.mjs` 실패 확인 → 정규식 수정 → 통과 확인(눈으로).
3. 기존 `W\d+` 케이스 회귀 없는지 동시 확인(하위호환).

## 6. config.json periods 재정의 (17 §1 날짜)

```json
"periods": [
  { "id": "DONE", "label": "DONE", "start": "2026-06-01", "end": "2026-06-16" },
  { "id": "MD1",  "label": "MD1", "start": "2026-06-16", "end": "2026-07-20" },
  { "id": "MD2",  "label": "MD2", "start": "2026-07-21", "end": "2026-08-31" },
  { "id": "MD3",  "label": "MD3", "start": "2026-09-01", "end": "2026-11-30" },
  { "id": "MD4",  "label": "MD4", "start": "2026-12-01", "end": "2026-12-31" }
]
```

> `DONE.start`(2026-06-01)는 기준선 표시용 placeholder. label은 추후 "1st Aha" 등 부제 부여 가능(플랜에서 결정).

## 7. src / UI 점검

- `WeekTabs.tsx`: `config.periods.map(p => p.id)`를 라벨로 렌더 → MD/DONE 탭 자동 동작(코드 변경 없이). 단 **사용자 카피 "주차"→"단계"** 점검 대상: `WeekTabs`·`ProgressTable`·`TrackCard`·`settings/DataEditor`·`hooks/useData`·`pages/Detail`. (플랜에서 각 파일 정독 후 정확 변경 — 추측 금지)
- 차트(Chart.js) x축이 periods를 라벨로 쓰는지 점검 → 4~5개 축으로 정상 렌더 확인.
- `CLAUDE.md`·README의 "24주(W1~W24) / 마일스톤 M1~M6" → "MD1~MD4(+DONE)"로 갱신.

## 8. 검증·배포 (이 레포의 "테스트")

1. `node scripts/test-parsers.mjs` — 파서 단위 테스트 통과(파일명 정규식 변경 회귀 포함).
2. 각 repo md 작성 후 재시드: `DOCS_DIR=<repo>/docs/project-management npm run sync -- <repo-id>` (클린 재시드이므로 `FORCE` 불필요. periods 변경으로 옛 week 키 자동 폐기).
3. `npm run lint && npm run validate:data && npm run build` — 셋 다 통과(데이터 정합 = 테스트 통과).
4. develop PR → CI 녹색 확인 → 머지 → (릴리스 시) develop→main PR → GitHub Pages 배포 확인.

## 9. 작업 분해 (플랜에서 상세화)

1. **파서 일반화** (TDD): 정규식 + 픽스처/테스트.
2. **config.json periods 재정의**: DONE + MD1~MD4.
3. **9개 repo md 작성**: §2 매핑대로 `WORKFLOW_<track>_<MD>.md` + DONE 기준선 md(§3).
4. **재시드**: 각 repo sync → `data/*.json` 재생성. 옛 W 데이터 폐기.
5. **src/UI 카피 점검**: 주차→단계, 차트 축.
6. **문서 갱신**: CLAUDE.md·README.
7. **검증·develop PR**.

## 10. 비범위 (YAGNI / 명시 제외)

- PRD 컬럼 데이터 작성(보류).
- 슬라이스를 1급 축으로 하는 데이터 모델 재설계(D-B에서 기각).
- 단일 17_스케줄 파서(D-C에서 기각).
- workflow-guide(VitePress 사이트)는 별개 — 본 작업 무관.
- 컴포넌트 파일명 변경(`WeekTabs`→`PhaseTabs` 등)은 카피 변경으로 충분하면 하지 않음(플랜에서 판단).

## 11. 리스크

| 리스크 | 완충 |
|---|---|
| 파서 정규식 일반화가 기존 W\d+ 케이스 깨뜨림 | 하위호환 테스트 케이스 유지(W1도 매치되는 패턴), 회귀 테스트 |
| 슬라이스↔repo 매핑 오류(특히 결제·LCS·#12 분산) | 17_스케줄 §2 본문으로 항목별 확정, 추측 시 멈추고 확인 |
| 차트/컴포넌트가 5개 period로 깨짐 | validate:data + build + 로컬 preview 확인 |
| DONE 기준선 완료 항목 누락/과다 | 17 §0 본문 항목과 1:1 대조 |
