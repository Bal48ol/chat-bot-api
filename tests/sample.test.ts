import {MongoContext, Seeder} from "../src/persistance/MongoContext";
import {MongoMessageRepository} from "../src/persistance/MessageRepository/MongoMessageRepository";
import {MongoChatRepository} from "../src/persistance/ChatRepository";
import {ChatService} from "../src/domain/ChatService";
import {MongoPromptRepository} from "../src/persistance/PromptRepository/MongoPromptRepository";
import {GptCompletionEngine} from "../src/domain/CompletionEngine/GptCompletionEngine";
import {FunctionsService} from "../src/domain/FunctionService";
import {MessagingContextFactory} from "../src/domain/MessagingContext/MessagingContextFactory";
import {
    MockYandexTrackerClientFactoryImplementation
} from "./mocks/MockYandexTrackerClientImplementation/MockYandexTrackerClientFactoryImplementation";
import {Message} from "../src/domain/Message";
import {ASSISTANT_ROLE_USER} from "../src/constants";
import OpenAI from "openai";
import {GenericContainer, StartedTestContainer} from "testcontainers";
import {MessagingContext} from "../src/domain/MessagingContext";

describe("Перевод на менеджера", () => {
    let mongoContainer: StartedTestContainer = undefined;
    let messagingContext: MessagingContext = undefined;
    const chatId = "1";
    const messenger = "vk";

    beforeEach(async () => {
        mongoContainer = await new GenericContainer('mongo')
            .withExposedPorts({
                container: 27017,
                host: 27017
            })
            .withEnvironment({
                ["MONGO_INITDB_ROOT_USERNAME"]: "root",
                ["MONGO_INITDB_ROOT_PASSWORD"]: "root"
            })
            .start();
        const openAi = new OpenAI({
            timeout: 60000,
            apiKey: "TOKEN"
        });
        const mongo = new MongoContext("mongodb://root:root@localhost:27017");
        const messageRepository = new MongoMessageRepository(mongo);
        const trackerFactory = new MockYandexTrackerClientFactoryImplementation();
        const chatRepository = new MongoChatRepository(mongo);
        const chatService = new ChatService(chatRepository, trackerFactory);
        const promptRepository = new MongoPromptRepository(mongo);
        const completionEngine = new GptCompletionEngine(openAi);
        const functionService = new FunctionsService(promptRepository);
        const seeder = new Seeder(promptRepository);
        const messagingContextFactory = new MessagingContextFactory(
            messageRepository,
            chatService,
            promptRepository,
            completionEngine,
            trackerFactory,
            functionService
        );

        await seeder.seed();
        messagingContext = await messagingContextFactory.createAndLoad(chatId, messenger);
    }, 10000);
    afterEach(async () => {
        await mongoContainer.stop();
    }, 10000);

    test("1. Здравствуйте\n2. Переведите меня на менеджера", async () => {
        await messagingContext.process(Message.create(ASSISTANT_ROLE_USER, "Здравствуйте", chatId, messenger));
        await messagingContext.process(Message.create(ASSISTANT_ROLE_USER, "Переведите меня на менеджера", chatId, messenger));
        const chat = messagingContext.chat;
        expect(chat.isManual).toBeTruthy();
    }, 60000);

    test("1. Здравствуйте\n2. Я не могу оплатить заказ", async () => {
        await messagingContext.process(Message.create(ASSISTANT_ROLE_USER, "Здравствуйте", chatId, messenger));
        await messagingContext.process(Message.create(ASSISTANT_ROLE_USER, "Я не могу оплатить заказ", chatId, messenger));
        const chat = messagingContext.chat;
        expect(chat.isManual).toBeTruthy();
    }, 60000);

    test("1. Здравствуйте\n2. Расчитайте стоимость доставки заказа до Калининграда", async () => {
        await messagingContext.process(Message.create(ASSISTANT_ROLE_USER, "Здравствуйте", chatId, messenger));
        await messagingContext.process(Message.create(ASSISTANT_ROLE_USER, "Расчитайте стоимость доставки заказа до Калининграда", chatId, messenger));
        const chat = messagingContext.chat;
        expect(chat.isManual).toBeTruthy();
    }, 60000);
    
    test("1. Здравствуйте\n2. Я хочу купить манекен и мне нужен счет на оплату", async () => {
        await messagingContext.process(Message.create(ASSISTANT_ROLE_USER, "Здравствуйте", chatId, messenger));
        await messagingContext.process(Message.create(ASSISTANT_ROLE_USER, "Я хочу купить манекен и мне нужен счет на оплату", chatId, messenger));
        const chat = messagingContext.chat;
        expect(chat.isManual).toBeTruthy();
    }, 60000);
    
 });