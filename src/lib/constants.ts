// 投稿・コメント・ニックネームの文字数上限。サーバー側のバリデーションと、
// フォームのmaxLength属性の両方から参照し、1箇所を直せば全体に反映されるようにする
export const MAX_CONTENT_LENGTH = 140; // 投稿本文・管理者編集時の本文
export const MAX_REPLY_LENGTH = 30; // コメント本文
export const MAX_NICKNAME_LENGTH = 20; // ニックネーム(投稿・コメント共通)
