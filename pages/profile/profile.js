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
    nicknameFocus: false,
    particlesReady: false,
    menuGroup1: [
      { icon: '💬', title: '我的对话', color: '#667eea' },
      { icon: '⭐', title: '我的收藏', color: '#f5af19' },
      { icon: '📋', title: '使用记录', color: '#4facfe' }
    ],
    menuGroup2: [
      { icon: '⚙️', title: '账号设置', color: '#667eea' },
      { icon: '🔔', title: '消息通知', color: '#f093fb' },
      { icon: '❓', title: '帮助与反馈', color: '#4facfe' },
      { icon: 'ℹ️', title: '关于我们', color: '#43e97b' }
    ]
  },

  onReady() {
    this.initParticles()
    setTimeout(() => this.setData({ particlesReady: true }), 300)
  },

  initParticles() {
    const query = wx.createSelectorQuery()
    query.select('#particleCanvas')
      .fields({ node: true, size: true })
      .exec((res) => {
        if (!res[0]) return
        const canvas = res[0].node
        const ctx = canvas.getContext('2d')
        const dpr = wx.getSystemInfoSync().pixelRatio
        const w = res[0].width
        const h = res[0].height
        canvas.width = w * dpr
        canvas.height = h * dpr
        ctx.scale(dpr, dpr)

        const particles = []
        const count = 60
        for (let i = 0; i < count; i++) {
          particles.push({
            x: Math.random() * w,
            y: Math.random() * h,
            r: Math.random() * 2 + 0.8,
            vx: (Math.random() - 0.5) * 0.3,
            vy: (Math.random() - 0.5) * 0.3,
            alpha: Math.random() * 0.5 + 0.2
          })
        }

        const animate = () => {
          ctx.clearRect(0, 0, w, h)
          particles.forEach((p, i) => {
            p.x += p.vx
            p.y += p.vy
            if (p.x < 0 || p.x > w) p.vx *= -1
            if (p.y < 0 || p.y > h) p.vy *= -1

            ctx.beginPath()
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
            ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha})`
            ctx.fill()

            for (let j = i + 1; j < count; j++) {
              const dx = p.x - particles[j].x
              const dy = p.y - particles[j].y
              const dist = Math.sqrt(dx * dx + dy * dy)
              if (dist < 100) {
                ctx.beginPath()
                ctx.moveTo(p.x, p.y)
                ctx.lineTo(particles[j].x, particles[j].y)
                ctx.strokeStyle = `rgba(255, 255, 255, ${0.08 * (1 - dist / 100)})`
                ctx.lineWidth = 0.5
                ctx.stroke()
              }
            }
          })
          this._animId = canvas.requestAnimationFrame(animate)
        }
        animate()
      })
  },

  onUnload() {
    if (this._animId) this._animId = null
  },

  goIndex() {
    wx.navigateBack()
  },

  onChooseAvatar(e) {
    this.setData({
      'userInfo.avatarUrl': e.detail.avatarUrl,
      nicknameFocus: true
    })
  },

  onNicknameInput(e) {
    this.setData({
      'userInfo.nickName': e.detail.value,
      nicknameFocus: false
    })
  }
})
