Page({
  onMenuTap(e) {
    const type = e.currentTarget.dataset.type
    wx.showToast({
      title: `点击了${type}`,
      icon: 'none'
    })
  }
})
