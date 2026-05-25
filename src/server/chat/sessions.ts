import {
    createChatSession,
    getChatSession,
    listChatSessions,
    renameChatSession,
    searchChatSessions,
    softDeleteChatSession,
} from "#/server/db/queries/chat";

export const chatSessionService = {
    create: createChatSession,
    get: getChatSession,
    list: listChatSessions,
    rename: renameChatSession,
    search: searchChatSessions,
    softDelete: softDeleteChatSession,
};
