// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init();

const db = cloud.database();
const _ = db.command;


// 云函数入口函数
exports.main = async (event, context) => {
    console.log('event', event)
    let {
        userInfo,
        groupInfo
    } = event;
    let {
        openId
    } = userInfo;
    //添加到数据库


    try {
        groupInfo = JSON.parse(groupInfo);
        await db.collection('users').where({
            _openid: openId
        }).update({
            data: {
                groups: _.push(groupInfo._id)
            }
        })
        await db.collection('groups').where({
            _id: groupInfo._id
        }).update({
            data: {
                members: _.push(openId)
            }
        })
        return true;
    } catch (err) {
        console.error(err);
        return false;
    }
}