/**
 * handleSlackPostRequest関数は、SlackアプリからのPOSTリクエストを処理します。
 * @returns {void}
 */
const handleSlackPostRequest = (e) => {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("list");
  const data = sheet.getDataRange().getValues();
  // 空いている行を探す
  let rowIndex = data.findIndex((row) => !row[0]) + 1 || data.length + 1;

  const postData = JSON.parse(e.postData.getDataAsString());
  if (postData.type == "url_verification") {
    return ContentService.createTextOutput(postData.challenge);
  }

  const payload = JSON.parse(e.postData.contents);
  const { text, channel: channelId, client_msg_id: msgId } = payload.event;

  // テキストからメンション部分を削除
  const url = removeMentionFromText(text);

  if (!url) {
    postSlackMessage(
      `URLを読み取れませんでした🤔\nURLだけメンションしてね💫`,
      channelId,
      url
    );
    return;
  }

  // 処理済みのメッセージの場合、OKを返して処理を終了する
  if (isMessageIdCached(msgId)) return ContentService.createTextOutput("OK");

  try {
    const content = extractContentFromUrl(url);
    const summary = fetchAIAnswerSummary(content);
    postSlackMessage(summary, channelId, url, content.image);

    // スプレッドシートにデータを書き込む
    sheet
      .getRange(rowIndex, 1, 1, 4)
      .setValues([[url, content.title, summary, "完了"]]);

    return ContentService.createTextOutput("OK");
  } catch (error) {
    console.error(error.stack, "応答エラーが発生しました");
    return ContentService.createTextOutput("NG");
  }
};
