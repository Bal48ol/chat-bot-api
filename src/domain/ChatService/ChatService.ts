import {ChatRepository} from "../../persistance/ChatRepository";
import {YandexTrackerClientFactory} from "../TrackerService";
import {Chat} from "../types";
import {CreateChatParameters, GetChatParameters} from "../../persistance/ChatRepository/ChatRepository";
import {loggerFactory} from "../../LoggerFactory";
import {getYTQueueFromMessenger} from "../../yt/mappings";
import {YC_STATE_ON_GPT_SIDE, YC_STATE_ON_MANAGER_SIDE} from "../../yt/constants";


const logger = loggerFactory.create("ChatService");

export class ChatService {
    constructor(
        private readonly chatRepository: ChatRepository,
        private readonly trackerFactory: YandexTrackerClientFactory
    ) {
    }
    
    async setIsManual(getParameters: GetChatParameters, isManual: boolean, changeInTracker: boolean) {
        const chat = await this.chatRepository.getChat(getParameters);
        if (!chat) {
            throw new Error(`Cant find chat with ${JSON.stringify(getParameters)}`);
        }
        
        await this.chatRepository.updateChat(getParameters, {
            isManual: isManual
        });

        if (!changeInTracker) {
            logger.info(`Set isManual to ${isManual} for internal chat ${chat.id}-${chat.messenger}`);
            return;
        }

        const tracker = this.trackerFactory.create("admin");
        const trackerState = isManual ? YC_STATE_ON_MANAGER_SIDE : YC_STATE_ON_GPT_SIDE;
        await tracker.changeIssueState(chat.trackerTaskId, trackerState);
        logger.info(`Set isManual to ${isManual} for chat ${chat.id}-${chat.messenger} with issue ${chat.trackerTaskId}`);
    }

    async getOrCreateChat(getParameters: GetChatParameters, createParameters: Omit<CreateChatParameters, "trackerTaskId">): Promise<Chat> {
        const chat = await this.chatRepository.getChat(getParameters);
        if (chat) {
            return chat;
        }

        const ytQueue = getYTQueueFromMessenger(createParameters.messenger);
        const tracker = this.trackerFactory.create("admin");
        const issue = ytQueue ? await tracker.createIssue({
            summary: createParameters.chatId,
            queue: ytQueue,
            type: "request"
        }) : null;
        const trackerTaskId = issue ? (issue.key as string) : "";
        const newChat = await this.chatRepository.createChat({
            chatId: createParameters.chatId,
            messenger: createParameters.messenger,
            isManual: false,
            trackerTaskId: trackerTaskId
        });
        logger.info(`Create chat ${createParameters.messenger}-${createParameters.chatId}|${trackerTaskId}`);

        return newChat;
    }
}