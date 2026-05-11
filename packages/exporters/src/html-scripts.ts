// EXP-02 vanilla JS templates + EXP-03 IntersectionObserver.
// 각 template 은 export 시 <script> 태그 안에 그대로 inject 됨.
// IIFE 패턴 — 글로벌 오염 없음. ES5 호환 (var/function — 모든 브라우저 지원).
//
// selector 약속 (Phase 04-01 SUMMARY 기준):
//   tabs:     [data-dworks-tabs] [data-dworks-tab-trigger][data-tab-id] [data-dworks-tab-panel][data-tab-id]
//   modal:    [data-dworks-modal-trigger][data-modal-id] [data-dworks-modal][id] [data-dworks-modal-close]
//   accordion:[data-dworks-accordion][data-expand-mode] [data-dworks-accordion-item]
//   carousel: [data-dworks-carousel] .dw-carousel__viewport [data-dworks-carousel-prev/next]
//   entrance: [data-dw-entrance] + [data-dw-entrance-trigger="load|scroll"] + duration/delay

// Tabs vanilla — click + ←/→ 키 네비.
// 비활성 panel 은 hidden attr 토글, 활성 trigger 는 aria-selected="true" + tabindex="0".
export const TABS_SCRIPT = `
(function(){
  document.querySelectorAll('[data-dworks-tabs]').forEach(function(root){
    var triggers = root.querySelectorAll('[data-dworks-tab-trigger]');
    var panels = root.querySelectorAll('[data-dworks-tab-panel]');
    function activate(tabId){
      triggers.forEach(function(t){
        var active = t.getAttribute('data-tab-id') === tabId;
        t.setAttribute('aria-selected', active ? 'true' : 'false');
        t.setAttribute('tabindex', active ? '0' : '-1');
      });
      panels.forEach(function(p){
        var active = p.getAttribute('data-tab-id') === tabId;
        if (active) p.removeAttribute('hidden');
        else p.setAttribute('hidden', '');
      });
    }
    triggers.forEach(function(t, i){
      t.addEventListener('click', function(){ activate(t.getAttribute('data-tab-id')); });
      t.addEventListener('keydown', function(e){
        if (e.key === 'ArrowRight') {
          var n = triggers[(i+1) % triggers.length];
          n.focus(); activate(n.getAttribute('data-tab-id'));
        }
        if (e.key === 'ArrowLeft') {
          var p = triggers[(i-1+triggers.length) % triggers.length];
          p.focus(); activate(p.getAttribute('data-tab-id'));
        }
      });
    });
  });
})();
`

// Modal vanilla — trigger 클릭 → showModal(), close 클릭/backdrop 클릭 → close().
// ESC 키는 <dialog> 네이티브 동작이므로 별도 핸들러 없음.
export const MODAL_SCRIPT = `
(function(){
  document.querySelectorAll('[data-dworks-modal-trigger]').forEach(function(btn){
    btn.addEventListener('click', function(){
      var id = btn.getAttribute('data-modal-id');
      var dialog = document.getElementById(id);
      if (dialog && typeof dialog.showModal === 'function') dialog.showModal();
    });
  });
  document.querySelectorAll('[data-dworks-modal-close]').forEach(function(btn){
    btn.addEventListener('click', function(){
      var dialog = btn.closest('dialog');
      if (dialog) dialog.close();
    });
  });
  // backdrop 클릭 close — <dialog> 의 ::backdrop 영역 클릭 시 event.target 이 dialog 자기 자신으로 잡힌다.
  // WR-02: 이전 getBoundingClientRect 비교는 진입 애니메이션(scale 0.95→1) 중 rect 가 축소되어 false-positive
  //         + 텍스트 selection drag-release 시 의도치 않은 close 발생. e.target === dialog 검사가 표준 패턴.
  document.querySelectorAll('[data-dworks-modal]').forEach(function(dialog){
    dialog.addEventListener('click', function(e){
      if (e.target === dialog) dialog.close();
    });
  });
})();
`

// Accordion vanilla — single 모드에서만 다른 details 자동 닫기.
// multiple 모드는 네이티브 <details> 그대로 (handler 미부착).
export const ACCORDION_SCRIPT = `
(function(){
  document.querySelectorAll('[data-dworks-accordion]').forEach(function(root){
    if (root.getAttribute('data-expand-mode') !== 'single') return;
    var items = root.querySelectorAll('[data-dworks-accordion-item]');
    items.forEach(function(item){
      item.addEventListener('toggle', function(){
        if (item.open) {
          items.forEach(function(other){ if (other !== item) other.removeAttribute('open'); });
        }
      });
    });
  });
})();
`

// Carousel init — Embla UMD 로드 후 각 carousel 노드를 init.
// defer script 가 DOMContentLoaded 전에 로드되었을 가능성 대비 readyState 분기.
export const CAROUSEL_INIT_SCRIPT = `
(function(){
  function init(){
    if (typeof EmblaCarousel !== 'function') return;
    document.querySelectorAll('[data-dworks-carousel]').forEach(function(root){
      var viewport = root.querySelector('.dw-carousel__viewport');
      if (!viewport) return;
      var embla = EmblaCarousel(viewport, { loop: true, slidesToScroll: 1 });
      var prev = root.querySelector('[data-dworks-carousel-prev]');
      var next = root.querySelector('[data-dworks-carousel-next]');
      if (prev) prev.addEventListener('click', function(){ embla.scrollPrev(); });
      if (next) next.addEventListener('click', function(){ embla.scrollNext(); });
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
`

