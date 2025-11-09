(() => {
    'use strict';

    const host = location.hostname;
    const debug = true;

    // ---------- translations used by the GUI ----------
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
            version: "Phiên bản v1.9.0.0",
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
            version: "Version v1.9.0.0",
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

    // selectedDelay: global variable used by GUI and callback
    let selectedDelay = parseInt(localStorage.getItem(STORAGE_KEY_DELAY) || '0');
    let autoRedirectEnabled = localStorage.getItem(STORAGE_KEY_AUTO) === 'true';
    let redirectInProgress = false; // Global redirect flag

    // ---------- GUI: BypassPanel ----------
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
            this.autoToggle = null;
            this.onStartCallback = null;
            this.redirectInProgress = false; // Instance redirect flag

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
            // use closed shadow root so page scripts can't easily tamper with UI elements
            this.shadow = this.container.attachShadow({
                mode: 'closed'
            });

            const style = document.createElement('style');
            style.textContent = `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap');

* { margin:0; padding:0; box-sizing:border-box; }

@keyframes fadeInScale {
    from { opacity:0; transform:scale(0.9) translateY(20px); }
    to { opacity:1; transform:scale(1) translateY(0); }
}

@keyframes neonPulse {
    0%, 100% {
        box-shadow: 0 0 5px rgba(139, 92, 246, 0.4),
                    0 0 10px rgba(139, 92, 246, 0.3),
                    0 0 20px rgba(139, 92, 246, 0.2),
                    inset 0 0 10px rgba(139, 92, 246, 0.1);
    }
    50% {
        box-shadow: 0 0 10px rgba(139, 92, 246, 0.6),
                    0 0 20px rgba(139, 92, 246, 0.4),
                    0 0 30px rgba(139, 92, 246, 0.3),
                    inset 0 0 15px rgba(139, 92, 246, 0.15);
    }
}

@keyframes statusGlow {
    0%, 100% {
        box-shadow: 0 0 10px currentColor, 0 0 20px currentColor, 0 0 30px currentColor;
    }
    50% {
        box-shadow: 0 0 15px currentColor, 0 0 30px currentColor, 0 0 45px currentColor;
    }
}

@keyframes slideDown {
    from { opacity: 0; max-height: 0; transform: translateY(-10px); }
    to { opacity: 1; max-height: 500px; transform: translateY(0); }
}

.panel-container {
    position: fixed;
    top: 24px;
    right: 24px;
    width: 400px;
    z-index: 2147483647;
    font-family: 'Space Grotesk', -apple-system, BlinkMacSystemFont, sans-serif;
    animation: fadeInScale 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}

.panel {
    background: #0d0d0d;
    border-radius: 24px;
    overflow: hidden;
    border: 1px solid rgba(139, 92, 246, 0.15);
    box-shadow: 0 24px 48px rgba(0, 0, 0, 0.9),
                0 0 0 1px rgba(139, 92, 246, 0.1);
    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.panel:hover {
    border-color: rgba(139, 92, 246, 0.25);
    transform: translateY(-2px);
}

.header {
    background: linear-gradient(135deg, #0d0d0d 0%, #151515 100%);
    padding: 24px;
    position: relative;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid rgba(139, 92, 246, 0.1);
}

.title {
    font-size: 16px;
    font-weight: 700;
    color: #8b5cf6;
    letter-spacing: 2px;
    text-transform: uppercase;
    z-index: 1;
}

.minimize-btn {
    background: transparent;
    border: 1px solid rgba(139, 92, 246, 0.3);
    color: #8b5cf6;
    width: 32px;
    height: 32px;
    border-radius: 8px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    font-size: 18px;
    font-weight: 700;
    z-index: 1;
}

.minimize-btn:hover {
    background: rgba(139, 92, 246, 0.1);
    border-color: #8b5cf6;
    transform: rotate(180deg);
}

.minimize-btn:active {
    transform: scale(0.9) rotate(180deg);
}

.status-section {
    padding: 24px;
    position: relative;
    background: #0d0d0d;
}

.status-box {
    background: #151515;
    border: 1px solid rgba(139, 92, 246, 0.2);
    border-radius: 16px;
    padding: 18px;
    position: relative;
    overflow: hidden;
    transition: all 0.3s ease;
}

.status-box:hover {
    border-color: rgba(139, 92, 246, 0.35);
    background: #181818;
}

.status-content {
    display: flex;
    align-items: center;
    gap: 14px;
    position: relative;
    z-index: 1;
}

.status-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    animation: statusGlow 2s ease-in-out infinite;
    flex-shrink: 0;
    position: relative;
}

.status-dot::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 18px;
    height: 18px;
    border-radius: 50%;
    border: 1px solid currentColor;
    opacity: 0.3;
}

.status-dot.info { background: #3b82f6; color: #3b82f6; }
.status-dot.success { background: #10b981; color: #10b981; }
.status-dot.warning { background: #f59e0b; color: #f59e0b; }
.status-dot.error { background: #ef4444; color: #ef4444; }

.status-text {
    color: #d1d5db;
    font-size: 13px;
    font-weight: 500;
    flex: 1;
    line-height: 1.6;
    letter-spacing: 0.3px;
}

.panel-body {
    max-height: 600px;
    overflow: hidden;
    transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    opacity: 1;
}

.panel-body.hidden {
    max-height: 0;
    opacity: 0;
}

.language-section {
    padding: 24px;
    background: #0d0d0d;
    border-bottom: 1px solid rgba(139, 92, 246, 0.1);
}

.lang-toggle {
    display: flex;
    gap: 10px;
    background: #151515;
    padding: 4px;
    border-radius: 12px;
    border: 1px solid rgba(139, 92, 246, 0.1);
}

.lang-btn {
    flex: 1;
    background: transparent;
    border: none;
    color: #6b7280;
    padding: 10px;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 600;
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 1px;
    transition: all 0.2s ease;
}

.lang-btn:hover {
    color: #9ca3af;
    background: rgba(139, 92, 246, 0.05);
}

.lang-btn.active {
    background: #8b5cf6;
    color: #000;
    box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4);
}

.info-section {
    padding: 24px;
    background: #0d0d0d;
    text-align: center;
}

.version, .credit {
    color: #6b7280;
    font-size: 11px;
    font-weight: 500;
    margin-bottom: 8px;
    letter-spacing: 0.5px;
    text-transform: uppercase;
}

.links {
    display: flex;
    justify-content: center;
    gap: 16px;
    font-size: 11px;
    margin-top: 12px;
}

.links a {
    color: #8b5cf6;
    text-decoration: none;
    transition: all 0.2s ease;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 1px;
    padding: 6px 12px;
    border-radius: 6px;
    border: 1px solid rgba(139, 92, 246, 0.2);
}

.links a:hover {
    background: rgba(139, 92, 246, 0.1);
    border-color: #8b5cf6;
}

.slider-container {
    display: none;
    padding: 0;
    animation: slideDown 0.3s ease;
    margin-top: 16px;
}

.slider-container.active {
    display: block;
}

.slider-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin: 0 24px 10px 24px;
}

.slider-label {
    color: #9ca3af;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 1px;
    text-transform: uppercase;
}

.slider-value {
    color: #8b5cf6;
    font-size: 13px;
    font-weight: 700;
    background: rgba(139, 92, 246, 0.1);
    padding: 4px 10px;
    border-radius: 6px;
    border: 1px solid rgba(139, 92, 246, 0.2);
    min-width: 45px;
    text-align: center;
}

.slider-track {
    margin: 0 24px 16px 24px;
}

.slider {
    width: 100%;
    height: 4px;
    border-radius: 2px;
    background: #1f1f1f;
    outline: none;
    -webkit-appearance: none;
    cursor: pointer;
    transition: all 0.2s ease;
}

.slider:hover {
    background: #252525;
}

.slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #8b5cf6;
    cursor: pointer;
    transition: all 0.2s ease;
    box-shadow: 0 0 0 4px rgba(139, 92, 246, 0.2);
}

.slider::-webkit-slider-thumb:hover {
    transform: scale(1.2);
    box-shadow: 0 0 0 6px rgba(139, 92, 246, 0.3);
}

.slider::-webkit-slider-thumb:active {
    transform: scale(1.1);
}

.slider::-moz-range-thumb {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #8b5cf6;
    cursor: pointer;
    border: none;
    transition: all 0.2s ease;
    box-shadow: 0 0 0 4px rgba(139, 92, 246, 0.2);
}

.auto-redirect-container {
    margin: 0 24px 16px 24px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 16px;
    background: #151515;
    border: 1px solid rgba(139, 92, 246, 0.2);
    border-radius: 12px;
    transition: all 0.2s ease;
}

.auto-redirect-container:hover {
    background: #181818;
    border-color: rgba(139, 92, 246, 0.35);
}

.toggle-label {
    color: #d1d5db;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.5px;
    text-transform: uppercase;
}

.toggle-switch {
    position: relative;
    display: inline-block;
    width: 52px;
    height: 28px;
}

.toggle-switch input {
    opacity: 0;
    width: 0;
    height: 0;
}

.toggle-slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: #1f1f1f;
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    border-radius: 28px;
    border: 1px solid rgba(139, 92, 246, 0.2);
}

.toggle-slider:before {
    position: absolute;
    content: "";
    height: 20px;
    width: 20px;
    left: 4px;
    bottom: 3px;
    background: linear-gradient(135deg, #4b5563, #6b7280);
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    border-radius: 50%;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

input:checked + .toggle-slider {
    background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%);
    border-color: #8b5cf6;
    animation: neonPulse 2s ease-in-out infinite;
}

input:checked + .toggle-slider:before {
    transform: translateX(24px);
    background: linear-gradient(135deg, #fff, #f3f4f6);
    box-shadow: 0 4px 12px rgba(139, 92, 246, 0.5);
}

.toggle-slider:hover {
    border-color: rgba(139, 92, 246, 0.4);
}

.start-btn {
    width: calc(100% - 48px);
    margin: 0 24px 20px 24px;
    background: #8b5cf6;
    color: #000;
    border: none;
    padding: 14px;
    border-radius: 12px;
    font-weight: 700;
    font-size: 14px;
    letter-spacing: 0.5px;
    text-transform: uppercase;
    cursor: pointer;
    transition: all 0.2s ease;
    box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4);
    position: relative;
    overflow: hidden;
}

.start-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(139, 92, 246, 0.6);
    background: #9d6ff7;
}

.start-btn:active {
    transform: translateY(0);
    box-shadow: 0 2px 8px rgba(139, 92, 246, 0.4);
}

.start-btn.hidden {
    display: none;
}

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

            // read persisted delay for UI initialization
            const lastDelay = parseInt(localStorage.getItem(STORAGE_KEY_DELAY) || '0');
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

            // elements
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

            // attach container to document
            document.documentElement.appendChild(this.container);

            // Ensure selectedDelay is in sync with UI immediately
            try {
                selectedDelay = parseInt(localStorage.getItem(STORAGE_KEY_DELAY) || '0');
                this.slider.value = String(selectedDelay);
                this.sliderValue.textContent = `${selectedDelay}s`;
            } catch (e) {
                if (debug) console.warn('Failed to initialize slider from storage', e);
            }
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

            // auto-redirect toggle
            this.autoToggle.addEventListener('change', (e) => {
                autoRedirectEnabled = e.target.checked;
                try {
                    localStorage.setItem(STORAGE_KEY_AUTO, String(autoRedirectEnabled));
                } catch (err) {
                    if (debug) console.warn('Could not save auto-redirect to localStorage', err);
                }

                // Show/hide start button based on auto-redirect state
                if (autoRedirectEnabled) {
                    this.startBtn.classList.add('hidden');
                } else {
                    this.startBtn.classList.remove('hidden');
                }

                if (debug) console.log('[Debug] Auto-redirect:', autoRedirectEnabled);
            });

            // slider change updates selectedDelay and persists immediately
            this.slider.addEventListener('input', (e) => {
                selectedDelay = parseInt(e.target.value);
                this.sliderValue.textContent = `${selectedDelay}s`;
                try {
                    localStorage.setItem(STORAGE_KEY_DELAY, String(selectedDelay));
                } catch (err) {
                    if (debug) console.warn('Could not save delay to localStorage', err);
                }
            });

            // start button triggers the callback with current selectedDelay
            this.startBtn.addEventListener('click', () => {
                if (this.redirectInProgress) {
                    if (debug) console.log('[Debug] Start button: redirect already in progress');
                    return;
                }

                if (this.onStartCallback) {
                    this.redirectInProgress = true;
                    redirectInProgress = true;
                    try {
                        this.onStartCallback(selectedDelay);
                    } catch (err) {
                        if (debug) console.error('[Debug] onStartCallback error', err);
                        this.redirectInProgress = false;
                        redirectInProgress = false;
                    }
                }
            });
        }

        updateLanguage() {
            try {
                localStorage.setItem(STORAGE_KEY_LANG, currentLanguage);
            } catch (e) {}
            this.langBtns.forEach(btn => {
                btn.classList.toggle('active', btn.dataset.lang === currentLanguage);
            });
            const titleEl = this.shadow.querySelector('.title');
            if (titleEl) titleEl.textContent = 'BYPASS SYSTEM';
            if (this.versionEl) this.versionEl.textContent = t('version');
            if (this.creditEl) this.creditEl.textContent = t('madeBy');

            // Update toggle label
            const toggleLabel = this.shadow.querySelector('.toggle-label');
            if (toggleLabel) toggleLabel.textContent = t('autoRedirect');

            if (this.currentMessageKey) {
                this.show(this.currentMessageKey, this.currentType, this.currentReplacements);
            }
        }

        show(messageKeyOrTitle, typeOrSubtitle = 'info', replacements = {}) {
            this.currentMessageKey = messageKeyOrTitle;
            this.currentType = (typeof typeOrSubtitle === 'string' && ['info', 'success', 'warning', 'error'].includes(typeOrSubtitle)) ? typeOrSubtitle : 'info';
            this.currentReplacements = replacements;
            let message = '';
            if (translations[currentLanguage] && translations[currentLanguage][messageKeyOrTitle]) {
                message = t(messageKeyOrTitle, replacements);
                if (typeof typeOrSubtitle === 'string' && !['info', 'success', 'warning', 'error'].includes(typeOrSubtitle) && typeOrSubtitle.length > 0) {
                    message = typeOrSubtitle;
                }
            } else {
                message = (typeof typeOrSubtitle === 'string' && ['info', 'success', 'warning', 'error'].includes(typeOrSubtitle)) ? messageKeyOrTitle : (typeOrSubtitle || messageKeyOrTitle);
            }
            this.statusText.textContent = message;
            this.statusDot.className = `status-dot ${this.currentType}`;
        }

        showBypassingWorkink() {
            this.show('captchaSuccessBypassing', 'success');
        }

        // Called when a destination is ready and we want to show the slider / allow the user to start redirect
        showCaptchaComplete() {
            // Prevent multiple calls
            if (this.redirectInProgress || redirectInProgress) {
                if (debug) console.log('[Debug] showCaptchaComplete: redirect already in progress, ignoring');
                return;
            }

            this.sliderContainer.classList.add('active');
            this.sliderContainer.style.display = 'block';
            this.show('bypassSuccess', 'success');
            this.sliderValue.textContent = `${selectedDelay}s`;
            try {
                this.slider.value = String(selectedDelay);
            } catch (e) {}

            if (debug) console.log('[Debug] Slider container shown, autoRedirectEnabled:', autoRedirectEnabled);

            // If auto-redirect is enabled, automatically trigger the callback after showing UI
            if (autoRedirectEnabled) {
                if (debug) console.log('[Debug] Auto-redirect is enabled, starting auto countdown with delay:', selectedDelay);

                // Mark redirect as in progress BEFORE calling callback
                this.redirectInProgress = true;
                redirectInProgress = true;

                // Use a longer delay to ensure UI is fully rendered
                setTimeout(() => {
                    if (this.onStartCallback) {
                        if (debug) console.log('[Debug] Calling onStartCallback with delay:', selectedDelay);
                        try {
                            this.onStartCallback(selectedDelay);
                        } catch (err) {
                            if (debug) console.error('[Debug] Auto-redirect callback error', err);
                            this.redirectInProgress = false;
                            redirectInProgress = false;
                        }
                    } else {
                        if (debug) console.warn('[Debug] onStartCallback is not set!');
                        this.redirectInProgress = false;
                        redirectInProgress = false;
                    }
                }, 500);
            } else {
                if (debug) console.log('[Debug] Auto-redirect is disabled, waiting for manual start');
            }
        }

        // allow external code to set the Start button action
        setCallback(callback) {
            this.onStartCallback = callback;
        }

        // start a countdown that replaces the status text with a single "Redirecting in Xs..." message
        startCountdown(seconds) {
            if (debug) console.log('[Debug] startCountdown called with seconds:', seconds);

            // Hide only the slider elements, keep auto-redirect toggle visible
            const sliderHeader = this.shadow.querySelector('.slider-header');
            const sliderTrack = this.shadow.querySelector('.slider-track');
            if (sliderHeader) sliderHeader.style.display = 'none';
            if (sliderTrack) sliderTrack.style.display = 'none';
            if (this.startBtn) this.startBtn.style.display = 'none';

            if (debug) console.log('[Debug] Slider elements hidden, auto-toggle remains visible');

            try {
                if (this.startBtn) this.startBtn.disabled = true;
            } catch (e) {}

            let remaining = Math.max(0, parseInt(seconds) || 0);

            // Directly set the text without calling show() to avoid conflicts
            this.statusText.textContent = `Redirecting in ${remaining}s...`;
            this.statusDot.className = 'status-dot info';

            const interval = setInterval(() => {
                remaining--;
                if (remaining > 0) {
                    this.statusText.textContent = `Redirecting in ${remaining}s...`;
                } else {
                    clearInterval(interval);
                    this.statusText.textContent = `Redirecting...`;
                }
            }, 1000);

            return {
                stop: () => clearInterval(interval)
            };
        }
    }

    // ---------- instantiate GUI ----------
    let panel = null;
    setTimeout(() => {
        try {
            panel = new BypassPanel();
            panel.show('pleaseSolveCaptcha', 'info');
        } catch (e) {
            if (debug) console.error('Panel create failed', e);
        }
    }, 100);

    // ---------- Bypass logic ----------
    if (host.includes("key.volcano.wtf")) handleVolcano();
    else if (host.includes("work.ink")) handleWorkInk();

    // --- VOLCANO (kept mostly unchanged) ---
    function handleVolcano() {
        if (panel) panel.show('pleaseSolveCaptcha', 'info');
        if (debug) console.log('[Debug] Waiting Captcha (Volcano)');

        let alreadyDoneContinue = false;
        let alreadyDoneCopy = false;

        function actOnCheckpoint(node) {
            if (!alreadyDoneContinue) {
                const buttons = node && node.nodeType === 1 ?
                    node.matches('#primaryButton[type="submit"], button[type="submit"], a, input[type=button], input[type=submit]') ? [node] :
                    node.querySelectorAll('#primaryButton[type="submit"], button[type="submit"], a, input[type=button], input[type=submit]') :
                    document.querySelectorAll('#primaryButton[type="submit"], button[type="submit"], a, input[type=button], input[type=submit]');
                for (const btn of buttons) {
                    const text = (btn.innerText || btn.value || "").trim().toLowerCase();
                    if (text.includes("continue") || text.includes("next step")) {
                        const disabled = btn.disabled || btn.getAttribute("aria-disabled") === "true";
                        const style = getComputedStyle(btn);
                        const visible = style.display !== "none" && style.visibility !== "hidden" && btn.offsetParent !== null;
                        if (visible && !disabled) {
                            alreadyDoneContinue = true;
                            if (panel) panel.show('captchaSuccess', 'success');
                            if (debug) console.log('[Debug] Captcha Solved (Volcano)');

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

            const copyBtn = node && node.nodeType === 1 ?
                node.matches("#copy-key-btn, .copy-btn, [aria-label='Copy']") ?
                node :
                node.querySelector("#copy-key-btn, .copy-btn, [aria-label='Copy']") :
                document.querySelector("#copy-key-btn, .copy-btn, [aria-label='Copy']");
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

        mo.observe(document.documentElement, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['disabled', 'aria-disabled', 'style']
        });

        if (actOnCheckpoint()) {
            if (alreadyDoneCopy) {
                mo.disconnect();
            }
        }
    }

    // --- WORK.INK (modified to detect GTD button clickability) ---
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
        let captchaSolved = false;

        const map = {
            onLI: ["onLinkInfo"],
            onLD: ["onLinkDestination"]
        };

        function resolveName(obj, candidates) {
            if (!obj || typeof obj !== "object") {
                return {
                    fn: null,
                    index: -1,
                    name: null
                };
            }
            for (let i = 0; i < candidates.length; i++) {
                const name = candidates[i];
                if (typeof obj[name] === "function") {
                    return {
                        fn: obj[name],
                        index: i,
                        name
                    };
                }
            }
            return {
                fn: null,
                index: -1,
                name: null
            };
        }

        function resolveWriteFunction(obj) {
            if (!obj || typeof obj !== "object") {
                return {
                    fn: null,
                    index: -1,
                    name: null
                };
            }
            for (let i in obj) {
                if (typeof obj[i] === "function" && obj[i].length === 2) {
                    return {
                        fn: obj[i],
                        name: i
                    };
                }
            }
            return {
                fn: null,
                index: -1,
                name: null
            };
        }

        const types = {
            mo: 'c_monetization',
            ss: 'c_social_started',
            tr: 'c_turnstile_response',
            ad: 'c_adblocker_detected',
            ping: 'c_ping'
        };

        const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

        // Function to check if GTD button is clickable
        function isGTDButtonClickable() {
            const gtdButton = document.querySelector('.button.large.accessBtn.pos-relative');
            if (!gtdButton) return false;

            const buttonText = gtdButton.textContent.trim();
            if (!buttonText.includes('Go To Destination')) return false;

            // Check if button is disabled
            const disabled = gtdButton.disabled ||
                           gtdButton.getAttribute('disabled') === 'true' ||
                           gtdButton.getAttribute('aria-disabled') === 'true';

            // Check if button is visible
            const style = getComputedStyle(gtdButton);
            const visible = style.display !== 'none' &&
                          style.visibility !== 'hidden' &&
                          gtdButton.offsetParent !== null;

            // Check if button has pointer-events enabled
            const clickable = style.pointerEvents !== 'none';

            const isClickable = !disabled && visible && clickable;

            if (debug && isClickable) {
                console.log('[Debug] GTD button is clickable!');
            }

            return isClickable;
        }

        // Interval to continuously check GTD button
        const gtdCheckInterval = setInterval(() => {
            if (captchaSolved || bypassTriggered) {
                if (debug) console.log('[Debug] Captcha already processed, stopping GTD check');
                clearInterval(gtdCheckInterval);
                return;
            }

            if (isGTDButtonClickable()) {
                if (debug) console.log('[Debug] GTD button detected as clickable - captcha solved!');
                captchaSolved = true;
                clearInterval(gtdCheckInterval);

                if (panel) panel.show('captchaSuccess', 'success');

                // Trigger bypass after detecting clickable button
                setTimeout(() => {
                    triggerBypass('gtd-button-clickable');
                }, 500);
            }
        }, 500); // Check every 500ms

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
