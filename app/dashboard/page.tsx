'use client';

import { useEffect, useState, useCallback } from 'react';
import { RefreshCw, TrendingUp, TrendingDown, Minus, Star, MessageSquare, Package, ShoppingCart } from 'lucide-react';
import { formatJST, parseDbDate } from '@/lib/utils';

interface AsinRow {
  id: number;
  asin: string;
  note: string | null;
  frequency: string;
  track_reviews: number;
  track_purchase_count: number;
  latest_rating: number | null;
  latest_count: number | null;
  latest_purchase_count_label: string | null;
  latest_measured_at: string | null;
  prev_rating: number | null;
  prev_count: number | null;
}

function Diff({ curr, prev, decimals = 0 }: { curr: number | null; prev: number | null; decimals?: number }) {
  if (curr == null || prev == null) return <span className="text-gray-600">—</span>;
  const d = curr - prev;
  if (Math.abs(d) < 0.001) return <span className="text-gray-500 text-xs flex items-center gap-0.5"><Minus className="w-3 h-3" /> 0</span>;
  const fmt = d.toFixed(decimals);
  return d > 0
    ? <span className="text-green-400 text-xs flex items-center gap-0.5"><TrendingUp className="w-3 h-3" /> +{fmt}</span>
    : <span className="text-red-400 text-xs flex items-center gap-0.5"><TrendingDown className="w-3 h-3" /> {fmt}</span>;
}

function Stars({ v }: { v: number | null }) {
  if (v == null) return <span className="text-gray-600">—</span>;
  return (
    <span className="flex items-center gap-1">
      <Star className="w-3.5 h-3.5 text-orange-400 fill-orange-400" />
      <span className="text-white">{v.toFixed(1)}</span>
    </span>
  );
}

function PurchaseLabel({ label, tracked }: { label: string | null; tracked: boolean }) {
  if (!tracked) return <span className="text-gray-600 text-xs">OFF</span>;
  if (label === 'error') return <span className="text-red-400 text-xs">取得失敗</span>;
  if (label === null) return <span className="text-gray-500 text-xs">なし</span>;
  // テキストが長い場合は省略
  const short = label.length > 20 ? label.slice(0, 20) + '…' : label;
  return <span className="text-green-300 text-xs" title={label}>{short}</span>;
}

function TrackBadges({ trackReviews, trackPurchase }: { trackReviews: boolean; trackPurchase: boolean }) {
  return (
    <div className="flex gap-1 flex-wrap justify-center">
      <span className={`text-[10px] px-1.5 py-0.5 rounded border ${
        trackReviews
          ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
          : 'bg-gray-700/50 text-gray-600 border-gray-700'
      }`}>
        レビュー
      </span>
      <span className={`text-[10px] px-1.5 py-0.5 rounded border ${
        trackPurchase
          ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
          : 'bg-gray-700/50 text-gray-600 border-gray-700'
      }`}>
        購入件数
      </span>
    </div>
  );
}

function toJSTDate(d: Date): string {
  return d.toLocaleDateString('sv', { timeZone: 'Asia/Tokyo' });
}

function isToday(s: string | null): boolean {
  if (!s) return false;
  const d = parseDbDate(s);
  return toJSTDate(d) === toJSTDate(new Date());
}

