// 云函数入口文件
const cloud = require('wx-server-sdk');
const TcbRouter = require('tcb-router');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database({ throwOnNotFound: false });
const _ = db.command;
const $ = db.command.aggregate;
const log = cloud.logger();

// 云函数入口函数
exports.main = async (event, context) => {
  const app = new TcbRouter({ event });
  const { user_id, prize_id } = event;

  app.router('get_prize', async (ctx) => {
    try {
      const { data } = await db.collection('prize').doc(prize_id).get();
      ctx.body = { ok: true, data };
    } catch (error) {
      log.error({ name: 'get_prize', error });
		  ctx.body = { ok: false };
    }
	});
  
  app.router('set_prize', async (ctx) => {
    const { covers = [], prize_title, prize_desc } = event;
    try {
      if (!prize_id) {
        await db.collection('prize').add({ data: { covers, prize_title, prize_desc }});
      } else {
        await db.collection('prize').doc(prize_id).update({ data: { covers, prize_title, prize_desc }});
      }
      ctx.body = { ok: true };
    } catch (error) {
      console.log(error, event);
      log.error({ name: 'set_prize', error });
      ctx.body = { ok: false };
    }
  });

  app.router('get_prize_user', async (ctx) => {
    try {
      const { total, limit } = event;
      const { list = [] } = await db.collection('prize_user')
        .aggregate()
        .match({ prize_id })
        .sort({ prize_time: 1 })
        .skip(total)
        .limit(limit)
    		.lookup({ from: 'user', localField: 'user_id', foreignField: '_id', as: 'userinfo' })
        .addFields({ user_info: $.arrayElemAt(['$userinfo', 0]) })
        .addFields({
          'user_info.prize_key': $.concat(['$prize_key', '_', $.dateToString({
            date: '$prize_time',
            format: '%Y-%m-%d_%H:%M:%S'
          })])
        })
        .replaceRoot({ newRoot: '$user_info' })
        .project({ _id: true, prize_key: true, avatar_url: true })
        .group({
          _id: '$_id',
          avatar_url: $.first('$avatar_url'),
          prize_key: $.push('$prize_key'),
        })
        .end();
      ctx.body = { ok: true, data: list };
    } catch (error) {
      log.error({ name: 'get_prize_user', error });
		  ctx.body = { ok: false };
    }
  });
  
  app.router('get_prize_user_count', async (ctx) => {
    try {
      const { list = [] } = await db.collection('prize_user')
        .aggregate()
        .match({ prize_id })
    		.lookup({ from: 'user', localField: 'user_id', foreignField: '_id', as: 'userinfo' })
        .addFields({ user_info: $.arrayElemAt(['$userinfo', 0]) })
        .replaceRoot({ newRoot: '$user_info' })
        .group({ _id: '$_id' })
        .group({  _id: null, count: $.sum(1) })
        .project({ _id: false })
        .end();
      const { count = 0 } = list[0] || {};
      ctx.body = { ok: true, data: count };
    } catch (error) {
      log.error({ name: 'get_prize_user_count', error });
		  ctx.body = { ok: false };
    }
  })

  app.router('get_prize_cur', async (ctx) => {
    try {
      const { list = [] } = await db.collection('prize_user')
        .aggregate()
        .match({ prize_id, user_id })
    		.lookup({ from: 'user', localField: 'user_id', foreignField: '_id', as: 'userinfo' })
        .addFields({ user_info: $.arrayElemAt(['$userinfo', 0]) })
        .addFields({
          'user_info.prize_key': $.concat(['$prize_key', '_', $.dateToString({
            date: '$prize_time',
            format: '%Y-%m-%d_%H:%M:%S'
          })])
        })
        .replaceRoot({ newRoot: '$user_info' })
        .project({ _id: true, prize_key: true, avatar_url: true })
        .group({
          _id: '$_id',
          avatar_url: $.first('$avatar_url'),
          prize_key: $.push('$prize_key'),
        })
        .end();
      ctx.body = { ok: true, data: list[0] || {} };
    } catch (error) {
      log.error({ name: 'get_prize_cur', error });
		  ctx.body = { ok: false };
    }
  })

  app.router('set_prize_join', async (ctx) => {
    try {
      const { prize_id } = event;
      const { total: prize_total } = await db.collection('prize_user').where({ prize_id }).count();
      await db.collection('prize_user').add({
        data: {
          user_id,
          prize_id,
          prize_key: `${prize_total + 1}`.padStart(6, 0),
          prize_time: db.serverDate(),
        },
      });
      ctx.body = { ok: true };
    } catch (error) {
      console.log(error);
      log.error({ name: 'set_prize_join', error });
		  ctx.body = { ok: false };
    }
  })

  return app.serve(); // 必需返回
}