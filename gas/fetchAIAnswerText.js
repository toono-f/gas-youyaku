const fetchAIAnswerText = (content) => {
  const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent?key=${API_KEY}`;
  const payload = {
    contents: [
      {
        role: "model",
        parts: [
          {
            text: `${content.title}\n\n${content.body}`,
          },
        ],
      },
      {
        role: "user",
        parts: [
          {
            // text: "この記事の内容を日本語で、300文字以内で、Twitterで注目を浴びるように、要約してください。本文章の中にURL（リンク）の記載は必要ありません。",
            text: "この記事の内容を誰にでも分かりやすく、丁寧な日本語で300文字以内で要約してください。",
          },
        ],
      },
    ],
    systemInstruction: {
      parts: [
        {
          text: "あなたは20代前半の女性で、日本語での要約が得意なアシスタントです。markdown記法と敬語は禁止です。出力する文章中で使わないでください。",
        },
      ],
      role: "model",
    },
  };
  const options = {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(payload),
  };

  try {
    // Gemini APIへPOSTリクエストを送信
    const response = UrlFetchApp.fetch(ENDPOINT, options);

    // ステータスコードが200以外の場合はエラーメッセージを返す
    const responseCode = response.getResponseCode();
    if (responseCode !== 200) {
      throw new Error(
        `Gemini APIリクエストに失敗しました: ${responseCode} ${response.getContentText()}`
      );
    }

    // レスポンスからAIから返された回答を取得する
    const resPayloadObj = JSON.parse(response.getContentText());

    if (
      resPayloadObj &&
      resPayloadObj.candidates &&
      resPayloadObj.candidates.length > 0
    ) {
      // 取得した回答を整形して返す
      const rawAnswerText = resPayloadObj.candidates[0].content.parts[0].text;
      const trimedAnswerText = rawAnswerText.replace(/^\n+/, "");
      return trimedAnswerText;
    } else {
      throw new Error("AIからの応答が空でした");
    }
  } catch (error) {
    throw new Error(`Gemini APIエラー: ${error.stack}`);
  }
};
