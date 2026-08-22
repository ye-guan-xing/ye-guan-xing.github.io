/**
 * tracker.js —— 埋点引擎（纯本地 console 模拟，教学用）
 *
 * 模拟本项目三套系统的核心行为：
 *   ① LogTrack        神策 + 自研日志（双后端）
 *   ② $tracker        火山引擎 Rangers（仅 App 内生效）
 *   ③ $timeTrack      性能计时点
 *
 * 不接任何真实 SDK，所有事件打到右侧「埋点事件流」面板 + console。
 */

(function (global) {
  'use strict';

  // ── 全局配置（对应真实项目的 config / env 开关）──────────────
  const CONFIG = {
    env: 'qa',          // qa / prod
    debug: true,       // 神策 debug 日志
    sensorsLog: true,  // 神策开关
    customLog: true,   // 自研日志开关
    enableOutAPP: false, // 火山：浏览器外是否生效
    inApp: false,      // 是否在 App 内
  };

  const START_TIME = Date.now();
  const panel = global.TrackerPanel || (global.TrackerPanel = createPanel());

  // ── ① LogTrack：神策 + 得到日志 ──────────────────────────────
  const LogTrack = {
    _started: false,
    config(opts) { Object.assign(CONFIG, opts); return this; },
    init() {
      this._started = true;
      log(`[LogTrack.init] env=${CONFIG.env} 神策=${CONFIG.sensorsLog} 自研=${CONFIG.customLog} debug=${CONFIG.debug}`);
      return this;
    },
    /**
     * @param {Object} obj       埋点参数
     * @param {String} eventType page / show / click / autoTrack
     */
    track(obj, eventType = 'page') {
      if (!this._started) this.init();
      const payload = { event_type: eventType, ...obj };
      // autoTrack 走神策全埋点，事件名固定
      if (eventType === 'autoTrack') payload.ev = 'sndd_sensor_autoTrack';
      if (CONFIG.sensorsLog) panel.push('神策Sensors', eventType, payload);
      if (CONFIG.customLog) panel.push('自研日志', eventType, payload);
      return this;
    },
  };

  // ── ② $tracker：火山 Rangers，仅 App 内生效 ──────────────────
  const ranger = {
    _enabled: false,
    init() {
      this._enabled = CONFIG.inApp || CONFIG.enableOutAPP;
      log(`[$tracker.init] 火山 Rangers ${this._enabled ? '已加载(App内)' : '未加载(非App,静默)'}`);
      return this;
    },
    logTrack(eventName, params) {
      if (!this._enabled) {
        panel.push('火山Rangers(静默)', eventName, { ...params, _note: '非App环境不报' });
        return;
      }
      params = params || {};
      if (!params.url) params.url = location.href; // 火山自动补 url
      panel.push('火山Rangers', eventName, params);
    },
  };
  // 暴露成和真实项目一致的函数式调用：this.$tracker(name, params)
  global.$tracker = function (eventName, params) { ranger.logTrack(eventName, params); };

  // ── ③ $timeTrack：性能计时 ────────────────────────────────────
  global.$timeTrack = function (label) {
    const elapsed = Date.now() - START_TIME;
    panel.push('性能计时', label, { elapsed_ms: elapsed });
  };

  // ── 停留时长心跳（写法 G 的可复用实现）────────────────────────
  /**
   * @param {Function} getPayload 返回每次 flush 要带的扩展字段
   * @returns {{start,stop,flush}} 控制句柄
   */
  function createStayTracker(getPayload) {
    let duration = 0;
    let visibleStart = 0;
    let timer = null;

    function resume() { if (!visibleStart && !document.hidden) visibleStart = Date.now(); }
    function pause() { if (visibleStart) { duration += Date.now() - visibleStart; visibleStart = 0; } }
    function flush() {
      pause();
      if (duration > 0) {
        // 双系统并行上报（写法 C）
        global.$tracker('sndd_hs_page', { duration_ms: duration, ...(getPayload ? getPayload() : {}) });
        LogTrack.track({
          page_name: 'demo页', page_type: 2, url: location.href,
          key1: JSON.stringify({ duration, ...(getPayload ? getPayload() : {}) }),
        }, 'page');
        duration = 0;
      }
      resume();
    }
    function heartbeat() {
      stopTimer();
      if (document.hidden) return;
      timer = setTimeout(() => { timer = null; flush(); heartbeat(); }, 3000);
    }
    function stopTimer() { if (timer) { clearTimeout(timer); timer = null; } }
    function onVisibility() {
      if (document.hidden) { stopTimer(); flush(); }
      else { resume(); heartbeat(); }
    }
    return {
      start() {
        resume(); heartbeat();
        document.addEventListener('visibilitychange', onVisibility);
        window.addEventListener('beforeunload', flush);
      },
      stop() {
        stopTimer(); flush();
        document.removeEventListener('visibilitychange', onVisibility);
        window.removeEventListener('beforeunload', flush);
      },
      flush,
    };
  }

  // ── 事件流面板（把"上报"可视化）──────────────────────────────
  function createPanel() {
    let mount;
    const COLORS = {
      '神策Sensors': '#4a90d9',
      '自研日志': '#5cb85c',
      '火山Rangers': '#d9774a',
      '火山Rangers(静默)': '#888',
      '性能计时': '#9a7acc',
    };
    function ensureMount() {
      if (mount) return mount;
      mount = document.getElementById('tracker-stream');
      return mount;
    }
    return {
      push(backend, type, payload) {
        const el = ensureMount();
        if (!el) { console.log(`[${backend}] ${type}`, payload); return; }
        const row = document.createElement('div');
        row.className = 'tr-row';
        const tag = document.createElement('span');
        tag.className = 'tr-tag';
        tag.style.color = COLORS[backend] || '#ccc';
        tag.textContent = backend;
        const t = document.createElement('span');
        t.className = 'tr-type'; t.textContent = type;
        const p = document.createElement('pre');
        p.className = 'tr-payload';
        p.textContent = JSON.stringify(payload, null, 0);
        row.appendChild(tag); row.appendChild(t); row.appendChild(p);
        el.prepend(row);
        while (el.children.length > 50) el.removeChild(el.lastChild);
        console.log(`%c[${backend}]%c ${type}`, `color:${COLORS[backend]||'#ccc'};font-weight:bold`, 'color:#aaa', payload);
      },
      clear() {
        const el = ensureMount();
        if (el) el.innerHTML = '';
      },
    };
  }

  // ── 工具 ─────────────────────────────────────────────────────
  function log(msg) { console.log('%c[tracker]', 'color:#4a90d9;font-weight:bold', msg); }

  // 暴露
  global.LogTrack = LogTrack;
  global.TrackerConfig = {
    get: () => ({ ...CONFIG }),
    set: (patch) => { Object.assign(CONFIG, patch); ranger.init(); return global.TrackerConfig.get(); },
  };
  global.createStayTracker = createStayTracker;
})(window);
