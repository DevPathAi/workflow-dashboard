/**
 * 트랙별 식별 색상 — 대시보드 카드와 진행률 추이 차트가 공유한다.
 * 같은 트랙은 두 곳에서 같은 색을 갖도록 한다(상호 일관성).
 * index < 팔레트 길이면 팔레트 순서, 그 외에는 이름 해시로 결정.
 */
export const TRACK_COLORS = [
  '#D97706', '#0D9488', '#6366F1', '#EC4899', '#0EA5E9', '#8B5CF6',
  '#F97316', '#06B6D4', '#84CC16', '#E879F9', '#14B8A6', '#F43F5E',
]

export function getTrackColor(trackName: string, index: number): string {
  if (index < TRACK_COLORS.length) return TRACK_COLORS[index]
  let hash = 0
  for (let i = 0; i < trackName.length; i++) {
    hash = ((hash << 5) - hash) + trackName.charCodeAt(i)
    hash |= 0
  }
  return TRACK_COLORS[Math.abs(hash) % TRACK_COLORS.length]
}
