'use client';

import { useEffect, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { AlertCircle } from 'lucide-react';

interface AsinOption {
  id: number; asin: string; note: string | null;
  track_reviews: number; track_purchase_count: number;
}
interface Snapshot {
  rating: number | null;
  review_count: number | null;
  purchase_count_label: string | null;
  measured_at: string;
}

const PERIODS = [
  { label: '7日', value: 7 },
  { label: '30日', value: 30 },
  { label: '90日', value: 90 },
];

export default function GraphPage() {
  const [asins, setAsins] = useState<AsinOption[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [days, setDays] = useState(30);
  const [data, setData] = useState<Snapshot[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/asins').then(r => r.json()).then((rows: AsinOption[]) => {
      setAsins(rows);
      if (rows.length > 0) setSelectedId(String(rows[0].id));
    });
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    setLoading(true);
    fetch(`/api/snapshots?asinId=${selectedId}&days=${days}`)
      .then(r => r.json())
      .then((rows: Snapshot[]) => { setData(rows); setLoading(false); });
  }, [selectedId, days]);

  const selectedAsin = asins.find(a => String(a.id) === selectedId);
  const trackReviews = Boolean(selectedAsin?.track_reviews);
  const trackPurchase = Boolean(selectedAsin?.track_purchase_count);

  // エラースナップショット（review_count=null）を除外してグラフの途切れを防ぐ
  const chartData = data
    .filter(d => d.review_count !== null)
    .map(d => ({
      date: new Date(d.measured_at).toLocaleDateString('ja-JP', { month: '2-digit', day: '2-digit' }),
      rating: d.rating,
      count: d.review_count,
    }));

  // 購入件数タイムライン（テキスト値なのでテーブル表示）
  const purchaseTimeline = data
    .filter(d => d.purchase_count_label !== null)
    .map(d => ({
      date: new Date(d.measured_at).toLocaleDateString('ja-JP', { month: '2-digit', day: '2-digit' }),
      time: new Date(d.measured_at).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Tokyo' }),
      label: d.purchase_count_label,
    }));

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">推移グラフ</h1>
        <p className="text-gray-400 text-sm mt-0.5">レビュー数・星評価・購入件数の時系列推移</p>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-3">
        <select
          value={selectedId}
          onChange={e => setSelectedId(e.target.value)}
          className="bg-gray-800 border border-gray-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-orange-500"
        >
          {asins.length === 0 && <option value="">ASIN未登録</option>}
          {asins.map(a => (
            <option key={a.id} value={a.id}>
              {a.asin}{a.note ? ` (${a.note})` : ''}
            </option>
          ))}
        </select>
        <div className="flex gap-1">
          {PERIODS.map(p => (
            <button
              key={p.value}
              onClick={() => setDays(p.value)}
              className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                days === p.value
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-800 border border-gray-700 text-gray-400 hover:text-white'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {selectedAsin && (
        <div className="flex items-center gap-3">
          <p className="text-gray-400 text-sm">
            ASIN: <span className="text-orange-400 font-mono">{selectedAsin.asin}</span>
            {selectedAsin.note && <span className="ml-2 text-gray-500">({selectedAsin.note})</span>}
          </p>
          <div className="flex gap-1.5">
            <span className={`text-[10px] px-1.5 py-0.5 rounded border ${
              trackReviews ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' : 'bg-gray-700/50 text-gray-600 border-gray-700'
            }`}>レビュー</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded border ${
              trackPurchase ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' : 'bg-gray-700/50 text-gray-600 border-gray-700'
            }`}>購入件数</span>
          </div>
        </div>
      )}

      {loading ? (
        <div className="h-64 flex items-center justify-center text-gray-500">読み込み中...</div>
      ) : data.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-gray-500">
          データがありません。計測を実行してください。
        </div>
      ) : (
        <div className="space-y-6">
          {/* Review count */}
          {trackReviews && (
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
              <h2 className="text-sm font-semibold text-white mb-4">レビュー件数</h2>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="date" stroke="#6b7280" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#6b7280" tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: 8 }}
                    labelStyle={{ color: '#d1d5db' }}
                    itemStyle={{ color: '#60a5fa' }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line
                    type="monotone" dataKey="count" name="レビュー数"
                    stroke="#60a5fa" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }}
                    connectNulls={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Rating */}
          {trackReviews && (
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
              <h2 className="text-sm font-semibold text-white mb-4">星評価</h2>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="date" stroke="#6b7280" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#6b7280" tick={{ fontSize: 11 }} domain={[1, 5]} />
                  <Tooltip
                    contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: 8 }}
                    labelStyle={{ color: '#d1d5db' }}
                    itemStyle={{ color: '#fb923c' }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line
                    type="monotone" dataKey="rating" name="星評価"
                    stroke="#fb923c" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }}
                    connectNulls={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Purchase count timeline */}
          {trackPurchase && (
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
              <h2 className="text-sm font-semibold text-white mb-4">購入件数（過去1か月）タイムライン</h2>
              {purchaseTimeline.length === 0 ? (
                <p className="text-gray-500 text-sm">購入件数データがありません（Amazonが表示していない期間）</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-700 text-gray-400 text-xs">
                        <th className="text-left py-2 pr-6">日付</th>
                        <th className="text-left py-2 pr-6">時刻 (JST)</th>
                        <th className="text-left py-2">購入件数テキスト</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...purchaseTimeline].reverse().map((row, i) => (
                        <tr key={i} className="border-b border-gray-700/50">
                          <td className="py-2 pr-6 text-gray-400 font-mono text-xs">{row.date}</td>
                          <td className="py-2 pr-6 text-gray-500 font-mono text-xs">{row.time}</td>
                          <td className="py-2">
                            {row.label === 'error' ? (
                              <span className="flex items-center gap-1 text-red-400 text-xs">
                                <AlertCircle className="w-3 h-3" />
                                取得失敗
                              </span>
                            ) : (
                              <span className="text-purple-300 text-xs">{row.label}</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
