import {rawEmojis} from "./emojis";
import beep from "../sounds/beep.mp3";
import juntos from "../sounds/juntos.mp3";
import pristine from "../sounds/pristine.mp3";
import ding from "../sounds/ding.mp3";
import dadum from "../sounds/dadum.mp3";
import pop from "../sounds/pop.mp3";
import popSwoosh from "../sounds/pop-swoosh.mp3";
import config from "./config";
import {Base64} from 'js-base64';

export const topicUrl = (baseUrl, topic) => `${baseUrl}/${topic}`;
export const topicUrlWs = (baseUrl, topic) => `${topicUrl(baseUrl, topic)}/ws`
    .replaceAll("https://", "wss://")
    .replaceAll("http://", "ws://");
export const topicUrlJson = (baseUrl, topic) => `${topicUrl(baseUrl, topic)}/json`;
export const topicUrlJsonPoll = (baseUrl, topic) => `${topicUrlJson(baseUrl, topic)}?poll=1`;
export const topicUrlJsonPollWithSince = (baseUrl, topic, since) => `${topicUrlJson(baseUrl, topic)}?poll=1&since=${since}`;
export const topicUrlAuth = (baseUrl, topic) => `${topicUrl(baseUrl, topic)}/auth`;
export const topicShortUrl = (baseUrl, topic) => shortUrl(topicUrl(baseUrl, topic));
export const accountUrl = (baseUrl) => `${baseUrl}/v1/account`;
export const accountPasswordUrl = (baseUrl) => `${baseUrl}/v1/account/password`;
export const accountTokenUrl = (baseUrl) => `${baseUrl}/v1/account/token`;
export const accountSettingsUrl = (baseUrl) => `${baseUrl}/v1/account/settings`;
export const accountSubscriptionUrl = (baseUrl) => `${baseUrl}/v1/account/subscription`;
export const accountReservationUrl = (baseUrl) => `${baseUrl}/v1/account/reservation`;
export const accountReservationSingleUrl = (baseUrl, topic) => `${baseUrl}/v1/account/reservation/${topic}`;
export const accountBillingSubscriptionUrl = (baseUrl) => `${baseUrl}/v1/account/billing/subscription`;
export const accountBillingPortalUrl = (baseUrl) => `${baseUrl}/v1/account/billing/portal`;
export const accountPhoneUrl = (baseUrl) => `${baseUrl}/v1/account/phone`;
export const accountPhoneVerifyUrl = (baseUrl) => `${baseUrl}/v1/account/phone/verify`;
export const tiersUrl = (baseUrl) => `${baseUrl}/v1/tiers`;
export const shortUrl = (url) => url.replaceAll(/https?:\/\//g, "");
export const expandUrl = (url) => [`https://${url}`, `http://${url}`];
export const expandSecureUrl = (url) => `https://${url}`;

export const validUrl = (url) => {
    return url.match(/^https?:\/\/.+/);
}

export const validTopic = (topic) => {
    if (disallowedTopic(topic)) {
        return false;
    }
    return topic.match(/^([-_a-zA-Z0-9]{1,64})$/); // Regex must match Go & Android app!
}

export const disallowedTopic = (topic) => {
    return config.disallowed_topics.includes(topic);
}

export const topicDisplayName = (subscription) => {
    if (subscription.displayName) {
        return subscription.displayName;
    } else if (subscription.baseUrl === config.base_url) {
        return subscription.topic;
    }
    return topicShortUrl(subscription.baseUrl, subscription.topic);
};

// Format emojis (see emoji.js)
const emojis = {};
rawEmojis.forEach(emoji => {
    emoji.aliases.forEach(alias => {
        emojis[alias] = emoji.emoji;
    });
});

const toEmojis = (tags) => {
    if (!tags) return [];
    else return tags.filter(tag => tag in emojis).map(tag => emojis[tag]);
}

export const formatTitleWithDefault = (m, fallback) => {
    if (m.title) {
        return formatTitle(m);
    }
    return fallback;
};

export const formatTitle = (m) => {
    const emojiList = toEmojis(m.tags);
    if (emojiList.length > 0) {
        return `${emojiList.join(" ")} ${m.title}`;
    } else {
        return m.title;
    }
};

export const formatMessage = (m) => {
    if (m.title) {
        return m.message;
    } else {
        const emojiList = toEmojis(m.tags);
        if (emojiList.length > 0) {
            return `${emojiList.join(" ")} ${m.message}`;
        } else {
            return m.message;
        }
    }
};

export const unmatchedTags = (tags) => {
    if (!tags) return [];
    else return tags.filter(tag => !(tag in emojis));
}

export const maybeWithAuth = (headers, user) => {
    if (user && user.password) {
        return withBasicAuth(headers, user.username, user.password);
    } else if (user && user.token) {
        return withBearerAuth(headers, user.token);
    }
    return headers;
}

export const maybeWithBearerAuth = (headers, token) => {
    if (token) {
        return withBearerAuth(headers, token);
    }
    return headers;
}

export const withBasicAuth = (headers, username, password) => {
    headers['Authorization'] = basicAuth(username, password);
    return headers;
}

export const basicAuth = (username, password) => {
    return `Basic ${encodeBase64(`${username}:${password}`)}`;
}

export const withBearerAuth = (headers, token) => {
    headers['Authorization'] = bearerAuth(token);
    return headers;
}

export const bearerAuth = (token) => {
    return `Bearer ${token}`;
}

export const encodeBase64 = (s) => {
    return Base64.encode(s);
}

export const encodeBase64Url = (s) => {
    return Base64.encodeURI(s);
}

export const maybeAppendActionErrors = (message, notification) => {
    const actionErrors = (notification.actions ?? [])
        .map(action => action.error)
        .filter(action => !!action)
        .join("\n")
    if (actionErrors.length === 0) {
        return message;
    } else {
        return `${message}\n\n${actionErrors}`;
    }
}

export const shuffle = (arr) => {
    let j, x;
    for (let index = arr.length - 1; index > 0; index--) {
        j = Math.floor(Math.random() * (index + 1));
        x = arr[index];
        arr[index] = arr[j];
        arr[j] = x;
    }
    return arr;
}

export const splitNoEmpty = (s, delimiter) => {
    return s
        .split(delimiter)
        .map(x => x.trim())
        .filter(x => x !== "");
}

/** Non-cryptographic hash function, see https://stackoverflow.com/a/8831937/1440785 */
export const hashCode = async (s) => {
    let hash = 0;
    for (let i = 0; i < s.length; i++) {
        const char = s.charCodeAt(i);
        hash = ((hash<<5)-hash)+char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
}

export const formatShortDateTime = (timestamp) => {
    return new Intl.DateTimeFormat('default', {dateStyle: 'short', timeStyle: 'short'})
        .format(new Date(timestamp * 1000));
}

export const formatShortDate = (timestamp) => {
    return new Intl.DateTimeFormat('default', {dateStyle: 'short'})
        .format(new Date(timestamp * 1000));
}

export const formatBytes = (bytes, decimals = 2) => {
    if (bytes === 0) return '0 bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export const formatNumber = (n) => {
    if (n === 0) {
        return n;
    } else if (n % 1000 === 0) {
        return `${n/1000}k`;
    }
    return n.toLocaleString();
}

export const formatPrice = (n) => {
    if (n % 100 === 0) {
        return `$${n/100}`;
    }
    return `$${(n/100).toPrecision(2)}`;
}

export const openUrl = (url) => {
    window.open(url, "_blank", "noopener,noreferrer");
};

export const sounds = {
    "ding": {
        file: ding,
        label: "Ding"
    },
    "juntos": {
        file: juntos,
        label: "Juntos"
    },
    "pristine": {
        file: pristine,
        label: "Pristine"
    },
    "dadum": {
        file: dadum,
        label: "Dadum"
    },
    "pop": {
        file: pop,
        label: "Pop"
    },
    "pop-swoosh": {
        file: popSwoosh,
        label: "Pop swoosh"
    },
    "beep": {
        file: beep,
        label: "Beep"
    }
};

export const playSound = async (id) => {
    const audio = new Audio(sounds[id].file);
    return audio.play();
};

// From: https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch
export async function* fetchLinesIterator(fileURL, headers) {
    const utf8Decoder = new TextDecoder('utf-8');
    const response = await fetch(fileURL, {
        headers: headers
    });
    const reader = response.body.getReader();
    let { value: chunk, done: readerDone } = await reader.read();
    chunk = chunk ? utf8Decoder.decode(chunk) : '';

    const re = /\n|\r|\r\n/gm;
    let startIndex = 0;

    for (;;) {
        let result = re.exec(chunk);
        if (!result) {
            if (readerDone) {
                break;
            }
            let remainder = chunk.substr(startIndex);
            ({ value: chunk, done: readerDone } = await reader.read());
            chunk = remainder + (chunk ? utf8Decoder.decode(chunk) : '');
            startIndex = re.lastIndex = 0;
            continue;
        }
        yield chunk.substring(startIndex, result.index);
        startIndex = re.lastIndex;
    }
    if (startIndex < chunk.length) {
        yield chunk.substr(startIndex); // last line didn't end in a newline char
    }
}

export const randomAlphanumericString = (len) => {
    const alphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let id = "";
    for (let i = 0; i < len; i++) {
        id += alphabet[(Math.random() * alphabet.length) | 0];
    }
    return id;
}
