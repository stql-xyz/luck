// 云函数入口文件
const cloud = require('wx-server-sdk');
const got = require('got');
const TcbRouter = require('tcb-router');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database({ throwOnNotFound: false });
const log = cloud.logger();

// 基于base62编码生成14位的ID字符串
// 优点：短/按时间序/双击可全选/唯一性足够安全
const codeStr = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"
function base62encode(v, n){
  var ret = ""
  for(var i=0;i<n;i++){
    ret = codeStr[v%codeStr.length] + ret
    v = Math.floor(v/codeStr.length)
  }
  return ret
}
function getId() {
  var ret = ''
  var ms = (new Date()).getTime()
  ret += base62encode(ms, 8) // 6923年循环一次
  ret += base62encode(Math.ceil(Math.random() * (62**6)), 6) // 冲突概率为每毫秒568亿分之一
  return ret
}

// 云函数入口函数
exports.main = async (event) => {
	const app = new TcbRouter({ event });
	const { user_id } = event;

	app.router('get_qrcode', async (ctx) => {
    const { page, prize_id } = event;
    try {
      const user_share_id = getId();
      db.collection('user_share').add({ data: { _id: user_share_id, prize_id, user_id, create_time: db.serverDate() }}).then(() => {});
      const { buffer } = await cloud.openapi.wxacode.getUnlimited({ page, scene: user_share_id });
      const { fileID } = await cloud.uploadFile({ cloudPath: `qrcode/${user_share_id}.png`, fileContent: buffer });
      ctx.body = { ok: true, data: fileID };
    } catch (error) {
      log.error({ name: 'get_qrcode', error });
			ctx.body = { ok: false };
    }
  });

	app.router('set_userInfo', async (ctx) => {
		try {
			const { userInfo = {} } = event;
			const { avatarUrl, nickName } = userInfo;
			const fileContent = await got(avatarUrl).buffer();
			const { fileID } = await cloud.uploadFile({ cloudPath: `avatar/${user_id}_${new Date().valueOf()}.jpeg`, fileContent });
			const user = { ...userInfo, avatar_url: fileID, nickname: nickName };
			delete user.avatarUrl;
			delete user.nickName;
			await db.collection('user').doc(user_id).update({ data: { ...user }});
			ctx.body = { ok: true };
		} catch (error) {
			log.error({ name: 'set_userInfo', error });
			ctx.body = { ok: false };
		}
	});
	return app.serve(); // 必需返回
};