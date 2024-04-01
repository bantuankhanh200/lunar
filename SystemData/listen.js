const moment = require('moment-timezone');
const fs = require('fs-extra');
const path = require('path');

module.exports = function ({ api, models }) {
    const Users = require("../main/brain/controllers/users")({ models, api });
    const Threads = require("../main/brain/controllers/threads")({ models, api });
    const Currencies = require("../main/brain/controllers/currencies")({ models });
    const logger = require("../main/utils/log.js");
    const autoReset = require("./src/autoReset.js");
    autoReset();
    (async () => {
        try {
            const [threads, users, currencies] = await Promise.all([
                Threads.getAll(),
                Users.getAll(['userID', 'name', 'data']),
                Currencies.getAll(['userID'])
            ]);

            threads.forEach(data => {
                global.data.allThreadID.push(String(data.threadID));
                global.data.threadData.set(String(data.threadID), data.data || {});
                global.data.threadInfo.set(String(data.threadID), data.threadInfo || {});

                if (data.data && data.data.banned) {
                    global.data.threadBanned.set(String(data.threadID), {
                        'reason': data.data.reason || '',
                        'dateAdded': data.data.dateAdded || ''
                    });
                }

                if (data.data && data.data.commandBanned && Array.isArray(data.data.commandBanned) && data.data.commandBanned.length > 0) {
                    global.data.commandBanned.set(String(data.threadID), data.data.commandBanned);
                }

                if (data.data && data.data.NSFW) {
                    global.data.threadAllowNSFW.push(String(data.threadID));
                }
            });

            users.forEach(dataU => {
                global.data.allUserID.push(String(dataU.userID));

                if (dataU.name && Array.isArray(dataU.name) && dataU.name.length > 0) {
                    global.data.userName.set(String(dataU.userID), dataU.name);
                }

                if (dataU.data && dataU.data.banned === 1) {
                    global.data.userBanned.set(String(dataU.userID), {
                        'reason': dataU.data.reason || '',
                        'dateAdded': dataU.data.dateAdded || ''
                    });
                }

                if (dataU.data && dataU.data.commandBanned && Array.isArray(dataU.data.commandBanned) && dataU.data.commandBanned.length > 0) {
                    global.data.commandBanned.set(String(dataU.userID), dataU.data.commandBanned);
                }
            });

            currencies.forEach(dataC => global.data.allCurrenciesID.push(String(dataC.userID)));
        } catch (error) {
            logger.loader(global.getText('listen', 'failLoadEnvironment', error), 'error');
        }
    })();

    logger.loader("┏━━━━━━━━━━━━━━━━━━━━━━━━━━┓");
    logger.loader(` ID BOT: ${api.getCurrentUserID()}`);
    logger.loader(` PREFIX: ${!global.config.PREFIX ? "Bạn chưa set prefix" : global.config.PREFIX}`);
    logger.loader(` NAME BOT: ${(!global.config.BOTNAME) ? "This bot was made by Vtuan" : global.config.BOTNAME}`);
    logger.loader("┗━━━━━━━━━━━━━━━━━━━━━━━━━━┛");

    const handlers = ["handleCommand", "handleCommandEvent", "handleReply", "handleCreateDatabase", "handleEvent", "handleRefresh", "handleReaction"];
    logger.loader(`Ping load toàn bộ commands và events • ${Date.now() - global.client.timeStart}ms •`);

    return async (event) => {
        switch (event.type) {
            case "message":
            case "message_reply":
            case "message_unsend":
                handlers.slice(0, 4).forEach(handler => require(`./handle/${handler}`)({ api, models, Users, Threads, Currencies })({ event }));
                break;
            case "event":
                handlers.slice(4, 6).forEach(handler => require(`./handle/${handler}`)({ api, models, Users, Threads, Currencies })({ event }));
                break;
            case "message_reaction":
                const { iconUnsend } = global.config;
                const iconUnsendPath = path.join(__dirname, '../SystemData/data/iconUnsend.json');
                const groupData = fs.existsSync(iconUnsendPath) && JSON.parse(fs.readFileSync(iconUnsendPath, 'utf-8')).find(item => item.groupId === event.threadID);
                if (groupData?.iconUnsend == event.reaction && event.senderID == api.getCurrentUserID() || iconUnsend?.status && iconUnsend.icon == event.reaction && event.senderID == api.getCurrentUserID()) { api.unsendMessage(event.messageID); }
                require("./handle/handleReaction")({ api, models, Users, Threads, Currencies })({ event });
                break;
            default:
                break;
        }
    };
};