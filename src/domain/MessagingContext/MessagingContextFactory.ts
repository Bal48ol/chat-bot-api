import {MessageRepository} from "../../persistance/MessageRepository/MessageRepository";
import {ChatService} from "../ChatService";
import {PromptRepository} from "../../persistance/PromptRepository/PromptRepository";
import {CompletionEngine} from "../CompletionEngine/CompletionEngine";
import {YandexTrackerClientFactory} from "../TrackerService";
import {FunctionsService} from "../FunctionService";
import {MessagingContext} from "./MessagingContext";
import {loggerFactory} from "../../LoggerFactory";

const logger = loggerFactory.create("MessagingContextFactory");

export class MessagingContextFactory {
    constructor(
        private readonly messageRepository: MessageRepository,
        private readonly chatService: ChatService,
        private readonly promptRepository: PromptRepository,
        private readonly completionEngine: CompletionEngine,
        private readonly trackerFactory: YandexTrackerClientFactory,
        private readonly functionService: FunctionsService,
    ) {
    }

    async createAndLoad(
        chatId: string,
        messenger: string,
    ) {
        logger.info(`Create message context for ${chatId}-${messenger}`);
        const context = new MessagingContext(
            chatId,
            messenger,
            this.messageRepository,
            this.chatService,
            this.promptRepository,
            this.completionEngine,
            this.trackerFactory,
            this.functionService
        );
        await context.load();
        return context;
    }
}