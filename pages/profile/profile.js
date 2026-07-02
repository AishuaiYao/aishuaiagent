Page({
  data: {
    userInfo: {
      nickName: '微信用户',
      avatarUrl: '',
      signature: '这个人很懒，什么都没留下'
    },
    stats: [
      { num: 0, label: '对话' },
      { num: 0, label: '收藏' },
      { num: 0, label: '关注' }
    ],
    nicknameFocus: false
  },
  onChooseAvatar(e) {
    this.setData({
      'userInfo.avatarUrl': e.detail.avatarUrl,
      nicknameFocus: true
    })
    setTimeout(() => {
      wx.createSelectorQuery().select('#nicknameInput').boundingClientRect(rect => {
        if (rect) {
          wx.pageScrollTo({ scrollTop: rect.top - 50, duration: 200 })
        }
      }).exec()
    }, 100)
  },
  onNicknameInput(e) {
    this.setData({
      'userInfo.nickName': e.detail.value,
      nicknameFocus: false
    })
  }
})
