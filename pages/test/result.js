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
    scoreLevel: '',
    badgeColor: '',
    compareText: '',
    summary: '',
    suggestions: [],
    dimensionList: [],
    dimensionsData: null,
    recordId: ''
  },

  async onLoad(options) {
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
      badgeColor = '#A8D8EA';
    } else if (overallScore >= 70) {
      scoreLevel = '良好';
      badgeColor = '#C7CEEA';
    } else if (overallScore >= 55) {
      scoreLevel = '一般';
      badgeColor = '#FFD3B4';
    } else {
      scoreLevel = '待提升';
      badgeColor = '#8A9BAA';
    }

    // 维度列表
    const dimColors = ['#A8D8EA', '#FFD3B4', '#C7CEEA', '#B5E0D0', '#F0C8D0', '#B0D8F0', '#D8C8E0', '#E8D0C0', '#D0E0D8'];
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

    // 查找历史记录进行比较
    this.loadHistoryCompare(type);

    // 延迟绘制雷达图
    if (dimensions) {
      setTimeout(() => this.drawRadar(), 500);
    }
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
        ctx.fillStyle = 'rgba(168, 216, 234, 0.25)';
        ctx.fill();
        ctx.strokeStyle = '#A8D8EA';
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
          ctx.fillStyle = '#A8D8EA';
          ctx.fill();
          ctx.beginPath();
          ctx.arc(x, y, 8, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(168, 216, 234, 0.15)';
          ctx.fill();
        }
      });
  },

  /** 保存/分享卡片 (Canvas 绘制分享图) */
  shareCard() {
    wx.showLoading({ title: '生成中...' });

    // 创建一个离屏 Canvas 绘制分享卡片
    const query = wx.createSelectorQuery();
    query.select('#shareCanvas')
      .fields({ node: true, size: true })
      .exec((res) => {
        if (!res[0] || !res[0].node) {
          wx.hideLoading();
          util.showToast('生成失败，请重试');
          return;
        }
        const canvas = res[0].node;
        const ctx = canvas.getContext('2d');
        const dpr = wx.getSystemInfoSync().pixelRatio;
        const w = res[0].width;
        const h = res[0].height;
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        ctx.scale(dpr, dpr);

        const data = this.data;

        // 背景
        const grad = ctx.createLinearGradient(0, 0, w, h);
        grad.addColorStop(0, '#F0F8FB');
        grad.addColorStop(1, '#FFFFFF');
        ctx.fillStyle = grad;
        this._roundRect(ctx, 0, 0, w, h, 20);
        ctx.fill();

        // 顶部标题
        ctx.fillStyle = '#1A2A3A';
        ctx.font = 'bold 18px -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(data.testName, w / 2, 50);

        // 日期 + 月龄
        ctx.fillStyle = '#8A9BAA';
        ctx.font = '12px -apple-system, sans-serif';
        ctx.fillText(`${data.completedAt} · ${data.babyAge}个月`, w / 2, 76);

        // 分数
        ctx.fillStyle = '#1A2A3A';
        ctx.font = 'bold 48px -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(data.overallScore.toString(), w / 2, 145);

        ctx.fillStyle = '#4A5B6E';
        ctx.font = '14px -apple-system, sans-serif';
        ctx.fillText('分', w / 2 + 35, 145);

        // 等级徽章
        ctx.fillStyle = data.badgeColor;
        this._roundRect(ctx, w / 2 - 40, 158, 80, 28, 14);
        ctx.fill();
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 13px -apple-system, sans-serif';
        ctx.fillText(data.scoreLevel, w / 2, 178);

        // 比较
        if (data.compareText) {
          ctx.fillStyle = '#A8D8EA';
          ctx.font = '12px -apple-system, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(data.compareText, w / 2, 210);
        }

        // 维度分析
        let yOffset = 240;
        ctx.fillStyle = '#1A2A3A';
        ctx.font = 'bold 14px -apple-system, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('维度分析', 30, yOffset);
        yOffset += 22;

        const maxItems = Math.min(data.dimensionList.length, 5);
        for (let i = 0; i < maxItems; i++) {
          const item = data.dimensionList[i];
          ctx.fillStyle = '#4A5B6E';
          ctx.font = '12px -apple-system, sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText(item.name, 30, yOffset + 14);

          // 进度条背景
          ctx.fillStyle = '#E8ECF0';
          this._roundRect(ctx, 130, yOffset + 5, w - 160, 10, 5);
          ctx.fill();

          // 进度条
          const barW = ((w - 160) * Math.min(item.score, 100)) / 100;
          ctx.fillStyle = item.color;
          this._roundRect(ctx, 130, yOffset + 5, barW, 10, 5);
          ctx.fill();

          ctx.fillStyle = '#4A5B6E';
          ctx.font = 'bold 12px -apple-system, sans-serif';
          ctx.textAlign = 'right';
          ctx.fillText(`${item.score}分`, w - 30, yOffset + 14);

          yOffset += 30;
        }

        // 小结
        yOffset += 10;
        ctx.fillStyle = '#1A2A3A';
        ctx.font = 'bold 14px -apple-system, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('小结', 30, yOffset);
        yOffset += 20;

        ctx.fillStyle = '#4A5B6E';
        ctx.font = '12px -apple-system, sans-serif';
        const summaryText = data.summary || '';
        const maxLineW = w - 60;
        const summaryLines = this._wrapText(ctx, summaryText, maxLineW);
        for (const line of summaryLines.slice(0, 3)) {
          ctx.fillText(line, 30, yOffset);
          yOffset += 18;
        }

        // 底部
        yOffset = h - 40;
        ctx.fillStyle = '#8A9BAA';
        ctx.font = '10px -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('宝宝成长度量 · 科学陪伴每一步', w / 2, yOffset);

        // 转为图片
        setTimeout(() => {
          wx.canvasToTempFilePath({
            canvas,
            success: (res) => {
              wx.hideLoading();
              wx.previewImage({
                urls: [res.tempFilePath],
                showmenu: true
              });
              // 也可引导保存到相册
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
            fail: () => {
              wx.hideLoading();
              util.showToast('生成失败，请重试');
            }
          });
        }, 300);
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

  /** 跳转跟踪看板 */
  goDashboard() {
    wx.navigateTo({ url: '/pages/dashboard/dashboard' });
  },

  /** 再测一次 */
  retakeQuiz() {
    wx.redirectTo({ url: `/pages/test/quiz?type=${this.data.testType}` });
  }
});
