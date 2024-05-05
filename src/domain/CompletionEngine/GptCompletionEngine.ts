import {CompleteParameters, CompletionEngine, CompletionResult} from "./CompletionEngine";
import {AssistantRole} from "../types";
import {
    ASSISTANT_ROLE_ASSISTANT,
    ASSISTANT_ROLE_MANAGER,
    ASSISTANT_ROLE_SYSTEM,
} from "../../constants";
import {Chat, FunctionDefinition} from "openai/resources";
import ChatCompletionMessageParam = Chat.ChatCompletionMessageParam;
import OpenAI from "openai";

export class GptCompletionEngine implements CompletionEngine {
    constructor(private readonly openAi: OpenAI) {
    }
    async complete({messages, functions, systemPrompt}: CompleteParameters): Promise<CompletionResult[]> {
        const systemMessage = {role: ASSISTANT_ROLE_SYSTEM, content: systemPrompt.value};

        const messagesToSend = [
            systemMessage,
            ...messages,
        ].map(x => ({
            role: x.role as AssistantRole,
            content: x.content,
            // @ts-ignore
            name: x.name
        }));

        const response = await this.gptRequest(messagesToSend, functions);
        const answer = response.choices[0].message;

        // Text result
        if (answer.content) {
            return [{role: answer.role, content: answer.content}];
        }

        // Function call
        if (answer.function_call.name) {
            return [{
                role: answer.role, content: null, function: {
                    name: answer.function_call.name
                }
            }]
        }

        throw new Error("Cant build completion result")
    }

    private gptRequest(messages: ChatCompletionMessageParam[], functions: FunctionDefinition[]) {
        return this.openAi.chat.completions.create({
            model: "gpt-4-1106-preview",
            messages: messages,
            stream: false,
            functions: functions,
            function_call: "auto",
        });
    }

}