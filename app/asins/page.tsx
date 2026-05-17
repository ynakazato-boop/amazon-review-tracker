'use client';

import { useEffect, useState, useCallback } from 'react';
import { Trash2, Plus, ExternalLink } from 'lucide-react';
import { formatJST } from '@/lib/utils';

interface AsinRow {
  id: number; asin: string; note: string | null;
  frequency: string; track_reviews: number; track_purchase_count: number; created_at: string;
}

const FREQ_LABELS: Record<string, string> = {
  daily: '毎日', weekly: '毎週', monthly: '毎月',
};

function TrackToggle({
  active, label, color, onClick, disabled,
}: {
  active: boolean; label: string; color: 'blue' | 'purple';
  onClick: () => void; disabled?: boolean;
}) {
  const on  = color === 'blue'
    ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
    : 'bg-purple-500/20 text-purple-300 border-purple-500/30';
  const off = 'bg-gray-700/50 text-gray-500 border-gray-700 line-through';
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={active ? `${label}：ON（クリックでOFF）` : `${label}：OFF（クリックでON）`}
      className={`text-[10px] px-1.5 py-0.5 rounded border transition-colors ${active ? on : off} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:opacity-80'}`}
    >
      {label}
    </button>
  );
}

export default function AsinsPage() {
  const [rows, setRows] = useState<AsinRow[]>([]);
  const [form, setForm] = useState({
    asin: '', note: '', frequency: 'daily',
    track_reviews: true, track_purchase_count: true,
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [toggling, setToggling] = useState<number | null>(null);

  const fetchRows = useCallback(async () => {
    const res = await fetch('/api/asins');
    setRows(await res.json());
  }, []);

  useEffect(() => { fetchRows(); }, [fetchRows]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    const res = await fetch('/api/asins', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setForm({ asin: '', note: '', frequency: 'daily', track_reviews: true, track_purchase_count: true });
      await fetchRows();
    } else {
      const { error: msg } = await res.json();
      setError(msg);
    }
    setSubmitting(false);
  };

  const deleteAsin = async (id: number) => {
    if (!confirm('このASINを削除しますか？（計測データも削除されます）')) return;
    await fetch(`/api/asins/${id}`, { method: 'DELETE' });
    await fetchRows();
  };

  const toggleTrack = async (id: number, field: 'track_reviews' | 'track_purchase_count', current: number) => {
    setToggling(id);
    await fetch(`/api/asins/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [field]: !current }),
    });
    await fetchRows();
    setToggling(null);
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">ASIN登録</h1>
        <p className="text-gray-400 text-sm mt-0.5">計測対象のASINを登録します</p>
      </div>

      {/* Form */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-white mb-4">新規登録</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">ASIN <span className="text-red-400">*</span></label>
              <input
                type="text"
                value={form.asin}
                onChange={e => setForm(f => ({ ...f, asin: e.target.value.toUpperCase() }))}
                placeholder="B0XXXXXXXXX"
                maxLength={10}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm font-mono focus:outline-none focus:border-orange-500 placeholder-gray-600"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">備考</label>
              <input
                type="text"
                value={form.note}
                onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
                placeholder="商品名など"
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500 placeholder-gray-600"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">計測頻度</label>
              <select
                value={form.frequency}
                onChange={e => setForm(f => ({ ...f, frequency: e.target.value }))}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500"
              >
                <option value="daily">毎日（09:00）</option>
                <option value="weekly">毎週月曜（09:00）</option>
                <option value="monthly">毎月1日（09:00）</option>
              </select>
            </div>
          </div>

          {/* Track toggles */}
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form.track_reviews}
                onChange={e => setForm(f => ({ ...f, track_reviews: e.target.checked }))}
                className="w-4 h-4 rounded accent-blue-500"
              />
              <span className="text-sm text-gray-300">レビュー計測</span>
              <span className="text-xs text-gray-500">（星評価・件数）</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form.track_purchase_count}
                onChange={e => setForm(f => ({ ...f, track_purchase_count: e.target.checked }))}
                className="w-4 h-4 rounded accent-purple-500"
              />
              <span className="text-sm text-gray-300">購入件数計測</span>
              <span className="text-xs text-gray-500">（過去1か月）</span>
            </label>
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={submitting || !form.asin}
            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            登録する
          </button>
        </form>
      </div>

      {/* List */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-700 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">登録済みASIN</h2>
          <span className="text-xs text-gray-500">{rows.length}件</span>
        </div>
        {rows.length === 0 ? (
          <div className="p-8 text-center text-gray-500">登録されているASINはありません</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700 text-gray-400 text-xs">
                <th className="text-left px-5 py-3">ASIN</th>
                <th className="text-left px-4 py-3">備考</th>
                <th className="text-left px-4 py-3">頻度</th>
                <th className="text-center px-4 py-3">計測設定</th>
                <th className="text-left px-4 py-3">登録日</th>
                <th className="text-center px-4 py-3">操作</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id} className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-orange-400 font-mono">{r.asin}</span>
                      <a href={`https://www.amazon.co.jp/dp/${r.asin}`} target="_blank" rel="noreferrer">
                        <ExternalLink className="w-3 h-3 text-gray-600 hover:text-gray-400" />
                      </a>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-400">{r.note || '—'}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded">
                      {FREQ_LABELS[r.frequency] ?? r.frequency}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1.5 justify-center">
                      <TrackToggle
                        active={Boolean(r.track_reviews)}
                        label="レビュー"
                        color="blue"
                        disabled={toggling === r.id}
                        onClick={() => toggleTrack(r.id, 'track_reviews', r.track_reviews)}
                      />
                      <TrackToggle
                        active={Boolean(r.track_purchase_count)}
                        label="購入件数"
                        color="purple"
                        disabled={toggling === r.id}
                        onClick={() => toggleTrack(r.id, 'track_purchase_count', r.track_purchase_count)}
                      />
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {formatJST(r.created_at, { year: 'numeric', month: '2-digit', day: '2-digit' })}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => deleteAsin(r.id)}
                      className="text-gray-600 hover:text-red-400 transition-colors p-1 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
