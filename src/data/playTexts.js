// ─────────────────────────────────────────────────────────────────────────────
// Bilingual play-by-play text library
// {atk} = attacker last name   {def} = defender last name
//
// Structure: TEXTS[action_key][position] → Array<{ en, zh }>
// action_key:  '3pt_made' | '3pt_miss' | '2pt_made' | '2pt_miss' | 'ft'
//              | 'steal' | 'block' | 'turnover'
// position:    'PG' | 'SG' | 'SF' | 'PF' | 'C'
//
// To add more lines: append { en, zh } objects to the relevant array.
// ─────────────────────────────────────────────────────────────────────────────

const TEXTS = {

  // ── 3-point shot — MADE ──────────────────────────────────────────────────
  '3pt_made': {
    PG: [
      { en: '{atk} pulls up off the dribble — BANG! Three-pointer!',              zh: '{atk} 运球急停跳投——命中！三分球！' },
      { en: '{atk} step-back, creates space, fires — MONEY!',                     zh: '{atk} 后撤步拉开距离——三分刷网！' },
      { en: '{atk} races ahead in transition, rises — BURIES the 3!',             zh: '{atk} 快攻推进，起跳——三分命中！' },
      { en: '{atk} off-the-dribble triple, never hesitates — GOOD!',              zh: '{atk} 运球直接投三分，毫不犹豫——进了！' },
      { en: '{atk} ridiculous step-back, pulls an entire body width — PRECISION!', zh: '{atk} 后撤幅度夸张，拉开整整一个身位——精准制导！' },
      { en: '{atk} cold-blooded from range — this shot doesn\'t negotiate!',       zh: '{atk} 冷血拔枪，这球根本不带讲理的。' },
    ],
    SG: [
      { en: '{atk} catches and shoots in rhythm — perfect rotation, GOOD!',       zh: '{atk} 接球即投，节奏完美——命中！' },
      { en: '{atk} fades to the corner, rises — SPLASH!',                         zh: '{atk} 退至底角，一跃而起——三分进！' },
      { en: '{atk} curls off the screen, spots up — fires and HITS!',             zh: '{atk} 绕掩护出来，定点出手——命中！' },
      { en: '{atk} pump-fakes {def}, rises and nails the three!',                 zh: '{atk} 假动作晃过{def}，起跳命中三分！' },
      { en: '{atk} raises up beyond the arc — {def} can only hear the swish!',    zh: '{atk} 三分线外抬手就是答案，{def}只能听到刷网声。' },
      { en: '{atk} catch, zero hesitation — fires in a fraction of a second!',    zh: '{atk} 接球无调整，零点几秒出手——干脆利落！' },
      { en: '{atk} launches outside — straight to the heart of the rim, ice cold!', zh: '{atk} 外线开火，篮球直刺篮心，没有一丝犹豫！' },
    ],
    SF: [
      { en: '{atk} rises over {def} on the wing — MADE!',                         zh: '{atk} 在侧翼强起，越过{def}——命中！' },
      { en: '{atk} open corner 3, pure stroke — MADE!',                           zh: '{atk} 底角空位三分，出手干净——命中！' },
      { en: '{atk} pump-fakes, {def} bites, rises and fires — GOOD!',             zh: '{atk} 假动作，{def}上当，真实起跳——三分进！' },
      { en: '{atk} off-ball cut, catch at the arc — DRILLS it!',                  zh: '{atk} 无球跑位，弧顶接球——直接投进！' },
      { en: '{atk} hand is scorching — the 3-pointer has its own lock-on system!', zh: '{atk} 手感滚烫，三分像是自带锁头系统。' },
    ],
    PF: [
      { en: '{atk} pops out to the arc, launches — GOOD!',                        zh: '{atk} 弹出三分线，出手——命中！' },
      { en: '{atk} spotted up on the wing, nails the triple!',                    zh: '{atk} 翼区等球，三分球稳稳打进！' },
      { en: '{atk} unexpected 3, {def} caught sleeping — MADE!',                  zh: '{atk} 出其不意的三分，{def}没有跟上——命中！' },
      { en: '{atk} stretch 4 doing work — drains the triple!',                    zh: '{atk} 拉开空间大前锋发威——三分进！' },
    ],
    C: [
      { en: '{atk} drifts to the 3-point line — big man can SHOOT!',              zh: '{atk} 飘到三分线——大个子也会投篮！' },
      { en: '{atk} wide open beyond the arc, no one follows — MADE!',             zh: '{atk} 三分线外空位，没人防——命中！' },
      { en: '{atk} surprising triple! {def} didn\'t follow out — GOES IN!',       zh: '{atk} 意外的三分！{def}没有跟出——进了！' },
    ],
  },

  // ── 3-point shot — MISSED ────────────────────────────────────────────────
  '3pt_miss': {
    PG: [
      { en: '{atk} pull-up 3 — off the back rim, no good',                        zh: '{atk} 运球跳投三分——砸后沿出局' },
      { en: '{atk} step-back, pulls the trigger — rimmed out',                    zh: '{atk} 后撤步出手——圆弧蹦出' },
      { en: '{atk} fires the long ball — falls short',                            zh: '{atk} 远射——没进' },
      { en: '{atk} hesitation triple — {def} contests, clank!',                   zh: '{atk} 停顿后投三分——{def}干扰，打铁！' },
      { en: '{atk} step-back triple — legs fade, clangs off the back of the rim', zh: '{atk} 后撤步三分——腿软了，砸后沿出局' },
      { en: '{def} closes out hard — bothers the release, {atk}\'s 3 is off',     zh: '{def} 飞速补防——干扰出手，{atk}的三分偏了' },
      { en: '{atk} clean look off the dribble — rattles in and out, so close!',   zh: '{atk} 运球空位——进进出出，差一点！' },
    ],
    SG: [
      { en: '{atk} catch-and-shoot 3 — rattles iron',                             zh: '{atk} 接球跳投三分——碰铁出局' },
      { en: '{atk} off the curl, 3-ball — wide right',                            zh: '{atk} 绕掩护接球三分——偏右没进' },
      { en: '{atk} fades into a corner triple — off the side of the backboard',   zh: '{atk} 底角三分——打板出局' },
      { en: '{atk} open corner triple — kicks the back iron, bench goes quiet',   zh: '{atk} 底角空位三分——打后沿，全场安静了' },
      { en: '{atk} pulls up for 3 — flat arc clips the front rim, no good',       zh: '{atk} 急停三分——弧度太平，打前沿出局' },
    ],
    SF: [
      { en: '{atk} wing 3, contested by {def} — no good',                         zh: '{atk} 翼区三分，被{def}干扰——没进' },
      { en: '{atk} rises and fires — clanks off the rim',                         zh: '{atk} 起跳出手——砸框弹出' },
      { en: '{atk} pull-up triple — short and left',                              zh: '{atk} 急停三分——打短偏左了' },
      { en: '{atk} wing triple — rattles in and out, the rim gave it back!',      zh: '{atk} 翼区三分——进进出出，篮圈不买账！' },
      { en: '{def} closes out perfectly — {atk} rushes the shot, airball!',       zh: '{def} 补防到位——{atk}仓促出手，直接气球球！' },
    ],
    PF: [
      { en: '{atk} pops to the arc, launches — bricks it hard',                   zh: '{atk} 弹到弧顶出手——打铁' },
      { en: '{atk} 3-ball from the wing — offline',                               zh: '{atk} 翼区三分——偏了' },
      { en: '{atk} unexpected long shot — way off',                               zh: '{atk} 意外出手长距离——差太多' },
      { en: '{atk} launches from the arc — sails long, bounces off the backboard', zh: '{atk} 弧顶三分出手——飞太远，打板出局' },
    ],
    C: [
      { en: '{atk} heaves a 3 — air ball, what was that?',                        zh: '{atk} 投了个三分——完全落空，这是干嘛？' },
      { en: '{atk} drifts beyond the arc, fires — well short',                    zh: '{atk} 漂到三分线外出手——差太多' },
      { en: '{atk} 3-point try — blocked clean by {def}',                         zh: '{atk} 尝试三分——被{def}干净封盖' },
      { en: '{atk} heaves a triple — clangs off everything, bounces into the crowd', zh: '{atk} 投了个三分——叮叮当当，弹到观众席去了' },
    ],
  },

  // ── 2-point shot — MADE ──────────────────────────────────────────────────
  '2pt_made': {
    PG: [
      { en: '{atk} splits the defense, teardrop — GOOD!',                         zh: '{atk} 分开防守，挑篮——进了！' },
      { en: '{atk} hesitation, blows by {def} — finger roll MADE!',               zh: '{atk} 停顿晃过{def}——轻松上篮！' },
      { en: '{atk} drives hard, floater at the rim — NETS IT!',                   zh: '{atk} 强突，禁区抛投——命中！' },
      { en: '{atk} euro-step, avoid the defense — lays it MADE!',                 zh: '{atk} 欧洲步，绕过防守——轻松得分！' },
      { en: '{atk} ignites like lightning — first step shreds the defense, {def} watches the replay!', zh: '{atk} 启动如闪电，第一步直接撕裂防线，{def}只能目送背影！' },
      { en: '{atk} crossover after crossover — {def} is just a spectator now.',   zh: '{atk} 连续胯下换手，把{def}晃成了观众。' },
      { en: '{atk} sudden stop — {def}\'s weight transfers and it\'s over.',       zh: '{atk} 突然一个急停，{def}重心直接交代。' },
      { en: '{atk} plays rhythm, not just speed — the defense has no answer.',     zh: '{atk} 玩的是节奏，不是速度。' },
    ],
    SG: [
      { en: '{atk} mid-range pull-up — SPLASHES in!',                             zh: '{atk} 中距离急停跳投——命中！' },
      { en: '{atk} drives baseline, reverse layup — GOOD!',                       zh: '{atk} 底线突破，反手上篮——进了！' },
      { en: '{atk} step-back mid-ranger — GOOD!',                                 zh: '{atk} 后撤步中投——命中！' },
      { en: '{atk} catch-and-go, strong finish — AND ONE!',                       zh: '{atk} 接球就冲，强硬完成——得分加罚！' },
      { en: '{atk} changes direction hard, {def} can\'t handle it — pure talent!', zh: '{atk} 强行变道超车，身体对抗拉满——这一球是纯天赋碾压！' },
      { en: '{atk} pump-fake so real even the camera got fooled.',                 zh: '{atk} 假动作逼真到连摄像机都被骗了。' },
    ],
    SF: [
      { en: '{atk} posts up {def}, drop-step — MADE!',                            zh: '{atk} 对位{def}背打，转身——得分！' },
      { en: '{atk} drives through traffic — lays it up, GOOD!',                   zh: '{atk} 在人堆里杀进去——上篮，进！' },
      { en: '{atk} mid-range off the glass — MADE!',                              zh: '{atk} 中投打板——进了！' },
      { en: '{atk} bulldozes past {def}, power layup — GOOD!',                    zh: '{atk} 暴力突破{def}，强硬上篮——得分！' },
      { en: '{atk} straight-line burst — the lane clears as if on command, one-arm SLAM!', zh: '{atk} 直线加速，禁区像是为他清空，单臂砸扣宣告主权！' },
      { en: '{atk} footwork like a surgeon — cuts open the defense one slice at a time.', zh: '{atk} 步伐细腻如同拆弹专家，一刀一刀切开防线。' },
      { en: '{atk} pivots into the paint — this shot carries anger.',              zh: '{atk} 转身杀入腹地，这球带着怒火！' },
    ],
    PF: [
      { en: '{atk} post-up, pump-fake, spin — MADE!',                             zh: '{atk} 背打，假动作，转身——得分！' },
      { en: '{atk} catches in the paint, quick drop — GOOD!',                     zh: '{atk} 禁区接球，快速扣篮——进了！' },
      { en: '{atk} elbow mid-range, textbook stroke — GOOD!',                     zh: '{atk} 罚球线中投，教科书式出手——命中！' },
      { en: '{atk} strong seal, lob finish — GOOD!',                              zh: '{atk} 强力卡位，抛球完成——进了！' },
      { en: '{atk} hangs in the air for a moment — time slows — then CRASHES it home!', zh: '{atk} 空中停顿一瞬，时间仿佛慢放——然后重重砸进篮筐！' },
      { en: '{atk} low-post bulldozer mode activated.',                            zh: '{atk} 背身低位推土机模式启动。' },
    ],
    C: [
      { en: '{atk} catches in the post, seal — POWER DUNK!',                      zh: '{atk} 低位接球，用力一扣——暴扣！' },
      { en: '{atk} hook shot over {def} — GOOD!',                                 zh: '{atk} 勾手盖过{def}——进了！' },
      { en: '{atk} putback slam — TWO!',                                           zh: '{atk} 补扣——进！' },
      { en: '{atk} deep post move, off the glass — MADE!',                        zh: '{atk} 低位背打，打板——进了！' },
    ],
  },

  // ── 2-point shot — MISSED ────────────────────────────────────────────────
  '2pt_miss': {
    PG: [
      { en: '{atk} drives, floater — no good',                                    zh: '{atk} 突进，抛投——没进' },
      { en: '{atk} mid-range pull-up — off the rim',                              zh: '{atk} 中投急停——砸框' },
      { en: '{atk} drives, lays it up — gets blocked by {def}!',                  zh: '{atk} 突破上篮——被{def}封出！' },
      { en: '{atk} teardrop at the rim — hangs on the lip and falls off',         zh: '{atk} 禁区抛投——在篮沿转了一圈掉出来了' },
      { en: '{atk} threads through traffic — blocked clean by {def}!',            zh: '{atk} 穿越人群突进——被{def}干净封盖！' },
    ],
    SG: [
      { en: '{atk} mid-range J — rattles out',                                    zh: '{atk} 中投——弹框出局' },
      { en: '{atk} drives, lays it up — missed',                                  zh: '{atk} 突破上篮——没进' },
      { en: '{atk} step-back — short off the front rim',                          zh: '{atk} 后撤步——打短了' },
      { en: '{atk} runner off the glass — too low, skips back off the iron',      zh: '{atk} 打板跑动中投——力道不足，弹框出局' },
      { en: '{atk} drives hard, {def} stays vertical — no call, no basket',       zh: '{atk} 强攻，{def}站直不动——无犯规，无进球' },
    ],
    SF: [
      { en: '{atk} post move, turnaround — rattles in and out',                   zh: '{atk} 背打转身——进出了' },
      { en: '{atk} drives, contested hard by {def} — missed',                     zh: '{atk} 突破，被{def}强力干扰——没进' },
      { en: '{atk} mid-range fade — offline, no good',                            zh: '{atk} 后仰跳投——偏了' },
      { en: '{atk} drives into a wall of hands — short and left, no good',        zh: '{atk} 突进人堆——力道不够偏左，没进' },
      { en: '{atk} turnaround off the glass — rattles around and out',            zh: '{atk} 背打转身打板——在篮筐里转了一圈出来了' },
    ],
    PF: [
      { en: '{atk} post-up, turnaround — blocked by {def}!',                      zh: '{atk} 低位转身——被{def}盖帽！' },
      { en: '{atk} elbow J — front of the rim',                                   zh: '{atk} 罚球线跳投——打前沿出局' },
      { en: '{atk} rolls off screen, mid-range — off the glass, out',             zh: '{atk} 绕掩护接球中投——打板没进' },
      { en: '{atk} hook shot — too much spin, rattles out',                       zh: '{atk} 勾手——旋转过多，弹出来了' },
    ],
    C: [
      { en: '{atk} hook — brushes iron, rolls out',                               zh: '{atk} 勾手——碰铁没进' },
      { en: '{atk} post-up, turnaround — bricked hard',                           zh: '{atk} 低位转身跳投——打铁' },
      { en: '{atk} lob attempt at the rim — missed',                              zh: '{atk} 高抛球——没进' },
      { en: '{atk} spins in the post — bricks off the side of the backboard',     zh: '{atk} 低位旋转——打板偏了，砸侧板出局' },
      { en: '{atk} power move, gets there — charge called, offensive foul!',      zh: '{atk} 强攻冲进禁区——冲撞犯规！主动犯规！' },
    ],
  },

  // ── Free throws ──────────────────────────────────────────────────────────
  // NOTE: buildDescription appends the actual result (e.g. "2/2 FT") after these lines
  'ft': {
    PG: [
      { en: '{atk} draws the foul, steps to the line',                            zh: '{atk} 造犯规，走上罚球线' },
      { en: '{atk} gets into the paint, draws contact',                           zh: '{atk} 杀入禁区，造成犯规' },
      { en: '{atk} weaves through traffic — absorbs contact and gets the call',   zh: '{atk} 穿越人群——吃到接触，造犯规' },
      { en: '{atk} quick stop at the line — {def} over the line, foul!',         zh: '{atk} 急停禁区边——{def}压线，犯规！' },
    ],
    SG: [
      { en: '{atk} slashes, draws the foul — free throws',                        zh: '{atk} 突破造犯规——罚球' },
      { en: '{atk} at the charity stripe',                                        zh: '{atk} 站上罚球线' },
      { en: '{atk} shoulder into {def} — drives through, AND ONE!',              zh: '{atk} 肩膀顶着{def}——强冲进去，得分加罚！' },
      { en: '{atk} slashes baseline, gets fouled hard — two free throws',         zh: '{atk} 底线突破，被硬犯——两罚' },
    ],
    SF: [
      { en: '{atk} strong drive, earns free throws',                              zh: '{atk} 强行突破，获得罚球机会' },
      { en: '{atk} to the line for 2',                                            zh: '{atk} 罚两球' },
      { en: '{atk} bullies into the post — hacked from behind, free throws',      zh: '{atk} 强行背打推进——被背后犯规，罚球' },
      { en: '{atk} catches and drives, {def} reaches — foul called, to the line', zh: '{atk} 接球突破，{def}伸手——犯规判定，走上罚球线' },
    ],
    PF: [
      { en: '{atk} draws the foul in the post — free throws',                    zh: '{atk} 低位造犯规——罚球' },
      { en: '{atk} strong move, earns 2 free throws',                            zh: '{atk} 强攻造犯规，获得两次罚球' },
      { en: '{atk} posts up deep — held on the move, to the line',               zh: '{atk} 低位卡深位——被抱住，罚球' },
      { en: '{atk} seals the defender — hacked from behind, two shots',          zh: '{atk} 卡住防守人——背后犯规，两罚' },
    ],
    C: [
      { en: '{atk} bulldozes in, draws the foul — two shots',                    zh: '{atk} 强攻内线造犯规——罚两球' },
      { en: '{atk} seal in the paint, contact — free throws',                    zh: '{atk} 内线卡位造犯规——罚球' },
      { en: '{atk} catches the lob — hammered in mid-air, two free throws!',     zh: '{atk} 接空中传球——空中被砸，两罚！' },
      { en: '{atk} rises for the putback — fouled mid-air, to the line!',        zh: '{atk} 跃起补篮——空中被犯规，走上罚球线！' },
    ],
  },

  // ── Steal — picked by DEFENDER's position ────────────────────────────────
  'steal': {
    PG: [
      { en: '{def} reads the passing lane — STEAL! {atk} coughs it up!',          zh: '{def} 预判传球路线——抢断！{atk} 失误！' },
      { en: '{def} strips {atk} in the open court — breaks away!',                zh: '{def} 在开阔地带从{atk}手里夺走——抢断！' },
      { en: '{def} darts in, pokes the ball free — GONE!',                        zh: '{def} 飞速出手，把球拨走——抢断！' },
      { en: '{def} anticipates {atk}\'s crossover — PICKS IT!',                   zh: '{def} 预判{atk}的交叉步——截断！' },
      { en: '{def} one step ahead — positions perfectly, textbook defensive stance!', zh: '{def} 提前一步站好位置，这是教科书级别的防守站位。' },
      { en: '{def} predicted the move — STEAL, fast break!',                      zh: '{def} 预判成功，直接抢断反击！' },
    ],
    SG: [
      { en: '{def} pokes the ball free from {atk} — STEAL!',                      zh: '{def} 把球从{atk}手里拨出——抢断！' },
      { en: '{def} reads {atk}\'s eyes — PICK IT!',                               zh: '{def} 读懂{atk}的眼神——抢断！' },
      { en: '{def} deflects the pass — STEAL and go!',                            zh: '{def} 拨偏传球——抢断！快攻！' },
      { en: '{def} corners {atk} — nowhere to go, ball stripped!',                zh: '{def} 把{atk}逼到死角，防守强度直接拉满。' },
    ],
    SF: [
      { en: '{def} swipes at the ball — got it! Steal!',                          zh: '{def} 手臂一挥——拿到了！抢断！' },
      { en: '{def} jumps the passing lane — THEFT by {def}!',                     zh: '{def} 堵截传球——{def}抢断！' },
      { en: '{def} gambles on the steal — pays off!',                             zh: '{def} 赌了一把抢断——成了！' },
      { en: '{def} raises both hands high — psychological shadow cast on {atk}.',  zh: '{def} 双手高举，给{atk}制造了心理阴影。' },
    ],
    PF: [
      { en: '{def} reads the entry pass — STEAL! Turnover {atk}!',                zh: '{def} 预判内线传球——抢断！{atk} 失误！' },
      { en: '{def} crashes the passing lane — THEFT!',                            zh: '{def} 堵截传球路线——抢断！' },
      { en: '{def} strips {atk} clean — ball security breakdown!',                zh: '{def} 从{atk}手中夺球——断球！' },
    ],
    C: [
      { en: '{def} deflects the post entry — STEAL by the big man!',              zh: '{def} 拨偏内线传球——大个子抢断！' },
      { en: '{def} tips the ball away — HUGE play!',                              zh: '{def} 把球拍走——关键断球！' },
      { en: '{def} swats the ball from {atk}\'s hands — STEAL!',                  zh: '{def} 从{atk}手中拍走球——抢断！' },
    ],
  },

  // ── Block — picked by DEFENDER's position ────────────────────────────────
  'block': {
    PG: [
      { en: '{def} times it perfectly — BLOCKED! {atk} shocked!',                 zh: '{def} 时机完美——封盖！{atk} 震惊了！' },
      { en: '{def} swats it away — nobody drives on {def}!',                      zh: '{def} 把球扇走——别想从{def}这里突破！' },
      { en: '{def} explodes off the floor — surprise BLOCK!',                     zh: '{def} 突然起跳——意外大帽！' },
    ],
    SG: [
      { en: '{def} contests from behind — BLOCKED by {def}!',                     zh: '{def} 从后方追上——封盖！' },
      { en: '{def} rises with {atk} — sends it to the stands!',                   zh: '{def} 和{atk}一起跳——把球扇进看台！' },
      { en: '{def} surprise block on {atk} — didn\'t see it coming!',             zh: '{def} 意外封掉{atk}的球——没想到！' },
    ],
    SF: [
      { en: '{def} rotates over, BLOCKS {atk}\'s shot!',                          zh: '{def} 协防到位，封盖{atk}的投篮！' },
      { en: '{def} meets {atk} at the rim — SWAT!',                               zh: '{def} 在篮框处迎击{atk}——大帽！' },
      { en: '{def} HUGE block — REJECTED into the crowd!',                        zh: '{def} 超级大帽——扇进人群！' },
      { en: '{def} closes out fast, blocks {atk}\'s shot clean!',                 zh: '{def} 快速补防，干净封盖{atk}！' },
    ],
    PF: [
      { en: '{def} erases {atk}\'s shot — BIG BLOCK!',                            zh: '{def} 盖掉{atk}的投篮——超级大帽！' },
      { en: '{def} skies and rejects {atk} — WOW!',                               zh: '{def} 高高跃起封盖{atk}——太厉害了！' },
      { en: '{def} MASSIVE rejection — {atk} can\'t believe it!',                 zh: '{def} 超级大帽——{atk}难以置信！' },
      { en: '{def} chase-down block — momentum KILLED!',                          zh: '{def} 一记追身大帽，把士气直接拍飞！' },
    ],
    C: [
      { en: '{def} towers over {atk} — NO! NOT IN THIS HOUSE!',                   zh: '{def} 居高临下——不行！这里是我的禁区！' },
      { en: '{def} absolute rejection — the rim protector is HERE!',              zh: '{def} 干脆利落的大帽——禁区守门员在！' },
      { en: '{def} swats {atk}\'s shot clean — REJECTED!',                        zh: '{def} 干净封盖{atk}——大帽！' },
      { en: '{def} blocks {atk} one-handed — make it look easy!',                 zh: '{def} 单手封盖{atk}——轻描淡写！' },
      { en: '{def} turns the paint into a no-fly zone.',                          zh: '{def} 把篮下变成了禁飞区。' },
    ],
  },

  // ── Turnover — picked by ATTACKER's position ─────────────────────────────
  'turnover': {
    PG: [
      { en: '{atk} telegraphs the pass — intercepted, turnover!',                 zh: '{atk} 传球太明显——被截断，失误！' },
      { en: '{atk} bad handle in traffic — loses the ball!',                      zh: '{atk} 在人堆里运球失控——失球！' },
      { en: '{atk} sloppy dribble — ball out of bounds',                          zh: '{atk} 运球不稳——球出界了' },
      { en: '{atk} fires a behind-the-back — right to nobody, turnover!',         zh: '{atk} 背后传球——传给空气了，失误！' },
      { en: '{atk} walks into a trap — nowhere to go, ball stripped!',            zh: '{atk} 走进包夹陷阱——无路可走，球被掏走！' },
      { en: '{atk} overdribbles at the top — {def} reaches in and steals it!',   zh: '{atk} 在弧顶运球太久——{def}伸手掏球，抢断！' },
    ],
    SG: [
      { en: '{atk} careless with the ball — turnover!',                           zh: '{atk} 处理球太粗心——失误！' },
      { en: '{atk} tries to split the trap — loses it',                           zh: '{atk} 尝试从夹击中突破——丢球了' },
      { en: '{atk} dribble off the foot — out of bounds',                         zh: '{atk} 球砸到脚——出界失误' },
      { en: '{atk} gets too fancy — dribbles it out of bounds',                   zh: '{atk} 花式运球玩过了——自己运出界外，失误' },
      { en: '{atk} lofts a pass over the top — intercepted! Great read!',         zh: '{atk} 高吊传球——被截断！对方早就等着了！' },
    ],
    SF: [
      { en: '{atk} turnover in transition — bad decision',                        zh: '{atk} 在快攻中失误——判断失误' },
      { en: '{atk} reaches to pass, gets stripped — turnover',                    zh: '{atk} 伸手传球，球被打走——失误' },
      { en: '{atk} charges into the defense — offensive foul!',                   zh: '{atk} 冲撞对方——主动犯规！' },
      { en: '{atk} drives head-down — runs straight into the charge, foul!',     zh: '{atk} 低头突破——硬撞进去，主动犯规！' },
      { en: '{atk} tries to thread the needle — passes into a covered lane, stolen!', zh: '{atk} 尝试穿针引线——传进有人的路线，被断！' },
    ],
    PF: [
      { en: '{atk} post move, spins into trouble — loses it',                     zh: '{atk} 背打时旋转失误——丢球了' },
      { en: '{atk} caught in a double team — stripped!',                          zh: '{atk} 被夹击——球被拿走！' },
      { en: '{atk} offensive foul — turnover!',                                   zh: '{atk} 主动犯规——失误！' },
      { en: '{atk} panics in the double team — blindly lobs it, stolen!',        zh: '{atk} 在夹击中慌了——盲目高抛，被断！' },
      { en: '{atk} spin move in traffic — loses grip, ball just rolls away',      zh: '{atk} 人堆里旋转——没抓住球，球自己滚走了' },
    ],
    C: [
      { en: '{atk} double-teamed in the post — turnover',                         zh: '{atk} 在低位被包夹——失误' },
      { en: '{atk} drops the entry pass — turnover!',                             zh: '{atk} 没有接稳内线传球——失误！' },
      { en: '{atk} offensive charge, loses the ball',                             zh: '{atk} 冲撞犯规——失去球权' },
      { en: '{atk} fumbles the dribble — ball bounces away, out of bounds!',      zh: '{atk} 运球脱手——球自己弹开，出界失误！' },
      { en: '{atk} entry pass gets tipped — gift-wrapped for the defense!',       zh: '{atk} 内线传球被拨偏——直接送给对手！' },
    ],
  },

  // ── Zone notifications ─────────────────────────────────────────────────────
  // {atk} = player name; picked by zone type (not position)
  'zone_hot': [
    { en: '🔥 {atk} is heating up!',                    zh: '🔥 {atk} 手感来了！' },
    { en: '🔥 {atk} is in a groove!',                   zh: '🔥 {atk} 状态拉满！' },
    { en: '🔥 {atk} is getting hot!',                   zh: '🔥 {atk} 手感火热！' },
  ],
  'zone_fire': [
    { en: '🔥🔥 {atk} is ON FIRE — unstoppable!',        zh: '🔥🔥 {atk} 无双模式启动！' },
    { en: '🔥🔥 {atk} has entered the zone!',            zh: '🔥🔥 {atk} 进入自动得分程序！' },
    { en: '🔥🔥 {atk} is TAKING OVER the game!',         zh: '🔥🔥 {atk} 接管比赛，全场目光锁定！' },
  ],
  'zone_cold': [
    { en: '❄️ {atk} is going cold...',                   zh: '❄️ {atk} 手感凉了...' },
    { en: '❄️ {atk} can\'t find the touch...',           zh: '❄️ {atk} 手感迷失...' },
  ],
  'zone_frozen': [
    { en: '❄️❄️ {atk} is completely frozen!',            zh: '❄️❄️ {atk} 彻底冻结！' },
    { en: '❄️❄️ {atk} is stuck in a freezing mode!',    zh: '❄️❄️ {atk} 冻结模式，投啥啥不进！' },
  ],
}

