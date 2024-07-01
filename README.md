# プロジェクト名

このリポジトリは、SlackアプリとGoogle Apps Scriptを使用して、指定されたURLからコンテンツを抽出し、要約を生成してSlackに投稿するプロジェクトです。

## 主な機能

1. Slackでのメンションもしくはスプレッドシートで指定されたURLからコンテンツを抽出
2. 抽出したコンテンツをAIで要約
3. 要約文をSlackチャンネルに投稿

## ファイル構成

- `gas/common.js`: 共通関数
- `gas/handleSlackPostRequest.js`: SlackからのPOSTリクエストを処理
- `gas/processSlackPostRequest.js`: スプレッドシートからURLを取得して処理
- `gas/fetchAIAnswerSummary.js`: AIを使用してコンテンツを要約
- `gas/extractContent.js`: コンテンツ抽出ロジック

## Google Apps Scriptでの設定

1. gasディレクトリの中のjsファイルをすべて追加
2. Slackアプリを設定し、取得したトークンを環境変数に設定
3. 投稿先のSlackチャンネルIDを環境変数に設定
4. GeminiのAPIキーを環境変数に設定

## その他準備

- 記事のURL、タイトル、要約文、完了状態、投稿先チャンネルIDを記載するスプレッドシートを作成
