import {YandexTrackerClient, YandexTrackerClientFactory} from "../../../src/domain/TrackerService";
import {MockYandexTrackerClientImplementation} from "./MockYandexTrackerClientImplementation";

export class MockYandexTrackerClientFactoryImplementation implements YandexTrackerClientFactory {
    create(alias: string): YandexTrackerClient {
        return new MockYandexTrackerClientImplementation();
    }

}