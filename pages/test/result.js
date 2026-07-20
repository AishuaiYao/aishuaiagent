const util = require('../../utils/util');
const cloud = require('../../utils/cloud');
const app = getApp();

Page({
  data: {
    testType: '',
    testName: '',
    completedAt: '',
    babyAge: 0,
    overallScore: 0,
    displayScore: 0,       // 动画显示的分数（从0滚到真实值）
    scoreLevel: '',
    badgeColor: '',
    compareText: '',
    summary: '',
    suggestions: [],
    dimensionList: [],
    dimensionsData: null,
    recordId: '',
    theme: {},
    showConfetti: false,   // 撒花
    showBadge: false,      // 徽章弹入
    dimsRevealed: false    // 维度条展示
  },

  async onLoad(options) {
    this.setData({ theme: app.getTheme() });
    const { type, record, id } = options;

    // 模式1: 从答题页传入，携带完整 record JSON
    if (record) {
      let recordData;
      try {
        recordData = JSON.parse(decodeURIComponent(record));
      } catch (e) {
        util.showToast('数据解析失败');
        setTimeout(() => wx.navigateBack(), 1500);
        return;
      }
      this.setData({ testType: type, recordId: recordData._id });
      this.processResult(type, recordData);
      const testName = util.testTypeMap[type]?.name || recordData.testName || '测试结果';
      wx.setNavigationBarTitle({ title: testName });
      return;
    }

    // 模式2: 从首页/看板传入，仅有 id，需从数据库查询
    if (id) {
      util.showLoading('加载中...');
      try {
        const db = wx.cloud.database();
        const res = await db.collection('test_records').doc(id).get();
        const recordData = res.data;
        if (!recordData) {
          util.hideLoading();
          util.showToast('记录不存在');
          setTimeout(() => wx.navigateBack(), 1500);
          return;
        }
        this.setData({ testType: type || recordData.testType, recordId: id });
        this.processResult(type || recordData.testType, recordData);
        const testName = util.testTypeMap[type || recordData.testType]?.name || recordData.testName || '测试结果';
        wx.setNavigationBarTitle({ title: testName });
        util.hideLoading();
      } catch (e) {
        util.hideLoading();
        console.error('加载记录失败:', e);
        util.showToast('加载失败，请重试');
        setTimeout(() => wx.navigateBack(), 1500);
      }
      return;
    }

    // 无有效参数
    util.showToast('参数错误');
    setTimeout(() => wx.navigateBack(), 1500);
  },

  processResult(type, record) {
    const theme = app.getTheme();
    const { scores, dimensions, summary, suggestions, completedAt, babyAgeMonths } = record;

    // 计算总分
    let overallScore = 0;
    if (type === 'attention') {
      const total = scores.sustained + scores.selective + scores.shifting;
      overallScore = Math.round((total / 75) * 100);
    } else if (type === 'attachment') {
      overallScore = scores.security;
    } else {
      const vals = Object.values(scores);
      overallScore = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
    }

    // 等级
    let scoreLevel = '', badgeColor = '';
    if (overallScore >= 85) {
      scoreLevel = '优秀';
      badgeColor = theme.primary;
    } else if (overallScore >= 70) {
      scoreLevel = '良好';
      badgeColor = theme.accent;
    } else if (overallScore >= 55) {
      scoreLevel = '一般';
      badgeColor = theme.secondary;
    } else {
      scoreLevel = '待提升';
      badgeColor = '#8A9BAA';
    }

    // 维度列表
    const dimColors = [theme.primary, theme.secondary, theme.accent, '#B5E0D0', '#F0C8D0', '#B0D8F0', '#D8C8E0', '#E8D0C0', '#D0E0D8'];
    let dimensionList = [];
    let dimColorIdx = 0;

    if (type === 'attention') {
      dimensionList = [
        { key: 'sustained', name: '持续性注意', score: scores.sustained, color: dimColors[dimColorIdx++] },
        { key: 'selective', name: '选择性注意', score: scores.selective, color: dimColors[dimColorIdx++] },
        { key: 'shifting', name: '注意转移', score: scores.shifting, color: dimColors[dimColorIdx++] }
      ];
    } else if (type === 'attachment') {
      dimensionList = [
        { key: 'security', name: '安全型依恋', score: scores.security, color: dimColors[dimColorIdx++] },
        { key: 'avoidance', name: '回避行为', score: 100 - scores.avoidance, color: dimColors[dimColorIdx++] },
        { key: 'resistance', name: '抵抗行为', score: 100 - scores.resistance, color: dimColors[dimColorIdx++] }
      ];
    } else {
      const nameMap = {
        activity: '活动水平', rhythmicity: '节律性', approach: '趋避性',
        adaptability: '适应性', intensity: '反应强度', mood: '情绪本质',
        persistence: '坚持性', distractibility: '注意分散度', threshold: '反应阈'
      };
      for (const [key, val] of Object.entries(scores)) {
        dimensionList.push({ key, name: nameMap[key] || key, score: val, color: dimColors[dimColorIdx++ % dimColors.length] });
      }
    }

    this.setData({
      testName: record.testName || util.testTypeMap[type]?.name || '',
      completedAt: util.formatDate(completedAt),
      babyAge: babyAgeMonths || 0,
      overallScore,
      scoreLevel,
      badgeColor,
      summary,
      suggestions: suggestions || [],
      dimensionList,
      dimensionsData: dimensions
    });

    // 动画序列: 分数滚动 → 徽章弹入 → 撒花
    this.animateScore(overallScore);

    // 查找历史记录进行比较
    this.loadHistoryCompare(type);

    // 延迟绘制雷达图
    if (dimensions) {
      setTimeout(() => this.drawRadar(), 800);
    }
  },

  /** 分数计数动画 */
  animateScore(target) {
    const duration = 1200; // 动画总时长 ms
    const startTime = Date.now();

    const step = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutCubic 缓动
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(eased * target);

      this.setData({ displayScore: current });

      if (progress < 1) {
        // 使用 setTimeout 代替 requestAnimationFrame 确保小程序兼容
        setTimeout(step, 16);
      } else {
        // 分数动画完成 → 弹出徽章
        setTimeout(() => {
          this.setData({ showBadge: true });
          // 徽章弹出后 → 撒花
          setTimeout(() => {
            this.setData({ showConfetti: true });
            this.startConfetti();
            // 维度条依次展开
            setTimeout(() => {
              this.setData({ dimsRevealed: true });
            }, 300);
          }, 400);
        }, 200);
      }
    };

    step();
  },

  /** 撒花庆祝动画 */
  startConfetti() {
    const query = wx.createSelectorQuery();
    query.select('#confettiCanvas')
      .fields({ node: true, size: true })
      .exec((res) => {
        if (!res[0] || !res[0].node) return;
        const canvas = res[0].node;
        const ctx = canvas.getContext('2d');
        const dpr = wx.getSystemInfoSync().pixelRatio;
        const W = res[0].width;
        const H = res[0].height;
        canvas.width = W * dpr;
        canvas.height = H * dpr;
        ctx.scale(dpr, dpr);

        const particles = [];
        const colors = ['#FFD3B4', '#A8D8EA', '#C7CEEA', '#FFB7C5', '#B5E0D0', '#FDE0EC', '#FFEAA7', '#D6EEF5'];
        const maxParticles = 40;

        for (let i = 0; i < maxParticles; i++) {
          particles.push({
            x: Math.random() * W,
            y: Math.random() * H * 0.5 - H * 0.3,
            vx: (Math.random() - 0.5) * 4,
            vy: Math.random() * 2 + 1,
            size: Math.random() * 6 + 3,
            color: colors[Math.floor(Math.random() * colors.length)],
            rotation: Math.random() * 360,
            rotSpeed: (Math.random() - 0.5) * 10,
            opacity: Math.random() * 0.6 + 0.4
          });
        }

        let animFrame;
        const animate = () => {
          ctx.clearRect(0, 0, W, H);

          let alive = 0;
          for (const p of particles) {
            if (p.y > H + 20 || p.opacity <= 0.02) continue;
            alive++;

            p.x += p.vx;
            p.vy += 0.08; // 重力
            p.y += p.vy;
            p.rotation += p.rotSpeed;
            p.opacity -= 0.003;

            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate((p.rotation * Math.PI) / 180);
            ctx.globalAlpha = Math.max(p.opacity, 0);
            ctx.fillStyle = p.color;
            ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
            ctx.restore();
          }

          if (alive > 0) {
            animFrame = setTimeout(animate, 32);
          }
        };

        animate();

        // 2秒后清理
        setTimeout(() => {
          if (animFrame) clearTimeout(animFrame);
          ctx.clearRect(0, 0, W, H);
        }, 2500);
      });
  },

  /** 加载历史对比 */
  async loadHistoryCompare(type) {
    const baby = app.globalData.currentBaby;
    if (!baby?._id) return;
    try {
      const records = await cloud.getTestRecords(baby._id, type);
      if (records.length >= 2) {
        const prev = records[1];
        let prevOverall = 0;
        if (type === 'attention') {
          prevOverall = Math.round(((prev.scores.sustained + prev.scores.selective + prev.scores.shifting) / 75) * 100);
        } else if (type === 'attachment') {
          prevOverall = prev.scores.security;
        } else {
          prevOverall = Math.round(Object.values(prev.scores || {}).reduce((a, b) => a + b, 0) / Object.keys(prev.scores || {}).length);
        }
        const diff = this.data.overallScore - prevOverall;
        if (diff > 0) {
          this.setData({ compareText: `较上次 +${diff} 分` });
        } else if (diff < 0) {
          this.setData({ compareText: `较上次 ${diff} 分` });
        } else {
          this.setData({ compareText: '持平' });
        }
      }
    } catch (e) {
      console.error('加载历史对比失败:', e);
    }
  },

  /** 绘制雷达图 */
  drawRadar() {
    const theme = app.getTheme();
    const query = wx.createSelectorQuery();
    query.select('#radarCanvas')
      .fields({ node: true, size: true })
      .exec((res) => {
        if (!res[0] || !res[0].node) return;
        const canvas = res[0].node;
        const ctx = canvas.getContext('2d');
        const dpr = wx.getSystemInfoSync().pixelRatio;
        const width = res[0].width;
        const height = res[0].height;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);

        const dims = this.data.dimensionsData;
        const labels = ['专注力', '情绪', '社交', '感知'];
        const values = [dims.focus || 0, dims.emotion || 0, dims.social || 0, dims.sensory || 0];
        const count = labels.length;
        const cx = width / 2;
        const cy = height / 2;
        const radius = Math.min(cx, cy) - 60;
        const levels = 5;

        ctx.clearRect(0, 0, width, height);

        // 绘制网格 - 新色系
        for (let i = 1; i <= levels; i++) {
          const r = (radius / levels) * i;
          ctx.beginPath();
          ctx.strokeStyle = '#E8ECF0';
          ctx.lineWidth = 1;
          for (let j = 0; j < count; j++) {
            const angle = (Math.PI * 2 / count) * j - Math.PI / 2;
            const x = cx + Math.cos(angle) * r;
            const y = cy + Math.sin(angle) * r;
            if (j === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.closePath();
          ctx.stroke();
        }

        // 绘制轴线
        for (let i = 0; i < count; i++) {
          const angle = (Math.PI * 2 / count) * i - Math.PI / 2;
          ctx.beginPath();
          ctx.strokeStyle = '#D8DEE5';
          ctx.lineWidth = 1;
          ctx.moveTo(cx, cy);
          ctx.lineTo(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius);
          ctx.stroke();

          // 标签
          const lx = cx + Math.cos(angle) * (radius + 36);
          const ly = cy + Math.sin(angle) * (radius + 36);
          ctx.fillStyle = '#4A5B6E';
          ctx.font = '12px -apple-system, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(labels[i], lx, ly);
        }

        // 绘制数据区域
        ctx.beginPath();
        for (let i = 0; i < count; i++) {
          const angle = (Math.PI * 2 / count) * i - Math.PI / 2;
          const val = values[i] / 100;
          const x = cx + Math.cos(angle) * radius * val;
          const y = cy + Math.sin(angle) * radius * val;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fillStyle = theme.primaryRgba025;
        ctx.fill();
        ctx.strokeStyle = theme.primary;
        ctx.lineWidth = 2;
        ctx.stroke();

        // 绘制数据点
        for (let i = 0; i < count; i++) {
          const angle = (Math.PI * 2 / count) * i - Math.PI / 2;
          const val = values[i] / 100;
          const x = cx + Math.cos(angle) * radius * val;
          const y = cy + Math.sin(angle) * radius * val;
          ctx.beginPath();
          ctx.arc(x, y, 5, 0, Math.PI * 2);
          ctx.fillStyle = theme.primary;
          ctx.fill();
          ctx.beginPath();
          ctx.arc(x, y, 8, 0, Math.PI * 2);
          ctx.fillStyle = theme.primaryRgba015;
          ctx.fill();
        }
      });
  },

  /** 保存/分享卡片 - 全卡 PCA 渐变 + 宝宝头像 + 知芽品牌 */
  async shareCard() {
    wx.showLoading({ title: '生成中...' });

    const baby = app.globalData.currentBaby;
    const avatarSrc = baby?.avatar || '';

    // PCA 提取头像主成分 → 渐变起止色
    const pca = await this._pcaExtract(avatarSrc);
    const mc = this._buildPalette(pca);

    const query = wx.createSelectorQuery();
    query.select('#shareCanvas').fields({ node: true, size: true }).exec((res) => {
      if (!res[0] || !res[0].node) {
        wx.hideLoading();
        util.showToast('生成失败，请重试');
        return;
      }
      const canvas = res[0].node;
      const ctx = canvas.getContext('2d');
      const dpr = wx.getSystemInfoSync().pixelRatio;
      const W = res[0].width;   // 300px (600rpx)
      const H = res[0].height;  // 430px (860rpx)
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      ctx.scale(dpr, dpr);

      const data = this.data;

      // 三角形绘制: 所有内容卡片
      const drawAll = (avatarImg) => {
        // ========== 全卡片渐变背景 (对角线) ==========
        const bgGrad = ctx.createLinearGradient(0, 0, W, H);
        bgGrad.addColorStop(0, mc.gradStart);
        bgGrad.addColorStop(0.5, mc.gradEnd);
        bgGrad.addColorStop(1, mc.gradStart);
        ctx.fillStyle = bgGrad;
        this._roundRect(ctx, 0, 0, W, H, 20);
        ctx.fill();

        // ========== 顶部：头像 + 昵称 + 知芽 ==========
        const avR = 26, avCY = 44;
        // 头像圆形
        ctx.save();
        ctx.beginPath();
        ctx.arc(W / 2, avCY, avR, 0, Math.PI * 2);
        ctx.clip();
        if (avatarImg) {
          // 从图片中心裁剪正方形避免拉伸变形
          const iw = avatarImg.width, ih = avatarImg.height;
          const sq = Math.min(iw, ih);
          const sx = (iw - sq) / 2, sy = (ih - sq) / 2;
          ctx.drawImage(avatarImg, sx, sy, sq, sq, W / 2 - avR, avCY - avR, avR * 2, avR * 2);
        } else {
          ctx.fillStyle = 'rgba(255,255,255,0.5)';
          ctx.fillRect(W / 2 - avR, avCY - avR, avR * 2, avR * 2);
          ctx.fillStyle = 'rgba(255,255,255,0.9)';
          ctx.font = '22px -apple-system, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(baby?.gender === 'female' ? '👧' : '👦', W / 2, avCY);
        }
        ctx.restore();
        // 白色描边
        ctx.beginPath();
        ctx.arc(W / 2, avCY, avR, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255,255,255,0.9)';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // 昵称
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 13px -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'alphabetic';
        ctx.fillText(baby?.name || '宝宝', W / 2, 84);

        // ========== 测试信息卡片 (半透明白) ==========
        ctx.save();
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.shadowColor = 'rgba(0,0,0,0.05)';
        ctx.shadowBlur = 6;
        ctx.shadowOffsetY = 1;
        this._roundRect(ctx, 20, 112, W - 40, 38, 10);
        ctx.fill();
        ctx.restore();

        ctx.fillStyle = mc.textDark;
        ctx.font = 'bold 12px -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(data.testName, W / 2, 129);
        ctx.fillStyle = 'rgba(100,100,100,0.6)';
        ctx.font = '9px -apple-system, sans-serif';
        ctx.fillText(`${data.completedAt} · ${data.babyAge}个月`, W / 2, 144);

        // ========== 分数卡片 ==========
        ctx.save();
        ctx.fillStyle = 'rgba(255,255,255,0.88)';
        ctx.shadowColor = 'rgba(0,0,0,0.05)';
        ctx.shadowBlur = 6;
        ctx.shadowOffsetY = 1;
        this._roundRect(ctx, 22, 166, W - 44, 70, 12);
        ctx.fill();
        ctx.restore();

        // 总分
        ctx.fillStyle = mc.textDark;
        ctx.font = 'bold 44px -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(data.overallScore.toString(), W / 2, 198);
        ctx.fillStyle = mc.textMid;
        ctx.font = '12px -apple-system, sans-serif';
        ctx.fillText('分', W / 2 + 26, 198);

        // 等级徽章
        ctx.fillStyle = mc.badgeBg;
        this._roundRect(ctx, W / 2 - 30, 206, 60, 20, 10);
        ctx.fill();
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 10px -apple-system, sans-serif';
        ctx.fillText(data.scoreLevel, W / 2, 220);

        // 对比
        if (data.compareText) {
          ctx.fillStyle = mc.textMid;
          ctx.font = '9px -apple-system, sans-serif';
          ctx.fillText(data.compareText, W / 2, 234);
        }

        // ========== 维度卡片 ==========
        const dimStart = data.compareText ? 248 : 242;
        ctx.save();
        ctx.fillStyle = 'rgba(255,255,255,0.88)';
        ctx.shadowColor = 'rgba(0,0,0,0.04)';
        ctx.shadowBlur = 5;
        ctx.shadowOffsetY = 1;
        this._roundRect(ctx, 20, dimStart, W - 40, 148, 12);
        ctx.fill();
        ctx.restore();

        let yOff = dimStart + 18;
        ctx.fillStyle = mc.textDark;
        ctx.font = 'bold 11px -apple-system, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('维度分析', 32, yOff);
        yOff += 16;

        const maxItems = Math.min(data.dimensionList.length, 5);
        for (let i = 0; i < maxItems; i++) {
          const item = data.dimensionList[i];
          ctx.fillStyle = mc.textMid;
          ctx.font = '9px -apple-system, sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText(item.name, 32, yOff + 8);

          // 进度条
          ctx.fillStyle = 'rgba(0,0,0,0.06)';
          this._roundRect(ctx, 100, yOff + 1, W - 140, 7, 3.5);
          ctx.fill();
          const barW = ((W - 140) * Math.min(item.score, 100)) / 100;
          ctx.fillStyle = mc.dimBar;
          this._roundRect(ctx, 100, yOff + 1, barW, 7, 3.5);
          ctx.fill();

          ctx.fillStyle = mc.textDark;
          ctx.font = 'bold 9px -apple-system, sans-serif';
          ctx.textAlign = 'right';
          ctx.fillText(`${item.score}分`, W - 32, yOff + 8);
          yOff += 19;
        }

        // 小结
        const summaryY = dimStart + 166;
        ctx.fillStyle = mc.textDark;
        ctx.font = 'bold 10px -apple-system, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('小结', 32, summaryY);
        ctx.fillStyle = mc.textMid;
        ctx.font = '9px -apple-system, sans-serif';
        const summaryText = data.summary || '宝宝表现不错，继续保持哦！';
        const lines = this._wrapText(ctx, summaryText, W - 64);
        for (let i = 0; i < Math.min(lines.length, 2); i++) {
          ctx.fillText(lines[i], 32, summaryY + 14 + i * 14);
        }

        // ========== 底部品牌 ==========
        ctx.fillStyle = mc.textDark;
        ctx.font = 'bold 11px -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('知芽', W / 2, H - 24);
        ctx.fillStyle = mc.textMid;
        ctx.font = '8px -apple-system, sans-serif';
        ctx.fillText('科学陪伴每一步', W / 2, H - 12);

        // ========== 导出图片 ==========
        setTimeout(() => {
          wx.canvasToTempFilePath({
            canvas,
            success: (res) => {
              wx.hideLoading();
              wx.previewImage({ urls: [res.tempFilePath], showmenu: true });
              wx.showModal({
                title: '分享卡片已生成',
                content: '长按图片可保存或分享给好友',
                showCancel: true,
                cancelText: '关闭',
                confirmText: '保存到相册',
                success: (modalRes) => {
                  if (modalRes.confirm) {
                    wx.saveImageToPhotosAlbum({
                      filePath: res.tempFilePath,
                      success: () => util.showToast('已保存到相册', 'success'),
                      fail: () => util.showToast('保存失败，请长按保存')
                    });
                  }
                }
              });
            },
            fail: () => { wx.hideLoading(); util.showToast('生成失败，请重试'); }
          });
        }, 300);
      };

      // 加载头像图片
      if (avatarSrc) {
        const img = canvas.createImage();
        img.onload = () => drawAll(img);
        img.onerror = () => drawAll(null);
        img.src = avatarSrc;
      } else {
        drawAll(null);
      }
    });
  },

  /** 辅助: 圆角矩形 */
  _roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
  },

  /** 辅助: 文本换行 */
  _wrapText(ctx, text, maxWidth) {
    const lines = [];
    let currentLine = '';
    for (let i = 0; i < text.length; i++) {
      const testLine = currentLine + text[i];
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = text[i];
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) lines.push(currentLine);
    return lines;
  },

  /** PCA 主成分分析：提取头像的 RGB 协方差矩阵第一主成分，返回渐变起止色 + 色调信息 */
  _pcaExtract(avatarSrc) {
    return new Promise((resolve) => {
      const baby = app.globalData.currentBaby;
      const def = {
        gradStart: baby?.gender === 'female' ? '#FFE4EC' : '#D8EEFF',
        gradEnd:   baby?.gender === 'female' ? '#FFCCD5' : '#B8DCF0',
        meanR: 220, meanG: 200, meanB: 210,
        isWarm: baby?.gender === 'female'
      };

      if (!avatarSrc) { resolve(def); return; }

      const query = wx.createSelectorQuery();
      query.select('#colorCanvas').fields({ node: true, size: true }).exec((res) => {
        if (!res[0] || !res[0].node) { resolve(def); return; }
        const cvs = res[0].node;
        const ctx = cvs.getContext('2d');
        const img = cvs.createImage();
        img.onload = () => {
          // 采样 50×50 以获得足够的像素做稳定 PCA
          const S = 50;
          cvs.width = S; cvs.height = S;
          ctx.drawImage(img, 0, 0, S, S);
          try {
            const d = ctx.getImageData(0, 0, S, S).data;
            // 剔除过暗/过亮的背景像素
            const pts = [];
            for (let i = 0; i < S * S; i++) {
              const idx = i * 4;
              const r = d[idx], g = d[idx + 1], b = d[idx + 2];
              const bri = (r + g + b) / 3;
              if (bri > 25 && bri < 240) pts.push([r, g, b]);
            }
            if (pts.length < 30) { resolve(def); return; }

            const n = pts.length;

            // 1) 均值
            let mr = 0, mg = 0, mb = 0;
            for (const p of pts) { mr += p[0]; mg += p[1]; mb += p[2]; }
            mr /= n; mg /= n; mb /= n;

            // 2) 3×3 协方差矩阵 (symmetric)
            let c00 = 0, c01 = 0, c02 = 0, c11 = 0, c12 = 0, c22 = 0;
            for (const p of pts) {
              const dr = p[0] - mr, dg = p[1] - mg, db = p[2] - mb;
              c00 += dr * dr; c01 += dr * dg; c02 += dr * db;
              c11 += dg * dg; c12 += dg * db;
              c22 += db * db;
            }
            c00 /= n; c01 /= n; c02 /= n; c11 /= n; c12 /= n; c22 /= n;

            // 3) 幂迭代求第一特征向量 (PC1)
            let v0 = 1, v1 = 0.5, v2 = 0.3;
            for (let iter = 0; iter < 12; iter++) {
              const n0 = c00 * v0 + c01 * v1 + c02 * v2;
              const n1 = c01 * v0 + c11 * v1 + c12 * v2;
              const n2 = c02 * v0 + c12 * v1 + c22 * v2;
              const len = Math.sqrt(n0 * n0 + n1 * n1 + n2 * n2);
              if (len < 1e-10) break;
              v0 = n0 / len; v1 = n1 / len; v2 = n2 / len;
            }

            // 4) 所有像素沿 PC1 投影，取 min / max 对应的颜色
            let minP = Infinity, maxP = -Infinity;
            let minRGB = [mr, mg, mb], maxRGB = [mr, mg, mb];
            for (const p of pts) {
              const proj = (p[0] - mr) * v0 + (p[1] - mg) * v1 + (p[2] - mb) * v2;
              if (proj < minP) { minP = proj; minRGB = p; }
              if (proj > maxP) { maxP = proj; maxRGB = p; }
            }

            // 5) 把极值颜色柔化 (向白色拉)，保持马卡龙质感
            const soften = (c) => Math.round(c + (255 - c) * 0.55);
            const lift = (c) => Math.round(c + (255 - c) * 0.7);

            const sR = Math.min(255, lift(minRGB[0])), sG = Math.min(255, lift(minRGB[1])), sB = Math.min(255, lift(minRGB[2]));
            const eR = Math.min(255, soften(maxRGB[0])), eG = Math.min(255, soften(maxRGB[1])), eB = Math.min(255, soften(maxRGB[2]));

            const isWarm = mr > mb + 15;  // 暖调判断

            resolve({
              gradStart: `rgb(${sR},${sG},${sB})`,
              gradEnd:   `rgb(${eR},${eG},${eB})`,
              meanR: mr, meanG: mg, meanB: mb,
              isWarm
            });
          } catch (e) { resolve(def); }
        };
        img.onerror = () => resolve(def);
        img.src = avatarSrc;
      });
    });
  },

  /** 基于 PCA 结果生成完整调色板 */
  _buildPalette(pca) {
    const deepR = Math.max(0, Math.round(pca.meanR * 0.5));
    const deepG = Math.max(0, Math.round(pca.meanG * 0.5));
    const deepB = Math.max(0, Math.round(pca.meanB * 0.5));

    // 加深色：徽章背景、进度条
    const badgeBg = `rgb(${Math.round(pca.meanR * 0.7)},${Math.round(pca.meanG * 0.7)},${Math.round(pca.meanB * 0.7)})`;
    const dimBar = `rgb(${Math.max(0, Math.round(pca.meanR * 0.6))},${Math.max(0, Math.round(pca.meanG * 0.6))},${Math.max(0, Math.round(pca.meanB * 0.6))})`;

    // 文字色：深的对比色
    const textDark = `rgb(${deepR},${deepG},${deepB})`;
    const textMid = `rgb(${Math.round(pca.meanR * 0.6)},${Math.round(pca.meanG * 0.6)},${Math.round(pca.meanB * 0.6)})`;

    // 品牌底部色
    const footerR = Math.round(pca.meanR * 0.45 + 100);
    const footerG = Math.round(pca.meanG * 0.45 + 100);
    const footerB = Math.round(pca.meanB * 0.45 + 100);

    return {
      gradStart: pca.gradStart,
      gradEnd: pca.gradEnd,
      badgeBg,
      dimBar,
      textDark,
      textMid,
      footerText: `rgb(${Math.min(255, footerR)},${Math.min(255, footerG)},${Math.min(255, footerB)})`,
      isWarm: pca.isWarm
    };
  },

  /** 跳转跟踪看板 */
  goDashboard() {
    wx.navigateTo({ url: '/pages/dashboard/dashboard' });
  },

  /** 再测一次 */
  retakeQuiz() {
    wx.redirectTo({ url: `/pages/test/quiz?type=${this.data.testType}` });
  }
});
