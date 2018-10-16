//index.js
const app = getApp()

Page({
  data: {
    from: 0,
    limit: 20,
    end: false,
    keywords: '',
    inputValue: '',
    bookList: [],
    loading: true
  },
  onLoad: function () {
    if (!wx.cloud) {
      return
    }

    wx.showShareMenu({
      withShareTicket: true
    })
  },
  init() {
    wx.cloud.callFunction({
      name: 'login',
      data: {},
      success: res => {
        app.globalData.openId = res.result.openid; //注意此处小写
        wx.getUserInfo({
          success: res => {
            app.globalData.userInfo = res.userInfo;
            this.setData({
              from: 0,
              end: false,
              bookList: [],
              loading: true
            })
            this.getBooks();
          }
        })
      },
      fail: err => {
        wx.navigateTo({
          url: '/pages/login/index',
        })
      }
    });
  },
  refresh: function () {
    this.setData({
      from: 0,
      limit: 20,
      end: false,
      keywords: '',
      inputValue: '',
      bookList: [],
      loading: true
    });
    getCurrentPages().reverse()[0].onShow();
  },
  onShow: function () {
    this.init();
  },
  onPullDownRefresh: function (e) {
    this.refresh();
    wx.stopPullDownRefresh();
  },
  onReachBottom: function (e) {
    if (this.data.end) return;
    this.setData({
      from: this.data.from + this.data.limit
    })
    this.getBooks();
  },
  addGroup:function(e){
    wx.navigateTo({
      url: '/pages/theGroup/index'
    })
  },
  bindKeyInput: function (e) {
    this.setData({
      inputValue: e.detail.value
    })
  },
  scrolling: function (e) {

  },
  searchBooks: function () {
    this.setData({
      end: false,
      from: 0,
      keywords: this.data.inputValue,
      bookList: [],
      loading: true
    });
    this.getBooks()
  },
  getMoreInfo: function (e) {
    //传参
    wx.navigateTo({
      url: '/pages/theLib/index?uid=' + e.currentTarget.dataset.uid
    })
  },
  getUserInfoFromDB() {
    const db = wx.cloud.database();
    return db.collection('users').where({
      _openid: app.globalData.openId
    }).get().catch(err=>{
      console.error(err);
      //error
      this.setData({
        loading:false
      })
    })
  },
  getUsersByGroup(groups) {
    if (!groups || groups.length == 0) {
      return Promise.resolve()
    }
    return wx.cloud.callFunction({
      name: 'getOpenIdsByGroups',
      data: {
        groups
      }
    }).catch(err => {
      console.error(err);
      //error
      this.setData({
        loading: false
      })
    });
  },
  getBooks() {
    this.getUserInfoFromDB().then(uRes => {
      let userInfo = uRes && uRes.data && uRes.data[0];
      if (!userInfo) {
        //error
        this.setData({
          loading: false
        })
        return Promise.reject();
      }
      let {
        groups
      } = userInfo;
      this.getUsersByGroup(groups).then(oRes => {
        let myLeague;
        if (!oRes || !oRes.result) {
          myLeague=[app.globalData.openId];
        }else{
          myLeague=oRes.result;
        }
        wx.setStorage({
          key: 'myLeague',
          data: myLeague,
          complete: console.log
        })
        this.getBooksFromDB(myLeague);
      })
    });
  },
  getBooksFromDB(openIds) {
    if (this.data.end) return;
    const db = wx.cloud.database();
    const _ = db.command;
    let collections = db.collection('books');
    let filterObj = {
      _openid: _.in(openIds)
    }

    if (this.data.keywords) {
      filterObj.title = this.data.keywords
    }
    collections = collections.where(filterObj);
    if (this.data.from > 0) {
      collections = collections.skip(this.data.from)
    }
    collections.limit(this.data.limit).orderBy(
      'createAt', 'desc'
    ).get({
      success: res => {
        if (!res.data || res.data.length == 0) {
          this.setData({
            end: true
          })
          return;
        }

        let books = res.data.map(ele => {
          let theDate = new Date(ele.createAt);
          let theDateArr = [theDate.getFullYear(), theDate.getMonth() + 1, theDate.getDate()];
          return {
            image: ele.image,
            title: ele.title,
            author: ele.author && ele.author.join(','),
            createAt: theDateArr.join('-'),
            openId: ele._openid,
            userInfo: ele.userInfo
          }
        });

        this.setData({
          bookList: this.data.bookList.concat(books)
        });
        //必须分开，否则不渲染booklist？？
        if (res.data.length <= limit) {
          this.setData({
            end: true
          })
        }
      },
      fail: err => {},
      complete: () => {
        this.setData({
          loading: false
        })
      }
    })
  }
})