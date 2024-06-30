// デプロイURL登録先： https://api.slack.com/apps/A0671FCSE56/event-subscriptions?

/**
 * doPost関数は、SlackアプリからのPOSTリクエストを処理します。
 * @returns {void}
 */
const doPost = (e) => {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("list");
  const data = sheet.getDataRange().getValues();

  // 空いている行を探す
  let rowIndex = data.findIndex((row) => !row[0]) + 1 || data.length + 1;

  const postData = JSON.parse(e.postData.getDataAsString());
  if (postData.type == "url_verification") {
    return ContentService.createTextOutput(postData.challenge);
  }

  const payload = JSON.parse(e.postData.contents);
  const { text, channel, client_msg_id: msgId } = payload.event;

  // テキストからメンション部分を削除
  const url = trimMentionText(text);

  if (!url) {
    postMessage(
      `URLを読み取れませんでした🤔\nURLだけメンションしてね💫`,
      channel,
      url
    );
    return;
  }

  // 処理済みのメッセージの場合、OKを返して処理を終了する
  if (isCachedId(msgId)) return ContentService.createTextOutput("OK");

  try {
    const content = extractContent(url);
    const youyakuContents = fetchAIAnswerText(content);
    postMessage(youyakuContents, channel, url, content.image);

    // スプレッドシートにデータを書き込む
    sheet
      .getRange(rowIndex, 1, 1, 4)
      .setValues([[url, content.title, youyakuContents, "完了"]]);

    return ContentService.createTextOutput("OK");
  } catch (e) {
    console.error(e.stack, "応答エラーが発生しました");
    return ContentService.createTextOutput("NG");
  }
};
