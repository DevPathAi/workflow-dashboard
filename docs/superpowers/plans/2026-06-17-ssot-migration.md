# SSoT 이관 (dashboard seed → 9개 서비스 레포) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 대시보드 `docs/seed/<repo-id>/workflow/`의 WORKFLOW md를 각 서비스 레포 `docs/project-management/workflow/`로 이관해 서비스 레포를 유일 SSoT로 만들고, 대시보드 seed를 제거한다.

**Architecture:** 파일 위치 이동(내용 불변). 9개 서비스 레포 각각에 (develop 없으면 생성 →) 브랜치 → md 복사 → develop PR. 검증은 대시보드가 서비스 레포에서 동일 데이터를 재생성하는지(sync dry-run 카운트 일치). 마지막에 대시보드 seed 삭제 PR.

**Tech Stack:** git, gh CLI, Node sync(`scripts/sync.mjs`), Windows + Bash 도구.

**경로 기준:** 워크스페이스 루트 `D:\workspace\dev-path-ai`(비-git). 대시보드 = `workflow-dashboard/`. 모든 `git -C <repo>` / `cp`는 루트 기준 상대경로 또는 절대경로 사용. **`cd` 지양**(권한 프롬프트), `git -C` 사용.

**절대 규칙:**
- **`git add .` 금지** — untracked `.omc/` 오염 방지. 반드시 명시 경로(`docs/project-management/workflow`)만 stage.
- main 직접 커밋·push 금지. 모든 변경은 develop 경유 PR.
- 9개 PR 머지는 사용자 게이트(자동 머지 금지).

---

## 레포 파라미터 표

| repo-id | track | develop 존재 | seed 파일(`docs/seed/<repo-id>/workflow/`) |
|---|---|---|---|
| devpath-shared | shared | ❌ 생성 필요 | WORKFLOW_shared_{DONE,MD1,MD3}.md |
| devpath-gateway | gateway | ❌ 생성 필요 | WORKFLOW_gateway_{DONE,MD1}.md |
| devpath-platform-svc | platform | ❌ 생성 필요 | WORKFLOW_platform_{DONE,MD1,MD2,MD4}.md |
| devpath-learning-svc | learning | ❌ 생성 필요 | WORKFLOW_learning_{DONE,MD1,MD2,MD3}.md |
| devpath-community-svc | community | ❌ 생성 필요 | WORKFLOW_community_{DONE,MD3}.md |
| devpath-ai-svc | ai | ❌ 생성 필요 | WORKFLOW_ai_{DONE,MD1,MD2,MD3,MD4}.md |
| devpath-sandbox-svc | sandbox | ❌ 생성 필요 | WORKFLOW_sandbox_{DONE,MD2,MD4}.md |
| devpath-frontend | frontend | ✅ 있음 | WORKFLOW_frontend_{DONE,MD1,MD2,MD3}.md |
| devpath-gitops | team-lead | ✅ 있음 | WORKFLOW_team-lead_{DONE,MD4}.md |

> gitops의 track/파일명은 `team-lead`(config.repos[].trackName 기준). repo-id는 devpath-gitops.

---

## 공통 절차 (레포 1개당 — Task 1~9에서 `$REPO`/`$DEV` 치환해 사용)

> 아래는 **정확한 명령 템플릿**이다. 각 Task는 이 절차를 해당 repo 값으로 실행한다. `$REPO`=repo-id, `$DEV`=develop 생성 필요 여부.

**(a) develop 보장** — `$DEV=생성필요`인 repo만:
```bash
git -C <$REPO> fetch origin
git -C <$REPO> checkout main
git -C <$REPO> pull --ff-only
git -C <$REPO> checkout -b develop
git -C <$REPO> push -u origin develop
```
`$DEV=있음`(frontend·gitops)이면 위 블록 **건너뛰고** 아래만:
```bash
git -C <$REPO> fetch origin
git -C <$REPO> checkout develop
git -C <$REPO> pull --ff-only
```

**(b) 작업 브랜치 + 파일 복사:**
```bash
git -C <$REPO> checkout -b docs/seed-project-management
mkdir -p <$REPO>/docs/project-management/workflow
cp workflow-dashboard/docs/seed/<$REPO>/workflow/*.md <$REPO>/docs/project-management/workflow/
```

