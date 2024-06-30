// デプロイURL登録先： https://api.slack.com/apps/A0671FCSE56/event-subscriptions?

/**
 * doPost関数は、SlackアプリからのPOSTリクエストを処理します。
 * @returns {void}
 */
const doPost = (e) => {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("list");
  const data = sheet.getDataRange().getValues();

  let rowIndex = null;

  // 空いている行を探す
  for (let i = 1; i < data.length; i++) {
    if (!data[i][0]) {
      rowIndex = i + 1;
      break;
    }
  }

  // 空いている行が見つからなかった場合、新しい行を追加
  if (rowIndex === null) {
    rowIndex = data.length + 1;
  }

  const postData = JSON.parse(e.postData.getDataAsString());
  if (postData.type == "url_verification") {
    return ContentService.createTextOutput(postData.challenge);
  }

  const payload = JSON.parse(e.postData.contents);
  const text = payload.event.text;
  const channel = payload.event.channel;
  const msgId = payload.event.client_msg_id;

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

    // スプレッドシートの同A列にURLを書き込む
    sheet.getRange(rowIndex, 1).setValue(url);

    // スプレッドシートの同B列に記事タイトルを書き込む
    sheet.getRange(rowIndex, 2).setValue(content.title);

    // スプレッドシートの同C列にyouyakuContentsを書き込む
    sheet.getRange(rowIndex, 3).setValue(youyakuContents);

    // スプレッドシートの同D列に完了の文字列を書き込む
    sheet.getRange(rowIndex, 4).setValue("完了");

    return ContentService.createTextOutput("OK");
  } catch (e) {
    console.error(e.stack, "応答エラーが発生しました");
    return ContentService.createTextOutput("NG");
  }
};
