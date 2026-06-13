# DevPath AI — Workflow Dashboard

**DevPath AI** 팀의 워크플로우 진행 현황 대시보드입니다. GitHub Pages로 배포됩니다.

`data/`의 정적 JSON을 읽어 다음을 렌더링합니다.

- 전체 진행률 (모든 트랙 체크 합산)
- 트랙별 카드 (담당자·주차별 진행률)
- 주차별 진행 테이블 / 진행 추이 차트
- 레포 상세 페이지 (PRD / Task / Workflow / Changelog 탭)

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

프로젝트는 **24주(W1~W24, 2026-06-15 시작) / 마일스톤 6개** 기준입니다.

| 마일스톤 | 시점 | 완료 기준 |
| --- | --- | --- |
| M1 가입 플로우 | W4 | GitHub OAuth + 프로필 수집 |
| M2 1st Aha | W8 | 가입 → 개인화 경로 p50 < 8분 |
| M3 학습 실행 | W12 | Sandbox + AI 리뷰 작동 |
| M4 모바일·커뮤니티 | W16 | Flutter 앱 + 게시판 + 프로필 |
| M5 습관화 | W20 | D7 리텐션 ≥ 25% (staging) |
| M6 v1.0 | W24 | 회귀 + 부하 + Chaos 전부 통과 |

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

전체 데이터 계약은 [skills/project-dashboard/references/data-schema.md](skills/project-dashboard/references/data-schema.md) 참고.

## 데이터 동기화

각 서비스 레포의 `docs/project-management/` 마크다운에서 진행 상황을 수집합니다.

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
