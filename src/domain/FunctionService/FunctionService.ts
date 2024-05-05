import OpenAI from "openai";
import {FUNCTIONS} from "../../gptFunctions";
import {PromptRepository} from "../../persistance/PromptRepository/PromptRepository";

export class FunctionsService {
    constructor(
        private readonly promptRepository: PromptRepository
    ) {
    }

    async getFunctions(): Promise<OpenAI.FunctionDefinition[]> {
        const result: OpenAI.FunctionDefinition[] = [];
        for (let f of FUNCTIONS) {
            const prompt = await this.promptRepository.getPrompt(f.name);
            result.push({
                name: f.name,
                description: prompt.value,
            })
        }

        return result;
    }
}