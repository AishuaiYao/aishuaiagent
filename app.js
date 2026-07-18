App({
  onLaunch() {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力');
      return;
    }
    wx.cloud.init({
      env: 'cloud1-0go1szfo623bff14',
      traceUser: true
    });

    this.loadGlobalData();
  },

  async loadGlobalData() {
    const userInfo = wx.getStorageSync('userInfo');
    const currentBaby = wx.getStorageSync('currentBaby');
    if (userInfo) this.globalData.userInfo = userInfo;
    if (currentBaby) this.globalData.currentBaby = currentBaby;
  },

  globalData: {
    userInfo: null,
    currentBaby: null
  },

  /** 设置用户信息并同步到本地缓存 */
  setUserInfo(userInfo) {
    this.globalData.userInfo = userInfo;
    if (userInfo) {
      wx.setStorageSync('userInfo', userInfo);
    } else {
      wx.removeStorageSync('userInfo');
    }
  },

  /** 设置当前宝宝并同步到缓存 */
  setCurrentBaby(baby) {
    this.globalData.currentBaby = baby;
    wx.setStorageSync('currentBaby', baby);
  }
});
