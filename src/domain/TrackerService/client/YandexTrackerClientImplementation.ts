import axios from "axios";
import {
    CreateIssueParameters,
    YandexTrackerClient,
    YandexTrackerIssue,
    YandexTrackerIssueComment, 
    YandexTrackerIssueTransition
} from "./YandexTrackerClient";

export class YandexTrackerClientImplementation implements YandexTrackerClient {
    readonly #accessToken: string;
    readonly #organizationId: number;

    constructor(organizationId: number, accessToken: string) {
        this.#accessToken = accessToken;
        this.#organizationId = organizationId;
    }

    async addComment(issueId: string, text: string) {
        const response = await this.#makeRequest({
            method: "POST",
            url: `/v2/issues/${issueId}/comments`,
            data: {
                text: text
            }
        });

        return (response?.data[0] as YandexTrackerIssueComment) ?? null;
    }

    async getIssue(issueId: string) {
        const response = await this.#makeRequest({
            method: "GET",
            url: `/v2/issues/${issueId}`
        });

        return (response?.data[0] as YandexTrackerIssue) ?? null;
    }

    async createIssue(parameters: CreateIssueParameters, additionalFields?: object) {
        const task = {
            ...parameters,
            ...additionalFields
        };
        const response = await this.#makeRequest({
            method: "POST",
            url: "/v2/issues/",
            data: task
        });

        return (response?.data as YandexTrackerIssue) ?? null;
    }

    async getIssueTransitions(issueKey: string) {
        const response = await this.#makeRequest({
            method: "GET",
            url: `/v2/issues/${issueKey}/transitions`,
        });
        
        return (response?.data as YandexTrackerIssueTransition[]) ?? null;
    }

    async changeIssueState(issueKey: string, transitionId: string) {
        const response = await this.#makeRequest({
            method: "POST",
            url: `/v2/issues/${issueKey}/transitions/${transitionId}/_execute`,
        });

        return response.data;
    }


    #makeRequest(options: {
        method: "POST" | "GET" | "PATCH",
        url: string,
        data?: object
    }) {
        return axios({
            method: options.method,
            url: `https://api.tracker.yandex.net${options.url}`,
            data: options.data,
            headers: {
                "Host": "api.tracker.yandex.net",
                "X-Org-ID": this.#organizationId,
                "Authorization": `OAuth ${this.#accessToken}`,
            }
        });
    }
}