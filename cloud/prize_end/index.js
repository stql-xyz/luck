// 云函数入口文件
const cloud = require('wx-server-sdk')
const CryptoJS = require('crypto-js');
const got = require('got');
const nodeXlsx = require('node-xlsx');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database({ throwOnNotFound: false });
const _ = db.command;
const $ = db.command.aggregate;
const log = cloud.logger();

function getNearValue(luck_value, beforeValue, afterValue) {
  if (!beforeValue && !afterValue) {
    throw new Error('');
  } else if (!beforeValue) {
    return afterValue;
  } else if (!afterValue) {
    return beforeValue;
  }
  for(let i=0; i<luck_value.length; i++) {
    const beforeCode = beforeValue.charCodeAt(i);
    const afterCode = afterValue.charCodeAt(i);
    const luckCode = luck_value.charCodeAt(i);
    const beforeDis = Math.abs(beforeCode - luckCode);
    const afterDis = Math.abs(afterCode - luckCode);
    if (beforeDis > afterDis) {
      return afterValue;
    }
    if (beforeDis < afterDis) {
      return beforeValue;
    }
  }
}
// 云函数入口函数
exports.main = async (event, context) => {
  // 获取所有未结束的抽奖
  const { list: prize_list = [] } = await db.collection('prize')
    .aggregate()
    .match({ is_end: _.exists(false) })
    .end();
  // 获取所有待开奖的数据
  const wait_prize_list = prize_list.filter(item => new Date().valueOf() > new Date(item.prize_end).valueOf());
  for (let i = 0; i<wait_prize_list.length; i++) {
    const { _id: prize_id } = wait_prize_list[i];
    const md5Chche = new Map();
    const getMd5 = (key) => {
      if (!md5Chche.has(key)) {
        const md5 = CryptoJS.MD5(key).toString();
        md5Chche.set(key, md5);
      }
      return md5Chche.get(key);
    }
    try {
      const { list = [] } = await db.collection('prize_user')
        .aggregate()
        .match({ prize_id })
        .project({ prize_code: true })
        .group({ _id: null, prize_code: $.push('$prize_code' )})
        .end();
      const { prize_code = [] } = list[0] || {};
      const md5_list = prize_code.map(item => getMd5(item));
      /** 获取luck_key */
      const url = 'https://stock.xueqiu.com/v5/stock/realtime/quotec.json?symbol=SH000001';
      const { body } = await got(url);
      const { data: [result = {}] = []} = JSON.parse(body);
      const current = Number(result.current).toFixed(2);
      await db.collection('prize').doc(prize_id).update({ data: { end_factor: current, end_factor_time: db.serverDate() } });
      /** md5处理 并获取最接近luck_value的md5值 */
      const luck_value = getMd5(current);
      md5_list.push(luck_value);
      md5_list.sort();
      const index = md5_list.findIndex(item => item === luck_value);
      const luck_prize_md5 = getNearValue(luck_value, md5_list[index - 1], md5_list[index + 1]);
      /** 根据md5找到该用户 */
      const end_luck_code = prize_code.find(item => getMd5(item) === luck_prize_md5);
      const { data: [luck_user = {}] = []} = await db.collection('prize_user').where({ prize_code: end_luck_code }).get();
      const { user_id: end_luck_user_id } = luck_user;
      await db.collection('prize').doc(prize_id).update({ data: { end_luck_user_id, end_luck_code } });
      /** 保存当前生成数据过程 */
      const date = new Date();
      const year = date.getFullYear();
      const month = `${date.getMonth() + 1}`.padStart(2, 0);
      const day = `${date.getDate()}`.padStart(2, 0);
      const hour = `${date.getHours()}`.padStart(2, 0);
      const min = `${date.getMinutes()}`.padStart(2, 0);
      const sec = `${date.getSeconds()}`.padStart(2, 0);
      const time_str = `${year}-${month}-${day} ${hour}:${min}:${sec}`;
      const xlsx_data = [];
      xlsx_data.push(['中奖用户(中奖码)', '对应的md5']);
      xlsx_data.push([end_luck_code, getMd5(end_luck_code)]);
      xlsx_data.push(['最新一次上证指数（随机因子）', '对应的md5', '获取时间']);
      xlsx_data.push([current, getMd5(current), time_str]);
      xlsx_data.push(['中奖码', '对应的md5']);
      prize_code.forEach(item => {
        xlsx_data.push([item, getMd5(item)]);
      });
      const fileContent =  nodeXlsx.build([
        { name:'原始数据', data:xlsx_data }
      ]);
      const { fileID } = await cloud.uploadFile({
        cloudPath: `rawdata/${prize_id}_${new Date().valueOf()}.xlsx`,
        fileContent
      });
      await db.collection('prize').doc(prize_id).update({ data: { is_end: true, end_raw_data: fileID } });
      md5Chche.clear();
    } catch (error) {
      log.error({ name: 'prize_end', error });
    }
  };
  log.error({ name: '执行成功', length: wait_prize_list.length });
  return {}
}