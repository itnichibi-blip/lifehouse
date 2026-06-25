"use strict";

import 'destyle.css';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/effect-fade';

// import '../css/style.css';
import '../css/style.css';

import Swiper from 'swiper';
import { Pagination, Autoplay, EffectFade } from 'swiper/modules';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
gsap.registerPlugin(ScrollTrigger);

// ヘッダー高さをCSS変数にセット
const header = document.querySelector('.header');
const setHeaderHeight = () => {
  if (!header) return;
  document.documentElement.style.setProperty('--header-height', `${header.offsetHeight}px`);
};
setHeaderHeight();
window.addEventListener('resize', setHeaderHeight);
const refreshLayout = () => {
  setHeaderHeight();
  ScrollTrigger.refresh();
};
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', refreshLayout);
} else {
  refreshLayout();
}
window.addEventListener('load', refreshLayout);

const getHeaderOffset = () => {
  if (header) return header.offsetHeight;
  const raw = getComputedStyle(document.documentElement).getPropertyValue('--header-height');
  const n = parseFloat(raw);
  return Number.isFinite(n) ? n : 80;
};

/** 固定ヘッダー直下に置くまでのオフセット（下端＋わずかな余白）。offsetHeight だけだと border や subpixel で被ることがある */
const ANCHOR_GAP_BELOW_HEADER = 16;

const getAnchorViewportOffset = () => {
  if (header) {
    return Math.ceil(header.getBoundingClientRect().bottom) + ANCHOR_GAP_BELOW_HEADER;
  }
  return getHeaderOffset() + ANCHOR_GAP_BELOW_HEADER;
};

// ファーストビュースワイパー
if (document.querySelector('.hero_swiper')) {
  new Swiper('.hero_swiper', {
    effect: 'fade',
    fadeEffect: {
      crossFade: true,
    },
    modules: [Pagination, Autoplay, EffectFade],
    loop: true,
    speed: 1500,
    autoplay: {
      delay: 6000,
      disableOnInteraction: false,
    },
    pagination: {
      el: '.swiper-pagination',
      clickable: true,
    },
  });
}


const items = document.querySelectorAll('.accordion_item');

// 最初の項目を開いておく
if (items[0]) openAccordion(items[0]);


items.forEach(item => {
    item.querySelector('.accordion_header').addEventListener('click', () => {
        const isOpen = item.classList.contains('open');

        // すべての項目を閉じる
        closeAllAccordions();

        if (!isOpen) {
            // 閉じていた場合は、その項目を開く
            openAccordion(item);
        }
    });
});

// ----------------------------------------------------------------
// アコーディオン開閉の関数
// ----------------------------------------------------------------

/**
 * すべてのアコーディオンを閉じます。
 */
function closeAllAccordions() {
    items.forEach(item => {
        item.classList.remove('open');
        const content = item.querySelector('.accordion_content');
        gsap.killTweensOf(content);
        gsap.to(content, {
            height: 0,
            paddingTop: 0,
            paddingBottom: 0,
            duration: 0.4
        });
    });
}

/**
 * 特定のアコーディオンを開きます。
 * @param {HTMLElement} item - 開く対象のアコーディオン要素
 */
function openAccordion(item) {
    const content = item.querySelector('.accordion_content');
    gsap.killTweensOf(content);

    // padding込みの高さを計測してからリセット
    gsap.set(content, { height: 'auto', paddingTop: 16, paddingBottom: 48 });
    const contentHeight = content.offsetHeight;
    gsap.set(content, { height: 0, paddingTop: 0, paddingBottom: 0 });

    // height と padding を同時にアニメーション
    gsap.to(content, {
        height: contentHeight,
        paddingTop: 16,
        paddingBottom: 48,
        duration: 0.4,
        onComplete: () => {
            gsap.set(content, { height: 'auto' });
        }
    });
    item.classList.add('open');
}

// ----------------------------------------------------------------
// メニューボタン開閉
// ----------------------------------------------------------------
const menuButton = document.querySelector('.menu_button');
const subMenu = document.querySelector('.sub_menu');
let isMenuOpen = false;

gsap.set(subMenu, { autoAlpha: 0 });

menuButton.addEventListener('click', () => {
  isMenuOpen = !isMenuOpen;
  if (isMenuOpen) {
    gsap.to(subMenu, { autoAlpha: 1, y: 8, duration: 0.3 });
  } else {
    gsap.to(subMenu, { autoAlpha: 0, y: 0, duration: 0.2 });
  }
});

// メニュー外クリックで閉じる
document.addEventListener('click', (e) => {
  if (isMenuOpen && !menuButton.contains(e.target) && !subMenu.contains(e.target)) {
    isMenuOpen = false;
    gsap.to(subMenu, { autoAlpha: 0, y: 0, duration: 0.2 });
  }
});

// サブメニュー内リンクをクリックしたら閉じる
subMenu.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    isMenuOpen = false;
    gsap.to(subMenu, { autoAlpha: 0, y: 0, duration: 0.2 });
  });
});

