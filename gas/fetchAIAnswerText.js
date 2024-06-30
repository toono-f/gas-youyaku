const fetchAIAnswerText = (content) => {
  const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent?key=${API_KEY}`;
  const payload = {
    contents: [
      {
        role: "model",
        parts: [{ text: `${content.title}\n\n${content.body}` }],
      },
      {
        role: "user",
        parts: [
          {
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
