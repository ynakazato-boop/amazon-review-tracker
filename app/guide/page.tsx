'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

const SECTIONS = [
  {
    title: 'ダッシュボード',
    content: `登録されたASINの最新レビュー状況を一覧表示します。
前回計測との差分（レビュー数の増減・評価変化）をカラーインジケーターで確認できます。
「全ASIN計測」ボタンで手動計測を即座に実行できます。
各行の「計測」ボタンで特定ASINのみ計測することも可能です。`,
  },
  {
    title: '推移グラフ',
    content: `ASIN・期間（7/30/90日）を選択してレビュー数と星評価の時系列グラフを表示します。
recharts ライブラリによるインタラクティブなグラフで、ホバーすると詳細な数値が表示されます。
グラフが表示されない場合は、まずダッシュボードから計測を実行してください。`,
  },
  {
    title: 'ASIN登録',
    content: `計測対象の商品ASINを登録します。
ASIN は Amazon の商品 URL に含まれる英数字10桁のコード（例: B0XXXXXXXXX）です。
計測頻度は毎日・毎週・毎月から選択できます。
自動計測のスケジュール: 毎日→09:00、毎週→月曜09:00、毎月→1日09:00。
削除するとスナップショットデータも一緒に削除されます。`,
  },
  {
    title: '実行ログ',
    content: `計測の実行履歴を一覧表示します。
各ログに対象ASIN数・成功数・失敗数・実行時間を記録しています。
ステータスが「実行中」の場合は現在計測が進行中です。
「更新」ボタンで最新状態を再取得できます。`,
  },
  {
    title: 'CSVエクスポート',
    content: `ASIN・期間を指定してレビューデータをCSVとしてダウンロードします。
未選択の場合は全ASINが対象になります。
出力カラム: ASIN / 備考 / 星評価 / レビュー件数 / 計測日時。
Excel などで開いて分析やレポートに活用できます。`,
  },
  {
    title: 'スクレイピングについて',
    content: `Amazon.co.jp の商品ページから星評価とレビュー件数を取得します。
リクエスト間隔に1〜2秒のランダム待機を入れてサーバー負荷を軽減しています。
User-Agent はランダムでローテーションされます。
Amazonの利用規約を遵守して、過度なアクセスは避けてください。
スクレイピングが失敗した場合は実行ログで詳細を確認できます。`,
  },
];

function Accordion({ title, content }: { title: string; content: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-gray-700 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-700/40 transition-colors"
      >
        <span className="text-sm font-semibold text-white">{title}</span>
        {open
          ? <ChevronDown className="w-4 h-4 text-orange-400 flex-shrink-0" />
          : <ChevronRight className="w-4 h-4 text-gray-500 flex-shrink-0" />}
      </button>
      {open && (
        <div className="px-5 pb-5 text-sm text-gray-400 leading-relaxed whitespace-pre-line border-t border-gray-700 pt-4">
          {content}
        </div>
      )}
    </div>
  );
}

export default function GuidePage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">使い方ガイド</h1>
        <p className="text-gray-400 text-sm mt-0.5">各ページの説明と操作方法</p>
      </div>
      <div className="max-w-2xl space-y-2">
        {SECTIONS.map(s => <Accordion key={s.title} {...s} />)}
      </div>
    </div>
  );
}
