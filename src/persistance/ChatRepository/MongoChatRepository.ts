import {ChatRepository, CreateChatParameters, GetChatParameters, UpdateChatParameters} from "./ChatRepository";
import {loggerFactory} from "../../LoggerFactory";
import {Chat} from "../../domain/types";
import {MongoContext} from "../MongoContext";

const logger = loggerFactory.create("MongoChatRepository");

export class MongoChatRepository implements ChatRepository {
    constructor(private readonly mongo: MongoContext) {
    }


    async getChat(parameters: GetChatParameters): Promise<Chat | null> {
        if ("trackerTaskId" in parameters) {
            return (await this.mongo.chats.findOne({
                trackerTaskId: parameters.trackerTaskId,
            })) ?? null; 
        }

        if ("chatId" in parameters) {
            return (await this.mongo.chats.findOne({
                id: parameters.chatId,
                messenger: parameters.messenger
            })) ?? null;
        }
        
        throw new Error("Wrong parameters");
    }

    async createChat(parameters: CreateChatParameters): Promise<Chat> {
        if (!parameters.chatId || parameters.chatId === "")
            throw new Error("Specify chatId");
        if (!parameters.trackerTaskId || parameters.trackerTaskId === "")
            throw new Error("Specify trackerTaskId");
        if (!parameters.messenger || parameters.messenger === "")
            throw new Error("Specify messenger");

        const chat = {
            id: parameters.chatId,
            messenger: parameters.messenger,
            isManual: parameters.isManual ?? false,
            trackerTaskId: parameters.trackerTaskId,
        } as Chat;

        await this.mongo.chats.insertOne(chat);
        return chat;
    }

    async updateChat(
        getParameters: GetChatParameters,
        updateParameters: UpdateChatParameters
    ): Promise<void> {
        const set = {};
        let filter = {};

        if ("trackerTaskId" in getParameters) {
            if (!getParameters.trackerTaskId || getParameters.trackerTaskId === "")
                throw new Error("Specify trackerTaskId");
            filter = {
                trackerTaskId: getParameters.trackerTaskId
            }
        }

        if ("chatId" in getParameters) {
            if (!getParameters.chatId || getParameters.chatId === "")
                throw new Error("Specify chatId");
            if (!getParameters.messenger || getParameters.messenger === "")
                throw new Error("Specify messenger");

            filter = {
                id: getParameters.chatId,
                messenger: getParameters.messenger,
            };
        }


        if (updateParameters.isManual !== null && updateParameters.isManual !== undefined)
            set["isManual"] = updateParameters.isManual;
        if (updateParameters.trackerTaskId !== null && updateParameters.trackerTaskId !== undefined)
            set["trackerTaskId"] = updateParameters.trackerTaskId;

        await this.mongo.chats.updateOne(
            filter, {
                $set: set
            }
        );
    }
}