// ─── Public API ───────────────────────────────────────────────────────────────

function pickByPos(categoryObj, pos) {
  const list = categoryObj?.[pos] ?? categoryObj?.['SF'] ?? []
  if (!list.length) return { en: '{atk} makes a play', zh: '{atk} 有所作为' }
  return list[Math.floor(Math.random() * list.length)]
}

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

/** Pick a zone notification text for the given zone type ('hot'|'fire'|'cold'|'frozen'). */
export function pickZoneText(zoneType) {
  const list = TEXTS[`zone_${zoneType}`]
  if (!list?.length) return null
  return pickRandom(list)
}

/**
 * Given a play object from the game engine, pick a random bilingual text pair.
 * Returns { en: string, zh: string } with {atk} and {def} placeholders.
 */
export function pickPlayText(play) {
  const atkPos = play.attacker?.position ?? 'SF'
  const defPos = play.defender?.position ?? 'SF'

  if (play.turnover) {
    return play.specialEvent === 'steal'
      ? pickByPos(TEXTS.steal, defPos)
      : pickByPos(TEXTS.turnover, atkPos)
  }

  if (play.specialEvent === 'block') {
    return pickByPos(TEXTS.block, defPos)
  }

  if (play.shotType === 'FT') {
    return pickByPos(TEXTS.ft, atkPos)
  }

  const key = `${play.shotType}_${play.made ? 'made' : 'miss'}`
  return pickByPos(TEXTS[key] ?? {}, atkPos)
}
