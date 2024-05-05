import {Prompt} from "../../domain/types";

export interface PromptRepository {
    getPrompt(type: string): Promise<Prompt | null>;
    setPrompt(type: string, value: string): Promise<void>;
}