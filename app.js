App({
  onLaunch() {
    wx.cloud.init({
      env: 'cloud1-0go1szfo623bff14'
    })
  },
  globalData: {
    userInfo: null
  }
})
