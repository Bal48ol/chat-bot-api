import {Db, MongoClient} from "mongodb";
import {loggerFactory} from "../../LoggerFactory";
import { Prompt, Chat} from "../../domain/types";
import {Message} from "../../domain/Message";

const logger = loggerFactory.create("MongoContext");

export class MongoContext {
    private readonly client: MongoClient;
    private readonly db: Db;

    constructor(connectionString: string) {
        if (!connectionString)
            throw new Error("Provide connection mongo string");

        this.client = new MongoClient(connectionString);
        this.db = this.client.db("conversations-api");
    }

    async close() {
        logger.info("Closing connection...");
        await this.client.close();
        logger.info("Connection closed");
    }

    async connect() {
        logger.info("Establishing connection...");
        await this.client.connect();
        logger.info("Connection established");
    }

    public get prompts() {
        return this.db.collection<Prompt>("prompts");
    }

    public get messages() {
        return this.db.collection<Message>("messages");
    }

    public get chats() {
        return this.db.collection<Chat>("chats");
    }
}