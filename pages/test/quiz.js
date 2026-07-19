const testData = require('../../utils/testData');
const util = require('../../utils/util');
const cloud = require('../../utils/cloud');
const app = getApp();

Page({
  data: {
    testType: '',
    testInfo: null,
    questions: [],
    currentIndex: 0,
    currentQuestion: null,
    totalQuestions: 0,
    selectedValue: null,
    answers: {},
    progress: 0,
    isLastQuestion: false,
    theme: {}
  },

  onLoad(options) {
    this.setData({ theme: app.getTheme() });
    const type = options.type;
    const info = testData[type];
    if (!info) {
      util.showToast('测试类型不存在');
      setTimeout(() => wx.navigateBack(), 1500);
      return;
    }
    // 动态设置导航栏标题为对应测试名
    const testName = util.testTypeMap[type]?.name || info.name || '测试答题';
    wx.setNavigationBarTitle({ title: testName });

    const questions = info.questions;
    this.setData({
      testType: type,
      testInfo: info,
      questions,
      totalQuestions: questions.length,
      currentQuestion: questions[0]
    });
  },

  /** 选择选项（自动跳下一题） */
  selectOption(e) {
    const value = Number(e.currentTarget.dataset.value);
    const index = this.data.currentIndex;
    const answers = { ...this.data.answers };

    // 更新答案
    answers[`q${index}`] = value;

    this.setData({
      selectedValue: value,
      answers
    });

    // 最后一题不自动跳转，等待用户点击提交
    if (this.data.isLastQuestion) return;

    // 短暂延迟后自动跳到下一题（给用户视觉反馈时间）
    clearTimeout(this._autoNextTimer);
    this._autoNextTimer = setTimeout(() => {
      this.nextQuestion();
    }, 300);
  },

  /** 上一题 */
  prevQuestion() {
    const prevIndex = this.data.currentIndex - 1;
    if (prevIndex < 0) return;

    const questions = this.data.questions;
    const progress = Math.round((prevIndex / this.data.totalQuestions) * 100);

    this.setData({
      currentIndex: prevIndex,
      currentQuestion: questions[prevIndex],
      selectedValue: this.data.answers[`q${prevIndex}`] || null,
      progress,
      isLastQuestion: prevIndex === this.data.totalQuestions - 1
    });
  },

  /** 下一题 */
  nextQuestion() {
    const nextIndex = this.data.currentIndex + 1;
    if (nextIndex >= this.data.totalQuestions) return;

    const questions = this.data.questions;
    const progress = Math.round((nextIndex / this.data.totalQuestions) * 100);

    this.setData({
      currentIndex: nextIndex,
      currentQuestion: questions[nextIndex],
      selectedValue: this.data.answers[`q${nextIndex}`] || null,
      progress,
      isLastQuestion: nextIndex === this.data.totalQuestions - 1
    });
  },

  /** 提交答案 */
  async submitAnswers() {
    // 检查是否所有题都答了
    const answered = Object.keys(this.data.answers).length;
    if (answered < this.data.totalQuestions) {
      wx.showModal({
        title: '提示',
        content: `还有 ${this.data.totalQuestions - answered} 题未作答，确定要提交吗？`,
        success: (res) => {
          if (res.confirm) this.doSubmit();
        }
      });
      return;
    }
    this.doSubmit();
  },

  /** 执行提交 */
  async doSubmit() {
    util.showLoading('正在生成结果...');
    try {
      const { testType, testInfo, answers, questions } = this.data;
      const baby = app.globalData.currentBaby;
      const userInfo = app.globalData.userInfo;

      // 计算得分
      const { scores, dimensions, summary, suggestions } = this.calcScores();

      const record = {
        userId: userInfo?._id || '',
        babyId: baby?._id || '',
        testType,
        testName: testInfo.name,
        completedAt: new Date(),
        babyAgeMonths: util.calcBabyAge(baby?.birthday),
        scores,
        dimensions,
        summary,
        suggestions,
        isShared: false
      };

      // 保存到云端
      const res = await cloud.saveTestRecord(record);
      record._id = res._id;

      util.hideLoading();

      // 跳转结果页
      const recordStr = encodeURIComponent(JSON.stringify(record));
      wx.redirectTo({
        url: `/pages/test/result?type=${testType}&record=${recordStr}`
      });
    } catch (e) {
      util.hideLoading();
      console.error('保存记录失败:', e);
      util.showToast('提交失败，请重试');
    }
  },

  /** 计算得分 */
  calcScores() {
    const { testType, testInfo, answers, questions } = this.data;
    let scores = {};
    let dimensions = {};
    let summary = '';
    let suggestions = [];

    if (testType === 'attention') {
      const cats = testInfo.categories;
      scores = { sustained: 0, selective: 0, shifting: 0 };
      for (const cat of Object.keys(cats)) {
        for (const qId of cats[cat].questions) {
          const val = answers[`q${qId - 1}`] || 0;
          scores[cat] += val;
        }
      }
      const total = scores.sustained + scores.selective + scores.shifting;
      const maxTotal = 75; // 15 questions * 5
      const overall = Math.round((total / maxTotal) * 100);

      dimensions = {
        focus: overall,
        emotion: 50,
        social: 50,
        sensory: Math.round((scores.sustained / 25) * 100)
      };

      if (overall >= 80) summary = '宝宝注意力发展优秀，专注力很强！';
      else if (overall >= 60) summary = '宝宝注意力发展良好，继续加油！';
      else summary = '宝宝注意力正在发展中，可以通过游戏来提升。';

      suggestions = [
        '每天和宝宝一起阅读绘本 10-15 分钟',
        '减少接触电子屏幕的时间',
        '玩"找不同""拼图"等专注力游戏',
        '为宝宝创造安静、有序的游戏环境'
      ];
    } else if (testType === 'attachment') {
      const securityQuestions = [2, 3, 4, 6, 8, 9, 10];
      const avoidanceQuestions = [1, 5];
      const resistanceQuestions = [7];
      let securityScore = 0, avoidanceScore = 0, resistanceScore = 0;

      for (const qId of securityQuestions) {
        securityScore += answers[`q${qId - 1}`] || 0;
      }
      for (const qId of avoidanceQuestions) {
        avoidanceScore += answers[`q${qId - 1}`] || 0;
      }
      for (const qId of resistanceQuestions) {
        resistanceScore += answers[`q${resistanceQuestions[0] - 1}`] || 0;
      }

      const maxSecurity = 35, maxAvoidance = 10, maxResistance = 5;
      scores = {
        security: Math.round((securityScore / maxSecurity) * 100),
        avoidance: Math.round((avoidanceScore / maxAvoidance) * 100),
        resistance: Math.round((resistanceScore / maxResistance) * 100)
      };

      const overall = scores.security;

      dimensions = {
        focus: 50,
        emotion: overall,
        social: Math.round((scores.security * 0.6) + ((100 - scores.avoidance) * 0.4)),
        sensory: 50
      };

      if (overall >= 80) summary = '宝宝表现出安全型依恋，亲子关系亲密稳固！';
      else if (overall >= 60) summary = '宝宝依恋关系总体良好，可以多增加亲密互动。';
      else summary = '建议增加亲子互动时间，建立更稳固的情感连接。';

      suggestions = [
        '多给宝宝温暖的拥抱和亲吻',
        '及时回应宝宝的需求信号',
        '每天固定亲子游戏时间',
        '在宝宝探索时给予积极的眼神和微笑鼓励'
      ];
    } else if (testType === 'temperament') {
      const cats = testInfo.categories;
      scores = {};
      for (const catKey of Object.keys(cats)) {
        let catScore = 0;
        for (const qId of cats[catKey].questions) {
          catScore += answers[`q${qId - 1}`] || 0;
        }
        scores[catKey] = Math.round((catScore / cats[catKey].maxScore) * 100);
      }

      const overall = Math.round(Object.values(scores).reduce((a, b) => a + b, 0) / Object.keys(scores).length);

      dimensions = {
        focus: scores.persistence,
        emotion: scores.mood,
        social: scores.approach,
        sensory: scores.threshold
      };

      if (overall >= 70) summary = '宝宝属于易养型气质，适应能力强！';
      else if (overall >= 50) summary = '宝宝气质温和，对新事物需要一些适应时间。';
      else summary = '宝宝可能需要更多耐心引导，每个宝宝都有独特的气质。';

      suggestions = [
        '尊重宝宝天生的气质特点，因材施教',
        '为宝宝建立规律的生活作息',
        '面对新环境时给予充足的适应时间',
        '多鼓励宝宝表达自己的感受'
      ];
    }

    return { scores, dimensions, summary, suggestions };
  }
});
