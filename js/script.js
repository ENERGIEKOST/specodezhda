document.addEventListener('DOMContentLoaded', () => {
    'use strict';

    const store = {
        get(key) { try { return localStorage.getItem(key); } catch (e) { return null; } },
        set(key, val) { try { localStorage.setItem(key, val); } catch (e) { /* noop */ } }
    };

    const $ = (id) => document.getElementById(id);

    /* ============================================================
       1. ПОЛОСА ПРОГРЕССА
       ============================================================ */
    const scrollProgress = $('scrollProgress');
    if (scrollProgress) {
        let progressTicking = false;
        window.addEventListener('scroll', () => {
            if (progressTicking) return;
            progressTicking = true;
            requestAnimationFrame(() => {
                const h = document.documentElement.scrollHeight - window.innerHeight;
                const p = h > 0 ? (window.scrollY / h) * 100 : 0;
                scrollProgress.style.width = p + '%';
                progressTicking = false;
            });
        }, { passive: true });
    }

    /* ============================================================
       1.1 БЛОКИРОВКА СКРОЛЛА
       ============================================================ */
    const anyOverlayOpen = () => {
        return $('popupOverlay')?.classList.contains('is-open') ||
               $('catalogOverlay')?.classList.contains('is-open') ||
               $('promoModal')?.classList.contains('is-open') ||
               $('nav')?.classList.contains('active');
    };
    const unlockBody = () => { if (!anyOverlayOpen()) document.body.style.overflow = ''; };

    /* ============================================================
       1.2 УПРАВЛЕНИЕ ФОКУСОМ — удержание Tab внутри открытых меню и модалок
       ============================================================ */
    const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';
    let lastFocused = null;
    const focusFirstIn = (root) => {
        if (!root) return;
        const el = root.querySelector(FOCUSABLE);
        if (el) el.focus({ preventScroll: true });
    };
    const restoreFocus = () => {
        const el = lastFocused;
        lastFocused = null;
        if (el && typeof el.focus === 'function') el.focus({ preventScroll: true });
    };
    const trapFocus = (e) => {
        if (e.key !== 'Tab') return;
        const container = e.target.closest('.modal.is-open, .catalog-overlay.is-open, .promo-modal.is-open, .nav.active');
        if (!container) return;

        // Бургер находится вне <nav>, поэтому добавляем его в конец списка
        // фокусируемых элементов — иначе до кнопки-крестика нельзя добраться табом.
        let items = Array.from(container.querySelectorAll(FOCUSABLE));
        if (container.id === 'nav' && container.classList.contains('active')) {
            const burgerEl = $('burger');
            if (burgerEl && !items.includes(burgerEl)) items.push(burgerEl);
        }
        if (!items.length) return;

        const first = items[0];
        const last  = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
            e.preventDefault(); last.focus();
        } else if (!e.shiftKey && (document.activeElement === last || !items.includes(document.activeElement))) {
            e.preventDefault(); first.focus();
        }
    };

    /* ============================================================
       2. МОБИЛЬНОЕ МЕНЮ
       ============================================================ */
    const burger = $('burger');
    const nav = $('nav');
    if (burger && nav) {
        burger.addEventListener('click', () => {
            nav.classList.toggle('active');
            const isOpen = nav.classList.contains('active');
            burger.setAttribute('aria-expanded', isOpen);
            const icon = burger.querySelector('i');
            if (icon) icon.className = isOpen ? 'fa fa-times' : 'fa fa-bars';
            if (isOpen) { document.body.style.overflow = 'hidden'; } else { unlockBody(); }
        });
        document.querySelectorAll('.nav a').forEach(link => {
            link.addEventListener('click', () => {
                nav.classList.remove('active');
                burger.setAttribute('aria-expanded', 'false');
                const icon = burger.querySelector('i');
                if (icon) icon.className = 'fa fa-bars';
                unlockBody();
            });
        });
    }

    /* ============================================================
       3. РОТАТОР
       ============================================================ */
    const rotator = $('rotator');
    if (rotator) {
        const words = ['для строительных бригад', 'для охранных структур', 'для автосервисов и СТО', 'для сварщиков', 'для заводов и цехов'];
        const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        let i = 0;
        let timer = null;
        let heroVisible = true;

        const swap = () => {
            rotator.style.transition = 'opacity 0.4s ease, transform 0.4s ease-in';
            rotator.style.opacity = '0';
            rotator.style.transform = 'translateX(40px)';
            setTimeout(() => {
                i = (i + 1) % words.length;
                rotator.textContent = words[i];
                rotator.style.transition = 'none';
                rotator.style.transform = 'translateX(-40px)';
                void rotator.offsetWidth;
                rotator.style.transition = 'opacity 0.4s ease, transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
                rotator.style.opacity = '1';
                rotator.style.transform = 'translateX(0)';
            }, 400);
        };
        const start = () => { if (timer === null && heroVisible && !document.hidden) timer = setInterval(swap, 3000); };
        const stop  = () => { if (timer !== null) { clearInterval(timer); timer = null; } };

        if (!reducedMotion) {
            const hero = document.querySelector('.hero');
            if (hero && 'IntersectionObserver' in window) {
                new IntersectionObserver((entries) => {
                    heroVisible = entries[0].isIntersecting;
                    if (heroVisible) start(); else stop();
                }).observe(hero);
            }
            document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); else start(); });
            start();
        }
    }

    /* ============================================================
       4. ВИДЖЕТ СВЯЗИ
       ============================================================ */
    const widget = $('msgWidget');
    const widgetTrigger = $('widgetTrigger');
    if (widget && widgetTrigger) {
        widgetTrigger.addEventListener('click', (e) => {
            e.stopPropagation();
            widget.classList.toggle('is-open');
            widgetTrigger.setAttribute('aria-expanded', widget.classList.contains('is-open'));
        });
        document.addEventListener('click', (e) => {
            if (widget.classList.contains('is-open') && !widget.contains(e.target)) {
                widget.classList.remove('is-open');
                widgetTrigger.setAttribute('aria-expanded', 'false');
            }
        });
    }

    /* ============================================================
       5. ЛОГОТИП — при клике закрываем открытое мобильное меню
       ============================================================ */
    const logoLink = $('logoLink');
    if (logoLink) {
        logoLink.addEventListener('click', (e) => {
            e.preventDefault();
            // Меню открыто — закрываем перед переходом на главную
            if (nav && nav.classList.contains('active')) {
                nav.classList.remove('active');
                if (burger) {
                    burger.setAttribute('aria-expanded', 'false');
                    const icon = burger.querySelector('i');
                    if (icon) icon.className = 'fa fa-bars';
                }
                unlockBody();
            }
            window.scrollTo({ top: 0, behavior: 'smooth' });
            history.replaceState(null, '', window.location.pathname);
        });
    }

    /* ============================================================
       6. АКЦИЯ
       ============================================================ */
    const promoCardPc    = $('promoCardPc');
    const minimizePc     = $('minimizePc');
    const mobilePromoBar = $('mobilePromoBar');
    const minimizeMobile = $('minimizeMobile');
    const promoFab       = $('promoFab');
    const promoModal     = $('promoModal');
    const closePromoModal= $('closePromoModal');

    const applyPromoState = () => {
        const minimized = store.get('promo_minimized') === 'true';
        document.documentElement.classList.toggle('promo-min', minimized);
        if (promoCardPc)    promoCardPc.classList.toggle('is-minimized', minimized);
        if (mobilePromoBar) mobilePromoBar.classList.toggle('is-minimized', minimized);
        if (promoFab)       promoFab.classList.toggle('is-visible', minimized);
    };
    applyPromoState();

    let promoResizeT;
    window.addEventListener('resize', () => {
        clearTimeout(promoResizeT);
        promoResizeT = setTimeout(applyPromoState, 150);
    });

    if (minimizePc && promoCardPc && promoFab) {
        minimizePc.addEventListener('click', () => {
            document.documentElement.classList.add('promo-min');
            promoCardPc.classList.add('is-minimized');
            promoFab.classList.add('is-visible');
            store.set('promo_minimized', 'true');
        });
    }
    if (minimizeMobile && mobilePromoBar && promoFab) {
        minimizeMobile.addEventListener('click', (e) => {
            e.stopPropagation();
            document.documentElement.classList.add('promo-min');
            mobilePromoBar.classList.add('is-minimized');
            promoFab.classList.add('is-visible');
            store.set('promo_minimized', 'true');
        });
    }
    if (promoFab) {
        promoFab.addEventListener('click', () => {
            if (window.innerWidth > 1024) {
                // ПК: все кнопки акции есть прямо в карточке — просто разворачиваем её
                document.documentElement.classList.remove('promo-min');
                promoFab.classList.remove('is-visible');
                if (promoCardPc) promoCardPc.classList.remove('is-minimized');
                store.set('promo_minimized', 'false');
            } else {
                // Мобилки/планшеты: 1 тап — сразу модалка акции.
                // Нижнюю плашку не возвращаем: пользователь свернул её сознательно,
                // после закрытия модалки доступ к акции остаётся через круглый виджет
                openPromoModal();
            }
        });
    }

    let promoModalOpener = null;
    const closePromo = () => {
        if (!promoModal || !promoModal.classList.contains('is-open')) return;
        promoModal.classList.remove('is-open');
        unlockBody();
        const opener = promoModalOpener;
        promoModalOpener = null;
        if (opener && typeof opener.focus === 'function') opener.focus({ preventScroll: true });
    };

    // Открытие модалки акции — общая функция для клика и нажатия клавиши
    const openPromoModal = () => {
        if (!promoModal || promoModal.classList.contains('is-open')) return;
        promoModalOpener = document.activeElement;
        promoModal.classList.add('is-open');
        document.body.style.overflow = 'hidden';
        focusFirstIn(promoModal);
    };

    if (mobilePromoBar && promoModal) {
        mobilePromoBar.addEventListener('click', (e) => {
            if (!e.target.closest('#minimizeMobile')) openPromoModal();
        });
        // Доступ к панели акции с клавиатуры (Enter/Space)
        mobilePromoBar.addEventListener('keydown', (e) => {
            if (e.target.closest('#minimizeMobile')) return;
            if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
                e.preventDefault();
                openPromoModal();
            }
        });
    }
    if (closePromoModal) closePromoModal.addEventListener('click', closePromo);
    if (promoModal) promoModal.addEventListener('click', (e) => { if (e.target === promoModal) closePromo(); });

    /* ============================================================
       7. COOKIE
       ============================================================ */
    const cookie = $('cookieBanner');
    const cookieAccept = $('cookieAccept');
    const cookieNecessary = $('cookieNecessary');
    if (cookie && cookieAccept && cookieNecessary) {
        const saved = store.get('cookie_consent');
        if (!saved) {
            setTimeout(() => {
                cookie.classList.add('is-visible');
                // Скрываем плавающие элементы (плашка акции, круглый виджет, виджет связи),
                // иначе cookie-баннер просто накрывает их и кнопки под ним не работают
                document.documentElement.classList.add('cookie-shown');
            }, 1000);
        }
        const hideCookie = (value) => {
            cookie.classList.remove('is-visible');
            document.documentElement.classList.remove('cookie-shown');
            store.set('cookie_consent', value);
        };
        cookieAccept.addEventListener('click', () => hideCookie('all'));
        cookieNecessary.addEventListener('click', () => hideCookie('necessary'));
    }

    /* ============================================================
       8. ЮРИДИЧЕСКАЯ МОДАЛКА
       ============================================================ */
    const modal = $('popupOverlay');
    const modalClose = $('popupClose');

    window.openModal = (targetTab) => {
        if (!modal) return;
        if (!modal.classList.contains('is-open')) {
            lastFocused = document.activeElement;
            document.body.style.overflow = 'hidden';
        }
        modal.classList.add('is-open');

        document.querySelectorAll('.modal-tab').forEach(t => {
            t.classList.remove('is-active');
            t.setAttribute('aria-selected', 'false');
        });
        document.querySelectorAll('.modal-content').forEach(c => c.classList.remove('is-active'));

        const tabBtn = document.querySelector(`.modal-tab[data-tab="${targetTab}"]`);
        const tabContent = document.getElementById(targetTab);
        if (tabBtn && tabContent) {
            tabBtn.classList.add('is-active');
            tabBtn.setAttribute('aria-selected', 'true');
            tabContent.classList.add('is-active');
        }
        focusFirstIn(modal);
    };
    window.closeModal = () => {
        if (!modal) return;
        modal.classList.remove('is-open');
        unlockBody();
        restoreFocus();
    };
    if (modal && modalClose) {
        $('openPolicy')?.addEventListener('click', (e) => { e.preventDefault(); window.openModal('tab-1'); });
        $('openPolicyCookie')?.addEventListener('click', (e) => { e.preventDefault(); window.openModal('tab-2'); });
        $('openPolicyCookie2')?.addEventListener('click', (e) => { e.preventDefault(); window.openModal('tab-2'); });
        $('openPolicyOferta')?.addEventListener('click', (e) => { e.preventDefault(); window.openModal('tab-3'); });

        modalClose.addEventListener('click', window.closeModal);
        modal.addEventListener('click', (e) => { if (e.target === modal) window.closeModal(); });

        document.querySelectorAll('.modal-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                const targetId = tab.getAttribute('data-tab');
                document.querySelectorAll('.modal-tab').forEach(t => {
                    t.classList.remove('is-active');
                    t.setAttribute('aria-selected', 'false');
                });
                document.querySelectorAll('.modal-content').forEach(c => c.classList.remove('is-active'));
                tab.classList.add('is-active');
                tab.setAttribute('aria-selected', 'true');
                document.getElementById(targetId)?.classList.add('is-active');
            });
        });
    }

    /* ============================================================
       9. КАРУСЕЛЬ
       ============================================================ */
    const PHONE = '+79889458880';
    const WA_BASE = 'https://wa.me/79889458880?text=';
    const MAX_LINK = 'https://max.ru/u/f9LHodD0cOLCpM7u_pa_Vx3ul_MFQYvq51uS13gZhT7H8y5cZUYExjlwQ-0';

    const SECTIONS = [
        { name: 'Спецодежда', items: [
            { n: 'Зимняя спецодежда', img: './img/webp/protective_clothing/1_builder_winter.webp' },
            { n: 'Летняя спецодежда', img: './img/webp/protective_clothing/2_builder_summer.webp' },
            { n: 'Сигнальная спецодежда', img: './img/webp/protective_clothing/3_builder_signal.webp' },
            { n: 'Защитная спецодежда', img: './img/webp/protective_clothing/4_builder_defender.webp' },
            { n: 'Форма охраны', img: './img/webp/protective_clothing/5_construction_security.webp' },
            { n: 'Сфера услуг', img: './img/webp/protective_clothing/6_construction_services.webp' }
        ]},
        { name: 'Спецобувь', items: [
            { n: 'Зимние сапоги', img: './img/webp/specialized_footwear/1_winter_boots.webp' },
            { n: 'Берцы', img: './img/webp/specialized_footwear/2_combat_boots.webp' },
            { n: 'Термостойкая обувь', img: './img/webp/specialized_footwear/3_heat_resistant_footwear.webp' },
            { n: 'Ботинки рабочие', img: './img/webp/specialized_footwear/4_work_boots.webp' },
            { n: 'Сапоги ПВХ', img: './img/webp/specialized_footwear/5_pvc_boots.webp' },
            { n: 'Кроссовки рабочие', img: './img/webp/specialized_footwear/6_work_sneakers.webp' }
        ]},
        { name: 'СИЗ', items: [
            { n: 'Каски защитные', img: './img/webp/siz_clothing/1_protective_helmets.webp' },
            { n: 'Респираторы', img: './img/webp/siz_clothing/2_respirators.webp' },
            { n: 'Перчатки рабочие', img: './img/webp/siz_clothing/3_work_gloves.webp' },
            { n: 'Очки защитные', img: './img/webp/siz_clothing/4_protective_goggles.webp' },
            { n: 'Наушники защитные', img: './img/webp/siz_clothing/5_protective_earmuffs.webp' },
            { n: 'Пояса страховочные', img: './img/webp/siz_clothing/6_safety_belts.webp' }
        ]}
    ];

    const ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="9" cy="10" r="1.6"/><path d="M4 17l4.5-4.5 3 3L15 12l5 5"/></svg>';
    function phHTML(cls) { return '<div class="ph ' + (cls || '') + '">' + ICON + '<small>Фото готовится</small></div>'; }
    function mediaHTML(item, cls) {
        if (!item || !item.img) return phHTML(cls);
        return '<img src="' + item.img + '" alt="' + item.n + '" loading="lazy" data-ph="' + (cls || '') + '">';
    }

    // Глобальный обработчик ошибок загрузки картинок. У некоторых картинок (логотип,
    // акция, модалка) есть свой inline onerror (imgFallback) — их не трогаем: глобальный
    // обработчик в capture-фазе сработал бы раньше и заменил аккуратную SVG-заглушку.
    document.addEventListener('error', function (e) {
        var img = e.target;
        if (!(img instanceof HTMLImageElement)) return;
        if (img.hasAttribute('onerror')) return; // у картинки свой обработчик imgFallback
        var d = document.createElement('div');
        d.innerHTML = phHTML(img.dataset.ph || '');
        if (d.firstChild) img.replaceWith(d.firstChild);
    }, true);

    let state = { sec: 0, idx: 0 };
    let sec = SECTIONS[0];
    let figs = [];
    let thumbEls = [];
    let overlay = $('catalogOverlay');
    let modalGen = 0;

    let isAnimating = false;
    let lastSwipeAt = 0;

    function buildScene() {
        var stage = $('stage'); if (!stage) return;
        stage.innerHTML = ''; figs = [];
        if (!sec || !sec.items) return;
        sec.items.forEach(function (it) {
            var d = document.createElement('div');
            d.className = 'fig';
            d.innerHTML = mediaHTML(it, '');
            stage.appendChild(d);
            figs.push(d);
        });
    }

    function layout() {
        if (!sec || !sec.items) return;
        var n = sec.items.length;
        figs.forEach(function (el, i) {
            var rel = (i - state.idx + n) % n;
            var pos = rel === 0 ? 'cur' : rel === 1 ? 'next' : rel === n - 1 ? 'prev' : 'off';
            el.classList.toggle('cur',  pos === 'cur');
            el.classList.toggle('prev', pos === 'prev');
            el.classList.toggle('next', pos === 'next');
            el.classList.toggle('off',  pos === 'off');
        });
        var pl = $('plaque');
        if (pl) pl.textContent = sec.items[state.idx].n;
    }

    function buildThumbs() {
        var el = $('thumbs'); if (!el || !sec || !sec.items) return;
        el.innerHTML = sec.items.map(function (it, i) {
            return '<button class="thumb" data-i="' + i + '" aria-label="' + it.n + '" aria-current="false">' +
                (it.img ? mediaHTML(it, 'mini') : phHTML('mini')) +
                '</button>';
        }).join('');
        thumbEls = Array.prototype.slice.call(el.children);
        syncThumbs();
    }
    function syncThumbs() {
        thumbEls.forEach(function (b, i) {
            var active = i === state.idx;
            b.classList.toggle('on', active);
            b.setAttribute('aria-current', active ? 'true' : 'false');
        });
    }
    function renderTabs() {
        var el = $('tabs'); if (!el) return;
        el.innerHTML = SECTIONS.map(function (s, i) {
            return '<button class="tab' + (i === state.sec ? ' on' : '') + '" data-i="' + i + '">' + s.name + '</button>';
        }).join('');
    }
    function renderAll() { layout(); syncThumbs(); }

    // move() возвращает true, если слайд реально сменился. Вызывающий код обновляет
    // модалку только при успешном сдвиге — иначе картинка мигала бы тем же товаром.
    function move(d) {
        if (isAnimating) return false;
        if (!sec || !sec.items || !sec.items.length) return false;

        isAnimating = true;
        try {
            state.idx = (state.idx + d + sec.items.length) % sec.items.length;
            renderAll();
        } catch (err) {
            console.error('[carousel] move failed:', err);
            isAnimating = false;
            return false;
        }
        setTimeout(() => { isAnimating = false; }, 300);
        return true;
    }

    function setPos(i) {
        if (isAnimating) return;
        if (i === state.idx) { openCatalogModal(); return; }
        state.idx = i;
        renderAll();
    }

    const tabsEl = $('tabs');
    if (tabsEl) tabsEl.addEventListener('click', function (e) {
        if (isAnimating) return;
        var b = e.target.closest('.tab'); if (!b) return;
        var target = +b.dataset.i;
        if (target === state.sec) return;

        isAnimating = true;
        // Подсветку таба делаем на живых кнопках, без пересборки DOM:
        // пересобранный элемент появляется уже активным и CSS-переход не срабатывает
        Array.prototype.forEach.call(tabsEl.children, function (t) {
            t.classList.toggle('on', t === b);
        });

        // Кроссфейд сцены: плавно гасим текущие картинки, пересобираем, проявляем
        var stage = $('stage');
        var swap = function () {
            state.sec = target; state.idx = 0;
            sec = SECTIONS[state.sec];
            buildScene(); buildThumbs(); renderAll();
            if (stage) stage.classList.remove('fade');
            isAnimating = false;
        };
        if (stage) {
            stage.classList.add('fade');
            setTimeout(swap, 180);
        } else {
            swap();
        }
    });

    const arrL = $('arrL');
    if (arrL) arrL.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); move(-1); });

    const arrR = $('arrR');
    if (arrR) arrR.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); move(1); });

    const sceneEl = $('scene');
    if (sceneEl) sceneEl.addEventListener('click', function (e) {
        if (e.target.closest('.cat-arrow')) return;
        if (Date.now() - lastSwipeAt < 350) return;
        if (isAnimating) return;
        if (window.getSelection().toString() !== '') return;

        // Центральная карточка (.fig.cur) имеет pointer-events:auto — клик по ней
        // и её содержимому открывает модалку товара. Проверяем в первую очередь.
        if (e.target.closest('.fig.cur')) { openCatalogModal(); return; }

        // Боковые превью (.fig.prev/.next) имеют pointer-events:none, поэтому клик
        // доходит до .scene. По координатам определяем: попали в боковую фигуру —
        // листаем карусель. Фиксированная ширина фигур делает их зоны шире центральной,
        // поэтому проверка центральной карточки выше обязательна.
        var x = e.clientX, y = e.clientY;
        var prevFig = sceneEl.querySelector('.fig.prev');
        var nextFig = sceneEl.querySelector('.fig.next');
        if (prevFig) {
            var rp = prevFig.getBoundingClientRect();
            if (rp.width > 0 && x >= rp.left && x <= rp.right && y >= rp.top && y <= rp.bottom) {
                move(-1); return;
            }
        }
        if (nextFig) {
            var rn = nextFig.getBoundingClientRect();
            if (rn.width > 0 && x >= rn.left && x <= rn.right && y >= rn.top && y <= rn.bottom) {
                move(1); return;
            }
        }

        openCatalogModal();
    });

    const thumbsEl = $('thumbs');
    if (thumbsEl) thumbsEl.addEventListener('click', function (e) {
        var b = e.target.closest('.thumb'); if (!b) return;
        setPos(+b.dataset.i);
    });

    function msgFor(it) {
        return 'Здравствуйте! Интересует: ' + it.n + ' (раздел «' + sec.name + '»). Подскажите наличие и цену.';
    }
    function bindMsg(msg) {
        var wa = $('mWa');
        if (wa) wa.href = WA_BASE + encodeURIComponent(msg);
        // Почта: предзаполняем тему и текст письма — откроется готовая заявка
        var mail = $('mMail');
        if (mail) {
            var it = sec && sec.items ? sec.items[state.idx] : null;
            var subject = 'Заявка с сайта' + (it ? ' — ' + it.n : '');
            mail.href = 'mailto:profroba161@yandex.ru?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(msg);
        }
        var mx = $('mMax');
        if (mx) mx.onclick = function () {
            // MAX не умеет принимать текст через ссылку (в отличие от WhatsApp ?text=),
            // поэтому копируем заявку в буфер обмена и сразу открываем чат
            copyMsg(msg);
            // Явная обратная связь: меняем надпись на кнопке, чтобы человек точно
            // понял, что текст скопирован и его осталось вставить в чат
            var original = mx.textContent;
            mx.textContent = '✓ Текст скопирован — вставьте в MAX';
            mx.classList.add('copied');
            setTimeout(function () {
                mx.textContent = original;
                mx.classList.remove('copied');
            }, 4000);
            if (MAX_LINK) { window.open(MAX_LINK, '_blank', 'noopener'); }
        };
    }

    function openCatalogModal() {
        if (!overlay || !sec || !sec.items) return;
        var it = sec.items[state.idx];
        if (!overlay.classList.contains('is-open')) lastFocused = document.activeElement;
        var t = $('mTitle'); if (t) t.textContent = it.n;
        var im = $('mImg'); if (im) im.innerHTML = mediaHTML(it, '');
        bindMsg(msgFor(it));

        overlay.classList.add('is-open');
        document.body.style.overflow = 'hidden';

        const sheet = overlay.querySelector('.catalog-sheet');
        if (sheet) sheet.scrollTop = 0;
        focusFirstIn(overlay);
    }

    function closeCatalogModal() {
        if (!overlay) return;
        overlay.classList.remove('is-open');
        unlockBody();
        restoreFocus();
    }

    function copyMsg(t) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(t).then(
                function () { toast('Заявка скопирована — вставьте её в чат MAX', 4500); },
                function () { toast(t); }
            );
        } else { toast(t); }
    }
    var toastT;
    function toast(t, ms) {
        var el = $('toast');
        if (!el) { console.log('[toast]', t); return; }
        el.textContent = t;
        el.classList.add('show');
        clearTimeout(toastT);
        toastT = setTimeout(function () { el.classList.remove('show'); }, ms || 2600);
    }

    const ctaBtn = $('ctaBtn');
    if (ctaBtn) ctaBtn.addEventListener('click', openCatalogModal);
    const catalogClose = $('catalogClose');
    if (catalogClose) catalogClose.addEventListener('click', closeCatalogModal);

    if (overlay) overlay.addEventListener('click', function (e) {
        if (e.target === overlay) closeCatalogModal();
    });

    // Модалка обновляется только при фактической смене слайда
    const mArrL = $('mArrL');
    if (mArrL) mArrL.addEventListener('click', function (e) {
        e.preventDefault(); e.stopPropagation();
        if (move(-1)) syncCatalogModal();
    });
    const mArrR = $('mArrR');
    if (mArrR) mArrR.addEventListener('click', function (e) {
        e.preventDefault(); e.stopPropagation();
        if (move(1)) syncCatalogModal();
    });

    function syncCatalogModal() {
        // Модалка закрыта — синхронизировать нечего
        if (!overlay || !overlay.classList.contains('is-open')) return;
        if (!sec || !sec.items) return;
        var it = sec.items[state.idx];
        var g = ++modalGen;
        var w = $('mImg'); if (!w) return;

        w.classList.add('fade');
        setTimeout(function () {
            if (g !== modalGen) return;
            var t = $('mTitle'); if (t) t.textContent = it.n;
            w.innerHTML = mediaHTML(it, '');
            w.classList.remove('fade');
            bindMsg(msgFor(it));
        }, 200);
    }

    /* --- СВАЙП --- */
    function bindSwipe(el, cb) {
        if (!el) return;
        var x0 = null, y0 = null;
        var isSwiped = false;

        el.addEventListener('touchstart', function (e) {
            x0 = e.touches[0].clientX;
            y0 = e.touches[0].clientY;
            isSwiped = false;
        }, { passive: true });

        el.addEventListener('touchmove', function (e) {
            if (x0 === null) return;
            var dx = e.touches[0].clientX - x0;
            var dy = e.touches[0].clientY - y0;
            if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 10) {
                isSwiped = true;
            }
        }, { passive: true });

        el.addEventListener('touchend', function (e) {
            if (x0 === null) return;
            var dx = e.changedTouches[0].clientX - x0;
            var dy = e.changedTouches[0].clientY - y0;

            if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.5) {
                cb(dx < 0 ? 1 : -1);
                lastSwipeAt = Date.now();
            }

            if (isSwiped) {
                e.preventDefault();
                lastSwipeAt = Date.now();
            }
            x0 = null;
        }, { passive: false });
    }

    bindSwipe($('scene'), move);
    bindSwipe($('mMedia'), function (d) { if (move(d)) syncCatalogModal(); });

    const mCall = $('mCall');
    if (mCall) mCall.href = 'tel:+' + PHONE.replace(/\D/g, '');

    (function preloadAll() {
        SECTIONS.forEach(function (s) {
            s.items.forEach(function (it) {
                if (it.img) { var x = new Image(); x.src = it.img; }
            });
        });
    })();

    try {
        renderTabs();
        buildScene();
        buildThumbs();
        renderAll();
    } catch (err) {
        console.error('[carousel] init failed:', err);
    }

    /* ============================================================
       9.1 СКРЫТИЕ ПЛАВАЮЩИХ ВИДЖЕТОВ НАД КАТАЛОГОМ
       (мобилки: промо-плашка, promo-fab и виджет мессенджеров
       перекрывали карусель/миниатюры/CTA — пока секция каталога
       занимает экран, плавающие элементы скрываются)
       ============================================================ */
    const catalogSection = $('catalog');
    if (catalogSection && 'IntersectionObserver' in window) {
        new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                document.documentElement.classList.toggle('floats-hidden', entry.isIntersecting);
            });
        }, { threshold: 0.3 }).observe(catalogSection);
    }

    /* ============================================================
       10. REVEAL
       ============================================================ */
    const revealElements = document.querySelectorAll('.reveal');
    if (revealElements.length > 0 && 'IntersectionObserver' in window) {
        const revealObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('active');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.15, rootMargin: '0px 0px -50px 0px' });
        revealElements.forEach(el => revealObserver.observe(el));
    }

    /* ============================================================
       11. ESC + СТРЕЛКИ
       ============================================================ */
    document.addEventListener('keydown', (e) => {
        trapFocus(e);

        if (e.key === 'Escape') {
            if (modal && modal.classList.contains('is-open')) window.closeModal();
            if (overlay && overlay.classList.contains('is-open')) closeCatalogModal();
            if (promoModal && promoModal.classList.contains('is-open')) closePromo();
            if (nav && nav.classList.contains('active') && burger) {
                nav.classList.remove('active');
                const icon = burger.querySelector('i');
                if (icon) icon.className = 'fa fa-bars';
                burger.setAttribute('aria-expanded', 'false');
                unlockBody();
            }
            if (widget && widget.classList.contains('is-open')) {
                widget.classList.remove('is-open');
                widgetTrigger.setAttribute('aria-expanded', 'false');
            }
        }

        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
            // Пока открыты юридическая модалка или акция — стрелки страницы
            // не листают карусель. Модалку каталога не блокируем:
            // в ней стрелками как раз листают товар
            const anyModalOpen = ($('popupOverlay') && $('popupOverlay').classList.contains('is-open'))
                              || ($('promoModal')   && $('promoModal').classList.contains('is-open'));
            if (anyModalOpen) return;

            const catSection = $('catalog');
            const catVisible = (overlay && overlay.classList.contains('is-open')) ||
                (catSection && (function () {
                    var r = catSection.getBoundingClientRect();
                    return r.top < window.innerHeight && r.bottom > 0;
                })());
            if (catVisible) {
                // Обновляем модалку только если сдвиг реально произошёл
                if (move(e.key === 'ArrowLeft' ? -1 : 1)) {
                    if (overlay && overlay.classList.contains('is-open')) syncCatalogModal();
                }
            }
        }
    });

    /* ============================================================
       12. ЯКОРЯ + СБРОС СКРОЛЛА ПРИ F5
       ============================================================ */
    window.addEventListener('load', () => {
        if (window.location.hash) {
            const targetId = window.location.hash;
            let targetElement = null;
            try { targetElement = document.querySelector(targetId); } catch (err) { targetElement = null; }
            if (targetElement) {
                setTimeout(() => targetElement.scrollIntoView({ behavior: 'auto', block: 'start' }), 150);
            }
        } else {
            try { window.scrollTo({ top: 0, left: 0, behavior: 'instant' }); }
            catch (e) { window.scrollTo(0, 0); }
        }
    });

    /* ============================================================
       13. ГОД В ПОДВАЛЕ + СТРАХОВКА REVEAL
       (если IntersectionObserver не сработал, все блоки показываются через 3с)
       ============================================================ */
    const copyYear = $('copyYear');
    if (copyYear) copyYear.textContent = new Date().getFullYear();

    setTimeout(() => {
        document.querySelectorAll('.reveal:not(.active)').forEach(el => el.classList.add('active'));
    }, 3000);
});
