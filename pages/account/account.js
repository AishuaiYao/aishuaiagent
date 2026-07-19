const util = require('../../utils/util');
const cloud = require('../../utils/cloud');
const app = getApp();

Page({
  data: {
    drawerVisible: false,
    userInfo: null,
    // 注册表单
    showRegister: false,
    avatarUrl: '',
    nickName: '',
    submitting: false
  },

  onShow() {
    const userInfo = app.globalData.userInfo;
    this.setData({ userInfo });

    // 未登录且未显示注册表单时，自动弹窗收集资料
    if (!userInfo && !this.data.showRegister) {
      // 延迟弹出，避免页面切入动画冲突
      setTimeout(() => {
        this.setData({ showRegister: true });
      }, 400);
    }
  },

  maskPhone(phone) {
    return util.maskPhone(phone);
  },

  /** 微信头像选择（现代 API） */
  onChooseAvatar(e) {
    const { avatarUrl } = e.detail;
    this.setData({ avatarUrl });
  },

  /** 昵称输入 */
  onNicknameInput(e) {
    this.setData({ nickName: e.detail.value });
  },

  /** 提交注册 */
  async handleRegister() {
    const { avatarUrl, nickName } = this.data;
    if (!nickName.trim()) {
      util.showToast('请输入昵称');
      return;
    }

    this.setData({ submitting: true });
    try {
      // 获取 OpenID 作为唯一标识
      const { result } = await wx.cloud.callFunction({ name: 'getOpenId' });
      if (!result?.openId) {
        util.showToast('获取身份信息失败，请重试');
        this.setData({ submitting: false });
        return;
      }
      const openId = result.openId;

      // 创建或更新用户（以 openId 为唯一标识）
      const userId = await cloud.upsertUser(openId, {
        nickName: nickName.trim(),
        avatarUrl: avatarUrl || '',
        updatedAt: new Date()
      });

      const userInfo = {
        _id: userId,
        openId,
        nickName: nickName.trim(),
        avatarUrl: avatarUrl || ''
      };
      app.setUserInfo(userInfo);
      this.setData({
        userInfo,
        showRegister: false,
        submitting: false,
        avatarUrl: '',
        nickName: ''
      });
      util.showToast('登录成功');
    } catch (e) {
      console.error('注册失败:', e);
      util.showToast('登录失败，请重试');
      this.setData({ submitting: false });
    }
  },

  /** 点击登录按钮，显示注册弹窗 */
  showLoginPopup() {
    this.setData({ showRegister: true });
  },

  /** 关闭注册弹窗 */
  closeRegister() {
    this.setData({ showRegister: false });
  },

  /** 退出登录 */
  handleLogout() {
    wx.showModal({
      title: '退出登录',
      content: '退出后不会删除您的数据。确定退出吗？',
      confirmColor: '#A8D8EA',
      success: (res) => {
        if (res.confirm) {
          app.setUserInfo(null);
          app.setCurrentBaby(null);
          wx.removeStorageSync('currentBaby');
          this.setData({
            userInfo: null,
            showRegister: false,
            avatarUrl: '',
            nickName: ''
          });
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
