import {Chat} from "../../domain/types";


export type GetChatParameters = {
    chatId: string;
    messenger: string;
} | {
    trackerTaskId: string;
}

export interface CreateChatParameters {
    chatId: string;
    messenger: string;
    trackerTaskId: string;
    isManual?: boolean;
}

export interface UpdateChatParameters {
    isManual?: boolean;
    trackerTaskId?: string;
}

export interface ChatRepository {
    updateChat(getParameters: GetChatParameters, updateParameters: UpdateChatParameters): Promise<void>;
    getChat(parameters: GetChatParameters): Promise<Chat | null>;
    createChat(parameters: CreateChatParameters): Promise<Chat>;
}