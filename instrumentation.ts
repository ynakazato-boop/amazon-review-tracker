export async function register() {
  // process.env.NEXT_RUNTIME を if ブロック内で正条件チェックすることで
  // webpack が Edge ランタイム向けビルド時に dead code として除去できる。
  // 早期 return パターンだと webpack が import() を Edge バンドルに含めてしまう。
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { maybeInitCron } = await import('./lib/cronInit');
    maybeInitCron();
  }
}