**(c) 커밋(명시 경로만) + push + PR:**
```bash
git -C <$REPO> add docs/project-management/workflow
git -C <$REPO> status --short        # docs/project-management/workflow/*.md 만 staged인지 확인. .omc/ 등 없어야 함
git -C <$REPO> commit -m "docs: 워크플로 진척 md(SSoT) 추가 — DONE+MD1~MD4 슬라이스"
git -C <$REPO> push -u origin docs/seed-project-management
gh pr create -R DevPathAi/<$REPO> --base develop --head docs/seed-project-management \
  --title "docs: 워크플로 진척 md(SSoT) 추가 (DONE+MD1~MD4)" \
  --body "workflow-dashboard 일정 재정렬에 따른 진척 SSoT 마크다운을 docs/project-management/workflow/에 추가. 대시보드가 이 파일을 sync 원본으로 사용. 내용: 17_스케줄 DONE 기준선 + MD1~MD4 수직 슬라이스. 🤖 Generated with Claude Code"
```

**검증(각 Task 끝):** `gh pr view <PR#> -R DevPathAi/<$REPO> --json number,state,baseRefName` 로 PR이 base=develop으로 열렸는지 확인. 커밋에 `.omc/`나 기타 파일 없는지 `git -C <$REPO> show --stat HEAD` 확인.

---

## Task 1: devpath-shared 이관
**Files:** Create `devpath-shared/docs/project-management/workflow/WORKFLOW_shared_{DONE,MD1,MD3}.md`

- [ ] **Step 1: develop 생성** — 공통 절차 (a) `$DEV=생성필요`, `$REPO=devpath-shared`
- [ ] **Step 2: 브랜치+복사** — 공통 절차 (b), `$REPO=devpath-shared`. 복사 후 `ls devpath-shared/docs/project-management/workflow/` → 3개 파일(DONE,MD1,MD3) 확인.
- [ ] **Step 3: 커밋+push+PR** — 공통 절차 (c), `$REPO=devpath-shared`. `git -C devpath-shared show --stat HEAD`에 3개 md만, `.omc/` 없음 확인.
- [ ] **Step 4: 검증** — PR이 base=develop으로 열림 확인.

## Task 2: devpath-gateway 이관
**Files:** Create `devpath-gateway/docs/project-management/workflow/WORKFLOW_gateway_{DONE,MD1}.md`
- [ ] **Step 1:** 공통 (a) `$DEV=생성필요`, `$REPO=devpath-gateway`
- [ ] **Step 2:** 공통 (b) `$REPO=devpath-gateway` → 2개 파일(DONE,MD1) 확인
- [ ] **Step 3:** 공통 (c) `$REPO=devpath-gateway` → stat 2개 md만 확인
- [ ] **Step 4:** PR base=develop 확인

## Task 3: devpath-platform-svc 이관
**Files:** Create `devpath-platform-svc/docs/project-management/workflow/WORKFLOW_platform_{DONE,MD1,MD2,MD4}.md`
- [ ] **Step 1:** 공통 (a) `$DEV=생성필요`, `$REPO=devpath-platform-svc`
- [ ] **Step 2:** 공통 (b) `$REPO=devpath-platform-svc` → 4개 파일(DONE,MD1,MD2,MD4) 확인
- [ ] **Step 3:** 공통 (c) `$REPO=devpath-platform-svc`. **주의: 이 repo엔 untracked `.omc/`가 있다.** `git add docs/project-management/workflow`만, `git status --short`로 `.omc/`가 staged 아님을 반드시 확인 후 커밋.
- [ ] **Step 4:** PR base=develop 확인

## Task 4: devpath-learning-svc 이관
**Files:** Create `devpath-learning-svc/docs/project-management/workflow/WORKFLOW_learning_{DONE,MD1,MD2,MD3}.md`
- [ ] **Step 1:** 공통 (a) `$DEV=생성필요`, `$REPO=devpath-learning-svc`
- [ ] **Step 2:** 공통 (b) `$REPO=devpath-learning-svc` → 4개 파일 확인
- [ ] **Step 3:** 공통 (c) `$REPO=devpath-learning-svc` → stat 4개 md만
- [ ] **Step 4:** PR base=develop 확인

