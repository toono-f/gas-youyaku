const SLACK_BOT_AUTH_TOKEN =
  PropertiesService.getScriptProperties().getProperty("SLACK_BOT_AUTH_TOKEN");

const API_KEY = PropertiesService.getScriptProperties().getProperty("API_KEY");

const SLACK_CHANNEL =
  PropertiesService.getScriptProperties().getProperty("SLACK_CHANNEL");

/**
 * Slackの指定したチャンネルにメッセージを投稿する
 * @param {string} text - 投稿するメッセージのテキスト
 * @param {string} channel - 投稿先のチャンネルID
 * @param {string} articleUrl - 記事のURL
 * @param {string} image_url - 画像のURL
 * @returns {void}
 */
const postMessage = (text, channel, articleUrl, image_url) => {
  const url = "https://slack.com/api/chat.postMessage";
  const payload = {
    method: "post",
    headers: { Authorization: "Bearer " + SLACK_BOT_AUTH_TOKEN },
    contentType: "application/json",
    payload: JSON.stringify({
      text: articleUrl ? `${text}\n${articleUrl}` : text,
      channel,
      attachments: image_url
        ? [
            {
              fields: [{ title: "", value: "" }],
              image_url,
            },
          ]
        : null,
    }),
  };
  UrlFetchApp.fetch(url, payload);
};

/**
 * 指定されたURLからコンテンツを抽出します。
 * @param {string} url - コンテンツを抽出するURL。
 * @returns {Object} 抽出されたコンテンツオブジェクト。
 */
const extractContent = (url) => {
  const opt = { threshold: 80, continuous_factor: 1.0 };
  const html = UrlFetchApp.fetch(url).getContentText();
  return new ExtractContent().analyse(html, opt).asText();
};

/**
 * 処理したメッセージのIDをキャッシュして、同じメッセージを無視する
 * @param {string} id - メッセージのID
 * @returns {boolean} - メッセージがキャッシュされているかどうか
 */
const isCachedId = (id) => {
  const cache = CacheService.getScriptCache();
  const isCached = cache.get(id);
  if (isCached) return true;

  cache.put(id, true, 60 * 5);
  return false;
};

/**
 * メンションされたテキストから、メンション部分を除去して返す
 * @param {string} source - メンションされたテキスト
 * @returns {string} メンション部分が除去されたテキスト
 */
const trimMentionText = (source) => {
  const urlRegex = /<(https?:\/\/[^\s]+)>/g;
  const match = urlRegex.exec(source);
  if (match) return match[0].slice(1, -1);
  return null;
};