// Entrance animation — IntersectionObserver + prefers-reduced-motion 존중.
// tree-renderer 가 emit 하는 attr: data-dw-entrance / data-dw-entrance-trigger / -duration / -delay
//   (render.ts:60-65 참조 — data-dw-entrance namespace).
// prefers-reduced-motion: reduce 면 초기 상태에서 바로 final 적용 (transition 0).
export const ENTRANCE_ANIMATION_SCRIPT = `
(function(){
  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var TYPE_TO_INITIAL = {
    'slide-up': 'translateY(20px)',
    'slide-left': 'translateX(20px)',
    'slide-right': 'translateX(-20px)',
    'slide-down': 'translateY(-20px)',
    'fade-in': null
  };
  function applyInitial(el){
    var type = el.getAttribute('data-dw-entrance') || 'fade-in';
    if (prefersReduced) { el.style.opacity = '1'; el.style.transform = 'none'; return; }
    el.style.opacity = '0';
    var t = TYPE_TO_INITIAL[type];
    if (t) el.style.transform = t;
  }
  function applyFinal(el){
    var duration = el.getAttribute('data-dw-entrance-duration') || '600';
    var delay = el.getAttribute('data-dw-entrance-delay') || '0';
    el.style.transition = 'opacity ' + duration + 'ms ease ' + delay + 'ms, transform ' + duration + 'ms ease ' + delay + 'ms';
    el.style.opacity = '1';
    el.style.transform = 'none';
  }
  var nodes = document.querySelectorAll('[data-dw-entrance]');
  if (prefersReduced) { nodes.forEach(function(el){ applyInitial(el); }); return; }
  var loadEls = [];
  var scrollEls = [];
  nodes.forEach(function(el){
    var trigger = el.getAttribute('data-dw-entrance-trigger') || 'scroll';
    applyInitial(el);
    if (trigger === 'load') loadEls.push(el);
    else scrollEls.push(el);
  });
  // load trigger — DOM 준비 후 다음 프레임에서 final 적용 (transition 트리거).
  function runLoad(){ requestAnimationFrame(function(){ loadEls.forEach(applyFinal); }); }
  if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', runLoad);
  } else {
    runLoad();
  }
  // scroll trigger — IntersectionObserver, 진입 시 1회 적용 후 unobserve.
  if ('IntersectionObserver' in window) {
    var observer = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if (entry.isIntersecting) { applyFinal(entry.target); observer.unobserve(entry.target); }
      });
    }, { threshold: 0.1 });
    scrollEls.forEach(function(el){ observer.observe(el); });
  } else {
    scrollEls.forEach(applyFinal);
  }
})();
`

// Base CSS — reset + Pretendard font + 인터랙티브 컴포넌트 최소 스타일.
// 토큰 시스템은 향후 web 어댑터에서 확장 (CONTEXT D-03 — lite 버전).
export const BASE_CSS = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html{font-family:'Pretendard Variable','Pretendard',-apple-system,BlinkMacSystemFont,sans-serif;line-height:1.5;-webkit-text-size-adjust:100%}
body{min-height:100vh;font-feature-settings:'tnum'}
img,picture,video{max-width:100%;display:block}
button{font:inherit;background:none;border:0;cursor:pointer;color:inherit}
.dw-tabs__panel[hidden]{display:none}
.dw-modal{border:0;padding:0;background:transparent}
.dw-modal[open]{animation:dwModalIn 200ms ease both}
.dw-modal::backdrop{background:rgba(0,0,0,0.5)}
@keyframes dwModalIn{from{opacity:0;transform:scale(0.95)}to{opacity:1;transform:scale(1)}}
.dw-carousel{position:relative}
.dw-carousel__viewport{overflow:hidden}
.dw-carousel__container{display:flex}
.dw-carousel__slide{flex:0 0 100%;min-width:0}
.dw-carousel__btn{position:absolute;top:50%;transform:translateY(-50%);width:40px;height:40px;border-radius:50%;background:rgba(0,0,0,0.5);color:#fff;z-index:10;font-size:20px}
.dw-carousel__btn--prev{left:8px}
.dw-carousel__btn--next{right:8px}
.dw-accordion__item{border-bottom:1px solid rgba(0,0,0,0.1)}
.dw-accordion__summary{padding:12px 0;cursor:pointer;font-weight:600}
.dw-accordion__panel{padding-bottom:12px}
.dw-tabs__list{display:flex;gap:8px;border-bottom:1px solid rgba(0,0,0,0.1)}
.dw-tabs__trigger{padding:12px 16px;border-bottom:2px solid transparent}
.dw-tabs__trigger[aria-selected="true"]{border-bottom-color:currentColor;font-weight:600}
@media (prefers-reduced-motion:reduce){*{animation-duration:0.01ms !important;transition-duration:0.01ms !important}}
`
