import {Message} from "../../domain/Message";

export interface GetMessagesParameters {
    chatId: string;
    messenger: string;
}

export interface CreateMessageParameters extends Message {
}

export interface MessageRepository {
    getMessages(parameters: GetMessagesParameters): Promise<Message[]>;
    createMessage(parameters: CreateMessageParameters): Promise<Message>;
}