import {
    createChatSession,
    getChatSession,
    getMostRecentChatSession,
    getMostRecentEmptyChatSession,
    listChatSessions,
    renameChatSession,
    searchChatSessions,
    softDeleteChatSession,
} from "#/server/db/queries/chat";

export const chatSessionService = {
    create: createChatSession,
    get: getChatSession,
    getMostRecent: getMostRecentChatSession,
    getMostRecentEmpty: getMostRecentEmptyChatSession,
    list: listChatSessions,
    rename: renameChatSession,
    search: searchChatSessions,
    softDelete: softDeleteChatSession,
};
