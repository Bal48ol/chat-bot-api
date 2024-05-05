import {YandexTrackerClientFactory} from "./YandexTrackerClientFactory";
import {YandexTrackerClient, YandexTrackerClientImplementation} from "./client";
import {loggerFactory} from "../../LoggerFactory";

const logger = loggerFactory.create("YandexTrackerClientFactoryImplementation");

export class YandexTrackerClientFactoryImplementation implements YandexTrackerClientFactory {
    private readonly clientsMap: Map<string, YandexTrackerClient>;
    constructor(definitions: {aliases: string[], token: string, organizationId: number}[]) {
        this.clientsMap = new Map();
        definitions.forEach(definition => {
            const client = new YandexTrackerClientImplementation(definition.organizationId, definition.token);
            logger.info(`Create client for roles ${definition.aliases.join(", ")}`)
            definition.aliases.forEach(alias => {
               this.clientsMap.set(alias, client);
            });
        })
    }
    
    create(alias: string): YandexTrackerClient {
        if (!this.clientsMap.has(alias))
            throw new Error(`Cant find YandexTrackerClient for alias ${alias}`);
        
        return this.clientsMap.get(alias);
    }
    
}