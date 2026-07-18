/**
 * 云开发数据库操作工具
 */
const db = wx.cloud.database();
const _ = db.command;

const collections = {
  users: db.collection('users'),
  babies: db.collection('babies'),
  test_records: db.collection('test_records')
};

module.exports = {
  db,
  _,
  collections,

  /** 获取当前用户 */
  async getUser() {
    const { result } = await wx.cloud.callFunction({
      name: 'getOpenId'
    }).catch(() => ({ result: null }));
    if (!result) return null;
    const { data } = await collections.users.where({ openId: result.openId }).get();
    return data[0] || null;
  },

  /** 创建或更新用户 */
  async upsertUser(openId, info = {}) {
    const { data } = await collections.users.where({ openId }).get();
    if (data.length > 0) {
      await collections.users.doc(data[0]._id).update({ data: info });
      return data[0]._id;
    } else {
      const res = await collections.users.add({
        data: { openId, ...info, createdAt: new Date() }
      });
      return res._id;
    }
  },

  /** 获取用户的所有宝宝 */
  async getBabies(userId) {
    const { data } = await collections.babies.where({ userId }).orderBy('isCurrent', 'desc').get();
    return data;
  },

  /** 添加宝宝 */
  async addBaby(data) {
    return await collections.babies.add({ data });
  },

  /** 更新宝宝 */
  async updateBaby(babyId, data) {
    return await collections.babies.doc(babyId).update({ data });
  },

  /** 删除宝宝 */
  async removeBaby(babyId) {
    return await collections.babies.doc(babyId).remove();
  },

  /** 切换当前宝宝 */
  async switchCurrentBaby(userId, babyId) {
    // 先将所有宝宝的 isCurrent 设为 false
    const { data: allBabies } = await collections.babies.where({ userId }).get();
    for (const baby of allBabies) {
      await collections.babies.doc(baby._id).update({
        data: { isCurrent: baby._id === babyId }
      });
    }
  },

  /** 保存测试记录 */
  async saveTestRecord(data) {
    return await collections.test_records.add({ data });
  },

  /** 获取宝宝测试记录 */
  async getTestRecords(babyId, testType = '') {
    let query = collections.test_records.where({ babyId });
    if (testType) {
      query = collections.test_records.where({ babyId, testType });
    }
    const { data } = await query.orderBy('completedAt', 'desc').get();
    return data;
  },

  /** 获取用户所有测试记录 */
  async getAllTestRecords(userId) {
    const { data } = await collections.test_records
      .where({ userId })
      .orderBy('completedAt', 'desc')
      .get();
    return data;
  }
};
