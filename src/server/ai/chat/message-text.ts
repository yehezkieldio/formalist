import type { UIMessage } from "ai";

export function getMessageText(message: UIMessage) {
    return message.parts
        .filter((part) => part.type === "text")
        .map((part) => part.text)
        .join("");
}

export function getLastUserText(messages: UIMessage[]) {
    const message = messages.findLast((item) => item.role === "user");

    return message ? getMessageText(message) : "";
}
