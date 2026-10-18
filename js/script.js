'use strict';

document.addEventListener('DOMContentLoaded', () => {

    /* ======================================================================
       1. БУРГЕР-МЕНЮ
       ====================================================================== */
    const burger = document.getElementById('menuToggle');
    const nav = document.querySelector('.nav');

    const setMenuState = (open) => {
        if (!nav) return;
        nav.classList.toggle('is-open', open);
        if (burger) {
            burger.setAttribute('aria-expanded', String(open));
            burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
        }
        document.body.style.overflow = open ? 'hidden' : '';
    };

    if (burger && nav) {
        burger.addEventListener('click', () => {
            setMenuState(!nav.classList.contains('is-open'));
        });

        document.querySelectorAll('.nav__link').forEach(link => {
            link.addEventListener('click', () => setMenuState(false));
        });

        window.addEventListener('resize', () => {
            if (window.innerWidth > 768 && nav.classList.contains('is-open')) {
                setMenuState(false);
            }
        });
    }

    /* ======================================================================
       2. ВИДЖЕТ МЕССЕНДЖЕРОВ
       ====================================================================== */
    const widget = document.getElementById('msgWidget');
    const widgetTrigger = document.getElementById('widgetTrigger');

    const setWidgetState = (open) => {
        if (!widget) return;
        widget.classList.toggle('is-open', open);
        if (widgetTrigger) widgetTrigger.setAttribute('aria-expanded', String(open));
    };

    if (widget && widgetTrigger) {
        widgetTrigger.addEventListener('click', (e) => {
            e.stopPropagation();
            setWidgetState(!widget.classList.contains('is-open'));
        });

        document.addEventListener('click', (e) => {
            if (widget.classList.contains('is-open') && !widget.contains(e.target)) {
                setWidgetState(false);
            }
        });
    }

    /* ======================================================================
       3. COOKIE-БАННЕР (1.5 сек, без сдвига виджета — меньше дёрганья)
       ====================================================================== */
    const cookie = document.getElementById('cookieBanner');
    const cookieOk = document.getElementById('cookieOk');

    if (cookie && cookieOk) {
        let accepted = false;
        try {
            accepted = localStorage.getItem('cookie_accepted') === 'true';
        } catch (err) {
            accepted = false;
        }

        if (!accepted) {
            setTimeout(() => {
                cookie.classList.add('is-visible');
            }, 1500);
        }

        cookieOk.addEventListener('click', () => {
            cookie.classList.remove('is-visible');
            try {
                localStorage.setItem('cookie_accepted', 'true');
            } catch (err) {}
        });
    }

    /* ======================================================================
       4. МОДАЛКА «ПРАВОВАЯ ИНФОРМАЦИЯ»
       ====================================================================== */
    const modal = document.getElementById('popupOverlay');
    const modalClose = document.getElementById('popupClose');
    const openPolicy = document.getElementById('openPolicy');

    const openModal = () => {
        if (!modal) return;
        modal.classList.add('is-open');
        document.body.style.overflow = 'hidden';
        if (modalClose) modalClose.focus();
    };

    const closeModal = () => {
        if (!modal) return;
        modal.classList.remove('is-open');
        document.body.style.overflow = '';
    };

    if (modal && modalClose && openPolicy) {
        openPolicy.addEventListener('click', (e) => {
            e.preventDefault();
            openModal();
        });

        modalClose.addEventListener('click', closeModal);

        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });
    }

    /* ======================================================================
       5. ВКЛАДКИ В МОДАЛКЕ
       ====================================================================== */
    const modalTabs = document.querySelectorAll('.modal__tab');
    const modalContents = document.querySelectorAll('.modal__content');

    modalTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetId = tab.getAttribute('data-tab');
            if (!targetId) return;

            modalTabs.forEach(t => {
                t.classList.remove('is-active');
                t.setAttribute('aria-selected', 'false');
            });
            modalContents.forEach(c => c.classList.remove('is-active'));

            tab.classList.add('is-active');
            tab.setAttribute('aria-selected', 'true');

            const target = document.getElementById(targetId);
            if (target) target.classList.add('is-active');
        });
    });

    /* ======================================================================
       6. РОТАТОР ТЕКСТА
       ====================================================================== */
    const rotator = document.getElementById('rotator');

    if (rotator) {
        const words = [
            'строительных бригад',
            'сварщиков и монтажников',
            'охранных структур',
            'комплексного снабжения',
            'автосервисов и СТО',
            'промышленных предприятий'
        ];

        let index = 0;
        let timer = null;
        const DELAY = 3200;
        const FADE = 350;

        const rotate = () => {
            rotator.classList.add('is-fading');
            setTimeout(() => {
                index = (index + 1) % words.length;
                rotator.textContent = words[index];
                rotator.classList.remove('is-fading');
            }, FADE);
        };

        const start = () => {
            stop();
            timer = setInterval(rotate, DELAY);
        };

        const stop = () => {
            if (timer) {
                clearInterval(timer);
                timer = null;
            }
        };

        const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (!reduced) {
            start();

            document.addEventListener('visibilitychange', () => {
                if (document.hidden) stop();
                else start();
            });
        }
    }

    /* ======================================================================
       7. ESC — ЗАКРЫТЬ ВСЁ ОТКРЫТОЕ
       ====================================================================== */
    document.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape') return;

        if (modal && modal.classList.contains('is-open')) closeModal();

        if (nav && nav.classList.contains('is-open')) {
            nav.classList.remove('is-open');
            if (burger) burger.setAttribute('aria-expanded', 'false');
            document.body.style.overflow = '';
        }

        if (widget && widget.classList.contains('is-open')) {
            widget.classList.remove('is-open');
            if (widgetTrigger) widgetTrigger.setAttribute('aria-expanded', 'false');
        }
    });

    /* ======================================================================
       8. ФОЛЛБЭК ПЛАВНОГО СКРОЛЛА
       ====================================================================== */
    if (!('scrollBehavior' in document.documentElement.style)) {
        document.querySelectorAll('a[href^="#"]').forEach(link => {
            link.addEventListener('click', (e) => {
                const href = link.getAttribute('href');
                if (href === '#' || href.length < 2) return;

                const target = document.querySelector(href);
                if (!target) return;

                e.preventDefault();
                const offset = 80;
                const top = target.getBoundingClientRect().top + window.pageYOffset - offset;

                window.scrollTo({ top, behavior: 'smooth' });
            });
        });
    }

});