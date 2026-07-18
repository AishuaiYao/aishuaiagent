const util = require('../../utils/util');

Page({
  data: {
    drawerVisible: false,
    testList: [
      {
        type: 'attention',
        name: '注意力测试',
        icon: '🔍',
        desc: '通过日常行为评估宝宝注意力水平',
        bgColor: '#D6EEF5',
        available: true
      },
      {
        type: 'attachment',
        name: '亲子依恋测试',
        icon: '💕',
        desc: '评估宝宝与主要照顾者的依恋关系质量',
        bgColor: '#FFF0E5',
        available: true
      },
      {
        type: 'temperament',
        name: '气质类型测试',
        icon: '🌈',
        desc: '基于Thomas & Chess气质九维度理论评估宝宝气质',
        bgColor: '#E8EBF7',
        available: true
      },
      {
        type: 'experiment',
        name: '交互式小实验',
        icon: '🧪',
        desc: '陪伴宝宝一起完成的趣味互动实验',
        bgColor: '#F0F0F0',
        available: false
      },
      {
        type: 'guide',
        name: '图文指导',
        icon: '📖',
        desc: '分月龄的宝宝发展指导手册',
        bgColor: '#F0F0F0',
        available: false
      }
    ]
  },

  openDrawer() {
    this.setData({ drawerVisible: true });
  },

  closeDrawer() {
    this.setData({ drawerVisible: false });
  },

  onNavigate(e) {
    const { path } = e.detail;
    if (path === '/pages/tests/tests') return;
    wx.navigateTo({ url: path }).catch(() => {
      wx.redirectTo({ url: path });
    });
  },

  goQuiz(e) {
    const { type, available } = e.currentTarget.dataset;
    if (!available) return;
    const baby = getApp().globalData.currentBaby;
    if (!baby) {
      util.showToast('请先添加宝宝信息');
      return;
    }
    wx.navigateTo({ url: `/pages/test/quiz?type=${type}` });
  }
});
