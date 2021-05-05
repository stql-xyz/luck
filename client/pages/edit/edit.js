// client/pages/edit/edit.js
import COMFUN from '../../utils/comfun';
const APP = getApp();
Page({
  data: {
    prize_id: '',
    cover: '',
    prize_title: '',
    prize_desc: '',
    prize_end: '',
    endTime: '',
    hour_array: new Array(24).fill(0).map((_, i) => `${i}`.padStart(2, '0'))
  },
  async handleUploadImage() {
    wx.showLoading({ title: '图片上传中' });
    try {
      const imageRes = await COMFUN.wxPromise(wx.chooseImage)({
        count: 9,
        sizeType: ['compressed'],
        sourceType: ['album'],
      });
      const { path, size } = imageRes.tempFiles[0];
      if (size > 1024 * 1024 * 0.95) {
        this.stopClickSubmit(); // 取消立即更新
        await COMFUN.wxPromise(wx.showModal)({ title: '图片太大了', content: '请修改后重试', showCancel: false, confirmText: '我知道了' });
        return;
      }
      const suffix = /\.\w+$/.exec(path)[0];
      const { fileID } = await COMFUN.wxPromise(wx.cloud.uploadFile)({
        cloudPath: `cover/${Date.now()}${Math.round(
          Math.random() * 100000
        )}${suffix}`,
        filePath: path,
      });
      this.setData({ cover: fileID });
    } catch (error) {
      COMFUN.showErr({ error, type: 'upload_image' })
    }
    wx.hideLoading();
  },
  async setPrizeData() {
    try {
      const { prize_id, cover, prize_title, prize_desc, prize_end } = this.data;
      if (prize_end.split(' ').length !== 2) {
        wx.showToast({ title: '请设置好结束日期', icon: 'none'});
        return;
      }
      if (!cover) {
        wx.showToast({ title: '请设置好封面', icon: 'none'});
        return;
      }
      if (!prize_title) {
        wx.showToast({ title: '请设置好标题', icon: 'none'});
        return;
      }
      if (!prize_desc) {
        wx.showToast({ title: '请设置好描述', icon: 'none'});
        return;
      }
      const result = await COMFUN.wxPromise(wx.showModal)({
        title: prize_id ? '修改' : '新增',
        content: prize_id ? '确定修改此抽奖内容吗' : '确定新增抽奖吗',
      });
      if (!result.confirm) return;
      wx.showLoading();
      const { _id: user_id } = await APP.getUser();
      const cloud_res = await wx.cloud.callFunction({
        name: 'prize',
        data: {
          $url: 'set_prize',
          user_id,
          prize_id,
          cover,
          prize_end,
          prize_title,
          prize_desc,
        },
      });
      COMFUN.result(cloud_res).success(() => {
        wx.hideLoading();
        wx.showToast({ title: '修改成功' });
        this.getPrizeData(false);
      })
    } catch (error) {
      wx.hideLoading();
      COMFUN.showErr({ type: 'set_prize_dtl', error });
    }
  },
  async getPrizeData(loading = true) {
    const { prize_id } = this.data;
    if (!prize_id) return;
    loading && wx.showLoading();
    try {
      const cloud_res = await wx.cloud.callFunction({
        name: 'prize',
        data: { $url: 'get_prize', prize_id },
      });
      COMFUN.result(cloud_res).success(({ prize_dtl }) => {
        const { cover = '', prize_end, prize_title = '', prize_desc = '' } = prize_dtl;
        this.setData({ cover, prize_end, prize_title, prize_desc });
      })
      this.setEndTime();
    } catch (error) {
      COMFUN.showErr({ type: 'get_prize_dtl', error });
    }
    loading && wx.hideLoading();
  },
  setEndTime() {
    if (!this.data.prize_end) return;
    const for_prize_end = this.data.prize_end.replace(/-/g, '/');
    const betweenTime = new Date(for_prize_end) - new Date();
    let leftSecond = betweenTime / 1000;
    const leftDay = Math.floor(leftSecond / (24 * 60 * 60));
    leftSecond = leftSecond % (24 * 60 * 60);
    const leftHour = Math.floor(leftSecond / (60 * 60));
    this.setData({ endTime: `${leftDay}天 ${leftHour}小时` });
  },
  bindDateChange(e) {
    const { prize_end } = this.data;
    const prize_end_arr = prize_end.split(' ');
    prize_end_arr[0] = e.detail.value;
    this.setData({ prize_end: prize_end_arr.join(' ') });
    this.setEndTime();
  },
  bindHourChange(e) {
    const { prize_end } = this.data;
    const prize_end_arr = prize_end.split(' ');
    prize_end_arr[1] = `${e.detail.value}`.padStart(2, 0) + ':00:00';
    this.setData({ prize_end: prize_end_arr.join(' ') });
    this.setEndTime();
  },
  onLoad: function (options) {
    const { prize_id } = options;
    this.setData({ prize_id }, this.getPrizeData);
  },
})