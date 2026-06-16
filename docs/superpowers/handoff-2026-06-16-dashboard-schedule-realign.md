# 세션 핸드오프 — workflow-dashboard 일정 전면 재정렬 (2026-06-16)

> **목적**: `documents/17_스케줄.md`가 **전면 재작성**(주차 W1~W24 → 단계 MD1~MD4 + 수직 슬라이스, 모두의 창업 정렬)되었다. 대시보드는 아직 **옛 기준(W1~W24 / 마일스톤 M1~M6)** 이므로 새 일정으로 전면 수정해야 한다. 본 문서는 그 작업을 다음 세션으로 이관한다.
> **원칙**: 이 레포 CLAUDE.md 절대 조건(추측 금지·검증 우선) + 브랜치 전략(main 보호·develop 경유 PR). 본 문서의 모든 현재 상태는 실제 파일로 확인됨.
> **선행 컨텍스트(documents 레포, main 반영 완료)**: 새 일정 설계·계획·본체.
> - 설계 스펙: `documents/docs/superpowers/specs/2026-06-16-schedule-rework-design.md`
> - 구현 계획: `documents/docs/superpowers/plans/2026-06-16-schedule-rework.md`
> - 본체: `documents/17_스케줄.md` (MD1~MD4 + 슬라이스 #1~12 + Tier 컷라인)
> - 모두의 창업 참고: `documents/35_모두의_창업_프로그램_참고.md`

---

## 1. 무엇이 바뀌었나 (새 일정 요약)

- **단계 체계 변경**: 주차 W1~W24(weekly) → **MD1~MD4**(모두의 창업 라운드 정렬 phase).
  - MD1 1st Aha 실연동 (6.16~7.20, 1R) / MD2 2nd Aha+베타100 (7.21~8.31, 2R=8주 MVP 종착) / MD3 풀 골든패스+모바일/랜딩 (9~11월, 3R) / MD4 사업화·완성도·IR (12월, 파이널).
- **작업 단위 변경**: 서비스별 주차 태스크 → **수직 슬라이스 #1~12**(백엔드 API + 기존 Flutter 목 화면을 실API로 전환, 끝단간). 한 슬라이스가 여러 repo(track)에 걸침.
- **완료 박제(DONE)**: W1 인프라 전체 + 프론트 목 프로토(web 골든패스 P4a~f·admin P5) + 백엔드 W1 + 문서 01~35. → 대시보드는 현재 전부 "Not Started"라 **완료 반영 필요**.
- **마일스톤**: M1~M6 → **MD1~MD4**.

## 2. 대시보드 현재 상태 (검증됨)

- **스택**: React 19 + Vite + Tailwind 4 + Chart.js, GitHub Pages 배포(basePath `/workflow-dashboard/`). `project-dashboard` 스킬 산출물.
- **데이터 모델**:
  - `data/config.json`: `periods`(현재 **W1~W24**, 각 `{id,label,start,end}`), `columns`(prd/task/workflow), `repos`(9개: shared·gateway·platform·learning·community·ai·sandbox·frontend·gitops, 각 `source.path=docs/project-management`), `basePath`.
  - `data/<repo>.json`: `tracks[] → weeks[] → steps[] → phases[] → items[]{text,done}` + `totalChecks/doneChecks` + `history`·`changelog`·`prd`. (현재 전부 done=false)
- **데이터 흐름(SSoT)**: 각 **서비스 repo의 `docs/project-management/*.md`** 가 SSoT(마크다운 체크리스트: `# <periodId> (MM-DD~MM-DD)` → `## Step:` → `### Phase:` → `- [x]/- [ ]`). 현재 각 repo엔 `README.md`만 있고 실제 `W*.md` 태스크 파일은 미작성(초기 data/*.json은 17에서 시드된 것으로 보임).
  - `npm run sync`(`scripts/sync.mjs`)가 `config.json` 읽고 → `github-markdown` 파서가 **`DOCS_DIR` 환경변수**의 로컬 마크다운을 파싱 → `config.periods`로 기간 매핑 → `data/<repo>.json` 생성. **DOCS_DIR 미설정 시 skip**. done 회귀 방지 가드(`FORCE=true`로 우회)·changelog·history 자동 생성.
- **검증 게이트(= 이 레포의 "테스트")**: `npm run lint` · `npm run validate:data`(`data/*.json` 스키마 정합, 계약 `skills/project-dashboard/references/data-schema.md`) · `npm run build`. 셋 다 통과해야 푸시.
- **src 컴포넌트의 W/M 의존(점검 대상)**: `src/components/WeekTabs.tsx`·`ProgressTable.tsx`·`TrackCard.tsx`·`settings/DataEditor.tsx`·`hooks/useData.ts`·`pages/Detail.tsx` 에 주차/마일스톤 관련 참조 존재 → MD 모델 전환 시 영향 점검 필요(특히 `WeekTabs`).
- **CLAUDE.md**: "기준: 24주(W1~W24) / 마일스톤 M1~M6" 문구 → MD1~MD4로 갱신 필요.
- **git**: `main`에 푸시됐던 Scope Lock 커밋 1개가 본 핸드오프 브랜치(`docs/dashboard-schedule-realign-handoff`)에 함께 실려 develop으로 합류 예정. `develop` 신규 생성·푸시 완료.

## 3. 해야 할 일 (전면 수정 작업 목록)

> 권장 흐름: **브레인스토밍(아래 §4 결정 먼저) → 스펙 → 계획 → TDD(데이터 검증 우선) → develop PR**. 1인+CC.

1. **config.json `periods` 재정의**: W1~W24 → 새 기간(아래 §4 결정에 따라 MD1~MD4 4개, 또는 MD+슬라이스 2단계). 날짜는 17_스케줄 §1 표 사용(MD1 2026-06-16~07-20, MD2 07-21~08-31, MD3 09-01~11-30, MD4 12-01~12-31).
2. **각 9개 repo `docs/project-management/` 마크다운 작성/재작성**: 새 단계 헤더(`# MD1 (2026-06-16~2026-07-20)` …) + 해당 repo가 맡는 슬라이스 태스크를 Step/Phase/체크리스트로. 17_스케줄 §2 단계별 상세의 repo별 항목을 분해.
   - 슬라이스↔repo 매핑 예: #1 OAuth=platform+gateway+shared, #2 진단=learning, #3 경로=ai+learning, #4 콘텐츠=learning, #5 Sandbox=sandbox, #6 리뷰=ai, #7 멘토=ai, #8 커뮤니티=community, #9 LCS=community+learning+shared, #10 모바일=frontend, #11 랜딩=frontend, #12 사업화=ai(FinOps)+gitops 등.
3. **완료(DONE) 반영**: W1 인프라(전 repo)·프론트 목 프로토(frontend: P1~P5)·백엔드 W1을 `- [x]`로. (대시보드가 진척 박제)
4. **CLAUDE.md 갱신**: "24주(W1~W24)/M1~M6" → "MD1~MD4". README도 동일 점검.
5. **src 점검**: WeekTabs 등 컴포넌트가 periods 변화에 깨지지 않는지(라벨·탭·차트 x축). validate:data + build로 확인. UI 카피("주차"→"단계") 점검.
6. **sync 재실행**: `DOCS_DIR=<각 repo>/docs/project-management npm run sync -- <repo-id>` (또는 GitHub Actions sync 워크플로) → `data/*.json` 재생성. done-guard 때문에 완료 반영 시 필요하면 `FORCE=true`.
7. **검증·배포**: `npm run lint && npm run validate:data && npm run build` 통과 → develop PR → 머지 → main 릴리스 PR → Pages 배포 확인.

## 4. 먼저 정할 결정 (다음 세션 브레인스토밍)

- **D-A. periods 입도(granularity)**: (a) MD1~MD4 4개 단일 / (b) MD 단계 + 슬라이스 #1~12 2단계(periods=슬라이스, 단계는 그룹) / (c) MD별 하위 주차 유지. → 차트·탭 UI에 직접 영향.
- **D-B. 작업 축(columns/tracks)**: 현재 track=repo(수평). 새 일정은 **수직 슬라이스**(여러 repo 횡단). repo 트랙 유지 + 슬라이스를 Step으로 둘지, 아니면 슬라이스를 1급 축으로 재모델할지.
- **D-C. SSoT 위치**: 태스크 원본을 (a) 각 repo `docs/project-management/*.md`(현 sync 구조 유지) vs (b) 17_스케줄 단일 파서. 현 sync는 (a) 전제.
- **D-D. 완료 데이터 회귀 가드**: 기존 data/*.json을 버리고 재시드할지(클린) vs done-guard로 누적할지.

## 5. 주의사항

- **브랜치 전략 준수**: main 직접 금지, develop 경유 2단계 PR. 본 레포는 Scope Lock 스트레이 커밋을 본 핸드오프 PR로 정리 중(다른 repo와 동일 패턴).
- **추측 금지**: 슬라이스↔repo 매핑·완료 여부는 17_스케줄 본문과 각 repo 실제 상태로 확인 후 반영. 본 §3-2 매핑 "예"는 출발점일 뿐 17 본문으로 확정.
- **검증이 곧 테스트**: 데이터 변경은 `validate:data` 통과가 완료 기준(절대 조건 2).
- **워크플로 가이드(workflow-guide)** 와 혼동 금지 — 그건 VitePress 문서 사이트(별개). 본 작업은 대시보드(React)만.

## 6. 관련 문서

- 새 일정 본체: [documents/17_스케줄.md](https://github.com/DevPathAi/documents/blob/main/17_스케줄.md)
- 설계 스펙: documents/docs/superpowers/specs/2026-06-16-schedule-rework-design.md
- 구현 계획: documents/docs/superpowers/plans/2026-06-16-schedule-rework.md
- 모두의 창업 참고: [documents/35_모두의_창업_프로그램_참고.md](https://github.com/DevPathAi/documents/blob/main/35_모두의_창업_프로그램_참고.md)
- 데이터 계약: `skills/project-dashboard/references/data-schema.md`
