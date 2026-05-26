import {
    attachUnlinkedChatToolCallsToMessage,
    createChatToolCall,
    listChatToolCalls,
    updateChatToolCallState,
} from "#/server/db/queries/chat";

export const chatToolCallService = {
    attachUnlinkedToMessage: attachUnlinkedChatToolCallsToMessage,
    create: createChatToolCall,
    list: listChatToolCalls,
    updateState: updateChatToolCallState,
};
