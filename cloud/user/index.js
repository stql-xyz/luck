// 云函数入口文件
const cloud = require('wx-server-sdk');
const got = require('got');
const TcbRouter = require('tcb-router');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database({ throwOnNotFound: false });
const log = cloud.logger();

// 云函数入口函数
exports.main = async (event) => {
	const app = new TcbRouter({ event });
	const { user_id } = event;

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