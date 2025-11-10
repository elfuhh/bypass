(function() {
    'use strict';

    // ---------- config ----------
    const host = location.hostname;
    const defaultTime = 8;
    const normalTime = 60;
    const ver = "2.0.0.1";
    const debug = true;

    // ---------- language & translations ----------
    let currentLanguage = localStorage.getItem('lang') || 'vi';
    const translations = {
        vi: {
            title: "Dyrian and elfuhh Bypass",
            pleaseSolveCaptcha: "Vui lòng giải CAPTCHA để tiếp tục",
            captchaSuccess: "CAPTCHA đã thành công",
            redirectingToWork: "Đang qua Work.ink...",
            bypassSuccessCopy: "Bypass thành công, đã Copy Key (bấm 'Cho Phép' nếu có)",
            waitingCaptcha: "Đang chờ CAPTCHA...",
            pleaseReload: "Vui lòng tải lại trang...(workink lỗi)",
            reloading: "đã giả mạo tải lại...",
            socialsdetected: "các mạng xã hội được phát hiện bắt đầu giả mạo...",
            bypassSuccess: "Bypass thành công",
            backToCheckpoint: "Đang về lại Checkpoint...",
            captchaSuccessBypassing: "CAPTCHA đã thành công, đang bypass...",
            version: "Phiên bản v2.0.0.1",
            madeBy: "Được tạo bởi DyRian và elfuhh (dựa trên IHaxU)",
            autoRedirect: "Tự động chuyển hướng"
        },
        en: {
            title: "Dyrian and elfuhh Bypass",
            pleaseSolveCaptcha: "Please solve the CAPTCHA to continue",
            captchaSuccess: "CAPTCHA solved successfully",
            redirectingToWork: "Redirecting to Work.ink...",
            bypassSuccessCopy: "Bypass successful! Key copied (click 'Allow' if prompted)",
            waitingCaptcha: "Waiting for CAPTCHA...",
            pleaseReload: "Please reload the page...(workink bugs)",
            reloading: "done spoofing reloading...",
            socialsdetected: "socials detected beginning to spoof...",
            bypassSuccess: "Bypass successful",
            backToCheckpoint: "Returning to checkpoint...",
            captchaSuccessBypassing: "CAPTCHA solved successfully, bypassing...",
            version: "Version v2.0.0.1",
            madeBy: "Made by DyRian and elfuhh (based on IHaxU)",
            autoRedirect: "Auto-redirect"
        }
    };

    function t(key, replacements = {}) {
        const map = translations[currentLanguage] && translations[currentLanguage][key] ? translations[currentLanguage][key] : key;
        let text = map;
        Object.keys(replacements).forEach(k => {
            text = text.replace(`{${k}}`, replacements[k]);
        });
        return text;
    }

    // ---------- persistent setting keys ----------
    const STORAGE_KEY_DELAY = 'dyrian_redirect_delay';
    const STORAGE_KEY_LANG = 'lang';
    const STORAGE_KEY_AUTO = 'dyrian_auto_redirect';

    let selectedDelay = parseInt(localStorage.getItem(STORAGE_KEY_DELAY) || '0', 10);
    let autoRedirectEnabled = localStorage.getItem(STORAGE_KEY_AUTO) === 'true';
    let redirectInProgress = false;

    // ---------- GUI ----------
    class BypassPanel {
        constructor() {
            this.container = null;
            this.shadow = null;
            this.panel = null;
            this.statusText = null;
            this.statusDot = null;
            this.versionEl = null;
            this.creditEl = null;
            this.langBtns = [];
            this.currentMessageKey = null;
            this.currentType = 'info';
            this.currentReplacements = {};
            this.isMinimized = false;
            this.body = null;
            this.minimizeBtn = null;
            this.sliderContainer = null;
            this.sliderValue = null;
            this.slider = null;
            this.startBtn = null;
            this.autoToggle = null;
            this.onStartCallback = null;
            this.redirectInProgress = false;
            this.init();
        }

        init() {
            try {
                this.createPanel();
                this.setupEventListeners();
            } catch (e) {
                if (debug) console.error('GUI init error', e);
            }
        }

        createPanel() {
            this.container = document.createElement('div');
            this.shadow = this.container.attachShadow({ mode: 'closed' });

            const style = document.createElement('style');
            style.textContent = `
/* ... all your existing CSS here ... */
`;
            this.shadow.appendChild(style);

            const lastDelay = parseInt(localStorage.getItem(STORAGE_KEY_DELAY) || '0', 10);
            const autoEnabled = localStorage.getItem(STORAGE_KEY_AUTO) === 'true';

            const panelHTML = `
<div class="panel-container">
  <div class="panel">
    <div class="header">
      <div class="title">WORKINK BYPASS</div>
      <button class="minimize-btn" id="minimize-btn">−</button>
    </div>

    <div class="status-section">
      <div class="status-box">
        <div class="status-content">
          <div class="status-dot info" id="status-dot"></div>
          <div class="status-text" id="status-text">${t('pleaseSolveCaptcha')}</div>
        </div>
      </div>

      <div class="slider-container" id="slider-container">
        <div class="slider-header">
          <span class="slider-label">Redirect delay:</span>
          <span class="slider-value" id="slider-value">${lastDelay}s</span>
        </div>
        <div class="slider-track">
          <input type="range" min="0" max="60" value="${lastDelay}" class="slider" id="delay-slider">
        </div>
        <div class="auto-redirect-container" id="auto-container">
          <label class="toggle-switch">
            <input type="checkbox" id="auto-toggle" ${autoEnabled ? 'checked' : ''}>
            <span class="toggle-slider"></span>
          </label>
          <span class="toggle-label">${t('autoRedirect')}</span>
        </div>
        <button class="start-btn ${autoEnabled ? 'hidden' : ''}" id="start-btn">Start Redirect</button>
      </div>
    </div>

    <div class="panel-body" id="panel-body">
      <div class="language-section">
        <div class="lang-toggle">
          <button class="lang-btn ${currentLanguage === 'vi' ? 'active' : ''}" data-lang="vi">Tiếng Việt</button>
          <button class="lang-btn ${currentLanguage === 'en' ? 'active' : ''}" data-lang="en">English</button>
        </div>
      </div>

      <div class="info-section">
        <div class="version" id="version">${t('version')}</div>
        <div class="credit" id="credit">${t('madeBy')}</div>
        <div class="links">
          <a href="https://www.youtube.com/@dyydeptry" target="_blank">YouTube</a>
          <a href="https://discord.gg/DWyEfeBCzY" target="_blank">Discord</a>
        </div>
      </div>
    </div>
  </div>
</div>
      `;

            const wrapper = document.createElement('div');
            wrapper.innerHTML = panelHTML;
            this.shadow.appendChild(wrapper.firstElementChild);

            // Elements
            this.panel = this.shadow.querySelector('.panel');
            this.statusText = this.shadow.querySelector('#status-text');
            this.statusDot = this.shadow.querySelector('#status-dot');
            this.versionEl = this.shadow.querySelector('#version');
            this.creditEl = this.shadow.querySelector('#credit');
            this.langBtns = Array.from(this.shadow.querySelectorAll('.lang-btn'));
            this.body = this.shadow.querySelector('#panel-body');
            this.minimizeBtn = this.shadow.querySelector('#minimize-btn');
            this.sliderContainer = this.shadow.querySelector('#slider-container');
            this.sliderValue = this.shadow.querySelector('#slider-value');
            this.slider = this.shadow.querySelector('#delay-slider');
            this.startBtn = this.shadow.querySelector('#start-btn');
            this.autoToggle = this.shadow.querySelector('#auto-toggle');
            this.autoContainer = this.shadow.querySelector('#auto-container');

            try {
                document.documentElement.appendChild(this.container);
            } catch (e) {
                setTimeout(() => {
                    try { document.documentElement.appendChild(this.container); } catch (_) {}
                }, 200);
            }

            try {
                selectedDelay = parseInt(localStorage.getItem(STORAGE_KEY_DELAY) || '0', 10);
                this.slider.value = String(selectedDelay);
                this.sliderValue.textContent = `${selectedDelay}s`;
            } catch (e) {}
        }

        setupEventListeners() {
            this.langBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    currentLanguage = btn.dataset.lang;
                    try { localStorage.setItem(STORAGE_KEY_LANG, currentLanguage); } catch (_) {}
                    this.updateLanguage();
                });
            });

            this.minimizeBtn.addEventListener('click', () => {
                this.isMinimized = !this.isMinimized;
                this.body.classList.toggle('hidden');
                this.minimizeBtn.textContent = this.isMinimized ? '+' : '−';
            });

            this.autoToggle.addEventListener('change', (e) => {
                autoRedirectEnabled = e.target.checked;
                try { localStorage.setItem(STORAGE_KEY_AUTO, String(autoRedirectEnabled)); } catch (_) {}
                if (autoRedirectEnabled) this.startBtn.classList.add('hidden');
                else this.startBtn.classList.remove('hidden');
            });

            this.slider.addEventListener('input', (e) => {
                selectedDelay = parseInt(e.target.value, 10);
                this.sliderValue.textContent = `${selectedDelay}s`;
                try { localStorage.setItem(STORAGE_KEY_DELAY, String(selectedDelay)); } catch (_) {}
            });

            this.startBtn.addEventListener('click', () => {
                if (this.redirectInProgress) return;
                if (this.onStartCallback) {
                    this.redirectInProgress = true;
                    redirectInProgress = true;
                    try { this.onStartCallback(selectedDelay); } catch (_) {
                        this.redirectInProgress = false; redirectInProgress = false;
                    }
                }
            });
        }

        updateLanguage() {
            this.langBtns.forEach(btn => btn.classList.toggle('active', btn.dataset.lang === currentLanguage));
            if (this.versionEl) this.versionEl.textContent = t('version');
            if (this.creditEl) this.creditEl.textContent = t('madeBy');
            const toggleLabel = this.shadow.querySelector('.toggle-label');
            if (toggleLabel) toggleLabel.textContent = t('autoRedirect');
        }

        show(messageKeyOrTitle, typeOrSubtitle = 'info', replacements = {}) {
            this.currentMessageKey = messageKeyOrTitle;
            this.currentType = ['info', 'success', 'warning', 'error'].includes(typeOrSubtitle) ? typeOrSubtitle : 'info';
            this.currentReplacements = replacements;
            let message = t(messageKeyOrTitle, replacements);
            if (this.statusText) this.statusText.textContent = message;
            if (this.statusDot) this.statusDot.className = `status-dot ${this.currentType}`;
        }

        showCaptchaComplete() {
            if (this.redirectInProgress || redirectInProgress) return;
            this.sliderContainer.classList.add('active');
            this.sliderContainer.style.display = 'block';
            this.show('bypassSuccess', 'success');
            this.sliderValue.textContent = `${selectedDelay}s`;
            try { this.slider.value = String(selectedDelay); } catch (_) {}

            if (autoRedirectEnabled && this.onStartCallback) {
                this.redirectInProgress = true;
                redirectInProgress = true;
                setTimeout(() => { try { this.onStartCallback(selectedDelay); } catch (_) { this.redirectInProgress = false; redirectInProgress = false; } }, 500);
            }
        }

        setCallback(callback) { this.onStartCallback = callback; }

        startCountdown(seconds) {
            let remaining = Math.max(0, parseInt(seconds, 10) || 0);
            if (this.statusText) this.statusText.textContent = `Redirecting in ${remaining}s...`;
            if (this.statusDot) this.statusDot.className = 'status-dot info';
            const interval = setInterval(() => {
                remaining--;
                if (remaining > 0 && this.statusText) this.statusText.textContent = `Redirecting in ${remaining}s...`;
                else clearInterval(interval);
            }, 1000);
            return { stop: () => clearInterval(interval) };
        }
    }

    // instantiate GUI
    let panel = null;
    try { panel = new BypassPanel(); panel.show('pleaseSolveCaptcha', 'info'); } catch (e) { if (debug) console.error(e); }

    // ---------- bypass logic ----------
    if (host.includes("key.volcano.wtf")) handleVolcano();
    else if (host.includes("work.ink")) handleWorkInk();

    function handleVolcano() { /* ... volcano code ... */ }

    function handleWorkInk() {
        if (panel) panel.show('pleaseSolveCaptcha', 'info');

        let sessionController, sendMessage, LinkInfoFn, LinkDestinationFn;
        let bypassTriggered = false, destinationProcessed = false, destinationURL = null;

        function triggerBypass(reason) {
            if (bypassTriggered) return;
            bypassTriggered = true;
            if (debug) console.log('[Debug] trigger Bypass via:', reason);
            if (panel) panel.show('captchaSuccessBypassing', 'success');
        }

        // ---------- NEW: Detect CAPTCHA solved by Go To Destination button ----------
        function checkCaptchaSolved() {
            const btn = document.querySelector('button.large, button#primaryButton, a[href], input[type=button]') || null;
            if (!btn) return;
            const style = getComputedStyle(btn);
            const visible = style && style.display !== 'none' && style.visibility !== 'hidden' && btn.offsetParent !== null;
            const enabled = !btn.disabled && btn.getAttribute('aria-disabled') !== 'true';
            if (visible && enabled && !destinationProcessed) {
                if (panel) panel.showCaptchaComplete();
                destinationProcessed = true;
                if (debug) console.log('[Debug] CAPTCHA solved detected: Go to Destination button clickable');
            }
        }

        setInterval(checkCaptchaSolved, 500);
    }
}

        async function checkAndHandleSocials() {
            if (!linkInfoA) {
                if (debug) console.log('[Debug] checkAndHandleSocials: no linkInfoA yet');
                return;
            }
            if (socialCheckInProgress) {
                if (debug) console.log('[Debug] Social check already running');
                return;
            }

            let socials = Array.isArray(linkInfoA.socials) ? linkInfoA.socials.slice() : [];
            if (debug) console.log('[Debug] checkAndHandleSocials: found socials count', socials.length);

            if (socials.length > 1) {
                socialCheckInProgress = true;
                if (panel) panel.show('Processing Socials', `Found ${socials.length} socials, spoofing with delays...`);
                if (debug) console.log('[Debug] Spoofing socials loop start');

                for (let i = 0; i < socials.length; i++) {
                    const soc = socials[i];
                    try {
                        if (sendMessageA && sessionControllerA) {
                            sendMessageA.call(sessionControllerA, types.ss, {
                                url: soc.url
                            });
                            if (debug) console.log(`[Debug] Spoofed social [${i+1}/${socials.length}]:`, soc.url);
                            if (panel) panel.show('Processing Socials', `Spoofed ${i+1}/${socials.length} socials...`);
                        } else {
                            if (debug) console.warn('[Debug] sendMessageA not ready; skipping spoof for', soc.url);
                        }
                    } catch (e) {
                        if (debug) console.error('[Debug] Error spoofing social', soc.url, e);
                    }
                    if (i < socials.length - 1) await sleep(1000);
                }

                if (debug) console.log('[Debug] Completed social spoofing. Waiting 2000ms before reload...');
                await sleep(2000);

                try {
                    sessionStorage.setItem('dyrian_last_spoof', Date.now().toString());
                } catch (e) {}
                if (panel) panel.show('reloading', 'info');
                window.location.reload();
                return;
            } else {
                socialCheckInProgress = false;
                if (debug) console.log('[Debug] Socials <=1: returning to normal captcha UI; waiting for user solve');
                if (panel) panel.show('pleaseSolveCaptcha', 'info');
                return;
            }
        }

        function triggerBypass(reason) {
            if (bypassTriggered) {
                if (debug) console.log('[Debug] triggerBypass skipped (already triggered)');
                return;
            }
            bypassTriggered = true;
            if (debug) console.log('[Debug] triggerBypass via:', reason);
            if (panel) panel.showBypassingWorkink();

            let retryCount = 0;
            async function keepSpoofing() {
                if (destinationReceived) {
                    if (debug) console.log('[Debug] destination received: stopping spoof loop after', retryCount, 'attempts');
                    return;
                }
                retryCount++;
                if (debug) console.log('[Debug] keepSpoofing attempt', retryCount);
                try {
                    if (linkInfoA && sendMessageA && sessionControllerA) {
                        const socials = linkInfoA.socials || [];
                        for (let i = 0; i < socials.length; i++) {
                            try {
                                sendMessageA.call(sessionControllerA, types.ss, {
                                    url: socials[i].url
                                });
                            } catch (e) {}
                        }
                    }
                    spoofWorkink();
                } catch (e) {
                    if (debug) console.error('[Debug] keepSpoofing error', e);
                }
                setTimeout(keepSpoofing, 3000);
            }
            keepSpoofing();
        }

        function spoofWorkink() {
            if (!linkInfoA) {
                if (debug) console.log('[Debug] spoofWorkink skipped: no linkInfoA');
                return;
            }
            if (debug) console.log('[Debug] spoofWorkink running, linkInfoA present');

            const socials = linkInfoA.socials || [];
            for (let i = 0; i < socials.length; i++) {
                const soc = socials[i];
                try {
                    if (sendMessageA && sessionControllerA) {
                        sendMessageA.call(sessionControllerA, types.ss, {
                            url: soc.url
                        });
                        if (debug) console.log(`[Debug] Faked social [${i+1}/${socials.length}]:`, soc.url);
                    }
                } catch (e) {
                    if (debug) console.error('[Debug] Error faking social', soc.url, e);
                }
            }

            const monetizations = sessionControllerA?.monetizations || [];
            if (debug) console.log('[Debug] Total monetizations to fake:', monetizations.length);

            for (let i = 0; i < monetizations.length; i++) {
                const monetization = monetizations[i];
                const monetizationId = monetization.id;
                const monetizationSendMessage = monetization.sendMessage;
                try {
                    switch (monetizationId) {
                        case 22:
                            monetizationSendMessage.call(monetization, {
                                event: 'read'
                            });
                            break;
                        case 25:
                            monetizationSendMessage.call(monetization, {
                                event: 'start'
                            });
                            monetizationSendMessage.call(monetization, {
                                event: 'installClicked'
                            });
                            fetch('/_api/v2/affiliate/operaGX', {
                                method: 'GET',
                                mode: 'no-cors'
                            }).catch(() => {});
                            setTimeout(() => {
                                fetch('https://work.ink/_api/v2/callback/operaGX', {
                                    method: 'POST',
                                    mode: 'no-cors',
                                    headers: {
                                        'Content-Type': 'application/json'
                                    },
                                    body: JSON.stringify({
                                        noteligible: true
                                    })
                                }).catch(() => {});
                            }, 5000);
                            break;
                        case 34:
                            monetizationSendMessage.call(monetization, {
                                event: 'start'
                            });
                            monetizationSendMessage.call(monetization, {
                                event: 'installClicked'
                            });
                            break;
                        case 71:
                            monetizationSendMessage.call(monetization, {
                                event: 'start'
                            });
                            monetizationSendMessage.call(monetization, {
                                event: 'installed'
                            });
                            break;
                        case 45:
                            monetizationSendMessage.call(monetization, {
                                event: 'installed'
                            });
                            break;
                        case 57:
                            monetizationSendMessage.call(monetization, {
                                event: 'installed'
                            });
                            break;
                        default:
                            if (debug) console.log('[Debug] Unknown monetization id', monetizationId);
                            break;
                    }
                } catch (e) {
                    if (debug) console.error('[Debug] Error faking monetization', monetization, e);
                }
            }
            if (debug) console.log('[Debug] spoofWorkink completed');
        }

        function createSendMessageProxy() {
            return function(...args) {
                const pt = args[0];
                const pd = args[1];

                if (pt !== types.ping) {
                    if (debug) console.log('[Debug] Message sent:', pt, pd);
                }

                if (pt === types.ad) {
                    if (debug) console.log('[Debug] Blocking adblocker message');
                    return;
                }

                if (pt === types.tr) {
                    if (debug) console.log('[Debug] Captcha/turnstile response detected -> user solved captcha');
                    captchaSolved = true;
                    const socials = linkInfoA?.socials || [];
                    if (socials.length <= 1) {
                        triggerBypass('tr');
                    } else {
                        if (debug) console.log('[Debug] Captcha solved but socials >1; social loop should handle removing them first.');
                    }
                }

                return sendMessageA ? sendMessageA.apply(this, args) : undefined;
            };
        }

        function createLinkInfoProxy() {
            return function(...args) {
                const info = args[0];
                linkInfoA = info;
                if (debug) console.log('[Debug] Link info arrived:', info);
                try {
                    checkAndHandleSocials();
                } catch (e) {
                    if (debug) console.error(e);
                }
                try {
                    spoofWorkink();
                } catch (e) {
                    if (debug) console.error(e);
                }
                try {
                    Object.defineProperty(info, 'isAdblockEnabled', {
                        get: () => false,
                        set: () => {},
                        configurable: false,
                        enumerable: true
                    });
                    if (debug) console.log('[Debug] Adblock disabled in linkInfo');
                } catch (e) {
                    if (debug) console.warn('[Debug] Define Property failed:', e);
                }
                return onLinkInfoA ? onLinkInfoA.apply(this, args) : undefined;
            };
        }

        function redirect(url) {
            if (debug) console.log('[Debug] Redirecting to:', url);
            window.location.href = url;
        }

        function createDestinationProxy() {
            return function(...args) {
                if (redirectInProgress || destinationReceived) {
                    if (debug) console.log('[Debug] createDestinationProxy: redirect already in progress or destination already received, ignoring');
                    return onLinkDestinationA ? onLinkDestinationA.apply(this, args) : undefined;
                }

                const data = args[0];
                const secondsPassed = (Date.now() - startTime) / 1000;
                destinationReceived = true;

                if (debug) console.log('[Debug] Destination data:', data.url);

                if (panel) {
                    panel.show('bypassSuccess', 'success');

                    panel.setCallback && panel.setCallback((delay) => {
                        if (debug) console.log('[Debug] Callback triggered with delay:', delay);
                        if (delay === 0) {
                            if (debug) console.log('[Debug] Delay is 0, redirecting immediately');
                            panel.show('redirectingToWork', 'info');
                            redirect(data.url);
                        } else {
                            if (debug) console.log('[Debug] Starting countdown with delay:', delay);
                            panel.startCountdown && panel.startCountdown(delay);
                            setTimeout(() => {
                                if (debug) console.log('[Debug] Countdown finished, redirecting to:', data.url);
                                redirect(data.url);
                            }, (delay + 1) * 1000);
                        }
                    });

                    if (debug) console.log('[Debug] Calling showCaptchaComplete');
                    panel.showCaptchaComplete && panel.showCaptchaComplete();
                }

                return onLinkDestinationA ? onLinkDestinationA.apply(this, args) : undefined;
            };
        }

        function setupProxies() {
            const send = resolveWriteFunction(sessionControllerA);
            const info = resolveName(sessionControllerA, map.onLI);
            const dest = resolveName(sessionControllerA, map.onLD);

            if (!send.fn || !info.fn || !dest.fn) {
                if (debug) console.log('[Debug] Could not resolve send/info/dest on controller yet', send, info, dest);
                return;
            }

            sendMessageA = send.fn;
            onLinkInfoA = info.fn;
            onLinkDestinationA = dest.fn;

            const sendMessageProxy = createSendMessageProxy();
            const onLinkInfoProxy = createLinkInfoProxy();
            const onDestinationProxy = createDestinationProxy();

            try {
                Object.defineProperty(sessionControllerA, send.name, {
                    get() {
                        return sendMessageProxy
                    },
                    set(v) {
                        sendMessageA = v
                    },
                    configurable: false,
                    enumerable: true
                });

                Object.defineProperty(sessionControllerA, info.name, {
                    get() {
                        return onLinkInfoProxy
                    },
                    set(v) {
                        onLinkInfoA = v
                    },
                    configurable: false,
                    enumerable: true
                });

                Object.defineProperty(sessionControllerA, dest.name, {
                    get() {
                        return onDestinationProxy
                    },
                    set(v) {
                        onLinkDestinationA = v
                    },
                    configurable: false,
                    enumerable: true
                });

                if (debug) console.log(`[Debug] setupProxies: installed ${send.name}, ${info.name}, ${dest.name}`);
            } catch (e) {
                if (debug) console.warn('[Debug] Failed to define proxy properties', e);
            }
        }

        function checkController(target, prop, value, receiver) {
            if (debug) console.log('[Debug] Checking prop:', prop, typeof value);
            if (value &&
                typeof value === 'object' &&
                resolveWriteFunction(value).fn &&
                resolveName(value, map.onLI).fn &&
                resolveName(value, map.onLD).fn &&
                !sessionControllerA) {
                sessionControllerA = value;
                if (debug) console.log('[Debug] Controller detected:', sessionControllerA);
                setupProxies();
            } else {
                if (debug) console.log('[Debug] checkController: No controller found for prop:', prop);
            }
            return Reflect.set(target, prop, value, receiver);
        }

        function createComponentProxy(comp) {
            return new Proxy(comp, {
                construct(target, args) {
                    const instance = Reflect.construct(target, args);
                    if (instance.$$.ctx) {
                        instance.$$.ctx = new Proxy(instance.$$.ctx, {
                            set: checkController
                        });
                    }
                    return instance;
                }
            });
        }

        function creaNodeResultProxy(result) {
            return new Proxy(result, {
                get: (target, prop, receiver) => {
                    if (prop === 'component') {
                        return createComponentProxy(target.component);
                    }
                    return Reflect.get(target, prop, receiver);
                }
            });
        }

        function createNodeProxy(oldNode) {
            return async (...args) => {
                const result = await oldNode(...args);
                return creaNodeResultProxy(result);
            }
        }

        function createKitProxy(kit) {
            if (!kit?.start) return [false, kit];

            return [
                true,
                new Proxy(kit, {
                    get(target, prop, receiver) {
                        if (prop === 'start') {
                            return function(...args) {
                                const appModule = args[0];
                                const options = args[2];

                                if (
                                    typeof appModule === 'object' &&
                                    typeof appModule.nodes === 'object' &&
                                    typeof options === 'object' &&
                                    typeof options.node_ids === 'object'
                                ) {
                                    const nodeIndex = options.node_ids[1];
                                    const oldNode = appModule.nodes[nodeIndex];
                                    appModule.nodes[nodeIndex] = createNodeProxy(oldNode);
                                }

                                if (debug) console.log('[Debug] kit.start intercepted!', options);
                                return kit.start.apply(this, args);
                            };
                        }
                        return Reflect.get(target, prop, receiver);
                    }
                })
            ];
        }

        function setupInterception() {
            const origPromiseAll = Promise.all;
            let intercepted = false;

            Promise.all = async function(promises) {
                const result = origPromiseAll.call(this, promises);
                if (!intercepted) {
                    intercepted = true;
                    return await new Promise((resolve) => {
                        result.then(([kit, app, ...args]) => {
                            if (debug) console.log('[Debug]: Set up Interception!');

                            const [success, created] = createKitProxy(kit);
                            if (success) {
                                Promise.all = origPromiseAll;
                                if (debug) console.log('[Debug]: Kit ready', created, app);
                            }
                            resolve([created, app, ...args]);
                        }).catch(() => {
                            resolve(result);
                        });
                    });
                }
                return await result;
            };
        }

        let controllerCheckInterval = setInterval(() => {
            if (sessionControllerA) {
                if (debug) console.log('[Debug] Controller detected early, stopping interval check');
                clearInterval(controllerCheckInterval);
            }
        }, 500);

        setTimeout(() => {
            if (controllerCheckInterval) {
                clearInterval(controllerCheckInterval);
                if (debug) console.log('[Debug] Controller check interval stopped after timeout');
            }
        }, 30000);

        window.googletag = {
            cmd: [],
            _loaded_: true
        };

        const blockedClasses = [
            "adsbygoogle",
            "adsense-wrapper",
            "inline-ad",
            "gpt-billboard-container"
        ];

        const blockedIds = [
            "billboard-1",
            "billboard-2",
            "billboard-3",
            "sidebar-ad-1",
            "skyscraper-ad-1"
        ];

        setupInterception();

        const periodicChecker = setInterval(() => {
            try {
                if (linkInfoA && !bypassTriggered) {
                    checkAndHandleSocials();
                }
            } catch (e) {
                if (debug) console.error('[Debug] periodic check error', e);
            }
        }, 2500);

        const ob = new MutationObserver(mutations => {
            for (const m of mutations) {
                for (const node of m.addedNodes) {
                    if (node.nodeType === 1) {
                        blockedClasses.forEach((cls) => {
                            try {
                                if (node.classList?.contains(cls)) {
                                    node.remove();
                                    if (debug) console.log('[Debug]: Removed ad by class:', cls, node);
                                }
                            } catch (e) {}
                            try {
                                node.querySelectorAll?.(`.${cls}`).forEach((el) => {
                                    el.remove();
                                    if (debug) console.log('[Debug]: Removed nested ad by class:', cls, el);
                                });
                            } catch (e) {}
                        });

                        blockedIds.forEach((id) => {
                            try {
                                if (node.id === id) {
                                    node.remove();
                                    if (debug) console.log('[Debug]: Removed ad by id:', id, node);
                                }
                            } catch (e) {}
                            try {
                                node.querySelectorAll?.(`#${id}`).forEach((el) => {
                                    el.remove();
                                    if (debug) console.log('[Debug]: Removed nested ad by id:', id, el);
                                });
                            } catch (e) {}
                        });

                        if (node.matches && node.matches('.button.large.accessBtn.pos-relative') && node.textContent.includes('Go To Destination')) {
                            if (debug) console.log('[Debug] GTD button detected in DOM');
                        }
                    }
                }
            }
        });
        ob.observe(document.documentElement, {
            childList: true,
            subtree: true
        });
    }

})();
