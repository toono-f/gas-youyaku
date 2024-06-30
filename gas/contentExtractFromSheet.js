/**
 * contentExtractFromSheet関数は、SlackアプリからのPOSTリクエストを処理します。
 * @returns {void}
 */
const contentExtractFromSheet = () => {
  // スプレッドシートからURLを取得する
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("list");
  const data = sheet.getDataRange().getValues();

  let url = null;
  let rowIndex = null;

  // (2行目以降の）A列にある、D列に完了の文字列が入っていない行のURLを取得
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] && data[i][3] !== "完了" && data[i][3] !== "失敗") {
      url = data[i][0];
      rowIndex = i + 1;
      break;
    }
  }

  if (!url || !url.includes("http")) {
    // 毎度実行してしまうので一旦停止
    // const message = url ?? fetchAIAnswerTextOthers();
    // postMessage(message, SLACK_CHANNEL);

    // if (url) {
    //   // スプレッドシートの同D列に完了の文字列を書き込む
    //   sheet.getRange(rowIndex, 4).setValue("完了");
    // }

    console.log("未完了のURLはありません");

    return;
  }

  // 投稿先のチャンネルに指定がある場合は設定する
  const channel = sheet.getRange(rowIndex, 5).getValue() || SLACK_CHANNEL;

  try {
    const content = extractContent(url);
    const youyakuContents = fetchAIAnswerText(content);
    postMessage(youyakuContents, channel, url);

    // スプレッドシートの同B列に記事タイトルを書き込む
    sheet.getRange(rowIndex, 2).setValue(content.title);

    // スプレッドシートの同C列にyouyakuContentsを書き込む
    sheet.getRange(rowIndex, 3).setValue(youyakuContents);

    // スプレッドシートの同D列に完了の文字列を書き込む
    sheet.getRange(rowIndex, 4).setValue("完了");

    return ContentService.createTextOutput("OK");
  } catch (error) {
    console.error(error.stack, "応答エラーが発生しました");
    // スプレッドシートの同D列に完了の文字列を書き込む
    sheet.getRange(rowIndex, 4).setValue("失敗");
    return ContentService.createTextOutput("NG");
  }
};
