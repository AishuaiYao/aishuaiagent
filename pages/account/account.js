const util = require('../../utils/util');
const cloud = require('../../utils/cloud');
const app = getApp();

Page({
  data: {
    drawerVisible: false,
    userInfo: null
  },

  onShow() {
    this.setData({ userInfo: app.globalData.userInfo });
  },

  maskPhone(phone) {
    return util.maskPhone(phone);
  },

  /** 微信登录 */
  handleLogin() {
    wx.getUserProfile({
      desc: '用于完善账号信息',
      success: (res) => {
        const userInfo = res.userInfo;
        // 获取 openId 并保存用户
        wx.cloud.callFunction({
          name: 'getOpenId',
          success: async (result) => {
            if (result.result?.openId) {
              const userId = await cloud.upsertUser(result.result.openId, {
                nickName: userInfo.nickName,
                avatarUrl: userInfo.avatarUrl,
                phone: this.data.phone || ''
              });
              userInfo._id = userId;
              userInfo.openId = result.result.openId;
              app.setUserInfo(userInfo);
              this.setData({ userInfo });
              util.showToast('登录成功');
            }
          },
          fail: () => {
            // 如果 getOpenId 云函数不存在，使用本地存储
            userInfo._id = `local_${Date.now()}`;
            app.setUserInfo(userInfo);
            this.setData({ userInfo });
            util.showToast('登录成功（本地模式）');
          }
        });
      },
      fail: () => {
        util.showToast('获取用户信息失败');
      }
    });
  },

  /** 退出登录 */
  handleLogout() {
    wx.showModal({
      title: '退出登录',
      content: '退出后不会删除您的数据，但未同步的数据可能丢失。确定退出吗？',
      confirmColor: '#A8D8EA',
      success: (res) => {
        if (res.confirm) {
          app.setUserInfo(null);
          app.setCurrentBaby(null);
          wx.removeStorageSync('userInfo');
          wx.removeStorageSync('currentBaby');
          this.setData({ userInfo: null });
          util.showToast('已退出登录');
        }
      }
    });
  },

  openDrawer() {
    this.setData({ drawerVisible: true });
  },

  closeDrawer() {
    this.setData({ drawerVisible: false });
  },

  onNavigate(e) {
    const { path } = e.detail;
    if (path === '/pages/account/account') return;
    wx.navigateTo({ url: path }).catch(() => wx.redirectTo({ url: path }));
  }
});
