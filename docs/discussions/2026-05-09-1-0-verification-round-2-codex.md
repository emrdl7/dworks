# 1.0.0 verification — Codex round 2

검증 시각: 2026-05-09 21:35 KST  
대상 커밋: `c79bdad` (`chore: 1.0.0 — 안정 stable foundation 마감`)  
검증자: Codex

## 결론

`c79bdad` 기준으로 "1.0.0 stable foundation 완료"라고 단정하기 어렵다.

코드의 production build, typecheck, test, web 단독 lint는 통과했다. 그러나 다음 세 가지가 release/stable 기준을 막는다.

1. 워크스페이스 전체 `pnpm lint`가 실패한다.
2. 1.0.0 버전 bump가 `@dworks/web`에만 적용되어 release metadata가 불일치한다.
3. 3000 dev 화면이 최초 검증 시 500으로 깨졌고, `preflight`가 해당 stale `.next` 상태를 감지하지 못했다.

또한 반응형 화면 구조는 768/440 폭에서 좌우 고정 패널이 캔버스를 가리는 상태라, "웹 디자인 툴"의 기본 구조 품질 기준에는 아직 못 미친다.

## 검증 결과

### 통과

```bash
pnpm typecheck
# 17 successful / 17 total

pnpm test
# 13 successful / 13 total

pnpm --filter @dworks/web lint
# exit 0, warning output 없음

pnpm build
# @dworks/api build + @dworks/web build 통과
# / size 76.7 kB, First Load JS 179 kB
```

fresh dev restart 이후:

```bash
curl -sS -o /dev/null -w 'home=%{http_code} %{content_type} %{size_download}\n' http://localhost:3000/
# home=200 text/html; charset=utf-8 90556
```

홈 HTML에서 참조되는 CSS/JS:

```text
/_next/static/css/app/layout.css?...              200 text/css
/_next/static/chunks/app/page.js                  200 application/javascript
/_next/static/chunks/main-app.js?...              200 application/javascript
/_next/static/chunks/app-pages-internals.js       200 application/javascript
/_next/static/chunks/webpack.js?...               200 application/javascript
/_next/static/chunks/polyfills.js                 200 application/javascript
```

Playwright viewport smoke:

```text
desktop 1680x950: status 200, console page errors 없음, document scroll overflow 없음
tablet  768x900 : status 200, console page errors 없음, document scroll overflow 없음
mobile  440x900 : status 200, console page errors 없음, document scroll overflow 없음
```

### 실패

```bash
pnpm lint
```

실패 원인:

```text
ESLint couldn't find an eslint.config.(js|mjs|cjs) file.
```

영향 패키지 예:

```text
@dworks/api
@dworks/components
@dworks/exporters
@dworks/llm-prompts
@dworks/tokens
@dworks/tree
@dworks/tree-editor
@dworks/tree-renderer
@dworks/validators
...
```

현재 flat config는 `apps/web/eslint.config.mjs`에만 있다. 루트 `package.json`의 `lint`는 `turbo lint`이므로, `1.0.0: ESLint warning 0` 주장은 "web 단독 lint"로 제한해야 한다. 워크스페이스 전체 기준으로는 lint가 실행 단계에서 실패한다.

## Release metadata 불일치

`c79bdad`는 실제로 `apps/web/package.json` 한 파일만 변경했다.

```bash
git show --stat --oneline c79bdad
# apps/web/package.json | 2 +-
```

현재 버전:

```text
apps/web/package.json      1.0.0
package.json               0.1.0
apps/api/package.json      0.1.0
apps/m3-eval/package.json  0.1.0
packages/*/package.json    0.1.0
```

따라서 "전체 1.0.0" release가 아니라 `@dworks/web`만 1.0.0이다. 이전 `0.1.0` 커밋 메시지에는 "모든 workspace package version bump"라고 되어 있었는데, 이번 1.0.0은 그 기준을 충족하지 않는다.

## 3000 dev 서버 문제

