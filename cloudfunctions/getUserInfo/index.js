// 云函数入口文件
const cloud = require('wx-server-sdk');

cloud.init();

const db = cloud.database();


// 云函数入口函数
exports.main = async (event, context) => {
    let {
        userInfo,
        uid
    } = event;
    let {
        openId
    } = userInfo;

    try {
        let uRes = await db.collection('users').where({
            _openid: uid
        }).get();
        if (!uRes || !uRes.data || uRes.data.length == 0) {
            return;
        }
        let uInfo = uRes.data[0];
        let {
            groups
        } = uInfo;

        if (!groups || groups.length == 0) {
            return uInfo;
        }
        let groupsInfo = [];
        await Promise.all(groups.map(async (id) => {
            let gRes = await db.collection('groups').where({
                _id: id
            }).get();
            if (gRes && gRes.data && gRes.data.length > 0) {
                groupsInfo.push(gRes.data[0])
            }
        }));
        uInfo.groups = groupsInfo
        return uInfo;
    } catch (err) {
        console.error(err);
        return;
    }
}