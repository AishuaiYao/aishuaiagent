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
    ]
  },
  onChooseAvatar(e) {
    this.setData({
      'userInfo.avatarUrl': e.detail.avatarUrl
    })
  },
  onNicknameInput(e) {
    this.setData({
      'userInfo.nickName': e.detail.value
    })
  }
})
