module.exports.config = {
    name: "leave",
    eventType: ["log:unsubscribe"],
    version: "1.0.0",
    credits: "Mirai Team", // mod by vtuan
    description: "Thông báo bot hoặc người rời khỏi nhóm",
    dependencies: {
        "fs-extra": "",
        "path": ""
    }
};

module.exports.run = async function ({ api, event, Users }) {
    const { logMessageData } = event;
    const leftParticipants = logMessageData.leftParticipantFbId.split(",");
    const leftNames = await Promise.all(leftParticipants.map(async participant => global.data.userName.get(participant) || await Users.getNameUser(participant)));
    const type = (event.author == logMessageData.leftParticipantFbId) ? "rời" : "bị quản trị viên kick";
    const msg = `${leftNames.join(", ")} đã ${type} khỏi nhóm.`;
    return api.sendMessage(msg, event.threadID);
};
