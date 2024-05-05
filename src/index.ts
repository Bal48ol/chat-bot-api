import fastify from "fastify";
import axios from "axios";
import {ASSISTANT_ROLE_MANAGER, ASSISTANT_ROLE_SYSTEM, ASSISTANT_ROLE_USER} from "./constants";
import cors from '@fastify/cors'
import {getMessengerFromYTQueue, getReplyUrl} from "./yt/mappings";
import {MongoContext, Seeder} from "./persistance/MongoContext";
import {MessagingContextFactory} from "./domain/MessagingContext/MessagingContextFactory";
import {MongoMessageRepository} from "./persistance/MessageRepository/MongoMessageRepository";
import {ChatService} from "./domain/ChatService";
import {MongoChatRepository} from "./persistance/ChatRepository";
import {YandexTrackerClientFactoryImplementation} from "./domain/TrackerService";
import {MongoPromptRepository} from "./persistance/PromptRepository/MongoPromptRepository";
import {GptCompletionEngine} from "./domain/CompletionEngine/GptCompletionEngine";
import {FunctionsService} from "./domain/FunctionService";
import {Message} from "./domain/Message";
import OpenAI from "openai";

const port = 8000;
const mongoConnectionString = process.env.MONGO_CONNECTION_STRING;
if (!mongoConnectionString)
    throw new Error("Specify MONGO_CONNECTION_STRING env variable");

const mongo = new MongoContext(mongoConnectionString);
const openAi = new OpenAI({
    timeout: 60000,
    apiKey: process.env.OPENAI_API_KEY,
});
const messageRepository = new MongoMessageRepository(mongo);
const trackerFactory = new YandexTrackerClientFactoryImplementation([
    {
        aliases: ["admin", "user"],
        organizationId: parseInt(process.env.TRACKER_ORGANIZATION_ID),
        token: process.env.TRACKER_USER_ACCESS_TOKEN,
    },
    {
        aliases: ["assistant", "function"],
        organizationId: parseInt(process.env.TRACKER_ORGANIZATION_ID),
        token: process.env.TRACKER_GPT_ACCESS_TOKEN,
    },
]);
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


async function main() {
    await mongo.connect();
    await seeder.seed();
    const app = fastify();
    await app.register(cors, {
        origin: "*"
    });
    
    app.get("/functions", async (request, reply) => {
       return await functionService.getFunctions(); 
    });

    app.get("/prompt", async (request, reply) => {
        const query = request.query as {
            type: string | undefined
        };
        if (!query.type) {
            return reply.status(500).send("Specify prompt type");
        }


        return await promptRepository.getPrompt(query.type);
    });

    app.post("/prompt", async (request, reply) => {
        const query = request.query as {
            type: string | undefined
        };
        if (!query.type) {
            return reply.status(500).send("Specify prompt type");
        }
        const body = request.body as {
            value: string
        };
        if (!body.value) {
            return reply.status(500).send("Specify prompt value");
        }
        console.log(`Set system prompt to ${body.value}`)
        await promptRepository.setPrompt(query.type, body.value);

        return reply.status(200).send("Ok");
    });

    app.post("/tracker/webhook/status", async (request, reply) => {
        const body = request.body as {
            queue: string,
            issue: string,
            status: string,
        };

        const isManual = body.status === "onManagerSide";
        console.log(`Set ${body.issue} isManual to ${isManual}`)
        try {
            await chatService.setIsManual({trackerTaskId: body.issue}, isManual, false);

            return reply.status(200).send("ok");
        } catch (e) {
            console.error(e);
            return reply.status(500);
        }
    });

    app.post("/tracker/webhook/comment", async (request, reply) => {
        console.log(request.body);
        const body = request.body as {
            queue: string,
            issue: string,
            message: string,
        };
        try {
            const messenger = getMessengerFromYTQueue(body.queue);
            if (messenger === null) {
                console.warn(`Messenger not found for queue ${body.queue}`);
                return reply.status(200);
            }
            const chat = await mongo.chats.findOne({
                trackerTaskId: body.issue
            });
            console.log(`Send message ${body.message} to (${messenger}) ${chat.id}`);
            const url = getReplyUrl(messenger);

            if (!url) {
                throw new Error("Cant find messenger reply url")
            }
            await axios({
                method: "POST",
                url: url,
                data: {
                    messenger: messenger,
                    chatId: chat.id,
                    content: body.message,
                }
            });
            await mongo.messages.insertOne(Message.create(ASSISTANT_ROLE_MANAGER, body.message, chat.id, messenger));
            return reply.status(200).send("Ok");

        } catch (e) {
            console.error(e);
            return reply.status(500);
        }
    });

    app.get("/statistics", async (request, reply) => {
        const messagesCount = await mongo.messages.countDocuments({
            role: {$ne: ASSISTANT_ROLE_SYSTEM}
        });
        const chatsCount = await mongo.chats.countDocuments({});
        return {
            messagesCount: messagesCount,
            chatsCount: chatsCount,
        }
    });

    app.post("/clear", async (request, reply) => {
        await mongo.messages.deleteMany({});
        await mongo.chats.deleteMany({});
        return reply.status(200).send("Ok");
    });

    app.post("/message", async (request, reply) => {
        const body = request.body as {
            chatId: string,
            message: string,
            secret: string,
            messenger: string,
            callbackUrl: string,
        };

        if (!body.secret || body.secret !== process.env.APP_SECRET)
            return reply.status(403).send();

        if (!body.chatId || !body.message || !body.messenger || typeof body.chatId !== "string")
            return reply.status(400).send();

        console.log(`Processing answer for chatId ${body.chatId} (${body.messenger}) with message ${body.message}`)
        try {
            const context = await messagingContextFactory.createAndLoad(body.chatId, body.messenger);
            await context.process(Message.create(ASSISTANT_ROLE_USER, body.message, body.chatId, body.messenger));
            const lastAnswer = context.messages[context.messages.length - 1];
            
            if (!lastAnswer || (lastAnswer.role !== "manager" && lastAnswer.role !== "assistant")) {
                return reply.status(200).send({});
            }

            const result = {
                chatId: lastAnswer.chatId,
                messenger: lastAnswer.messenger,
                content: lastAnswer.content,
            };
            if (body.callbackUrl) {
                await axios.post(body.callbackUrl, result);

                return reply.status(200);
            } else {
                return result;
            }
        } catch (e) {
            console.error(e);
            return reply.status(500).send();
        }
    });

    await app.listen({
        host: "0.0.0.0",
        port: port
    });
}

const registerCleanup = (mongo: MongoContext) => {
    const cleanUp = async (eventType: string) => {
        await mongo.close();
        console.log("Application exited...");
        process.exit();
    }

    [`exit`, `SIGINT`].forEach((eventType) => {
        process.on(eventType, cleanUp.bind(null, eventType));
    })
}

registerCleanup(mongo);

main().then(() => console.log(`Application started at port ${port}`));