export type AssistantRole = "user" | "system" | "assistant" ;

export interface Chat {
    id: string;
    messenger: string;
    isManual: boolean;
    trackerTaskId: string;
}

export interface Prompt {
    value: string;
    type: string;
}