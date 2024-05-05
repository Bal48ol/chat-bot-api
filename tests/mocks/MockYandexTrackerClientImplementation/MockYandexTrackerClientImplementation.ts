import {YandexTrackerClient} from "../../../src/domain/TrackerService";
import {
    CreateIssueParameters, YandexTrackerIssue,
    YandexTrackerIssueComment, YandexTrackerIssueTransition
} from "../../../src/domain/TrackerService/client/YandexTrackerClient";

export class MockYandexTrackerClientImplementation implements YandexTrackerClient {
    addComment(issueId: string, text: string): Promise<YandexTrackerIssueComment> {
        return Promise.resolve(null);
    }

    changeIssueState(issueKey: string, transitionId: string): Promise<any> {
        return Promise.resolve(null);
    }

    createIssue(parameters: CreateIssueParameters, additionalFields?: object): Promise<YandexTrackerIssue> {
        // @ts-ignore
        return Promise.resolve({
            id: "test",
            key: "test-123"
        });
    }

    getIssue(issueId: string): Promise<YandexTrackerIssue> {
        return Promise.resolve(null);
    }

    getIssueTransitions(issueKey: string): Promise<YandexTrackerIssueTransition[]> {
        return Promise.resolve([]);
    }
    
}