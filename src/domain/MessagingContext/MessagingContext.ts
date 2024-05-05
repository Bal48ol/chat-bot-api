import {MessageRepository} from "../../persistance/MessageRepository/MessageRepository";
import {ChatService} from "../ChatService";
import {PromptRepository} from "../../persistance/PromptRepository/PromptRepository";
import {Chat} from "../types";
import {
    ASSISTANT_ROLE_ASSISTANT,
    ASSISTANT_ROLE_MANAGER,
    ASSISTANT_ROLE_SYSTEM,
    PROMPT_TYPE_SYSTEM
} from "../../constants";
import {CompletionEngine, CompletionResult} from "../CompletionEngine/CompletionEngine";
import {YandexTrackerClientFactory} from "../TrackerService";
import {Message} from "../Message";
import {SWITCH_TO_MANAGER_FUNCTION_NAME} from "../../gptFunctions";
import {FunctionsService} from "../FunctionService";
import {loggerFactory} from "../../LoggerFactory";

const logger = loggerFactory.create("MessagingContext");

export class MessagingContext {

    #messages: Message[];
    #chat: Chat;

    constructor(
        private readonly chatId: string,
        private readonly messenger: string,
        private readonly messageRepository: MessageRepository,
        private readonly chatService: ChatService,
        private readonly promptRepository: PromptRepository,
        private readonly completionEngine: CompletionEngine,
        private readonly trackerFactory: YandexTrackerClientFactory,
        private readonly functionService: FunctionsService,
    ) {
    }

    public get messages() {
        return this.#messages;
    }

    public get chat() {
        return this.#chat;
    }

    public async load() {
        this.#chat = await this.chatService.getOrCreateChat({
            chatId: this.chatId,
            messenger: this.messenger
        }, {
            chatId: this.chatId,
            messenger: this.messenger,
            isManual: false,
        });
        this.#messages = await this.messageRepository.getMessages({
            chatId: this.chatId,
            messenger: this.messenger
        });
        logger.info(`Loaded context for ${this.#chat.id}-${this.#chat.messenger} ${this.#chat.trackerTaskId}`)
    }

    private getLastMessages() {
        return this.messages.filter(
            x => x.role !== ASSISTANT_ROLE_SYSTEM
        ).sort((a ,b) => a.date.getTime() - b.date.getTime()).slice(-30).map(x => ({
            ...x,
            role: x.role === ASSISTANT_ROLE_MANAGER ? ASSISTANT_ROLE_ASSISTANT : x.role,
        }));
    }

    private async addMessage(message: Message) {
        logger.info(`Add message for ${this.#chat.id}-${this.#chat.messenger} ${this.#chat.trackerTaskId}`)
        this.#messages.push(message);
        await this.messageRepository.createMessage(message);
        const tracker = this.trackerFactory.create(message.role);
        await tracker.addComment(this.chat.trackerTaskId, message.content);
    }


    public async process(message: Message) {
        const gptFunctions = await this.functionService.getFunctions();
        const systemPrompt = await this.promptRepository.getPrompt(PROMPT_TYPE_SYSTEM);

        await this.addMessage(message);

        if (this.chat.isManual) {
            return;
        }

        const processCompletion = async (completion: CompletionResult) => {
            if (completion.content) {
                // КОСТЫЛЬ ДЛЯ ПЕРЕВОДА НА МЕНЕДЖЕРА
                const lower = completion.content.toLowerCase();
                if ((lower.includes("менеджер") && (
                    lower.includes("передам") ||
                    lower.includes("передал") ||
                    lower.includes("передаю"))
                    || ( lower.includes("уточнить") || lower.includes("уточню") || lower.includes("узнать") || lower.includes("узнаю"))
                    || (lower.includes("вернусь") || lower.includes("свяжусь") || lower.includes("свяжется"))
                    || (lower.includes("нет информации") || lower.includes("недостаточно информации"))
                )){
                    await this.chatService.setIsManual({
                        messenger: this.chat.messenger,
                        chatId: this.chat.id,
                    }, true, true);
                    this.#chat.isManual = true; 
                }
                // КОСТЫЛЬ ДЛЯ ПЕРЕВОДА НА МЕНЕДЖЕРА
                
                await this.addMessage(Message.create(completion.role, completion.content, this.chatId, this.messenger))
                return;
            }

            if (!completion.function) {
                return;
            }

            // Function call
            if (completion.function.name === SWITCH_TO_MANAGER_FUNCTION_NAME) {
                await this.chatService.setIsManual({
                    messenger: this.chat.messenger,
                    chatId: this.chat.id,
                }, true, true); 
                this.#chat.isManual = true;

                await this.addMessage({
                    ...Message.create("function", "Перевод на менеджера был выполнен успешно. Сообщи об этом", this.chat.id, this.chat.messenger),
                    // @ts-ignore
                    name: SWITCH_TO_MANAGER_FUNCTION_NAME
                });
                const last = this.getLastMessages();
                const postFunctionCompletions = await this.completionEngine.complete({
                    messages: last,
                    functions: gptFunctions,
                    systemPrompt: systemPrompt
                });

                for (let completion of postFunctionCompletions) {
                    // Text answer
                    await processCompletion(completion);
                }
            }
        }

        const completions = await this.completionEngine.complete({
            messages: this.getLastMessages(),
            functions: gptFunctions,
            systemPrompt: systemPrompt
        });

        for (let completion of completions) {
            await processCompletion(completion);
        }
    }
}