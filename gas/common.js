const scriptProperties = PropertiesService.getScriptProperties();
const SLACK_BOT_AUTH_TOKEN = scriptProperties.getProperty(
  "SLACK_BOT_AUTH_TOKEN"
);
const API_KEY = scriptProperties.getProperty("API_KEY");
const SLACK_CHANNEL_ID = scriptProperties.getProperty("SLACK_CHANNEL");

/**
 * Slackの指定したチャンネルにメッセージを投稿する
 * @param {string} message - 投稿するメッセージのテキスト
 * @param {string} channelId - 投稿先のチャンネルID
 * @param {string} articleUrl - 記事のURL
 * @param {string} imageUrl - 画像のURL
 * @returns {void}
 */
const postSlackMessage = (message, channelId, articleUrl, imageUrl) => {
  const url = "https://slack.com/api/chat.postMessage";
  const payload = {
    method: "post",
    headers: { Authorization: `Bearer ${SLACK_BOT_AUTH_TOKEN}` },
    contentType: "application/json",
    payload: JSON.stringify({
      text: articleUrl ? `${message}\n${articleUrl}` : message,
      channel: channelId,
      attachments: imageUrl ? [{ image_url: imageUrl }] : null,
    }),
  };
  UrlFetchApp.fetch(url, payload);
};

/**
 * 指定されたURLからコンテンツを抽出する
 * @param {string} url - コンテンツを抽出するURL
 * @returns {Object} 抽出されたコンテンツオブジェクト
 */
const extractContentFromUrl = (url) => {
  const options = { threshold: 80, continuous_factor: 1.0 };
  const htmlContent = UrlFetchApp.fetch(url).getContentText();
  return new ExtractContent().analyse(htmlContent, options).asText();
};

/**
 * 処理したメッセージのIDをキャッシュして、同じメッセージを無視する
 * @param {string} messageId - メッセージのID
 * @returns {boolean} - メッセージがキャッシュされているかどうか
 */
const isMessageIdCached = (messageId) => {
  const cache = CacheService.getScriptCache();
  const isCached = cache.get(messageId);
  if (isCached) return true;

  cache.put(messageId, true, 60 * 5);
  return false;
};

/**
 * メンションされたテキストから、メンション部分を除去して返す
 * @param {string} text - メンションされたテキスト
 * @returns {string} メンション部分が除去されたテキスト
 */
const removeMentionFromText = (text) => {
  const urlRegex = /<https?:\/\/[^\s]+>/g;
  const match = text.match(urlRegex);
  return match ? match[0].slice(1, -1) : null;
};
