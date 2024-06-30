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
            text: "この記事の内容を日本語で、誰にでも分かりやすく、500文字以内で、要約してください。本文章の中にURL（リンク）の記載は必要ありません。",
          },
        ],
      },
    ],
    systemInstruction: {
      parts: [
        {
          text: "あなたは日本語での要約が得意なアシスタントです。投稿先はSlackなので、markdown記法やハッシュタグを使わずに、読みやすい文章を心がけてください。",
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
    const response = UrlFetchApp.fetch(ENDPOINT, options);
    if (response.getResponseCode() !== 200) {
      throw new Error(
        `Gemini APIリクエストに失敗しました: ${response.getResponseCode()} ${response.getContentText()}`
      );
    }

    const resPayloadObj = JSON.parse(response.getContentText());
    const rawAnswerText =
      resPayloadObj?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (rawAnswerText) {
      return rawAnswerText.trim();
    } else {
      throw new Error("AIからの応答が空でした");
    }
  } catch (error) {
    throw new Error(`Gemini APIエラー: ${error.stack}`);
  }
};
