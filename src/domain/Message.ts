import {AssistantRole} from "./types";

export class Message {
    role: AssistantRole | "manager" | "function";
    messenger: string;
    chatId: string;
    content: string;
    date: Date;

    static create = (role: string, content: string, chatId: string, messenger: string) => (
        {
            role: role,
            content: content,
            chatId: chatId,
            date: new Date(),
            messenger: messenger,
        } as Message
    );
}