const util = require('../../utils/util');
const cloud = require('../../utils/cloud');
const app = getApp();

Page({
  data: {
    drawerVisible: false,
    babies: [],
    showForm: false,
    editingBaby: null,
    formData: {
      name: '',
      birthday: '',
      gender: '',
      note: ''
    },
    today: '',
    theme: {}
  },

  onShow() {
    this.setData({ today: util.formatDate(new Date()), theme: app.getTheme() });
    this.loadBabies();
  },

  async loadBabies() {
    util.showLoading();
    try {
      const userInfo = app.globalData.userInfo;
      let babies = [];
      if (userInfo?._id) {
        babies = await cloud.getBabies(userInfo._id);
      } else {
        // 未登录时从本地存储读取
        babies = wx.getStorageSync('localBabies') || [];
      }
      this.setData({ babies });
      // 同步当前宝宝
      const current = babies.find(b => b.isCurrent);
      if (current) app.setCurrentBaby(current);
    } catch (e) {
      console.error('加载宝宝失败:', e);
    } finally {
      util.hideLoading();
    }
  },

  calcAge(birthday) {
    return util.calcBabyAge(birthday);
  },

  showAddForm() {
    this.setData({
      showForm: true,
      editingBaby: null,
      formData: { name: '', birthday: '', gender: '', note: '' }
    });
  },

  editBaby(e) {
    const baby = e.currentTarget.dataset.item;
    this.setData({
      showForm: true,
      editingBaby: baby,
      formData: {
        name: baby.name || '',
        birthday: util.formatDate(baby.birthday) || '',
        gender: baby.gender || '',
        note: baby.note || ''
      }
    });
  },

  hideForm() {
    this.setData({ showForm: false });
  },

  onFormInput(e) {
    const { key } = e.currentTarget.dataset;
    this.setData({ [`formData.${key}`]: e.detail.value });
  },

  onDateChange(e) {
    this.setData({ 'formData.birthday': e.detail.value });
  },

  onGenderTap(e) {
    this.setData({ 'formData.gender': e.currentTarget.dataset.gender });
  },

  async saveBaby() {
    const { name, birthday, gender, note } = this.data.formData;
    if (!name || !birthday) {
      util.showToast('请填写昵称和出生日期');
      return;
    }

    util.showLoading();
    try {
      const userInfo = app.globalData.userInfo;
      const isNew = !this.data.editingBaby;

      if (userInfo?._id) {
        // 云端操作
        if (isNew) {
          await cloud.addBaby({
            userId: userInfo._id,
            name,
            birthday: new Date(birthday),
            gender,
            note,
            avatar: '',
            isCurrent: this.data.babies.length === 0 // 第一个宝宝自动设为当前
          });
        } else {
          await cloud.updateBaby(this.data.editingBaby._id, {
            name, birthday: new Date(birthday), gender, note
          });
        }
      } else {
        // 本地存储
        let babies = wx.getStorageSync('localBabies') || [];
        if (isNew) {
          const baby = {
            _id: `local_${Date.now()}`,
            name,
            birthday,
            gender,
            note,
            isCurrent: babies.length === 0
          };
          babies.push(baby);
        } else {
          const idx = babies.findIndex(b => b._id === this.data.editingBaby._id);
          if (idx >= 0) {
            babies[idx] = { ...babies[idx], name, birthday, gender, note };
          }
        }
        wx.setStorageSync('localBabies', babies);
      }

      util.hideLoading();
      util.showToast(isNew ? '添加成功' : '修改成功');
      this.hideForm();
      this.loadBabies();
    } catch (e) {
      util.hideLoading();
      console.error('保存失败:', e);
      util.showToast('操作失败，请重试');
    }
  },

  async switchBaby(e) {
    const babyId = e.currentTarget.dataset.id;
    const userInfo = app.globalData.userInfo;

    util.showLoading();
    try {
      if (userInfo?._id) {
        await cloud.switchCurrentBaby(userInfo._id, babyId);
      } else {
        let babies = wx.getStorageSync('localBabies') || [];
        babies = babies.map(b => ({ ...b, isCurrent: b._id === babyId }));
        wx.setStorageSync('localBabies', babies);
      }
      util.hideLoading();
      util.showToast('切换成功');
      this.loadBabies();
    } catch (e) {
      util.hideLoading();
      console.error('切换失败:', e);
      util.showToast('切换失败');
    }
  },

  deleteBaby(e) {
    const { id, name } = e.currentTarget.dataset;
    wx.showModal({
      title: '确认删除',
      content: `确定要删除"${name}"的信息吗？此操作不可恢复。`,
      confirmColor: app.getTheme().primary,
      success: async (res) => {
        if (res.confirm) {
          util.showLoading();
          try {
            const userInfo = app.globalData.userInfo;
            if (userInfo?._id) {
              await cloud.removeBaby(id);
            } else {
              let babies = wx.getStorageSync('localBabies') || [];
              babies = babies.filter(b => b._id !== id);
              wx.setStorageSync('localBabies', babies);
            }
            util.hideLoading();
            util.showToast('删除成功');
            this.loadBabies();
          } catch (err) {
            util.hideLoading();
            console.error('删除失败:', err);
            util.showToast('删除失败');
          }
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
    if (path === '/pages/babies/babies') return;
    wx.navigateTo({ url: path }).catch(() => wx.redirectTo({ url: path }));
  }
});
