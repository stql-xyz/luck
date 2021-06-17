// client/pages/share/share.js
import USER from '../../utils/user';
import COMFUN from '../../utils/comfun';
Page({
  data: {
    imgDraw: {}, //绘制图片的大对象
    sharePath: '', //生成的分享图
    avatar_url: '',
    qrcode_url: '',
    paper_url: '',
    nickname: '',
    prize_title: '',
    prize_end: '',
  },
  onLoad({ prize_id, prize_title, prize_end }) {
    this.setData({ prize_id, prize_title, prize_end }, this.init);
  },
  previewImage() {
    const { sharePath } = this.data;
    if (!sharePath) return;
    wx.previewImage({
      urls: [sharePath],
    })
  },
  async init() {
    const user = USER.getUser();
    if (!user) return;
    wx.showLoading({ title: '生成中' });
    this.setData({ nickname: user.nickname });
    try {
        // 二维码fileID
        const page = 'pages/detail/detail';
        const { prize_id } = this.data;
        const cloud_res = await wx.cloud.callFunction({ name: 'user', data: { $url: 'get_qrcode', prize_id, user_id: user._id, page } });
        COMFUN.result(cloud_res);
        const read_file_id = 'cloud://prod-4gb0rayw4833ba54.7072-prod-4gb0rayw4833ba54-1305817567/sys/red.png';
        const fileIdList = [user.avatar_url, cloud_res.result.data, read_file_id];
        const { fileList } = await wx.cloud.getTempFileURL({ fileList: fileIdList });
        const [avatar_url, qrcode_url, paper_url] = fileList.map(item => item.tempFileURL);
        this.setData({ avatar_url, qrcode_url, paper_url });
        this.drawPic();
    } catch (error) {
      console.log(error);
    }
  },
  onImgErr(e) {
    wx.hideLoading()
    wx.showToast({ title: '生成分享图失败，请返回重试' })
  },
  onImgOK(e) {
    wx.hideLoading()
    this.setData({ sharePath: e.detail.path })
  },
  drawPic() {
    this.setData({
      imgDraw: {
        width: '750rpx',
        height: '1130rpx',
        background: '#fa5151',
        views: [
          {
            type: 'image',
            url: this.data.avatar_url,
            css: {
              top: '32rpx',
              left: '328rpx',
              width: '96rpx',
              height: '96rpx',
              borderWidth: '6rpx',
              borderColor: '#FFF',
              borderRadius: '96rpx'
            }
          },
          {
            type: 'text',
            text: this.data.nickname,
            css: {
              top: '160rpx',
              fontSize: '32rpx',
              left: '375rpx',
              align: 'center',
              color: '#FFFFFF'
            }
          },
          {
            type: 'text',
            text: `邀请您参与免费抽奖`,
            css: {
              top: '210rpx',
              left: '375rpx',
              align: 'center',
              fontSize: '40rpx',
              color: '#FFFFFF'
            }
          },
          {
            type: 'rect',
            css: {
              top: '300rpx',
              left: '32rpx',
              right: '32rpx',
              width: '686rpx',
              height: '800rpx',
              color: "#FFFFFF"
            }
          },
          {
            type: 'image',
            url: this.data.paper_url,
            css: {
              top: '328rpx',
              left: '260rpx',
              right: '260rpx',
              width: '230rpx',
              height: '300rpx',
              color: "#8a8a8a"
            }
          },
          {
            type: 'text',
            text: '100元',
            css: {
              top: '500rpx',
              left: '260rpx',
              right: '260rpx',
              width: '230rpx',
              height: '40rpx',
              fontSize: '40rpx',
              fontWeight: '600',
              color: '#ffebac',
              textAlign: 'center',
            }
          },
          {
            type: 'text',
            text: `奖品：${this.data.prize_title}  x 1份`,
            css: {
              top: '680rpx',
              left: '60rpx',
              right: '60rpx',
              width: '630rpx',
              height: '30rpx',
              fontSize: '30rpx',
            }
          },
          {
            type: 'text',
            text: `${this.data.prize_end} 自动开奖`,
            css: {
              top: '726rpx',
              left: '60rpx',
              right: '60rpx',
              width: '630rpx',
              height: '30rpx',
              fontSize: '26rpx',
              color: '#8a8a8a',
            }
          },
          {
            type: 'rect',
            css: {
              top: '786rpx',
              left: '60rpx',
              right: '60rpx',
              width: '630rpx',
              height: '1rpx',
              color: '#d8d8d8',
            }
          },
          {
            type: 'rect',
            css: {
              top: '772rpx',
              left: '18rpx',
              right: '704rpx',
              width: '28rpx',
              height: '28rpx',
              color: '#fa5151',
              borderRadius: '14rpx'
            }
          },
          {
            type: 'rect',
            css: {
              top: '772rpx',
              left: '704rpx',
              right: '18rpx',
              width: '28rpx',
              height: '28rpx',
              color: '#fa5151',
              borderRadius: '14rpx'
            }
          },
          {
            type: 'image',
            url: this.data.qrcode_url,
            css: {
              top: '820rpx',
              left: '275rpx',
              right: '275rpx',
              width: '200rpx',
              height: '200rpx'
            }
          },
          {
            type: 'text',
            text: '长按小程序码参与抽奖',
            css: {
              top: '1040rpx',
              left: '60rpx',
              right: '60rpx',
              width: '630rpx',
              height: '30rpx',
              fontSize: '26rpx',
              textAlign: 'center',
              color: '#8a8a8a',
            }
          },
        ]
      }
    })
  },
  async handleSavePhoto() {
    try {
      await COMFUN.wxPromise(wx.saveImageToPhotosAlbum)({ filePath: this.data.sharePath });
      wx.showToast({ title: '保存成功' })
    } catch (error) {
      const { authSetting } = await COMFUN.wxPromise(wx.getSetting)();
      if (!authSetting['scope.writePhotosAlbum']) {
        const res = await COMFUN.wxPromise(wx.showModal)({ title: '提示', content: '您未开启保存图片到相册的权限，请点击确定去开启权限后重试！' });
        if (res.confirm)  wx.openSetting();
      }
    }
  },
})