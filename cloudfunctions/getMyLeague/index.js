// 云函数入口文件
const cloud = require('wx-server-sdk');

cloud.init();

const db = cloud.database();


// 云函数入口函数
exports.main = async (event, context) => {
    let {
        userInfo
    } = event;
    let {
        openId
    } = userInfo;

    try {
        let uRes = await db.collection('users').where({
            _openid: openId
        });
        let uInfo = uRes && uRes.data && uRes.data[0];
        if (!uInfo) {
            return;
        }
        let mRes = await cloud.callFunction({
            name: 'getMembers',
            data: {
                members: uInfo.members
            }
        });
        if (!mRes || !mRes.result) {
            return;
        }
        return mRes.result;
    } catch (err) {
        console.error(err);
        return;
    }
}