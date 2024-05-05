import {YandexTrackerClient} from "./client";

export interface YandexTrackerClientFactory {
    create(alias: string): YandexTrackerClient;
}