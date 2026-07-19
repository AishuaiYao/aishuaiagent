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

  /** 主题色配置：男孩蓝绿 / 女孩粉系 */
  _themes: {
    boy: {
      primary: '#A8D8EA',
      primaryLight: '#D6EEF5',
      secondary: '#FFD3B4',
      accent: '#C7CEEA',
      accentLight: '#E8EBF7',
      primaryRgba02: 'rgba(168, 216, 234, 0.2)',
      primaryRgba015: 'rgba(168, 216, 234, 0.15)',
      primaryRgba01: 'rgba(168, 216, 234, 0.1)',
      primaryRgba025: 'rgba(168, 216, 234, 0.25)',
      primaryRgba03: 'rgba(168, 216, 234, 0.3)',
      primaryRgba035: 'rgba(168, 216, 234, 0.35)',
      primaryRgba018: 'rgba(168, 216, 234, 0.18)',
      secondaryRgba01: 'rgba(255, 211, 180, 0.1)',
      secondaryRgba015: 'rgba(255, 211, 180, 0.15)',
      dotBlue: '#A8D8EA', dotOrange: '#FFD3B4', dotPurple: '#C7CEEA'
    },
    girl: {
      primary: '#F2A6C2',
      primaryLight: '#FDE0EC',
      secondary: '#FFDEE9',
      accent: '#E8C7D2',
      accentLight: '#F5E6EE',
      primaryRgba02: 'rgba(242, 166, 194, 0.2)',
      primaryRgba015: 'rgba(242, 166, 194, 0.15)',
      primaryRgba01: 'rgba(242, 166, 194, 0.1)',
      primaryRgba025: 'rgba(242, 166, 194, 0.25)',
      primaryRgba03: 'rgba(242, 166, 194, 0.3)',
      primaryRgba035: 'rgba(242, 166, 194, 0.35)',
      primaryRgba018: 'rgba(242, 166, 194, 0.18)',
      secondaryRgba01: 'rgba(255, 222, 233, 0.1)',
      secondaryRgba015: 'rgba(255, 222, 233, 0.15)',
      dotBlue: '#F2A6C2', dotOrange: '#FFDEE9', dotPurple: '#E8C7D2'
    }
  },

  /** 根据当前宝宝性别获取主题 */
  getTheme() {
    const baby = this.globalData.currentBaby;
    const type = baby?.gender === 'female' ? 'girl' : 'boy';
    return this._themes[type];
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
