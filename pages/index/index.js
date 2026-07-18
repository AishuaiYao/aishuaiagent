const util = require('../../utils/util');
const cloud = require('../../utils/cloud');
const app = getApp();

Page({
  data: {
    drawerVisible: false,
    currentBaby: null,
    babyAge: 0,
    recentRecords: []
  },

  async onShow() {
    await this.loadBaby();
    this.loadRecords();
  },

  /** 加载当前宝宝信息（从真实数据源校验） */
  async loadBaby() {
    // 从云端或本地存储获取真实的宝宝列表，而非仅信任缓存
    let babies = [];
    const userInfo = app.globalData.userInfo;
    if (userInfo?._id) {
      try {
        babies = await cloud.getBabies(userInfo._id);
      } catch (e) {
        console.error('加载云端宝宝失败:', e);
      }
    } else {
      babies = wx.getStorageSync('localBabies') || [];
    }
    // 找到当前选中的宝宝（优先 isCurrent，其次第一个）
    const current = babies.find(b => b.isCurrent) || babies[0] || null;
    if (current) {
      const age = util.calcBabyAge(current.birthday);
      this.setData({ currentBaby: current, babyAge: age });
      app.setCurrentBaby(current);
    } else {
      this.setData({ currentBaby: null, babyAge: 0 });
      // 清除可能过期的缓存
      wx.removeStorageSync('currentBaby');
      if (app.globalData.currentBaby) app.globalData.currentBaby = null;
    }
  },

  /** 加载最近3条记录 */
  async loadRecords() {
    const baby = this.data.currentBaby;
    if (!baby || !baby._id) return;
    try {
      const records = await cloud.getTestRecords(baby._id);
      const recent = records.slice(0, 3).map(r => ({
        ...r,
        completedAtStr: util.formatDate(r.completedAt)
      }));
      this.setData({ recentRecords: recent });
    } catch (e) {
      console.error('加载记录失败:', e);
    }
  },

  /** 打开抽屉菜单 */
  openDrawer() {
    this.setData({ drawerVisible: true });
  },

  /** 关闭抽屉菜单 */
  closeDrawer() {
    this.setData({ drawerVisible: false });
  },

  /** 抽屉菜单导航 */
  onNavigate(e) {
    const { path } = e.detail;
    if (path === '/pages/index/index') return;
    wx.switchTab({ url: path }).catch(() => {
      wx.navigateTo({ url: path }).catch(() => {
        wx.redirectTo({ url: path });
      });
    });
  },

  /** 跳转全部测试页 */
  goTests() {
    wx.navigateTo({ url: '/pages/tests/tests' });
  },

  /** 进入答题 */
  goQuiz(e) {
    const type = e.currentTarget.dataset.type;
    if (!this.data.currentBaby) {
      util.showToast('请先添加宝宝信息');
      return;
    }
    wx.navigateTo({ url: `/pages/test/quiz?type=${type}` });
  },

  /** 查看结果详情 */
  goResult(e) {
    const { id, type } = e.currentTarget.dataset;
    wx.navigateTo({ url: `/pages/test/result?id=${id}&type=${type}` });
  },

  /** 跳转跟踪看板 */
  goDashboard() {
    wx.navigateTo({ url: '/pages/dashboard/dashboard' });
  },

  /** 跳转宝宝管理 */
  goBabies() {
    wx.navigateTo({ url: '/pages/babies/babies' });
  }
});
