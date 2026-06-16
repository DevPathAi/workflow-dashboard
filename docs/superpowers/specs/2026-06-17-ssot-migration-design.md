# 설계 — SSoT 이관 (dashboard docs/seed → 9개 서비스 레포)

> **작성일**: 2026-06-17 · **브랜치**: `docs/ssot-migration` (dashboard, develop 분기)
> **목적**: 대시보드 `docs/seed/<repo-id>/workflow/`에 임시로 둔 WORKFLOW md를 각 서비스 레포 `docs/project-management/workflow/`로 이관해 **서비스 레포를 유일 SSoT**로 만든다. (선행: 일정 재정렬 PR #5가 develop 머지됨)
> **원칙**: 추측 금지·검증 우선 + 브랜치 전략(main 보호·develop 경유 2단계 PR). develop 없는 레포는 main에서 생성.
> **그라운딩(검증됨)**: 9개 레포 git 상태 실측 — 7개(shared·gateway·platform·learning·community·ai·sandbox)는 origin/develop 없음·`main`·`docs/project-management/README.md`만 존재; frontend·gitops는 develop 있음·`docs/project-management` 디렉터리 없음. platform·gitops의 "dirty"는 untracked `.omc/`뿐(WIP 아님). 어느 레포에도 `workflow/` 하위 디렉터리 없음.

---

## 0. 확정 결정 (브레인스토밍)

| ID | 결정 | 선택 |
|---|---|---|
| D-1 | 이관 후 대시보드 docs/seed | **삭제 — 서비스 레포가 유일 SSoT** |
| (전제) | SSoT 위치 | 각 서비스 레포 `docs/project-management/workflow/` (일정 재정렬 D-C 계승) |

## 1. 범위

WORKFLOW md의 **위치 이동**이다. 내용·진척은 불변. 대시보드 `data/*.json`은 이미 정확하므로 변경 없음. 산출물: 9개 서비스 레포 PR(md 추가) + 대시보드 PR(seed 삭제·README 갱신).

## 2. 레포별 브랜치 플로우

| 레포 | 현재 | 작업 |
|---|---|---|
| devpath-shared·gateway·platform-svc·learning-svc·community-svc·ai-svc·sandbox-svc | main, develop 없음 | ① main에서 `develop` 생성·push ② develop에서 `docs/seed-project-management` 분기 ③ md 추가·commit·push ④ develop PR |
| devpath-frontend·gitops | develop 있음 | develop에서 `docs/seed-project-management` 분기 → md 추가 → develop PR (`docs/project-management/` 디렉터리 신규) |
| workflow-dashboard | develop 있음(작업 중 `docs/ssot-migration`) | 9개 PR 후 `docs/seed/` 삭제 + README sync 소스 설명 갱신 → develop PR |

- `.omc/`(untracked)는 절대 stage/commit 하지 않는다.
- 각 서비스 레포의 기존 `docs/project-management/README.md`는 유지하고 `workflow/` 하위만 추가한다.
- 각 레포는 자기 git·PR을 가진다(워크스페이스 루트는 비-git).

## 3. 파일 작업 (레포당 동일)

대시보드 `docs/seed/<repo-id>/workflow/WORKFLOW_*.md` → 해당 서비스 레포 `docs/project-management/workflow/`로 **내용 동일 복사**.

repo-id ↔ 파일:
- devpath-shared: `WORKFLOW_shared_DONE.md`, `_MD1.md`, `_MD3.md`
- devpath-gateway: `WORKFLOW_gateway_DONE.md`, `_MD1.md`
- devpath-platform-svc: `WORKFLOW_platform_DONE.md`, `_MD1.md`, `_MD2.md`, `_MD4.md`
- devpath-learning-svc: `WORKFLOW_learning_DONE.md`, `_MD1.md`, `_MD2.md`, `_MD3.md`
- devpath-community-svc: `WORKFLOW_community_DONE.md`, `_MD3.md`
- devpath-ai-svc: `WORKFLOW_ai_DONE.md`, `_MD1.md`, `_MD2.md`, `_MD3.md`, `_MD4.md`
- devpath-sandbox-svc: `WORKFLOW_sandbox_DONE.md`, `_MD2.md`, `_MD4.md`
- devpath-frontend: `WORKFLOW_frontend_DONE.md`, `_MD1.md`, `_MD2.md`, `_MD3.md`
- devpath-gitops: `WORKFLOW_team-lead_DONE.md`, `_MD4.md`

(총 29개 파일. 대시보드 `docs/seed/` 현재 내용과 1:1.)

## 4. 검증 = 이관 무결성

"테스트"는 **대시보드가 서비스 레포에서 동일 데이터를 재생성하는지**다. 각 repo에 대해:

```
DOCS_DIR=<service-repo>/docs/project-management npm run sync -- <repo-id>
```
실행 후 생성된 `data/<repo-id>.json`이 **현재 develop 커밋본과 diff 0**인지 확인(`git diff --stat`). 단, `updatedAt`·`history`의 날짜 필드는 sync 시각이라 달라질 수 있으므로 **tracks(체크 항목·done 수)** 정합을 기준으로 본다. 9개 모두 통과해야 Phase C 진행.

> 주의: 무결성 검증은 서비스 레포 **로컬 체크아웃**(이관 브랜치)에서 DOCS_DIR을 잡아 수행한다. 검증만이라 data 재커밋은 하지 않는다(대시보드 data는 이미 동일).

## 5. 시퀀싱

- **Phase A** — 9개 서비스 레포: develop 생성(필요 시) → md 추가 브랜치 → push → develop PR. (merge는 사용자 게이트.)
- **Phase B** — sync 무결성 검증(§4). 불일치 시 멈추고 원인 규명.
- **Phase C** — 대시보드: `docs/seed/` 삭제 + README sync 소스 설명 갱신 → develop PR.

seed 삭제 안전성: 내용이 서비스 레포에 이미 존재 + git 히스토리로 복구 가능. 단 **Phase C는 Phase A의 9개 PR push 이후** 수행(원본이 원격에 안전히 올라간 뒤).

## 6. 대시보드 README 갱신(Phase C)

`README.md` "데이터 동기화" 절(현재 "각 서비스 레포의 docs/project-management/ 마크다운에서 수집")은 이미 서비스 레포를 가리키므로 큰 변경 없음. 추가: `docs/seed/`가 제거되었고 원본 SSoT가 각 서비스 레포 `docs/project-management/workflow/`임을 명확히. 일정 재정렬 스펙의 "dashboard seed(임시)" 표현이 있으면 정리.

## 7. 비범위 (YAGNI / 명시 제외)

- **대시보드 자동 sync CI**(서비스 레포 push 시 data 자동 갱신 워크플로): 안 함. 수동 `DOCS_DIR sync` 유지. 별도 검토 대상.
- 각 서비스 레포 CLAUDE.md/README 변경: 불필요(md 추가만).
- 진척 내용·data/*.json 변경: 없음(위치 이동만).
- 9개 PR 자동 머지: 안 함(사용자 게이트).

## 8. 리스크

| 리스크 | 완충 |
|---|---|
| 7개 레포 develop 신규 생성이 기존 흐름과 충돌 | main==develop 시점에 생성(분기 0 비용). 규칙대로 develop만 생성·push |
| `.omc/` 등 untracked 오염 커밋 | `git add`를 명시 파일 경로로만(절대 `git add .` 금지) |
| sync 무결성 불일치(파서 경로·trackName) | Phase B에서 repo별 확인, 불일치 시 멈춤. trackName=config.repos[].trackName(gitops=team-lead) |
| seed 선삭제로 원본 분실 | Phase C를 Phase A push 이후로 강제 + git 히스토리 복구 |
