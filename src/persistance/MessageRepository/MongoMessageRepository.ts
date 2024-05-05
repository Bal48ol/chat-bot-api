import {CreateMessageParameters, GetMessagesParameters, MessageRepository} from "./MessageRepository";
import {MongoContext} from "../MongoContext";
import {Message} from "../../domain/Message";

export class MongoMessageRepository implements MessageRepository {
    constructor(private readonly mongo: MongoContext) {
    }

    async getMessages(parameters: GetMessagesParameters): Promise<Message[]> {
        return await this.mongo.messages.find<Message>({
            chatId: parameters.chatId,
            messenger: parameters.messenger,
        }).sort({
            date: 1
        }).toArray();
    }

    async createMessage(parameters: CreateMessageParameters): Promise<Message> {
        await this.mongo.messages.insertOne(parameters);
        return parameters as Message;
    }

}