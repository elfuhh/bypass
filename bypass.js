(() => {
    'use strict';

    const host = location.hostname; // check host
    const debug = true; // enable debug logs (console)

    let selectedDelay = 0;
    let currentLanguage = localStorage.getItem('lang') || 'vi'; // default language: vi/en

    // Translations (bypassSuccess simplified — no {time})
    const translations = {
        vi: {
            title: "Dyrian and elfuhh Bypass",
            pleaseSolveCaptcha: "Vui lòng giải CAPTCHA để tiếp tục",
            captchaSuccess: "CAPTCHA đã thành công",
            redirectingToWork: "Đang qua Work.ink...",
            bypassSuccessCopy: "Bypass thành công, đã Copy Key (bấm 'Cho Phép' nếu có)",
            waitingCaptcha: "Đang chờ CAPTCHA...",
            pleaseReload: "Vui lòng tải lại trang...(workink lỗi)",
            bypassSuccess: "Bypass thành công",
            backToCheckpoint: "Đang về lại Checkpoint...",
            captchaSuccessBypassing: "CAPTCHA đã thành công, đang bypass...",
            version: "Phiên bản v1.6.3.0",
            madeBy: "Được tạo bởi DyRian và elfuhh (dựa trên IHaxU)"
        },
        en: {
            title: "Dyrian and elfuhh Bypass",
            pleaseSolveCaptcha: "Please solve the CAPTCHA to continue",
            captchaSuccess: "CAPTCHA solved successfully",
            redirectingToWork: "Redirecting to Work.ink...",
            bypassSuccessCopy: "Bypass successful! Key copied (click 'Allow' if prompted)",
            waitingCaptcha: "Waiting for CAPTCHA...",
            pleaseReload: "Please reload the page...(workink bugs)",
            bypassSuccess: "Bypass successful",
            backToCheckpoint: "Returning to checkpoint...",
            captchaSuccessBypassing: "CAPTCHA solved successfully, bypassing...",
            version: "Version v1.6.3.0",
            madeBy: "Made by DyRian and elfuhh (based on IHaxU)"
        }
    };

    function t(key, replacements = {}) {
        if (!translations[currentLanguage] || !translations[currentLanguage][key]) return key;
        let text = translations[currentLanguage][key];
        Object.keys(replacements).forEach(placeholder => {
            text = text.replace(`{${placeholder}}`, replacements[placeholder]);
        });
        return text;
    }

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

            // slider elements
            this.sliderContainer = null;
            this.sliderValue = null;
            this.slider = null;
            this.startBtn = null;
            this.onStartCallback = null;

            this.init();
        }

        init() {
            this.createPanel();
            this.setupEventListeners();
        }

        createPanel() {
            this.container = document.createElement('div');
            this.shadow = this.container.attachShadow({ mode: 'closed' });

            const style = document.createElement('style');
            style.textContent = `
                * { margin: 0; padding: 0; box-sizing: border-box; }

                .panel-container {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    width: 400px;
                    z-index: 2147483647;
                    font-family: 'Segoe UI', Roboto, 'Noto Sans', Arial, sans-serif;
                }

                .panel {
                    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
                    border-radius: 16px;
                    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
                    overflow: hidden;
                    animation: slideIn 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
                    transition: all 0.3s ease;
                }

                @keyframes slideIn {
                    from {
                        opacity: 0;
                        transform: translateX(100px) scale(0.9);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0) scale(1);
                    }
                }

                .header {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    padding: 16px 20px;
                    position: relative;
                    overflow: hidden;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .header::before {
                    content: '';
                    position: absolute;
                    top: -50%;
                    left: -50%;
                    width: 200%;
                    height: 200%;
                    background: linear-gradient(45deg, transparent, rgba(255,255,255,0.1), transparent);
                    animation: shine 3s infinite;
                }

                @keyframes shine {
                    0% { transform: translateX(-100%) translateY(-100%) rotate(45deg); }
                    100% { transform: translateX(100%) translateY(100%) rotate(45deg); }
                }

                .title {
                    font-size: 20px;
                    font-weight: 700;
                    color: #fff;
                    text-shadow: 0 2px 4px rgba(0,0,0,0.3);
                    position: relative;
                    z-index: 1;
                }

                .minimize-btn {
                    background: rgba(255,255,255,0.15);
                    border: none;
                    color: #fff;
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s;
                    font-size: 20px;
                    font-weight: 700;
                    position: relative;
                    z-index: 1;
                }

                .minimize-btn:hover {
                    background: rgba(255,255,255,0.3);
                    transform: scale(1.1);
                }

                .status-section {
                    padding: 20px;
                    border-bottom: 1px solid rgba(255,255,255,0.05);
                    position: relative;
                }

                .status-box {
                    background: rgba(255,255,255,0.05);
                    border-radius: 12px;
                    padding: 16px;
                    position: relative;
                    overflow: hidden;
                }

                .status-box::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.03), transparent);
                    animation: shimmer 2s infinite;
                }

                @keyframes shimmer {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }

                .status-content {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    position: relative;
                    z-index: 1;
                }

                .status-dot {
                    width: 14px;
                    height: 14px;
                    border-radius: 50%;
                    animation: pulse 2s ease-in-out infinite;
                    box-shadow: 0 0 12px currentColor;
                    flex-shrink: 0;
                }

                @keyframes pulse {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.7; transform: scale(1.15); }
                }

                .status-dot.info { background: #60a5fa; }
                .status-dot.success { background: #4ade80; }
                .status-dot.warning { background: #facc15; }
                .status-dot.error { background: #f87171; }

                .status-text {
                    color: #fff;
                    font-size: 14px;
                    font-weight: 500;
                    flex: 1;
                    line-height: 1.5;
                }

                .panel-body {
                    max-height: 500px;
                    overflow: hidden;
                    transition: all 0.3s ease;
                    opacity: 1;
                }

                .panel-body.hidden {
                    max-height: 0;
                    opacity: 0;
                }

                .language-section {
                    padding: 16px 20px;
                    border-bottom: 1px solid rgba(255,255,255,0.05);
                }

                .lang-toggle {
                    display: flex;
                    gap: 10px;
                }

                .lang-btn {
                    flex: 1;
                    background: rgba(255,255,255,0.05);
                    border: 2px solid rgba(255,255,255,0.1);
                    color: #fff;
                    padding: 10px;
                    border-radius: 10px;
                    cursor: pointer;
                    font-weight: 600;
                    font-size: 14px;
                    transition: all 0.2s;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                }

                .lang-btn:hover {
                    background: rgba(255,255,255,0.1);
                    transform: translateY(-2px);
                }

                .lang-btn.active {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    border-color: #667eea;
                    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
                }

                .info-section {
                    padding: 16px 20px;
                    background: rgba(0,0,0,0.2);
                }

                .version {
                    color: rgba(255,255,255,0.6);
                    font-size: 12px;
                    font-weight: 500;
                    margin-bottom: 8px;
                    text-align: center;
                }

                .credit {
                    color: rgba(255,255,255,0.6);
                    font-size: 12px;
                    font-weight: 500;
                    text-align: center;
                    margin-bottom: 8px;
                }

                .credit-author {
                    color: #667eea;
                    font-weight: 700;
                }

                .links {
                    display: flex;
                    justify-content: center;
                    gap: 16px;
                    font-size: 11px;
                }

                .links a {
                    color: #667eea;
                    text-decoration: none;
                    transition: all 0.2s;
                }

                .links a:hover {
                    color: #764ba2;
                    text-decoration: underline;
                }

                /* --- Slider styles (Dyrian-themed & animated) --- */
                .slider-container {
                    display: none;
                    padding: 12px 0 0 0;
                    animation: fadeIn 0.4s ease;
                    margin-top: 12px;
                }

                .slider-container.active {
                    display: block;
                }

                .slider-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin: 0 20px 8px 20px;
                }

                .slider-label {
                    color: rgba(255,255,255,0.9);
                    font-size: 13px;
                    font-weight: 600;
                }

                .slider-value {
                    color: #fff;
                    font-size: 13px;
                    font-weight: 700;
                }

                .slider-track {
                    position: relative;
                    margin: 0 20px 12px 20px;
                }

                .slider {
                    width: 100%;
                    height: 8px;
                    border-radius: 6px;
                    background: linear-gradient(90deg,#2b3440 0%, #27323f 100%);
                    outline: none;
                    -webkit-appearance: none;
                    cursor: pointer;
                    transition: all 0.25s ease;
                }

                .slider::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    appearance: none;
                    width: 18px;
                    height: 18px;
                    border-radius: 50%;
                    background: linear-gradient(135deg,#667eea 0%, #764ba2 100%);
                    cursor: pointer;
                    transition: all 0.2s ease;
                    box-shadow: 0 6px 14px rgba(102,126,234,0.28);
                    border: 2px solid rgba(255,255,255,0.08);
                }

                .slider::-webkit-slider-thumb:hover {
                    transform: scale(1.12);
                }

                .slider::-moz-range-thumb {
                    width: 18px;
                    height: 18px;
                    border-radius: 50%;
                    background: linear-gradient(135deg,#667eea 0%, #764ba2 100%);
                    cursor: pointer;
                    border: 2px solid rgba(255,255,255,0.08);
                    transition: all 0.2s ease;
                    box-shadow: 0 6px 14px rgba(102,126,234,0.28);
                }

                .slider::-moz-range-thumb:hover {
                    transform: scale(1.12);
                }

                .start-btn {
                    width: calc(100% - 40px);
                    margin: 0 20px 16px 20px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    border: none;
                    padding: 10px;
                    border-radius: 10px;
                    font-weight: 700;
                    font-size: 14px;
                    cursor: pointer;
                    transition: all 0.18s ease;
                    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
                    box-shadow: 0 6px 18px rgba(102,126,234,0.18);
                }

                .start-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 10px 24px rgba(102,126,234,0.22);
                }

                .start-btn:disabled {
                    background: #4a5d6f;
                    cursor: not-allowed;
                    transform: none;
                    box-shadow: none;
                }

                @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }

                @media (max-width: 480px) {
                    .panel-container {
                        top: 10px;
                        right: 10px;
                        left: 10px;
                        width: auto;
                    }
                }
            `;

            this.shadow.appendChild(style);

            // NOTE: slider container moved directly under .status-section (inside it) so it sits right below status text.
            const panelHTML = `
                <div class="panel-container">
                    <div class="panel">
                        <div class="header">
                            <div class="title">${t('title')}</div>
                            <button class="minimize-btn" id="minimize-btn">−</button>
                        </div>

                        <div class="status-section">
                            <div class="status-box">
                                <div class="status-content">
                                    <div class="status-dot info" id="status-dot"></div>
                                    <div class="status-text" id="status-text">${t('pleaseSolveCaptcha')}</div>
                                </div>
                            </div>

                            <!-- Slider placed directly below the status text (inside the status-section) -->
                            <div class="slider-container" id="slider-container">
                                <div class="slider-header">
                                    <span class="slider-label">Redirect delay:</span>
                                    <span class="slider-value" id="slider-value">0s</span>
                                </div>
                                <div class="slider-track">
                                    <input type="range" min="0" max="60" value="0" class="slider" id="delay-slider">
                                </div>
                                <button class="start-btn" id="start-btn">Start Redirect</button>
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
                                <div class="credit" id="credit">
                                    ${t('madeBy')}
                                </div>
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

            this.panel = this.shadow.querySelector('.panel');
            this.statusText = this.shadow.querySelector('#status-text');
            this.statusDot = this.shadow.querySelector('#status-dot');
            this.versionEl = this.shadow.querySelector('#version');
            this.creditEl = this.shadow.querySelector('#credit');
            this.langBtns = Array.from(this.shadow.querySelectorAll('.lang-btn'));
            this.body = this.shadow.querySelector('#panel-body');
            this.minimizeBtn = this.shadow.querySelector('#minimize-btn');

            // slider elements
            this.sliderContainer = this.shadow.querySelector('#slider-container');
            this.sliderValue = this.shadow.querySelector('#slider-value');
            this.slider = this.shadow.querySelector('#delay-slider');
            this.startBtn = this.shadow.querySelector('#start-btn');

            document.documentElement.appendChild(this.container);
        }

        setupEventListeners() {
            this.langBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    currentLanguage = btn.dataset.lang;
                    this.updateLanguage();
                });
            });

            this.minimizeBtn.addEventListener('click', () => {
                this.isMinimized = !this.isMinimized;
                this.body.classList.toggle('hidden');
                this.minimizeBtn.textContent = this.isMinimized ? '+' : '−';
            });

            // slider input
            this.slider.addEventListener('input', (e) => {
                selectedDelay = parseInt(e.target.value);
                this.sliderValue.textContent = `${selectedDelay}s`;
            });

            // start button
            this.startBtn.addEventListener('click', () => {
                if (this.onStartCallback) {
                    try {
                        this.onStartCallback(selectedDelay);
                    } catch (err) {
                        if (debug) console.error('[Debug] onStartCallback error', err);
                    }
                }
            });
        }

        updateLanguage() {
            localStorage.setItem('lang', currentLanguage);

            this.langBtns.forEach(btn => {
                btn.classList.toggle('active', btn.dataset.lang === currentLanguage);
            });

            const titleEl = this.shadow.querySelector('.title');
            if (titleEl) titleEl.textContent = t('title');
            if (this.versionEl) this.versionEl.textContent = t('version');
            if (this.creditEl) this.creditEl.textContent = t('madeBy');

            if (this.currentMessageKey) {
                // re-show current message (localized if applicable)
                this.show(this.currentMessageKey, this.currentType, this.currentReplacements);
            }
        }

        /**
         * show: either translation key or raw string
         */
        show(messageKeyOrTitle, typeOrSubtitle = 'info', replacements = {}) {
            this.currentMessageKey = messageKeyOrTitle;
            this.currentType = (typeof typeOrSubtitle === 'string' && ['info','success','warning','error'].includes(typeOrSubtitle)) ? typeOrSubtitle : 'info';
            this.currentReplacements = replacements;

            let message = '';
            if (translations[currentLanguage] && translations[currentLanguage][messageKeyOrTitle]) {
                message = t(messageKeyOrTitle, replacements);
                if (typeof typeOrSubtitle === 'string' && !['info','success','warning','error'].includes(typeOrSubtitle) && typeOrSubtitle.length > 0) {
                    message = typeOrSubtitle;
                }
            } else {
                message = (typeof typeOrSubtitle === 'string' && ['info','success','warning','error'].includes(typeOrSubtitle)) ? messageKeyOrTitle : (typeOrSubtitle || messageKeyOrTitle);
            }

            this.statusText.textContent = message;
            this.statusDot.className = `status-dot ${this.currentType}`;
        }

        showBypassingWorkink() {
            this.show('captchaSuccessBypassing', 'success');
        }

        showCaptchaComplete() {
            // reveal slider area directly under status (we moved it)
            this.sliderContainer.classList.add('active');
            // show simplified bypass message
            this.show('bypassSuccess', 'success');
        }

        setCallback(callback) {
            this.onStartCallback = callback;
        }

        startCountdown(seconds) {
            // hide slider and disable start button while counting down
            this.sliderContainer.classList.remove('active');
            this.startBtn.disabled = true;

            let remaining = seconds;
            this.show('redirectingToWork', 'info');
            this.statusText.textContent = `Redirecting in ${remaining}s...`;

            const interval = setInterval(() => {
                remaining--;
                if (remaining > 0) {
                    this.statusText.textContent = `Redirecting in ${remaining}s...`;
                } else {
                    clearInterval(interval);
                }
            }, 1000);
        }
    }

    let panel = null;
    setTimeout(() => { panel = new BypassPanel(); panel.show('pleaseSolveCaptcha', 'info'); }, 100);

    // === Bypass logic (merged from original scripts) ===
    if (host.includes("key.volcano.wtf")) handleVolcano();
    else if (host.includes("work.ink")) handleWorkInk();

    function handleVolcano() {
        if (panel) panel.show('pleaseSolveCaptcha', 'info');
        if (debug) console.log('[Debug] Waiting Captcha');

        let alreadyDoneContinue = false;
        let alreadyDoneCopy = false;

        function actOnCheckpoint(node) {
            if (!alreadyDoneContinue) {
                const buttons = node && node.nodeType === 1
                    ? node.matches('#primaryButton[type="submit"], button[type="submit"], a, input[type=button], input[type=submit]')
                        ? [node]
                        : node.querySelectorAll('#primaryButton[type="submit"], button[type="submit"], a, input[type=button], input[type=submit]')
                    : document.querySelectorAll('#primaryButton[type="submit"], button[type="submit"], a, input[type=button], input[type=submit]');
                for (const btn of buttons) {
                    const text = (btn.innerText || btn.value || "").trim().toLowerCase();
                    if (text.includes("continue") || text.includes("next step")) {
                        const disabled = btn.disabled || btn.getAttribute("aria-disabled") === "true";
                        const style = getComputedStyle(btn);
                        const visible = style.display !== "none" && style.visibility !== "hidden" && btn.offsetParent !== null;
                        if (visible && !disabled) {
                            alreadyDoneContinue = true;
                            if (panel) panel.show('captchaSuccess', 'success');
                            if (debug) console.log('[Debug] Captcha Solved');

                            setTimeout(() => {
                                try {
                                    btn.click();
                                    if (panel) panel.show('redirectingToWork', 'info');
                                    if (debug) console.log('[Debug] Clicking Continue');
                                } catch (err) {
                                    if (debug) console.log('[Debug] No Continue Found', err);
                                }
                            }, 1500);
                            return true;
                        }
                    }
                }
            }

            const copyBtn = node && node.nodeType === 1
                ? node.matches("#copy-key-btn, .copy-btn, [aria-label='Copy']")
                    ? node
                    : node.querySelector("#copy-key-btn, .copy-btn, [aria-label='Copy']")
                : document.querySelector("#copy-key-btn, .copy-btn, [aria-label='Copy']");
            if (copyBtn) {
                setInterval(() => {
                    try {
                        copyBtn.click();
                        if (debug) console.log('[Debug] Copy button spam click');
                        if (panel) panel.show('bypassSuccessCopy', 'success');
                    } catch (err) {
                        if (debug) console.log('[Debug] No Copy Found', err);
                    }
                }, 500);
                return true;
            }

            return false;
        }

        const mo = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                if (mutation.type === 'childList') {
                    for (const node of mutation.addedNodes) {
                        if (node.nodeType === 1) {
                            if (actOnCheckpoint(node)) {
                                if (alreadyDoneCopy) {
                                    mo.disconnect();
                                    return;
                                }
                            }
                        }
                    }
                }
                if (mutation.type === 'attributes' && mutation.target.nodeType === 1) {
                    if (actOnCheckpoint(mutation.target)) {
                        if (alreadyDoneCopy) {
                            mo.disconnect();
                            return;
                        }
                    }
                }
            }
        });

        mo.observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['disabled', 'aria-disabled', 'style'] });

        if (actOnCheckpoint()) {
            if (alreadyDoneCopy) {
                mo.disconnect();
            }
        }
    }

    function handleWorkInk() {
        if (panel) panel.show('pleaseSolveCaptcha', 'info');

        const startTime = Date.now();
        let sessionControllerA = undefined;
        let sendMessageA = undefined;
        let onLinkInfoA = undefined;
        let linkInfoA = undefined;
        let onLinkDestinationA = undefined;
        let bypassTriggered = false;
        let destinationReceived = false;
        let socialCheckInProgress = false;

        const map = {
            onLI: ["onLinkInfo"],
            onLD: ["onLinkDestination"]
        };

        function resolveName(obj, candidates) {
            if (!obj || typeof obj !== "object") {
                return { fn: null, index: -1, name: null };
            }

            for (let i = 0; i < candidates.length; i++) {
                const name = candidates[i];
                if (typeof obj[name] === "function") {
                    return { fn: obj[name], index: i, name };
                }
            }
            return { fn: null, index: -1, name: null };
        }

        function resolveWriteFunction(obj) {
            if (!obj || typeof obj !== "object") {
                return { fn: null, index: -1, name: null };
            }

            for (let i in obj) {
                if (typeof obj[i] === "function" && obj[i].length === 2) {
                    return { fn: obj[i], name: i };
                }
            }
            return { fn: null, index: -1, name: null };
        }

        const types = {
            mo: 'c_monetization',
            ss: 'c_social_started',
            tr: 'c_turnstile_response',
            ad: 'c_adblocker_detected',
            ping: 'c_ping'
        };

        async function checkAndHandleSocials() {
            if (!linkInfoA || socialCheckInProgress) {
                return;
            }

            const socials = linkInfoA.socials || [];
            if (debug) console.log('[Debug] Checking socials count:', socials.length);

            if (socials.length > 1) {
                socialCheckInProgress = true;
                if (panel) panel.show('Processing Socials', `Found ${socials.length} socials, spoofing with delays...`);
                if (debug) console.log('[Debug] More than 1 social detected, spoofing with 1000ms delays...');

                // Spoof all socials with 2000ms delay between each (preserve original behavior)
                for (let i = 0; i < socials.length; i++) {
                    const soc = socials[i];
                    try {
                        if (sendMessageA) {
                            sendMessageA.call(sessionControllerA, types.ss, { url: soc.url });
                            if (debug) console.log(`[Debug] Spoofed social [${i+1}/${socials.length}]:`, soc.url);
                            if (panel) panel.show('Processing Socials', `Spoofed ${i+1}/${socials.length} socials...`);
                        }
                    } catch (e) {
                        if (debug) console.error(`[Debug] Error spoofing social [${i+1}/${socials.length}]:`, soc.url, e);
                    }

                    if (i < socials.length - 1) {
                        await new Promise(resolve => setTimeout(resolve, 2000));
                    }
                }

                // Wait a moment for the spoofing to register, then refresh
                setTimeout(() => {
                    if (debug) console.log('[Debug] Refreshing page to reduce socials...');
                    if (panel) panel.show('Refreshing...', 'Reloading page...');
                    window.location.reload();
                }, 4000);
            } else {
                if (debug) console.log('[Debug] 1 or fewer socials, proceeding with normal bypass');
                triggerBypass('social-check-complete');
            }
        }

        function triggerBypass(reason) {
            if (bypassTriggered) {
                if (debug) console.log('[Debug] trigger Bypass skipped, already triggered');
                return;
            }
            bypassTriggered = true;
            if (debug) console.log('[Debug] trigger Bypass via:', reason);
            if (panel) panel.showBypassingWorkink();

            let retryCount = 0;
            function keepSpoofing() {
                if (destinationReceived) {
                    if (debug) console.log('[Debug] Destination received, stopping spoofing after', retryCount, 'attempts');
                    return;
                }
                retryCount++;
                if (debug) console.log(`[Debug] Spoofing attempt #${retryCount}`);
                spoofWorkink();
                setTimeout(keepSpoofing, 3000);
            }
            keepSpoofing();
            if (debug) console.log('[Debug] Waiting for server to send destination data...');
        }

        function spoofWorkink() {
            if (!linkInfoA) {
                if (debug) console.log('[Debug] spoof Workink skipped: no sessionControllerA.linkInfo');
                return;
            }
            if (debug) console.log('[Debug] spoof Workink starting, linkInfo:', linkInfoA);

            const socials = linkInfoA.socials || [];
            if (debug) console.log('[Debug] Total socials to fake:', socials.length);

            for (let i = 0; i < socials.length; i++) {
                const soc = socials[i];
                try {
                    if (sendMessageA) {
                        sendMessageA.call(sessionControllerA, types.ss, { url: soc.url });
                        if (debug) console.log(`[Debug] Faked social [${i+1}/${socials.length}]:`, soc.url);
                    } else {
                        if (debug) console.warn(`[Debug] No send message for social [${i+1}/${socials.length}]:`, soc.url);
                    }
                } catch (e) {
                    if (debug) console.error(`[Debug] Error faking social [${i+1}/${socials.length}]:`, soc.url, e);
                }
            }

            const monetizations = sessionControllerA?.monetizations || [];
            if (debug) console.log('[Debug] Total monetizations to fake:', monetizations.length);

            for (let i = 0; i < monetizations.length; i++) {
                const monetization = monetizations[i];
                if (debug) console.log(`[Debug] Processing monetization [${i+1}/${monetizations.length}]:`, monetization);
                const monetizationId = monetization.id;
                const monetizationSendMessage = monetization.sendMessage;

                try {
                    switch (monetizationId) {
                        case 22:
                            monetizationSendMessage.call(monetization, { event: 'read' });
                            if (debug) console.log(`[Debug] Faked readArticles2 [${i+1}/${monetizations.length}]`);
                            break;
                        case 25:
                            monetizationSendMessage.call(monetization, { event: 'start' });
                            monetizationSendMessage.call(monetization, { event: 'installedClicked' });
                            fetch('/_api/v2/affiliate/operaGX', { method: 'GET', mode: 'no-cors' }).catch(() => {});
                            setTimeout(() => {
                                fetch('https://work.ink/_api/v2/callback/operaGX', {
                                    method: 'POST',
                                    mode: 'no-cors',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ noteligible: true })
                                }).catch(() => {});
                            }, 5000);
                            if (debug) console.log(`[Debug] Faked operaGX [${i+1}/${monetizations.length}]`);
                            break;
                        case 34:
                            monetizationSendMessage.call(monetization, { event: 'start' });
                            monetizationSendMessage.call(monetization, { event: 'installedClicked' });
                            if (debug) console.log(`[Debug] Faked norton [${i+1}/${monetizations.length}]`);
                            break;
                        case 71:
                            monetizationSendMessage.call(monetization, { event: 'start' });
                            monetizationSendMessage.call(monetization, { event: 'installed' });
                            if (debug) console.log(`[Debug] Faked externalArticles [${i+1}/${monetizations.length}]`);
                            break;
                        case 45:
                            monetizationSendMessage.call(monetization, { event: 'installed' });
                            if (debug) console.log(`[Debug] Faked pdfeditor [${i+1}/${monetizations.length}]`);
                            break;
                        case 57:
                            monetizationSendMessage.call(monetization, { event: 'installed' });
                            if (debug) console.log(`[Debug] Faked betterdeals [${i+1}/${monetizations.length}]`);
                            break;
                        default:
                            if (debug) console.log(`[Debug] Unknown monetization [${i+1}/${monetizations.length}]:`, monetization);
                            break;
                    }
                } catch (e) {
                    if (debug) console.error(`[Debug] Error faking monetization [${i+1}/${monetizations.length}]:`, monetization, e);
                }
            }

            if (debug) console.log('[Debug] spoof Workink completed');
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
                    if (debug) console.log('[Debug] Captcha bypassed via TR');
                    triggerBypass('tr');
                }

                return sendMessageA ? sendMessageA.apply(this, args) : undefined;
            };
        }

        function createLinkInfoProxy() {
            return function(...args) {
                const info = args[0];
                linkInfoA = info;
                if (debug) console.log('[Debug] Link info:', info);
                spoofWorkink();
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
                return onLinkInfoA ? onLinkInfoA.apply(this, args): undefined;
            };
        }

        function redirect(url) {
            if (debug) console.log('[Debug] Redirecting to:', url);
            window.location.href = url;
        }

        function startCountdown(url, waitLeft) {
            if (debug) console.log('[Debug] startCountdown: Started with', waitLeft, 'seconds');
            if (panel) panel.show('bypassSuccess', 'warning');

            const interval = setInterval(() => {
                waitLeft -= 1;
                if (waitLeft > 0) {
                    if (debug) console.log('[Debug] startCountdown: Time remaining:', waitLeft);
                    if (panel) panel.show('bypassSuccess', 'warning');
                } else {
                    clearInterval(interval);
                    redirect(url);
                }
            }, 1000);
        }

        function createDestinationProxy() {
            return function(...args) {
                const data = args[0];
                const secondsPassed = (Date.now() - startTime) / 1000;
                destinationReceived = true;
                if (debug) console.log('[Debug] Destination data:', data.url);

                let waitTimeSeconds = 5;
                const url = location.href;
                if (url.includes('42rk6hcq') || url.includes('ito4wckq') || url.includes('pzarvhq1')) {
                    waitTimeSeconds = 38;
                }

                if (secondsPassed >= waitTimeSeconds) {
                    if (panel) {
                        // show simplified "Bypass successful" and reveal slider placed directly under status text
                        panel.show('bypassSuccess', 'success');
                        panel.showCaptchaComplete();
                        panel.setCallback((delay) => {
                            if (debug) console.log('[Debug] User selected delay:', delay);

                            if (delay === 0) {
                                if (debug) console.log('[Debug] Delay is 0, redirecting immediately');
                                panel.show('redirectingToWork', 'info');
                                redirect(data.url);
                            } else {
                                panel.startCountdown(delay);
                                setTimeout(() => {
                                    redirect(data.url);
                                }, (delay + 1) * 1000);
                            }
                        });
                    }
                } else {
                    const remainingWait = waitTimeSeconds - secondsPassed;
                    if (panel) {
                        panel.show('Bypass successful', `Waiting ${Math.ceil(remainingWait)}s...`);
                    }
                    setTimeout(() => {
                        if (panel) {
                            panel.show('bypassSuccess', 'success');
                            panel.showCaptchaComplete();
                            panel.setCallback((delay) => {
                                if (debug) console.log('[Debug] User selected delay:', delay);

                                if (delay === 0) {
                                    if (debug) console.log('[Debug] Delay is 0, redirecting immediately');
                                    panel.show('redirectingToWork', 'info');
                                    redirect(data.url);
                                } else {
                                    panel.startCountdown(delay);
                                    setTimeout(() => {
                                        redirect(data.url);
                                    }, (delay + 1) * 1000);
                                }
                            });
                        }
                    }, remainingWait * 1000);
                }
                return onLinkDestinationA ? onLinkDestinationA.apply(this, args): undefined;
            };
        }

        function setupProxies() {
            const send = resolveWriteFunction(sessionControllerA);
            const info = resolveName(sessionControllerA, map.onLI);
            const dest = resolveName(sessionControllerA, map.onLD);

            sendMessageA = send.fn;
            onLinkInfoA = info.fn;
            onLinkDestinationA = dest.fn;

            const sendMessageProxy = createSendMessageProxy();
            const onLinkInfoProxy = createLinkInfoProxy();
            const onDestinationProxy = createDestinationProxy();

            Object.defineProperty(sessionControllerA, send.name, {
                get() { return sendMessageProxy },
                set(v) { sendMessageA = v },
                configurable: false,
                enumerable: true
            });

            Object.defineProperty(sessionControllerA, info.name, {
                get() { return onLinkInfoProxy },
                set(v) { onLinkInfoA = v },
                configurable: false,
                enumerable: true
            });

            Object.defineProperty(sessionControllerA, dest.name, {
                get() { return onDestinationProxy },
                set(v) { onLinkDestinationA = v },
                configurable: false,
                enumerable: true
            });

            if (debug) console.log(`[Debug] setupProxies: installed ${send.name}, ${info.name}, ${dest.name}`);
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
                        instance.$$.ctx = new Proxy(instance.$$.ctx, { set: checkController });
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
                        });
                    });
                }
                return await result;
            };
        }

        window.googletag = {cmd: [], _loaded_: true};

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

        const ob = new MutationObserver(mutations => {
            for (const m of mutations) {
                for (const node of m.addedNodes) {
                    if (node.nodeType === 1) {
                        blockedClasses.forEach((cls) => {
                            if (node.classList?.contains(cls)) {
                                node.remove();
                                if (debug) console.log('[Debug]: Removed ad by class:', cls, node);
                            }
                            node.querySelectorAll?.(`.${cls}`).forEach((el) => {
                                el.remove();
                                if (debug) console.log('[Debug]: Removed nested ad by class:', cls, el);
                            });
                        });

                        blockedIds.forEach((id) => {
                            if (node.id === id) {
                                node.remove();
                                if (debug) console.log('[Debug]: Removed ad by id:', id, node);
                            }
                            node.querySelectorAll?.(`#${id}`).forEach((el) => {
                                el.remove();
                                if (debug) console.log('[Debug]: Removed nested ad by id:', id, el);
                            });
                        });

                        if (node.matches('.button.large.accessBtn.pos-relative') && node.textContent.includes('Go To Destination')) {
                            if (debug) console.log('[Debug] GTD button detected');

                            if (!bypassTriggered && !socialCheckInProgress) {
                                if (debug) console.log('[Debug] GTD: Checking socials...');

                                let gtdRetryCount = 0;

                                function checkAndTriggerGTD() {
                                    const ctrl = sessionControllerA;
                                    const dest = resolveName(ctrl, map.onLD);

                                    if (ctrl && linkInfoA && dest.fn) {
                                        // Check socials before triggering bypass
                                        if (panel) panel.show('captchaSuccess', 'success');
                                        checkAndHandleSocials();
                                        if (debug) console.log('[Debug] GTD: Social check initiated after', gtdRetryCount, 'seconds');
                                    } else {
                                        gtdRetryCount++;
                                        if (debug) console.log(`[Debug] GTD retry ${gtdRetryCount}s: Still waiting for linkInfo...`);
                                        if (panel) panel.show('pleaseReload', 'info');
                                        setTimeout(checkAndTriggerGTD, 1000);
                                    }
                                }

                                checkAndTriggerGTD();

                            } else {
                                if (debug) console.log('[Debug] GTD ignored: bypass already triggered or social check in progress');
                            }
                        }
                    }
                }
            }
        });
        ob.observe(document.documentElement, { childList: true, subtree: true });
    }

})();