## Task 5: devpath-community-svc 이관
**Files:** Create `devpath-community-svc/docs/project-management/workflow/WORKFLOW_community_{DONE,MD3}.md`
- [ ] **Step 1:** 공통 (a) `$DEV=생성필요`, `$REPO=devpath-community-svc`
- [ ] **Step 2:** 공통 (b) `$REPO=devpath-community-svc` → 2개 파일 확인
- [ ] **Step 3:** 공통 (c) `$REPO=devpath-community-svc` → stat 2개 md만
- [ ] **Step 4:** PR base=develop 확인

## Task 6: devpath-ai-svc 이관
**Files:** Create `devpath-ai-svc/docs/project-management/workflow/WORKFLOW_ai_{DONE,MD1,MD2,MD3,MD4}.md`
- [ ] **Step 1:** 공통 (a) `$DEV=생성필요`, `$REPO=devpath-ai-svc`
- [ ] **Step 2:** 공통 (b) `$REPO=devpath-ai-svc` → 5개 파일 확인
- [ ] **Step 3:** 공통 (c) `$REPO=devpath-ai-svc` → stat 5개 md만
- [ ] **Step 4:** PR base=develop 확인

## Task 7: devpath-sandbox-svc 이관
**Files:** Create `devpath-sandbox-svc/docs/project-management/workflow/WORKFLOW_sandbox_{DONE,MD2,MD4}.md`
- [ ] **Step 1:** 공통 (a) `$DEV=생성필요`, `$REPO=devpath-sandbox-svc`
- [ ] **Step 2:** 공통 (b) `$REPO=devpath-sandbox-svc` → 3개 파일 확인
- [ ] **Step 3:** 공통 (c) `$REPO=devpath-sandbox-svc` → stat 3개 md만
- [ ] **Step 4:** PR base=develop 확인

## Task 8: devpath-frontend 이관 (develop 존재)
**Files:** Create `devpath-frontend/docs/project-management/workflow/WORKFLOW_frontend_{DONE,MD1,MD2,MD3}.md`
- [ ] **Step 1:** 공통 (a) `$DEV=있음`, `$REPO=devpath-frontend` (develop checkout+pull만)
- [ ] **Step 2:** 공통 (b) `$REPO=devpath-frontend`. **이 repo엔 `docs/project-management/` 디렉터리가 없으므로 `mkdir -p`가 새로 만든다.** → 4개 파일 확인
- [ ] **Step 3:** 공통 (c) `$REPO=devpath-frontend` → stat 4개 md만
- [ ] **Step 4:** PR base=develop 확인

## Task 9: devpath-gitops 이관 (develop 존재, track=team-lead)
**Files:** Create `devpath-gitops/docs/project-management/workflow/WORKFLOW_team-lead_{DONE,MD4}.md`
- [ ] **Step 1:** 공통 (a) `$DEV=있음`, `$REPO=devpath-gitops` (develop checkout+pull만)
- [ ] **Step 2:** 공통 (b) `$REPO=devpath-gitops`. `docs/project-management/` 디렉터리 신규. → 2개 파일(`WORKFLOW_team-lead_DONE.md`, `_MD4.md`) 확인
- [ ] **Step 3:** 공통 (c) `$REPO=devpath-gitops`. **주의: untracked `.omc/` 존재.** `git status --short`로 `.omc/` 미staged 확인 후 커밋. → stat 2개 md만
- [ ] **Step 4:** PR base=develop 확인

---

## Task 10: sync 무결성 검증 (Phase B)

> 각 서비스 레포의 이관 브랜치(로컬 작업트리)에서 DOCS_DIR을 잡아 대시보드 sync를 dry-run하고, 산출 카운트가 현재 커밋된 `data/<repo-id>.json`과 일치하는지 확인. data 재커밋은 하지 않는다.

**Files:** 없음(검증만). 대시보드 `workflow-dashboard/`에서 실행.

- [ ] **Step 1: 각 repo dry-run 카운트 수집**

각 repo에 대해(절대경로 사용, DOCS_DIR는 서비스 레포의 docs/project-management):
```bash
DOCS_DIR=D:/workspace/dev-path-ai/devpath-shared/docs/project-management node workflow-dashboard/scripts/sync.mjs devpath-shared --dry-run
```
9개 repo 각각 실행(repo-id만 바꿔). 출력의 `📋 Would write: N checks, M done` 값을 기록.

- [ ] **Step 2: 커밋본과 대조**

