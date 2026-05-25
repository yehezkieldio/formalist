import {
    createChatToolCall,
    updateChatToolCallState,
} from "#/server/db/queries/chat";

export const chatToolCallService = {
    create: createChatToolCall,
    updateState: updateChatToolCallState,
};
