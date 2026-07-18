const util = require('../../utils/util');
const cloud = require('../../utils/cloud');
const app = getApp();

Page({
  data: {
    drawerVisible: false,
    currentBaby: null,
    babyAge: 0,
    records: [],
    radarData: null,
    activeFilter: ''
  },

  onShow() {
    this.loadBaby();
    this.loadRecords();
  },

  loadBaby() {
    const baby = app.globalData.currentBaby || wx.getStorageSync('currentBaby');
    if (baby) {
      this.setData({
        currentBaby: baby,
        babyAge: util.calcBabyAge(baby.birthday)
      });
    }
  },

  async loadRecords() {
    const baby = this.data.currentBaby;
    if (!baby?._id) return;
    try {
      const records = await cloud.getTestRecords(baby._id);
      const formatted = records.map(r => ({
        ...r,
        completedAtStr: util.formatDate(r.completedAt),
        dotColor: r.testType === 'attention' ? '#A8D8EA' : r.testType === 'attachment' ? '#FFD3B4' : '#C7CEEA'
      }));
      this.setData({ records: formatted });

      // 聚合最新各测试维度数据
      this.aggregateRadarData(formatted);
    } catch (e) {
      console.error('加载记录失败:', e);
    }
  },

  aggregateRadarData(records) {
    if (!records || records.length === 0) return;
    const latestByType = {};
    for (const r of records) {
      if (!latestByType[r.testType] || new Date(r.completedAt) > new Date(latestByType[r.testType].completedAt)) {
        if (r.dimensions) latestByType[r.testType] = r;
      }
    }

    const types = Object.keys(latestByType);
    if (types.length === 0) return;

    const radarData = { focus: 0, emotion: 0, social: 0, sensory: 0 };
    for (const t of types) {
      const dims = latestByType[t].dimensions;
      if (dims) {
        if (dims.focus) radarData.focus = Math.max(radarData.focus, dims.focus);
        if (dims.emotion) radarData.emotion = Math.max(radarData.emotion, dims.emotion);
        if (dims.social) radarData.social = Math.max(radarData.social, dims.social);
        if (dims.sensory) radarData.sensory = Math.max(radarData.sensory, dims.sensory);
      }
    }

    this.setData({ radarData });
    setTimeout(() => this.drawRadar(), 500);
  },

  drawRadar() {
    const query = wx.createSelectorQuery();
    query.select('#dashRadarCanvas')
      .fields({ node: true, size: true })
      .exec((res) => {
        if (!res[0] || !res[0].node) return;
        const canvas = res[0].node;
        const ctx = canvas.getContext('2d');
        const dpr = wx.getSystemInfoSync().pixelRatio;
        const width = res[0].width;
        const height = res[0].height;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);

        const dims = this.data.radarData;
        const labels = ['专注力', '情绪', '社交', '感知'];
        const values = [dims?.focus || 0, dims?.emotion || 0, dims?.social || 0, dims?.sensory || 0];
        const count = labels.length;
        const cx = width / 2;
        const cy = height / 2;
        const radius = Math.min(cx, cy) - 60;
        const levels = 5;

        ctx.clearRect(0, 0, width, height);

        // 绘制网格
        for (let i = 1; i <= levels; i++) {
          const r = (radius / levels) * i;
          ctx.beginPath();
          ctx.strokeStyle = '#E8ECF0';
          ctx.lineWidth = 1;
          for (let j = 0; j < count; j++) {
            const angle = (Math.PI * 2 / count) * j - Math.PI / 2;
            const x = cx + Math.cos(angle) * r;
            const y = cy + Math.sin(angle) * r;
            if (j === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.closePath();
          ctx.stroke();
        }

        for (let i = 0; i < count; i++) {
          const angle = (Math.PI * 2 / count) * i - Math.PI / 2;
          ctx.beginPath();
          ctx.strokeStyle = '#D8DEE5';
          ctx.lineWidth = 1;
          ctx.moveTo(cx, cy);
          ctx.lineTo(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius);
          ctx.stroke();

          const lx = cx + Math.cos(angle) * (radius + 40);
          const ly = cy + Math.sin(angle) * (radius + 40);
          const dimKeys = ['focus', 'emotion', 'social', 'sensory'];
          ctx.fillStyle = this.data.activeFilter === dimKeys[i] ? '#A8D8EA' : '#4A5B6E';
          ctx.font = '12px -apple-system, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(labels[i], lx, ly);
        }

        ctx.beginPath();
        for (let i = 0; i < count; i++) {
          const angle = (Math.PI * 2 / count) * i - Math.PI / 2;
          const val = values[i] / 100;
          const x = cx + Math.cos(angle) * radius * val;
          const y = cy + Math.sin(angle) * radius * val;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fillStyle = 'rgba(168, 216, 234, 0.2)';
        ctx.fill();
        ctx.strokeStyle = '#A8D8EA';
        ctx.lineWidth = 2;
        ctx.stroke();

        for (let i = 0; i < count; i++) {
          const angle = (Math.PI * 2 / count) * i - Math.PI / 2;
          const val = values[i] / 100;
          const x = cx + Math.cos(angle) * radius * val;
          const y = cy + Math.sin(angle) * radius * val;
          ctx.beginPath();
          ctx.arc(x, y, 5, 0, Math.PI * 2);
          ctx.fillStyle = '#A8D8EA';
          ctx.fill();
          ctx.beginPath();
          ctx.arc(x, y, 8, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(168, 216, 234, 0.15)';
          ctx.fill();
        }
      });
  },

  setFilter(e) {
    const key = e.currentTarget.dataset.key;
    this.setData({ activeFilter: key === this.data.activeFilter ? '' : key });
    setTimeout(() => this.drawRadar(), 100);
  },

  openDrawer() {
    this.setData({ drawerVisible: true });
  },

  closeDrawer() {
    this.setData({ drawerVisible: false });
  },

  onNavigate(e) {
    const { path } = e.detail;
    if (path === '/pages/dashboard/dashboard') return;
    wx.navigateTo({ url: path }).catch(() => wx.redirectTo({ url: path }));
  },

  goTests() {
    wx.navigateTo({ url: '/pages/tests/tests' });
  },

  goBabies() {
    wx.navigateTo({ url: '/pages/babies/babies' });
  }
});