각 repo의 현재 `data/<repo-id>.json` 카운트:
```bash
node -e "const d=require('./workflow-dashboard/data/devpath-shared.json'); const t=d.tracks.reduce((s,x)=>s+x.weeks.reduce((a,w)=>a+w.totalChecks,0),0); const dn=d.tracks.reduce((s,x)=>s+x.weeks.reduce((a,w)=>a+w.doneChecks,0),0); console.log('devpath-shared committed:', dn+'/'+t)"
```
Expected: Step 1의 `M done / N checks`가 Step 2의 `dn/t`와 **9개 모두 일치**. 불일치 repo가 있으면 멈추고 원인(파일 누락·trackName·파서 경로) 규명. 추측 수정 금지.

- [ ] **Step 3: 검증 결과 기록 (커밋 없음)**

9개 일치 확인 결과를 보고. (이 Task는 파일 변경/커밋 없음.)

---

## Task 11: 대시보드 seed 삭제 + README 갱신 (Phase C)

> Task 1~9의 9개 PR이 push된 이후 수행. 브랜치 `docs/ssot-migration`(현재).

**Files:**
- Delete: `workflow-dashboard/docs/seed/` (전체, 29개 md + 디렉터리)
- Modify: `workflow-dashboard/README.md` (데이터 동기화 절)

- [ ] **Step 1: seed 디렉터리 삭제**
```bash
git -C workflow-dashboard rm -r docs/seed
```
Expected: 29개 md + 디렉터리 삭제 staged.

- [ ] **Step 2: README 데이터 동기화 절 보강**

`workflow-dashboard/README.md`의 "## 데이터 동기화" 절 첫 줄
`각 서비스 레포의 \`docs/project-management/\` 마크다운에서 진행 상황을 수집합니다.`
를 아래로 교체:
```markdown
각 서비스 레포의 `docs/project-management/workflow/WORKFLOW_*.md`(SSoT)에서 진행 상황을 수집합니다. 로컬 재시드는 `DOCS_DIR=<서비스 레포>/docs/project-management npm run sync -- <repo-id>` 형식으로 repo별 실행합니다.
```

- [ ] **Step 3: 게이트 확인**
```bash
git -C workflow-dashboard add docs/seed README.md
npm --prefix workflow-dashboard run validate:data 2>&1 | tail -1
npm --prefix workflow-dashboard run build 2>&1 | grep -E "built in|error"
```
Expected: validate:data PASS(data 변경 없음 — seed는 data와 무관), build PASS.

- [ ] **Step 4: 커밋 + push + PR**
```bash
git -C workflow-dashboard commit -m "docs: docs/seed 제거 — SSoT를 각 서비스 레포로 이관 완료"
git -C workflow-dashboard push -u origin docs/ssot-migration
gh pr create -R DevPathAi/workflow-dashboard --base develop --head docs/ssot-migration \
  --title "docs: SSoT 이관 — docs/seed 제거 + 서비스 레포 원본화" \
  --body "9개 서비스 레포 docs/project-management/workflow/로 WORKFLOW md 이관 완료에 따라 대시보드 docs/seed 제거. sync 무결성 검증(dry-run 카운트 9개 일치) 통과. 설계: docs/superpowers/specs/2026-06-17-ssot-migration-design.md. 🤖 Generated with Claude Code"
```
- [ ] **Step 5:** PR base=develop 확인. (이 PR엔 스펙·플랜 문서 커밋도 포함됨.)

---

## Self-Review (작성자 점검 결과)

- **Spec 커버리지:** 스펙 §2(브랜치 플로우)=Task1~9 (a)블록 / §3(파일 복사)=각 Task (b) / §4(sync 검증)=Task10 / §5 시퀀싱=Task 순서(A=1~9, B=10, C=11) / §6(README)=Task11 Step2 / §0 D-1(seed 삭제)=Task11 Step1. ✅
- **플레이스홀더:** 공통 절차에 실제 명령 전부 포함. 각 Task는 `$REPO`/`$DEV` 구체값 명시(추상 참조 아님). ✅
- **정합:** repo-id·track·파일 개수·develop 존재 여부가 파라미터 표와 각 Task에서 일치. gitops track=team-lead 일관. ✅
- **안전장치:** `git add` 명시 경로 한정(`.omc/` 보호) 전 Task 반복 명시. dirty repo(platform·gitops)에 추가 경고. seed 삭제(Task11)는 9개 push 이후로 순서 강제.
