'use client';

import { useEffect, useState, useCallback } from 'react';
import { RefreshCw, CheckCircle, XCircle, Clock } from 'lucide-react';
import { formatJSTFull, parseDbDate } from '@/lib/utils';

interface LogRow {
  id: number;
  started_at: string;
  finished_at: string | null;
  total: number;
  success: number;
  failed: number;
  status: string;
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'completed') return (
    <span className="flex items-center gap-1 text-green-400 text-xs">
      <CheckCircle className="w-3.5 h-3.5" /> 完了
    </span>
  );
  if (status === 'failed') return (
    <span className="flex items-center gap-1 text-red-400 text-xs">
      <XCircle className="w-3.5 h-3.5" /> 失敗
    </span>
  );
  return (
    <span className="flex items-center gap-1 text-yellow-400 text-xs">
      <Clock className="w-3.5 h-3.5 animate-pulse" /> 実行中
    </span>
  );
}

function duration(start: string, end: string | null) {
  if (!end) return '—';
  const ms = parseDbDate(end).getTime() - parseDbDate(start).getTime();
  return `${(ms / 1000).toFixed(0)}秒`;
}

export default function LogsPage() {
  const [rows, setRows] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/logs?limit=100');
    setRows(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">実行ログ</h1>
          <p className="text-gray-400 text-sm mt-0.5">計測の実行履歴</p>
        </div>
        <button
          onClick={fetchLogs}
          className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 text-sm px-3 py-2 rounded-lg transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          更新
        </button>
      </div>

      <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">読み込み中...</div>
        ) : rows.length === 0 ? (
          <div className="p-8 text-center text-gray-500">実行履歴がありません</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700 text-gray-400 text-xs">
                  <th className="text-left px-5 py-3">#</th>
                  <th className="text-left px-4 py-3">開始時刻</th>
                  <th className="text-left px-4 py-3">終了時刻</th>
                  <th className="text-center px-4 py-3">実行時間</th>
                  <th className="text-center px-4 py-3">対象</th>
                  <th className="text-center px-4 py-3">成功</th>
                  <th className="text-center px-4 py-3">失敗</th>
                  <th className="text-center px-4 py-3">ステータス</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(r => (
                  <tr key={r.id} className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors">
                    <td className="px-5 py-3 text-gray-500 text-xs">{r.id}</td>
                    <td className="px-4 py-3 text-gray-300 text-xs whitespace-nowrap">{formatJSTFull(r.started_at)}</td>
                    <td className="px-4 py-3 text-gray-300 text-xs whitespace-nowrap">{formatJSTFull(r.finished_at)}</td>
                    <td className="px-4 py-3 text-center text-gray-400 text-xs">{duration(r.started_at, r.finished_at)}</td>
                    <td className="px-4 py-3 text-center text-white">{r.total}</td>
                    <td className="px-4 py-3 text-center text-green-400">{r.success}</td>
                    <td className="px-4 py-3 text-center text-red-400">{r.failed || 0}</td>
                    <td className="px-4 py-3 text-center"><StatusBadge status={r.status} /></td>
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
