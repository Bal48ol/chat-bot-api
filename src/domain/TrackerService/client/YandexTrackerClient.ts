export interface CreateIssueParameters {
    summary: string;
    queue: string;
    type: string;
}
export interface YandexTrackerClient {
    addComment(issueId: string, text: string): Promise<YandexTrackerIssueComment>;
    getIssueTransitions(issueKey: string): Promise<YandexTrackerIssueTransition[]>;
    getIssue(issueId: string): Promise<YandexTrackerIssue>;
    createIssue(parameters: CreateIssueParameters, additionalFields?: object): Promise<YandexTrackerIssue>;
    changeIssueState(issueKey: string, transitionId: string): Promise<any>;
}

export interface YandexTrackerShortObject {
    self: string
    id: string
    display: string
}

export interface YandexTrackerShortObjectWithKey extends YandexTrackerShortObject{
    key: string
}

export interface YandexTrackerIssueTransition {
    id: string
    self: string
    display: string
    to: YandexTrackerShortObjectWithKey
}

export interface YandexTrackerIssue {
    self: string
    id: string
    key: string
    version: number
    lastCommentUpdatedAt: string
    summary: string
    parent: YandexTrackerShortObjectWithKey
    aliases: string[]
    updatedBy: YandexTrackerShortObject
    description: string
    sprint: YandexTrackerShortObject[]
    type: YandexTrackerShortObjectWithKey
    priority: YandexTrackerShortObjectWithKey
    createdAt: string
    followers: YandexTrackerShortObject[]
    createdBy: YandexTrackerShortObject
    votes: number
    assignee: YandexTrackerShortObject
    project: YandexTrackerShortObject
    queue: YandexTrackerShortObjectWithKey
    updatedAt: string
    status: YandexTrackerShortObjectWithKey
    previousStatus: YandexTrackerShortObjectWithKey
    favorite: boolean
}

export interface YandexTrackerIssueComment {
    self: string
    id: number
    longId: string
    text: string
    createBody: YandexTrackerShortObject
    updateBody: YandexTrackerShortObject
    createdAt: string
    updatedAt: string
    summonees: YandexTrackerShortObject[]
    maillistSummonees: YandexTrackerShortObject[]
    version: number
    type: string
    transport: string
}