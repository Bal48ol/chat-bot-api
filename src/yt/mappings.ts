export const getYTQueueFromMessenger = (messenger: string) => {
    if (messenger === "ok")
        return "OK";
    if (messenger === "vk")
        return "VK";
    if (messenger === "instagram-global")
        return "INSTGLOBAL";
    if (messenger === "instagram-russia")
        return "INSTRUS";
    if (messenger === "tg")
        return "TG";

    return null;
};

export const getMessengerFromYTQueue = (ytQueue: string) => {
    if (ytQueue === "OK")
        return "ok";
    if (ytQueue === "VK")
        return "vk";
    if (ytQueue === "INSTGLOBAL")
        return "instagram-global";
    if (ytQueue === "INSTRUS")
        return "instagram-russia";
    if (ytQueue === "TG")
        return "tg";

    return null;
}

export const getReplyUrl = (messenger: string) => {
    if (messenger === "vk")
        return process.env.REPLY_VK_URL;
    if (messenger === "instagram-global" || messenger === "instagram-russia")
        return process.env.REPLY_INSTAGRAM_URL;
    if (messenger === "ok")
        return process.env.REPLY_OK_URL;
    if (messenger === "tg")
        return process.env.REPLY_TG_URL;
}