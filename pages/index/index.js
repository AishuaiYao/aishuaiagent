Page({
  data: {
    features: [
      { icon: '💬', title: '智能对话', desc: '自然流畅的多轮对话体验，懂你所想，答你所问', color: '#667eea' },
      { icon: '🧠', title: '知识问答', desc: '海量知识库即时检索，精准回答各类专业问题', color: '#f093fb' },
      { icon: '✍️', title: '内容创作', desc: '一键生成文案、报告、创意，释放你的创作力', color: '#4facfe' },
      { icon: '📊', title: '数据分析', desc: '深度洞察数据价值，可视化呈现分析结果', color: '#43e97b' },
      { icon: '🔍', title: '智能搜索', desc: '全网信息精准检索，快速找到你需要的答案', color: '#fa709a' },
      { icon: '🎯', title: '个性化推荐', desc: '基于你的偏好，量身定制专属内容推荐', color: '#f5af19' }
    ],
    // Canvas 粒子
    particlesReady: false
  },

  onReady() {
    this.initParticles()
    // 卡片错峰入场
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

            // 连线
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

  goProfile() {
    wx.navigateTo({ url: '/pages/profile/profile' })
  }
})