// worksページ画像のアニメーション
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
        }
    });
}, {
    threshold: 0.5
});

document.querySelectorAll('.img_wrapper').forEach(wrapper => {
    observer.observe(wrapper);
});

const overlapWrap = document.querySelector('.overlap_wrap');
const companySection = document.getElementById('company');
const contactAccessSection = document.getElementById('contact_access');
/** index のみ main 直下にフッターあり。works 等では null */
const footerStackEl = document.querySelector('main.main > footer.footer');

const stackLayersComplete =
  overlapWrap &&
  companySection &&
  contactAccessSection &&
  footerStackEl;

/**
 * PC: 実績 → 会社概要 → お問い合わせ → フッターを pinSpacing:false で積む。
 * 次セクション上端がヘッダー基準線に達するまで pin（1枚ずつ重なる）。アンカー後は revert 付き disable → 即時 refresh で同期。
 */
if (stackLayersComplete) {
  const stackMm = gsap.matchMedia();
  stackMm.add('(min-width: 1025px)', () => {
    const pinTop = () => `${getHeaderOffset()}px`;
    const layers = [overlapWrap, companySection, contactAccessSection, footerStackEl];

    layers.forEach((el, i) => {
      gsap.set(el, { zIndex: 2 + i });
    });

    const triggers = layers.map((el, i) => {
      const next = layers[i + 1];
      return ScrollTrigger.create({
        id: `stack-pin-${i}`,
        trigger: el,
        start: () => `top ${pinTop()}`,
        endTrigger: next || el,
        end: next ? () => `top ${pinTop()}` : 'bottom bottom',
        pin: true,
        pinSpacing: false,
        anticipatePin: 1,
        invalidateOnRefresh: true,
      });
    });

    const worksAnimated = overlapWrap.querySelector('.works');
    let tw = null;
    if (worksAnimated) {
      tw = gsap.from(worksAnimated, {
        y: 80,
        scrollTrigger: {
          trigger: overlapWrap,
          start: 'top bottom',
          end: () => `top ${pinTop()}`,
          scrub: 1,
        },
      });
    }

    requestAnimationFrame(() => {
      requestAnimationFrame(() => ScrollTrigger.refresh());
    });

    return () => {
      triggers.forEach((st) => st.kill());
      layers.forEach((el) => gsap.set(el, { clearProps: 'zIndex' }));
      if (tw) {
        tw.kill();
        if (worksAnimated) gsap.set(worksAnimated, { clearProps: 'transform' });
      }
    };
  });
}

/** 固定ヘッダー＋余白を合わせてスクロールする同一ページ内アンカー（# は main.js で処理） */
const HEADER_OFFSET_ANCHOR_IDS = new Set(['works', 'company', 'contact_access', 'business']);

