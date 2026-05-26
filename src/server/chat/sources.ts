import { attachChatSource, listChatSources } from "#/server/db/queries/chat";

export const chatSourceService = {
    attach: attachChatSource,
    list: listChatSources,
};
