// ─────────────────────────────────────────────────────────────────────────────
// UI translation strings — add new entries here as the app grows.
// Usage:  import { T, t } from '../data/i18n'
//         t(T.market.signBtn, lang)   →  "Sign" | "签约"
// ─────────────────────────────────────────────────────────────────────────────

export const T = {

  // ── Navbar ─────────────────────────────────────────────────────────────────
  nav: {
    home:     { en: 'Home',     zh: '主页' },
    market:   { en: 'Market',   zh: '市场' },
    myTeam:   { en: 'My Team',  zh: '我的球队' },
    simulate: { en: 'Simulate', zh: '模拟' },
    league:   { en: 'League',   zh: '联赛' },
  },

  // ── Home ───────────────────────────────────────────────────────────────────
  home: {
    subtitle: { en: 'Fantasy Basketball', zh: '梦幻篮球' },
  },

  // ── Market ─────────────────────────────────────────────────────────────────
  market: {
    title:          { en: 'Free Market',        zh: '自由市场' },
    cash:           { en: 'Cash',               zh: '现金' },
    capSpace:       { en: 'Cap Space',           zh: '薪资空间' },
    untilRefresh:   { en: 'until refresh',       zh: '刷新倒计时' },
    refreshBtn:     { en: '↻ Refresh',           zh: '↻ 刷新' },
    signBtn:        { en: 'Sign',                zh: '签约' },
    cantAfford:     { en: "Can't afford",        zh: '负担不起' },
    signed:         { en: 'Signed',              zh: '已签约' },
    onTeam:         { en: 'On Team',             zh: '已加入' },
    signingOk:      { en: 'Signed!',             zh: '签约成功！' },
    empty:          { en: 'Market is empty',     zh: '市场为空' },
    generate:       { en: 'Generate Market',     zh: '生成市场' },
  },

  // ── Foundational Pick ──────────────────────────────────────────────────────
  foundational: {
    title:       { en: 'Choose Your Foundational Player',  zh: '选择你的核心球员' },
    subtitle:    { en: 'Pick one S-tier superstar to anchor your team. Choose wisely.',
                   zh: '选择一位 S 级超级球星作为球队核心，慎重选择。' },
    rosterNote:  { en: 'You\'ll also receive 7 randomly assigned players to fill your roster.',
                   zh: '你还将获得 7 名随机分配的球员来填充阵容。' },
    salary:      { en: 'Salary',  zh: '薪资' },
    lockIn:      { en: 'Lock In →', zh: '确认选择 →' },
  },

  // ── Team Reveal ────────────────────────────────────────────────────────────
  teamReveal: {
    title:        { en: 'Your roster is being assembled…', zh: '正在组建你的阵容…' },
    cornerstone:  { en: '⭐ Cornerstone', zh: '⭐ 核心球员' },
    startPlaying: { en: 'Start Playing →', zh: '开始游戏 →' },
    shuffle:      { en: '↺ Shuffle', zh: '↺ 重新分配' },
  },

  // ── Swap Drawer ────────────────────────────────────────────────────────────
  swapDrawer: {
    positionLabel:    { en: (pos) => `${pos} Position`,       zh: (pos) => `${pos} 位置` },
    currently:        { en: (name) => `Currently: ${name}`,   zh: (name) => `当前：${name}` },
    emptySlot:        { en: 'Empty slot — pick a player',     zh: '空位 — 选择一名球员' },
    removeBtn:        { en: 'Remove',                         zh: '移除' },
    noBench:          { en: 'No bench players available',     zh: '没有可用替补' },
    selectBench:      { en: 'Select from bench (sorted by effective rating)', zh: '选择替补（按实际能力排序）' },
  },

  // ── My Team ────────────────────────────────────────────────────────────────
  myTeam: {
    cash:          { en: 'Cash',                  zh: '现金' },
    capSpace:      { en: 'Cap Space',              zh: '薪资空间' },
    bench:         { en: 'Bench',                  zh: '板凳席' },
    reset:         { en: 'Reset',                  zh: '重置' },
    resetConfirm:  { en: 'Reset your team and start over?', zh: '确认重置球队并重新开始？' },
    hardReset:     { en: '⚠ Hard Reset (Dev)',     zh: '⚠ 完全重置 (Dev)' },
    hardResetConfirm: { en: 'Clear ALL data and restart from scratch?', zh: '清除所有数据并重新开始？' },
    allStarting:   { en: 'All players are in the starting lineup', zh: '所有球员都在首发阵容中' },
    sellBtn:       { en: 'Sell',                   zh: '出售' },
    sellFor:       { en: (n) => `Sell $${n}M`,     zh: (n) => `出售 $${n}M` },
    sellConfirm:   { en: (name, n) => `Release ${name} for $${n}M (80% of salary)?`,
                     zh: (name, n) => `以 $${n}M 出售 ${name}（薪资的80%）？` },
    starterCount:  { en: (n, total) => `${n}/5 starters · ${total} players`,
                     zh: (n, total) => `${n}/5 首发 · ${total} 球员` },
  },

  // ── Simulate ───────────────────────────────────────────────────────────────
  simulate: {
    myTeamLabel:     { en: 'MY TEAM',           zh: '我的球队' },
    final:           { en: 'FINAL',             zh: '终场' },
    vs:              { en: 'VS',                zh: 'VS' },
    youWin:          { en: '🏆 YOU WIN',         zh: '🏆 你赢了' },
    winReward:       { en: '+$5M Victory Bonus', zh: '+$500万 胜利奖励' },
    dynastyWins:     { en: 'DYNASTY WINS',      zh: '王朝获胜' },
    tie:             { en: 'TIE GAME',           zh: '平局' },
    playLog:         { en: 'Play Log',          zh: '对战日志' },
    boxScore:        { en: 'Box Score',         zh: '数据统计' },
    newGame:         { en: '↺ New Game',         zh: '↺ 新比赛' },
    speed:           { en: 'Speed:',            zh: '速度：' },
    slow:            { en: 'Slow',              zh: '慢速' },
    normal:          { en: 'Normal',            zh: '正常' },
    fast:            { en: 'Fast',              zh: '快速' },
    simulateBtn:     { en: '▶ Simulate Game',   zh: '▶ 开始模拟' },
    endOfGame:       { en: '— End of game —',   zh: '— 比赛结束 —' },
    pressStart:      { en: 'Press Simulate Game to start', zh: '点击"开始模拟"' },
    incompleteTitle: { en: 'Lineup incomplete',  zh: '阵容不完整' },
    incompleteHave:  { en: (n) => `You have ${n}/5 starters set.`,    zh: (n) => `当前只有 ${n}/5 位首发。` },
    incompleteHint:  { en: 'Go to My Team and fill all 5 positions (PG, SG, SF, PF, C).',
                       zh: '请到"我的队"页面，填满5个首发位置 (PG, SG, SF, PF, C)。' },
    playsCount:      { en: (r, t) => `${r} / ${t} plays`,  zh: (r, t) => `${r} / ${t} 回合` },
    vsLabel:         { en: (name) => `vs ${name}`,          zh: (name) => `对阵 ${name}` },
    pause:           { en: 'Pause',                         zh: '暂停' },
    resume:          { en: 'Resume',                        zh: '继续' },
    autoResume:      { en: (n) => `Auto in ${n}s`,          zh: (n) => `${n}秒后自动继续` },
    statsBtn:        { en: 'Stats',                         zh: '数据' },
    clickToSub:      { en: '— click a player to sub',       zh: '— 点击球员换人' },
    liveBoxScore:    { en: 'Live Box Score',                zh: '当前数据统计' },
    autoSimulate:    { en: '⚡ Auto',                        zh: '⚡ 自动换人' },
    autoSimulateOff: { en: 'Manual',                        zh: '手动' },
    subPlayer:       { en: 'Sub player',                    zh: '换人' },
    currentPlayer:   { en: 'Current',                       zh: '当前球员' },
    noBenchSub:      { en: 'No bench players',              zh: '无替补' },
    selectSub:       { en: 'Select replacement',            zh: '选择替补' },
  },

  // ── League ─────────────────────────────────────────────────────────────────
  league: {
    title:   { en: 'League',                               zh: '联赛' },
    soon:    { en: 'Coming soon — standings and matchups.', zh: '即将推出——排名与赛程。' },
  },

  // ── Box score column headers ────────────────────────────────────────────────
  boxScore: {
    player: { en: 'Player', zh: '球员' },
  },

  // ── Shared ─────────────────────────────────────────────────────────────────
  shared: {
    atk:  { en: 'ATK', zh: '攻击' },
    def:  { en: 'DEF', zh: '防守' },
    pts:  { en: 'PTS', zh: '得分' },
    reb:  { en: 'REB', zh: '篮板' },
    ast:  { en: 'AST', zh: '助攻' },
    stl:  { en: 'STL', zh: '抢断' },
    blk:  { en: 'BLK', zh: '盖帽' },
    to:   { en: 'TO',  zh: '失误' },
    min:  { en: 'MIN', zh: '时间' },
  },
}

/**
 * Get a translated string.
 * If the value is a function (for parametrized strings), call it with args.
 * @param {object} entry  - T.xxx entry, e.g. { en: 'Sign', zh: '签约' }
 * @param {string} lang   - 'en' | 'zh'
 * @param {...any} args   - optional args for function strings
 */
export function t(entry, lang, ...args) {
  const val = entry?.[lang] ?? entry?.en ?? ''
  return typeof val === 'function' ? val(...args) : val
}
