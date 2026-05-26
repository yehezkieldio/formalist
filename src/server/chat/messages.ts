import { createChatMessage, listChatMessages } from "#/server/db/queries/chat";

export const chatMessageService = {
    create: createChatMessage,
    list: listChatMessages,
};
