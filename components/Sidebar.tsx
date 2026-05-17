'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  LineChart,
  PackagePlus,
  ScrollText,
  Download,
  BookOpen,
  Star,
} from 'lucide-react';

const NAV = [
  { href: '/dashboard', label: 'ダッシュボード', icon: LayoutDashboard },
  { href: '/graph',     label: '推移グラフ',     icon: LineChart },
  { href: '/asins',     label: 'ASIN登録',       icon: PackagePlus },
  { href: '/logs',      label: '実行ログ',       icon: ScrollText },
  { href: '/export',    label: 'CSVエクスポート', icon: Download },
  { href: '/guide',     label: '使い方ガイド',   icon: BookOpen },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 flex-shrink-0 bg-gray-900 border-r border-gray-800 flex flex-col min-h-screen">
      <div className="flex items-center gap-2 px-5 py-5 border-b border-gray-800">
        <Star className="text-orange-400 w-5 h-5" />
        <span className="font-bold text-sm text-white leading-tight">
          Amazon<br />
          <span className="text-orange-400">レビュー</span>・<span className="text-orange-400">購入件数</span>計測
        </span>
      </div>

      <nav className="flex-1 py-4 space-y-0.5 px-2">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                active
                  ? 'bg-orange-500/20 text-orange-300 font-medium'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="px-4 py-3 border-t border-gray-800 text-xs text-gray-600">
        v0.1.0
      </div>
    </aside>
  );
}
