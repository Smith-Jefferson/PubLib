// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init();

const db = cloud.database();

// 云函数入口函数
exports.main = async (event, context) => {
    let {
        userInfo,
        briefUserInfo, //为了区别于自带的userInfo,briefUserInfo中没有openId
        groupInfo
    } = event;
    let {
        openId
    } = userInfo;
    //添加到数据库

    try {
        let myInfo = await db.collection('users').where({
            _openid: openId
        }).get();
        if (myInfo && myInfo.data && myInfo.data.length > 0) {
            return true;
        }
        let tobeStored = {
            _openid: openId,
            createAt: db.serverDate(),
            userInfo: briefUserInfo,
            groups: groupInfo ? [groupInfo] : [],
            contact: {}
        };
        let savedInfo = await db.collection('users').add({
            data: tobeStored
        });
        if (!savedInfo) {
            return false;
        }
        return true;
    } catch (err) {
        console.error(err);
        return false;
    }
}