최초 검증 시 `http://localhost:3000/`는 500이었다.

```text
Cannot find module './211.js'
Require stack:
- apps/web/.next/server/webpack-runtime.js
- apps/web/.next/server/pages/_document.js
...
```

당시 `.next/server/chunks/211.js` 파일은 존재했다. 즉, runtime은 `./211.js`를 찾고 실제 chunk는 `server/chunks/211.js`에 있는 혼합 stale 상태였다.

`pnpm --filter @dworks/web preflight`는 이 상태를 stale로 판단하지 않았다. 현재 `preflight`는 다음 marker 존재 여부만 확인한다.

```js
const REQUIRED_MARKERS = [
  'build-manifest.json',
  'app-build-manifest.json',
]
```

이 검사는 manifest가 존재하지만 webpack runtime/chunk layout이 섞인 상태를 못 잡는다.

수동 복구 절차:

```bash
for pid in $(lsof -tiTCP:3000 -sTCP:LISTEN); do kill "$pid" || true; done
rm -rf apps/web/.next
pnpm --filter @dworks/web dev
```

Codex 검증 후에는 fresh dev 서버를 `screen` 세션으로 재기동했다.

```text
screen: dworks-web-dev
port: 3000
status: 200
```

## 반응형 구조 품질 이슈

화면 자체는 1680/768/440 모두 렌더되고 document-level scroll overflow는 없다. 그러나 768/440에서는 앱 구조가 실사용 가능한 responsive design tool 레이아웃이라고 보기 어렵다.

관찰:

- 데스크톱: 좌측 패널, 중앙 캔버스, 우측 속성 패널이 모두 보인다.
- 768: 좌측 260px + 우측 360px 고정 패널 때문에 중앙 캔버스가 얇게 잘린다.
- 440: 좌측과 우측 패널만 보이고 중앙 캔버스는 사실상 접근 불가능하다.

원인 후보:

```tsx
// apps/web/src/app/page.tsx
grid-cols-[260px_minmax(0,1fr)_360px]
```

```tsx
style={{
  minWidth: selectedViewportPreset.width * canvasZoom + 64,
}}
```

작은 화면에서 page-level scroll을 막은 것은 맞지만, 그 결과로 중앙 작업면이 패널 뒤/옆으로 밀려 실사용성이 떨어진다.

## 권장 보완 순서

P0 — release gate 정합성:

1. 루트 `pnpm lint`가 통과하도록 ESLint flat config를 루트 또는 각 패키지에 정리한다.
2. 1.0.0 기준을 명확히 한다.
   - 전체 release라면 모든 workspace package version을 1.0.0으로 맞춘다.
   - web-only release라면 커밋/문서 문구를 `@dworks/web 1.0.0`으로 낮춘다.
3. `preflight`가 manifest 존재만 보지 말고 dev/prod 혼합 `.next`를 잡도록 강화한다.
   - 예: `BUILD_ID`/`static/<buildId>`/`server/webpack-runtime.js` chunk 위치 mismatch 감지
   - 또는 dev 시작 전 `.next/package.json`/build marker가 production 산출물임을 감지하면 정리

P1 — design tool 구조:

1. 768 이하에서 좌측/우측 패널을 동시에 고정하지 않는다.
2. 최소 한 가지 구조를 적용한다.
   - 패널 탭 전환: `AI 디자인 / 캔버스 / 속성`
   - 좌측 drawer + 우측 bottom sheet
   - inspector collapse 기본값 + 캔버스 우선
3. 캔버스 zoom 컨트롤은 유지하되, 패널 고정폭 때문에 캔버스가 사라지는 문제를 먼저 해결한다.

## Codex가 수정하지 않은 이유

이번 요청은 "검증하고 관련 내용을 Claude가 볼 수 있도록 정리"였으므로 코드 수정 없이 검증 노트만 남긴다. 작업트리는 검증 후 clean 상태였고, 서버만 fresh dev 상태로 재기동했다.
