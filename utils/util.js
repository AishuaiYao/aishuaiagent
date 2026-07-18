/**
 * 通用工具函数
 */

/** 计算月龄 */
function calcBabyAge(birthday) {
  const birth = new Date(birthday);
  const now = new Date();
  const yearDiff = now.getFullYear() - birth.getFullYear();
  const monthDiff = now.getMonth() - birth.getMonth();
  const totalMonths = yearDiff * 12 + monthDiff;
  return totalMonths;
}

/** 格式化日期 YYYY-MM-DD */
function formatDate(date) {
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** 格式化日期时间 */
function formatDateTime(date) {
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const h = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${day} ${h}:${min}`;
}

/** 手机号脱敏 */
function maskPhone(phone) {
  if (!phone || phone.length < 11) return phone;
  return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
}

/** 性别映射 */
const genderMap = { male: '男宝宝', female: '女宝宝', '': '未设置' };
const genderIconMap = { male: '👦', female: '👧', '': '👶' };

/** 测试类型映射 */
const testTypeMap = {
  attention: { name: '注意力测试', icon: '🔍', color: '#A8D8EA' },
  attachment: { name: '亲子依恋测试', icon: '💕', color: '#FFD3B4' },
  temperament: { name: '气质类型测试', icon: '🌈', color: '#C7CEEA' }
};

/** 深拷贝 */
function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

/** 显示 loading */
function showLoading(title = '加载中...') {
  wx.showLoading({ title, mask: true });
}

/** 隐藏 loading */
function hideLoading() {
  wx.hideLoading();
}

/** 显示 toast */
function showToast(title, icon = 'none') {
  wx.showToast({ title, icon, duration: 2000 });
}

module.exports = {
  calcBabyAge,
  formatDate,
  formatDateTime,
  maskPhone,
  genderMap,
  genderIconMap,
  testTypeMap,
  deepClone,
  showLoading,
  hideLoading,
  showToast
};