if (overlapWrap || companySection || document.getElementById('contact_access')) {
  const prefersReducedMotion = () =>
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const normalizePath = (pathname) => {
    let p = pathname.replace(/\/$/, '') || '/';
    if (p.endsWith('/index.html')) p = p.slice(0, -'/index.html'.length) || '/';
    return p;
  };

  const samePageAsLocation = (url) =>
    url.origin === location.origin && normalizePath(url.pathname) === normalizePath(location.pathname);

  const getStackPinTriggers = () =>
    ScrollTrigger.getAll().filter((st) => {
      const id = st.vars.id;
      return id != null && String(id).startsWith('stack-pin-');
    });

  /**
   * 実績〜フッターは ScrollTrigger pin のため、アンカー直後に refresh と位置補正で pin を再同期する。
   */
  const restoreHtmlScrollBehavior = (root, prev) => {
    root.style.scrollBehavior = prev;
  };

  /** 瞬間移動（微調整・reduce モード用） */
  const scrollToDocumentYInstant = (top) => {
    const t = Math.max(0, top);
    const root = document.documentElement;
    const prev = root.style.scrollBehavior;
    root.style.scrollBehavior = 'auto';
    window.scrollTo({ top: t, left: 0, behavior: 'auto' });
    const se = document.scrollingElement || root;
    if (Math.abs((window.pageYOffset || se.scrollTop) - t) > 2) {
      se.scrollTop = t;
    }
    restoreHtmlScrollBehavior(root, prev);
  };

  const scrollElementBelowFixedHeader = (el, sectionId) => {
    if (!el) return;

    /** pin 中は scrollHeight／座標が圧縮されてズレるため、計測・スクロール前に stack で revert し、終わってから再有効化する */
    const finishStackAnchorScroll = (stackPinTriggers) => {
      stackPinTriggers.forEach((st) => st.enable());
      ScrollTrigger.refresh();
      setHeaderHeight();
      const pad = getAnchorViewportOffset();
      const topGap = el.getBoundingClientRect().top;
      if (Math.abs(topGap - pad) > 4) {
        const sy = window.pageYOffset || document.documentElement.scrollTop;
        const yFix = el.getBoundingClientRect().top + sy - pad;
        scrollToDocumentYInstant(yFix);
      }
      ScrollTrigger.refresh();
    };

    /** smooth 完了待ち（初回計測前の refresh でレイアウト確定後にスクロールする） */
    const waitForSmoothScrollSettled = (targetY, onDone) => {
      const start = performance.now();
      const tick = () => {
        const sy = window.scrollY;
        const se = document.scrollingElement || document.documentElement;
        const maxScroll = Math.max(0, se.scrollHeight - window.innerHeight);
        const clampedTarget = Math.min(targetY, maxScroll);
        const nearTarget = Math.abs(sy - clampedTarget) < 6;
        const timedOut = performance.now() - start > 4500;
        if (nearTarget || timedOut) {
          onDone();
          return;
        }
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };

    const run = () => {
      const stackPinTriggers = getStackPinTriggers();
      stackPinTriggers.forEach((st) => st.disable(true));
      ScrollTrigger.refresh();

      const measureAndScroll = () => {
        setHeaderHeight();
        const pad = getAnchorViewportOffset();
        const sy = window.pageYOffset || document.documentElement.scrollTop;
        const se = document.scrollingElement || document.documentElement;
        const maxScroll = Math.max(0, se.scrollHeight - window.innerHeight);
        let y = Math.max(0, el.getBoundingClientRect().top + sy - pad);
        y = Math.min(y, maxScroll);

        if (prefersReducedMotion()) {
          scrollToDocumentYInstant(y);
          requestAnimationFrame(() => finishStackAnchorScroll(stackPinTriggers));
          return;
        }

        window.scrollTo({ top: y, left: 0, behavior: 'smooth' });
        waitForSmoothScrollSettled(y, () => finishStackAnchorScroll(stackPinTriggers));
      };

      requestAnimationFrame(() => {
        requestAnimationFrame(measureAndScroll);
      });
    };

    requestAnimationFrame(() => {
      requestAnimationFrame(run);
    });
  };

  /**
   * 会社概要: 見出し（.title_group）基準。
   * お問い合わせ: section 上端ではなく .contact_block（青ブロック）基準。上の装飾画像・padding でずれるため。
   */
  const getAnchorScrollTargetEl = (id) => {
    const section = document.getElementById(id);
    if (!section) return null;
    if (id === 'company') {
      const title = section.querySelector('.title_container .title_group');
      if (title) return title;
    }
    if (id === 'contact_access') {
      const block = section.querySelector('.contact_block');
      if (block) return block;
    }
    return section;
  };

  const scrollToSectionWithHeader = (id) => {
    const targetEl = getAnchorScrollTargetEl(id);
    if (!targetEl) return;
    scrollElementBelowFixedHeader(targetEl, id);
  };

  const onHeaderOffsetAnchorClick = (e) => {
    const a = e.target.closest('a');
    if (!a) return;

    const hrefAttr = (a.getAttribute('href') || '').trim();
    let hash = '';
    let historyUrl = '';

    if (hrefAttr.startsWith('#')) {
      const name = hrefAttr.slice(1).split('?')[0];
      if (!name || !HEADER_OFFSET_ANCHOR_IDS.has(name)) return;
      hash = `#${name}`;
      historyUrl = `${location.pathname}${location.search}${hash}`;
    } else {
      let url;
      try {
        url = new URL(a.href);
      } catch {
        return;
      }
      if (!samePageAsLocation(url)) return;
      hash = url.hash;
      const idFromHash = hash.startsWith('#') ? hash.slice(1).split('?')[0] : '';
      if (!idFromHash || !HEADER_OFFSET_ANCHOR_IDS.has(idFromHash)) return;
      historyUrl = `${url.pathname}${url.search}${hash}`;
    }

    const id = hash.slice(1).split('?')[0];
    if (!document.getElementById(id)) return;

    e.preventDefault();
    history.replaceState(null, '', historyUrl);

    requestAnimationFrame(() => {
      scrollToSectionWithHeader(id);
    });
  };

  document.addEventListener('click', onHeaderOffsetAnchorClick, true);

  window.addEventListener('hashchange', () => {
    const id = location.hash.startsWith('#') ? location.hash.slice(1).split('?')[0] : '';
    if (!id || !HEADER_OFFSET_ANCHOR_IDS.has(id)) return;
    if (!document.getElementById(id)) return;
    requestAnimationFrame(() => {
      scrollToSectionWithHeader(id);
    });
  });

  const initialHashId = location.hash.startsWith('#') ? location.hash.slice(1).split('?')[0] : '';
  if (initialHashId && HEADER_OFFSET_ANCHOR_IDS.has(initialHashId) && document.getElementById(initialHashId)) {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        scrollToSectionWithHeader(initialHashId);
      });
    });
  }
}

// hero service ホバー時にビデオ再生
document.querySelectorAll('.hero_service_item').forEach(item => {
  const video = item.querySelector('.hero_service_video');
  if (!video) return;
  item.addEventListener('mouseenter', () => { video.play(); });
  item.addEventListener('mouseleave', () => { video.pause(); video.currentTime = 0; });
});