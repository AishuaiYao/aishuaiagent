Component({
  properties: {
    visible: {
      type: Boolean,
      value: false
    },
    currentPath: {
      type: String,
      value: ''
    }
  },

  data: {
    menuItems: [
      { name: '首页', icon: '🏠', path: '/pages/index/index' },
      { name: '全部测试', icon: '📋', path: '/pages/tests/tests' },
      { name: '跟踪看板', icon: '📊', path: '/pages/dashboard/dashboard' },
      { name: '我的宝宝', icon: '👶', path: '/pages/babies/babies' },
      { name: '我的账号', icon: '👤', path: '/pages/account/account' }
    ]
  },

  methods: {
    close() {
      this.triggerEvent('close');
    },

    navigate(e) {
      const { path } = e.currentTarget.dataset;
      this.triggerEvent('navigate', { path });
      this.close();
    },

    preventMove() {
      return false;
    }
  }
});