export default function DashboardPage() {
  const [rows, setRows] = useState<AsinRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [scraping, setScraping] = useState<number | 'all' | null>(null);

  const fetchData = useCallback(async () => {
    const res = await fetch('/api/asins');
    setRows(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const triggerScrape = async (asinId?: number) => {
    setScraping(asinId ?? 'all');
    await fetch('/api/scrape', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(asinId ? { asinId } : {}),
    });

    if (asinId) {
      await fetchData();
      setScraping(null);
    } else {
      const poll = async () => {
        const logs: { status: string }[] = await fetch('/api/logs?limit=1').then(r => r.json());
        if (logs[0]?.status === 'completed' || logs[0]?.status === 'failed') {
          await fetchData();
          setScraping(null);
        } else {
          setTimeout(poll, 2000);
        }
      };
      setTimeout(poll, 2000);
    }
  };

  const measured_today = rows.filter(r => isToday(r.latest_measured_at)).length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">ダッシュボード</h1>
          <p className="text-gray-400 text-sm mt-0.5">登録ASINの最新レビュー・購入件数状況</p>
        </div>
        <button
          onClick={() => triggerScrape()}
          disabled={scraping !== null}
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${scraping === 'all' ? 'animate-spin' : ''}`} />
          {scraping === 'all' ? '計測中...' : '全ASIN計測'}
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: '登録ASIN数', value: rows.length, icon: Package, color: 'text-blue-400' },
          { label: '本日計測済み', value: measured_today, icon: RefreshCw, color: 'text-green-400' },
          { label: '未計測', value: rows.length - measured_today, icon: Minus, color: 'text-orange-400' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-gray-800 border border-gray-700 rounded-xl p-4 flex items-center gap-4">
            <div className={`p-2 rounded-lg bg-gray-700 ${color}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-gray-400 text-xs">{label}</p>
              <p className="text-2xl font-bold text-white">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ASIN table */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-700">
          <h2 className="text-sm font-semibold text-white">ASIN一覧</h2>
        </div>
        {loading ? (
          <div className="p-8 text-center text-gray-500">読み込み中...</div>
        ) : rows.length === 0 ? (
          <div className="p-8 text-center text-gray-500">ASINが登録されていません</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700 text-gray-400 text-xs">
                  <th className="text-left px-5 py-3">ASIN</th>
                  <th className="text-left px-4 py-3">備考</th>
                  <th className="text-center px-3 py-3">計測中</th>
                  <th className="text-center px-4 py-3">星評価</th>
                  <th className="text-center px-4 py-3">変化</th>
                  <th className="text-center px-4 py-3">レビュー数</th>
                  <th className="text-center px-4 py-3">変化</th>
                  <th className="text-center px-4 py-3">
                    <span className="flex items-center gap-1 justify-center">
                      <ShoppingCart className="w-3 h-3" />
                      購入件数
                    </span>
                  </th>
                  <th className="text-left px-4 py-3">最終計測 (JST)</th>
                  <th className="text-center px-4 py-3">操作</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(r => (
                  <tr key={r.id} className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors">
                    <td className="px-5 py-3">
                      <a
                        href={`https://www.amazon.co.jp/dp/${r.asin}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-orange-400 hover:underline font-mono"
                      >
                        {r.asin}
                      </a>
                    </td>
                    <td className="px-4 py-3 text-gray-400 max-w-[140px] truncate">
                      {r.note || '—'}
                    </td>
                    <td className="px-3 py-3">
                      <TrackBadges
                        trackReviews={Boolean(r.track_reviews)}
                        trackPurchase={Boolean(r.track_purchase_count)}
                      />
                    </td>
                    <td className="px-4 py-3 text-center">
                      {r.track_reviews ? <Stars v={r.latest_rating} /> : <span className="text-gray-600">—</span>}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {r.track_reviews ? <Diff curr={r.latest_rating} prev={r.prev_rating} decimals={1} /> : <span className="text-gray-600">—</span>}
                    </td>
                    <td className="px-4 py-3 text-center text-white">
                      {r.track_reviews
                        ? (r.latest_count != null
                          ? <span className="flex items-center justify-center gap-1">
                              <MessageSquare className="w-3.5 h-3.5 text-gray-500" />
                              {r.latest_count.toLocaleString()}
                            </span>
                          : <span className="text-gray-600">—</span>)
                        : <span className="text-gray-600">—</span>
                      }
                    </td>
                    <td className="px-4 py-3 text-center">
                      {r.track_reviews ? <Diff curr={r.latest_count} prev={r.prev_count} /> : <span className="text-gray-600">—</span>}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <PurchaseLabel
                        label={r.latest_purchase_count_label}
                        tracked={Boolean(r.track_purchase_count)}
                      />
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                      {r.latest_measured_at ? formatJST(r.latest_measured_at) : '未計測'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => triggerScrape(r.id)}
                        disabled={scraping !== null}
                        className="text-xs bg-gray-700 hover:bg-gray-600 disabled:opacity-40 text-gray-300 px-2.5 py-1 rounded transition-colors flex items-center gap-1 mx-auto"
                      >
                        <RefreshCw className={`w-3 h-3 ${scraping === r.id ? 'animate-spin' : ''}`} />
                        計測
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
