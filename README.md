# DevPath AI — Workflow Dashboard

**DevPath AI** 팀의 워크플로우 진행 현황 대시보드입니다. GitHub Pages로 배포됩니다.

`data/`의 정적 JSON을 읽어 다음을 렌더링합니다.

- 전체 진행률 (모든 트랙 체크 합산)
- 트랙별 카드 (담당자·단계별 진행률)
- 단계별 진행 테이블 / 진행 추이 차트
- 레포 상세 페이지 (PRD / Task / Workflow / Changelog 탭) — 작업이 있는 첫 단계가 기본으로 열림

> 이 레포는 [project-dashboard 스킬](skills/project-dashboard/project-dashboard.md)로 생성·관리됩니다.
> 데이터 수정/동기화는 `/project-dashboard` 스킬 명령(`status`, `config`, `edit`, `sync`)을 사용하세요.

## 기술 스택

- React 19 + TypeScript + Vite 8
- Tailwind CSS 4, Chart.js
- GitHub Pages (`.github/workflows/build.yml`)

## 로컬 실행

```bash
npm install
npm run dev
```

Vite 서버: `http://127.0.0.1:5173/workflow-dashboard/`

`HashRouter`를 사용하므로 상세 페이지 URL은 다음 형식입니다.

```text
http://127.0.0.1:5173/workflow-dashboard/#/detail/devpath-platform-svc
```

## 검사

푸시 전에 전부 실행:

```bash
npm run lint
npm run validate:data
npm run build
```

## 데이터 구조

프로젝트는 **단계 DONE·MD1~MD4 (모두의 창업 라운드 정렬, 2026-06~12)** 기준이며, 작업 단위는 **수직 슬라이스 #1~12**(repo별 Step)입니다.

| 단계 | 시점 | 완료 기준(끝단간 동작) |
| --- | --- | --- |
| DONE | ~6.16 | W1 인프라 + 프론트 목 프로토(web·admin) 기준선 |
| MD1 1st Aha | ~7.20 | OAuth → 진단 → 학습경로(Claude) p50 < 8분, web 실동작 |
| MD2 2nd Aha + 베타 | ~8.31 | 콘텐츠→Sandbox→AI리뷰 + 결제 + 베타 100명 (=8주 MVP) |
| MD3 풀 골든패스 + 멀티플랫폼 | ~11월 | 멘토·커뮤니티·LCS + 모바일 앱 + 랜딩 배포 |
| MD4 v1.0 완성도 | 12월 | 회귀·부하·Chaos 통과 + 왕중왕 IR 데모 |

트랙(레포) 목록 — `data/config.json`:

| Repo | Track |
| --- | --- |
| `devpath-shared` | shared |
| `devpath-gateway` | gateway |
| `devpath-platform-svc` | platform |
| `devpath-learning-svc` | learning |
| `devpath-community-svc` | community |
| `devpath-ai-svc` | ai |
| `devpath-sandbox-svc` | sandbox |
| `devpath-frontend` | frontend |
| `devpath-gitops` | team-lead |

> 현재 `data/`에는 [17_스케줄](https://github.com/DevPathAi/documents/blob/main/17_스케줄.md) 기반 **DONE 기준선 + MD1~MD4 수직 슬라이스** 작업이 9개 트랙에 시드되어 있습니다. DONE 기준선(W1 인프라·프론트 목 프로토)은 완료(`- [x]`)로 박제, 이후 슬라이스는 계획 상태이며 실제 진척은 각 서비스가 작업하며 `sync`로 갱신합니다.

전체 데이터 계약은 [skills/project-dashboard/references/data-schema.md](skills/project-dashboard/references/data-schema.md) 참고.

## 데이터 동기화

각 서비스 레포의 `docs/project-management/workflow/WORKFLOW_*.md`(SSoT)에서 진행 상황을 수집합니다. 로컬 재시드는 `DOCS_DIR=<서비스 레포>/docs/project-management npm run sync -- <repo-id>` 형식으로 repo별 실행합니다(과거 `docs/seed/`는 제거됨 — 원본은 각 서비스 레포).

```bash
npm run sync:dry   # 변경 미리보기
npm run sync       # data/*.json 갱신
```

갱신 후 `npm run validate:data && npm run build`로 확인하고 푸시합니다.

## 배포

`main` 푸시 시 GitHub Actions가 lint → validate:data → build 후 `data/`를 포함한 `dist/`를 GitHub Pages에 배포합니다. Vite base 경로는 `/workflow-dashboard/`입니다.

## 관련 문서

- [documents/17_스케줄](https://github.com/DevPathAi/documents/blob/main/17_스케줄.md)
- [documents/09_Git_규칙_정의서](https://github.com/DevPathAi/documents/blob/main/09_Git_규칙_정의서.md)
