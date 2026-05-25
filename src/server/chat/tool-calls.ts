import {
    createChatToolCall,
    listChatToolCalls,
    updateChatToolCallState,
} from "#/server/db/queries/chat";

export const chatToolCallService = {
    create: createChatToolCall,
    list: listChatToolCalls,
    updateState: updateChatToolCallState,
};
