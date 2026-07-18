// 云函数：initDB - 初始化数据库集合
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

// 需要创建的三个集合
const COLLECTIONS = ['users', 'babies', 'test_records'];

exports.main = async () => {
  const results = [];
  for (const name of COLLECTIONS) {
    try {
      await db.createCollection(name);
      results.push({ collection: name, status: 'created' });
    } catch (e) {
      // errCode -502003 表示集合已存在
      if (e.errCode === -502003) {
        results.push({ collection: name, status: 'already_exists' });
      } else {
        results.push({ collection: name, status: 'error', message: e.message });
      }
    }
  }
  return { success: true, results };
};
