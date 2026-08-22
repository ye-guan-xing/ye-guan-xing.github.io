/**
 * app.js —— 业务演示页（用最小代码演示七种写法里的 A / B / C / F / G）
 * 依赖 tracker.js 暴露的：LogTrack / $tracker / $timeTrack / TrackerConfig / createStayTracker
 */
(function () {
  'use strict';

  // 初始化埋点引擎（对应 main.js + commonImports.js）
  TrackerConfig.set({ env: 'qa' });
  LogTrack.init();
  $timeTrack('appCreated');

  // ── 数据 ────────────────────────────────────────────────────
  const COURSES = [
    { id: 'c1', title: '第一讲：什么是埋点', free: true },
    { id: 'c2', title: '第二讲：事件与参数', free: false },
    { id: 'c3', title: '第三讲：停留时长心跳', free: false },
  ];

  // ── 写法 B：组件内封装一层 track（公共字段写死，只传变化部分）──
  const PAGE = { page_name: 'demo列表页', page_type: 2, page_title: 'demo列表页' };
  function track(extra, eventType) {
    eventType = eventType || 'click';
    LogTrack.track({
      ...PAGE,
      url: location.href,
      main_item_id: extra.main_item_id || '',
      module_name: (extra.other || {}).module_name || '',
      item_name: (extra.other || {}).item_name || '',
      btn_name: (extra.other || {}).btn_name || '-',
      key1: JSON.stringify({ user_status: 'normal', ...(extra.key1Data || {}) }),
    }, eventType);
  }

  // ── 停留时长心跳（写法 G）────────────────────────────────────
  let stay = null;

  // ── 路由（写法 F：autoTrack 自动 page 曝光）──────────────────
  function route() {
    const hash = location.hash.replace(/^#/, '') || '/list';
    render(hash);
    // autoTrack：路由切换自动发 page（对应 App.vue）
    LogTrack.track({}, 'autoTrack');
  }

  function render(hash) {
    const app = document.getElementById('app');
    if (stay) { stay.stop(); stay = null; }
    if (hash === '/detail') return renderDetail(app);
    return renderList(app);
  }

  // ── 列表页 ──────────────────────────────────────────────────
  function renderList(app) {
    app.innerHTML = `
      <div class="page">
        <div class="nav"><button class="back">‹ 返回</button><span>demo 列表页</span></div>
        <div class="hint">点下面任意元素，看右侧「埋点事件流」。停留 3 秒会触发心跳。</div>
        <ul class="list"></ul>
        <button class="dual">双发演示（C：$tracker + LogTrack 同时报）</button>
      </div>`;

    // 写法 A：列表批量曝光 show
    track({ other: { module_name: '课程列表', item_name: '列表曝光', btn_name: '-' },
      key1Data: { list_count: COURSES.length, list_data: COURSES.map(c => ({ id: c.id, title: c.title })) }
    }, 'show');

    const ul = app.querySelector('.list');
    COURSES.forEach(c => {
      const li = document.createElement('li');
      li.className = 'item';
      li.innerHTML = `<span class="t">${c.title}</span><span class="badge">${c.free ? '免费' : '会员'}</span>`;
      // 写法 A：点击直接调（这里走封装 track 演示 B，本质都是 LogTrack.track）
      li.addEventListener('click', () => {
        track({
          main_item_id: c.id,
          other: { module_name: '课程列表', item_name: '课程项', btn_name: c.title },
          key1Data: { chapter_id: c.id, is_free: c.free, jump_url: `#/detail?id=${c.id}` },
        }, 'click');
        location.hash = '/detail?id=' + c.id;
      });
      ul.appendChild(li);
    });

    // 返回按钮（写法 B 封装）
    app.querySelector('.back').addEventListener('click', () => {
      track({ other: { module_name: '导航栏', item_name: '返回按钮', btn_name: '返回' } });
      history.length > 1 ? history.back() : (location.hash = '/list');
    });

    // 写法 C：双系统并行
    app.querySelector('.dual').addEventListener('click', () => {
      const payload = { module_name: '双发演示', btn_name: '立即订阅', price: 99 };
      $tracker('sndd_hs_click', { page_name: 'demo列表页', ...payload });           // ② 火山
      track({ other: payload, key1Data: { price: 99 } }, 'click');                   // ① 神策+得到
    });

    // 启动停留心跳
    stay = createStayTracker(() => ({ page_id: 'list', current_tab: 'knowledge' }));
    stay.start();
  }

  // ── 详情页 ──────────────────────────────────────────────────
  function renderDetail(app) {
    const id = (location.hash.match(/id=([^&]+)/) || [])[1] || 'c1';
    const c = COURSES.find(x => x.id === id) || COURSES[0];
    app.innerHTML = `
      <div class="page">
        <div class="nav"><button class="back">‹ 返回列表</button><span>课程详情</span></div>
        <h2>${c.title}</h2>
        <p class="hint">这是 ${c.title} 的详情内容。停留 3 秒触发心跳，切回列表时 flush 上报时长。</p>
      </div>`;
    track({ main_item_id: c.id, other: { module_name: '页面', item_name: '-', btn_name: '-' },
      key1Data: { chapter_id: c.id } }, 'page');
    app.querySelector('.back').addEventListener('click', () => { location.hash = '/list'; });
    stay = createStayTracker(() => ({ page_id: c.id }));
    stay.start();
  }

  // ── 环境开关（顶部工具栏）────────────────────────────────────
  document.getElementById('cfg-inapp').addEventListener('change', e => {
    TrackerConfig.set({ inApp: e.target.checked });
    document.getElementById('cfg-inapp-state').textContent = e.target.checked ? 'App内(火山生效)' : '浏览器(火山静默)';
  });
  document.getElementById('cfg-sensors').addEventListener('change', e => TrackerConfig.set({ sensorsLog: e.target.checked }));
  document.getElementById('cfg-custom').addEventListener('change', e => TrackerConfig.set({ customLog: e.target.checked }));
  document.getElementById('clear').addEventListener('click', () => TrackerPanel.clear());

  // ── 启动 ────────────────────────────────────────────────────
  window.addEventListener('hashchange', route);
  window.addEventListener('load', () => { route(); $timeTrack('appMounted'); });
})();
