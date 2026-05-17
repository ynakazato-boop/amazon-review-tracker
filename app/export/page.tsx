'use client';

import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';

interface AsinOption { id: number; asin: string; note: string | null }

export default function ExportPage() {
  const [asins, setAsins] = useState<AsinOption[]>([]);
  const [asinId, setAsinId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    fetch('/api/asins').then(r => r.json()).then(setAsins);
    const today = new Date().toISOString().slice(0, 10);
    const month = new Date(Date.now() - 30 * 864e5).toISOString().slice(0, 10);
    setStartDate(month);
    setEndDate(today);
  }, []);

  const handleExport = () => {
    const params = new URLSearchParams();
    if (asinId)    params.set('asinId', asinId);
    if (startDate) params.set('startDate', startDate);
    if (endDate)   params.set('endDate', endDate);
    window.location.href = `/api/export?${params}`;
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">CSVエクスポート</h1>
        <p className="text-gray-400 text-sm mt-0.5">期間を指定してレビューデータをCSV出力します</p>
      </div>

      <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 max-w-xl space-y-5">
        <div>
          <label className="block text-xs text-gray-400 mb-1.5">ASIN（未選択で全ASIN）</label>
          <select
            value={asinId}
            onChange={e => setAsinId(e.target.value)}
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500"
          >
            <option value="">全ASIN</option>
            {asins.map(a => (
              <option key={a.id} value={a.id}>
                {a.asin}{a.note ? ` — ${a.note}` : ''}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">開始日</label>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">終了日</label>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500"
            />
          </div>
        </div>

        <button
          onClick={handleExport}
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
        >
          <Download className="w-4 h-4" />
          CSVをダウンロード
        </button>

        <div className="bg-gray-900 rounded-lg p-3 text-xs text-gray-500">
          出力カラム: ASIN / 備考 / 星評価 / レビュー件数 / 計測日時
        </div>
      </div>
    </div>
  );
}
