/**
 * fetchAndPostUnfinishedUrls関数は、スプレッドシートから未完了のURLを取得し、内容を要約してSlackに投稿します。
 * @returns {void}
 */
const fetchAndPostUnfinishedUrls = () => {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("list");
  const data = sheet.getDataRange().getValues();

  let url = null;
  let rowIndex = null;

  // (2行目以降の）A列にある、D列に完了の文字列が入っていない行のURLを取得
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] && !["完了", "失敗"].includes(data[i][3])) {
      url = data[i][0];
      rowIndex = i + 1;
      break;
    }
  }
  if (!url || !url.includes("http")) {
    console.log("未完了のURLはありません");
    return;
  }

  const channelId = sheet.getRange(rowIndex, 5).getValue() || SLACK_CHANNEL_ID;

  try {
    const content = extractContentFromUrl(url);
    const summary = fetchAIAnswerSummary(content);
    postSlackMessage(summary, channelId, url);

    sheet.getRange(rowIndex, 2).setValue(content.title);
    sheet.getRange(rowIndex, 3).setValue(summary);
    sheet.getRange(rowIndex, 4).setValue("完了");

    return ContentService.createTextOutput("OK");
  } catch (error) {
    console.error(error.stack, "応答エラーが発生しました");
    sheet.getRange(rowIndex, 4).setValue("失敗");
    return ContentService.createTextOutput("NG");
  }
};
