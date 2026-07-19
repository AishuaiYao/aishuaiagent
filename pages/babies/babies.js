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
    theme: {},
    formAvatarTemp: ''  // 表单中选择的头像临时路径
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
      formData: { name: '', birthday: '', gender: '', note: '' },
      formAvatarTemp: ''
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
      },
      formAvatarTemp: ''
    });
  },

  hideForm() {
    this.setData({ showForm: false, formAvatarTemp: '' });
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

  /** 表单中选择头像 */
  onFormChooseAvatar() {
    const that = this;
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success(res) {
        that.setData({ formAvatarTemp: res.tempFilePaths[0] });
      }
    });
  },

  /** 卡片上快速更换头像 */
  changeAvatar(e) {
    const babyId = e.currentTarget.dataset.id;
    const that = this;
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success(res) {
        that.saveAvatarBase64(babyId, res.tempFilePaths[0]);
      }
    });
  },

  /** 压缩图片到200KB内并转base64，更新数据库 */
  async saveAvatarBase64(babyId, tempPath) {
    util.showLoading('处理头像...');
    const base64 = await this.compressToBase64(tempPath);
    if (!base64) {
      util.hideLoading();
      return;
    }

    const userInfo = app.globalData.userInfo;
    if (userInfo?._id) {
      await cloud.updateBaby(babyId, { avatar: base64 });
    } else {
      let babies = wx.getStorageSync('localBabies') || [];
      const idx = babies.findIndex(b => b._id === babyId);
      if (idx >= 0) {
        babies[idx] = { ...babies[idx], avatar: base64 };
        wx.setStorageSync('localBabies', babies);
      }
    }
    util.hideLoading();
    util.showToast('头像更新成功');
    this.loadBabies();
  },

  /** 用 canvas 等比缩放到 200px 内再转 base64，大小控制在 ~15KB */
  compressToBase64(tempPath) {
    const that = this;
    return new Promise((resolve) => {
      wx.getImageInfo({
        src: tempPath,
        success(info) {
          const MAX = 200;
          let w = info.width, h = info.height;
          if (w > h) {
            if (w > MAX) { h = Math.round(h * MAX / w); w = MAX; }
          } else {
            if (h > MAX) { w = Math.round(w * MAX / h); h = MAX; }
          }
          const ctx = wx.createCanvasContext('avatarCanvas', that);
          ctx.drawImage(tempPath, 0, 0, w, h);
          ctx.draw(false, () => {
            wx.canvasToTempFilePath({
              canvasId: 'avatarCanvas',
              width: w, height: h,
              quality: 0.5,
              success(res) {
                try {
                  const fs = wx.getFileSystemManager();
                  const b64 = fs.readFileSync(res.tempFilePath, 'base64');
                  const ext = (tempPath.split('.').pop() || 'png').toLowerCase();
                  const mime = ext === 'jpg' || ext === 'jpeg' ? 'jpeg' : 'png';
                  resolve(`data:image/${mime};base64,${b64}`);
                } catch (e) {
                  console.error('读取 base64 失败:', e);
                  resolve(null);
                }
              },
              fail(e) {
                console.error('canvas 导出失败:', e);
                that._compressFallback(tempPath, resolve);
              }
            }, that);
          });
        },
        fail() {
          util.showToast('图片处理失败');
          resolve(null);
        }
      });
    });
  },

  /** 降级方案：直接 compressImage 压缩后读 base64 */
  _compressFallback(tempPath, resolve) {
    const fs = wx.getFileSystemManager();
    wx.compressImage({
      src: tempPath,
      quality: 30,
      success(res) {
        try {
          const b64 = fs.readFileSync(res.tempFilePath, 'base64');
          const ext = (tempPath.split('.').pop() || 'png').toLowerCase();
          const mime = ext === 'jpg' || ext === 'jpeg' ? 'jpeg' : 'png';
          resolve(`data:image/${mime};base64,${b64}`);
        } catch (e) {
          console.error('降级压缩失败:', e);
          resolve(null);
        }
      },
      fail() {
        util.showToast('图片处理失败');
        resolve(null);
      }
    });
  },

  async saveBaby() {
    const { name, birthday, gender, note } = this.data.formData;
    const avatarTemp = this.data.formAvatarTemp;
    if (!name || !birthday) {
      util.showToast('请填写昵称和出生日期');
      return;
    }

    // 有头像先压缩为 base64
    let avatarBase64 = this.data.editingBaby?.avatar || '';
    if (avatarTemp) {
      util.showLoading('处理头像...');
      avatarBase64 = await this.compressToBase64(avatarTemp);
      if (!avatarBase64) {
        util.hideLoading();
        return;
      }
    } else {
      util.showLoading();
    }

    try {
      const userInfo = app.globalData.userInfo;
      const isNew = !this.data.editingBaby;

      if (userInfo?._id) {
        if (isNew) {
          await cloud.addBaby({
            userId: userInfo._id,
            name,
            birthday: new Date(birthday),
            gender,
            note,
            avatar: avatarBase64,
            isCurrent: this.data.babies.length === 0
          });
        } else {
          await cloud.updateBaby(this.data.editingBaby._id, {
            name, birthday: new Date(birthday), gender, note, avatar: avatarBase64
          });
        }
      } else {
        let babies = wx.getStorageSync('localBabies') || [];
        if (isNew) {
          babies.push({
            _id: `local_${Date.now()}`,
            name, birthday, gender, note,
            avatar: avatarBase64,
            isCurrent: babies.length === 0
          });
        } else {
          const idx = babies.findIndex(b => b._id === this.data.editingBaby._id);
          if (idx >= 0) {
            babies[idx] = { ...babies[idx], name, birthday, gender, note, avatar: avatarBase64 };
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
