import {PromptRepository} from "./PromptRepository";
import {MongoContext} from "../MongoContext";
import {loggerFactory} from "../../LoggerFactory";
import {Prompt} from "../../domain/types";

const logger = loggerFactory.create("MongoPromptRepository");

export class MongoPromptRepository implements PromptRepository {
    constructor(private readonly mongo: MongoContext) {
    }

    async getPrompt(type: string): Promise<Prompt | null> {
        return (await this.mongo.prompts.findOne({
            type: type
        })) ?? null;
    }

    async setPrompt(type: string, value: string): Promise<void> {
        logger.info(`Set ${type} prompt to ${value}`);
        await this.mongo.prompts.updateOne({
            type: type
        }, {
            $set: {
                type: type,
                value: value
            }
        }, {
            upsert: true
        });
    }
}