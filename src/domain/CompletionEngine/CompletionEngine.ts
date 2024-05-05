import {AssistantRole, Prompt} from "../types";
import OpenAI from "openai";
import {Message} from "../Message";

export interface CompleteParameters {
    messages: Pick<Message, "role" | "content">[];
    systemPrompt: Prompt;
    functions: OpenAI.FunctionDefinition[];
}

export interface CompletionResult {
    role: AssistantRole | "manager" | "function";
    content: string; 
    function?: {
        name: string
    }
}

export interface CompletionEngine {
    complete(parameters: CompleteParameters): Promise<CompletionResult[]>;
}