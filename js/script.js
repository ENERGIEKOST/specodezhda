document.addEventListener('DOMContentLoaded', () => {

    // --- 1. ПОЛОСА ПРОГРЕССА ---
    const scrollProgress = document.getElementById('scrollProgress');
    if (scrollProgress) {
        window.addEventListener('scroll', () => {
            const h = document.documentElement.scrollHeight - window.innerHeight;
            const p = h > 0 ? (window.scrollY / h) * 100 : 0;
            scrollProgress.style.width = p + '%';
        }, { passive: true });
    }

    // --- 2. МОБИЛЬНОЕ МЕНЮ ---
    const burger = document.getElementById('burger');
    const nav = document.getElementById('nav');
    if (burger && nav) {
        burger.addEventListener('click', () => {
            nav.classList.toggle('active');
            const isOpen = nav.classList.contains('active');
            burger.setAttribute('aria-expanded', isOpen);
            const icon = burger.querySelector('i');
            icon.className = isOpen ? 'fa-solid fa-xmark' : 'fa-solid fa-bars';
            document.body.style.overflow = isOpen ? 'hidden' : '';
        });
        document.querySelectorAll('.nav a').forEach(link => {
            link.addEventListener('click', () => {
                nav.classList.remove('active');
                burger.setAttribute('aria-expanded', 'false');
                burger.querySelector('i').className = 'fa-solid fa-bars';
                document.body.style.overflow = '';
            });
        });
    }

    // --- 3. КРАСИВЫЙ СЛАЙДЕР С ТЕКСТОМ ---
    const rotator = document.getElementById('rotator');
    if (rotator) {
        const words = ['строительных бригад', 'охранных структур', 'автосервисов и СТО', 'сварщиков и монтажников', 'промышленных предприятий'];
        let i = 0;
        
        setInterval(() => {
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
        }, 3000);
    }

    // --- 4. ВИДЖЕТ СВЯЗИ ---
    const widget = document.getElementById('msgWidget');
    const widgetTrigger = document.getElementById('widgetTrigger');
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

    // --- 5. COOKIE БАННЕР ---
    const cookie = document.getElementById('cookieBanner');
    const cookieAccept = document.getElementById('cookieAccept');
    const cookieNecessary = document.getElementById('cookieNecessary');
    if (cookie && cookieAccept && cookieNecessary) {
        let saved = localStorage.getItem('cookie_consent');
        if (!saved) {
            setTimeout(() => cookie.classList.add('is-visible'), 1000);
        }
        const hideCookie = (value) => {
            cookie.classList.remove('is-visible');
            localStorage.setItem('cookie_consent', value);
        };
        cookieAccept.addEventListener('click', () => hideCookie('all'));
        cookieNecessary.addEventListener('click', () => hideCookie('necessary'));
    }

    // --- 6. МОДАЛЬНОЕ ОКНО ---
    const modal = document.getElementById('popupOverlay');
    const modalClose = document.getElementById('popupClose');
    
    const openModal = (targetTab) => {
        if (!modal) return;
        modal.classList.add('is-open');
        document.body.style.overflow = 'hidden';
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
    };

    const closeModal = () => {
        if (!modal) return;
        modal.classList.remove('is-open');
        document.body.style.overflow = '';
    };

    if (modal && modalClose) {
        document.getElementById('openPolicy').addEventListener('click', (e) => { e.preventDefault(); openModal('tab-1'); });
        document.getElementById('openPolicyCookie').addEventListener('click', (e) => { e.preventDefault(); openModal('tab-2'); });
        document.getElementById('openPolicyCookie2').addEventListener('click', (e) => { e.preventDefault(); openModal('tab-2'); });
        document.getElementById('openPolicyOferta').addEventListener('click', (e) => { e.preventDefault(); openModal('tab-3'); });

        modalClose.addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

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
                document.getElementById(targetId).classList.add('is-active');
            });
        });
    }

    // --- 7. ЗАКРЫТИЕ ПО ESC ---
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (modal && modal.classList.contains('is-open')) closeModal();
            if (nav && nav.classList.contains('active')) {
                nav.classList.remove('active');
                burger.querySelector('i').className = 'fa-solid fa-bars';
                document.body.style.overflow = '';
            }
            if (widget && widget.classList.contains('is-open')) {
                widget.classList.remove('is-open');
                widgetTrigger.setAttribute('aria-expanded', 'false');
            }
        }
    });
});
