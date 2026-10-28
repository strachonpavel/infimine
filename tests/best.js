<script>
const s = [];
const log = m => { s.push(m); document.title = 'RESULT: ' + s.join(' | '); };
const ready = () => (window.infimine && typeof window.infimine.main === 'function');
/* fake clock - the win needs a controlled non-zero time */
let fakeNow = 1700000000000;
Date.now = () => fakeNow;
const advance = ms => { fakeNow += ms; };
const endLine = () => document.getElementById('infimine').textContent.replace(/\s+/g,' ');
const hasScoreBadge = () => endLine().includes('NEW BEST SCORE');
const hasTimeBadge = () => endLine().includes('NEW BEST TIME');
const key = sel => { const e = document.querySelector(sel); if (!e) throw new Error('missing: '+sel); e.dispatchEvent(new MouseEvent('click',{bubbles:true})); return e; };
const ctrlClick = sel => { const e = document.querySelector(sel); if (!e) throw new Error('missing: '+sel); e.dispatchEvent(new MouseEvent('click',{bubbles:true,ctrlKey:true})); return e; };
const gk = () => JSON.stringify([[8,8],3,10]);
const stored = () => { const k = Object.keys(localStorage).filter(x=>x.startsWith('bestScoreList_'));
  return k.length ? JSON.parse(localStorage.getItem(k[0])) : []; };
/* a controlled win: mark (starts the clock), wait, unmark, open everything */
const winIn = async (ms) => {
  window.infimine.setRandom(() => 1); //no mines
  window.infimine.newGame('8_8_3_10');
  ctrlClick('td[data-act="cell"]'); //mark - starts the clock, the game stays on
  advance(ms);
  ctrlClick('td.mark');             //unmark
  key('td[data-act="cell"]');       //opens everything -> win -> clock frozen
};
(async () => {
  try {
    for (let i=0; i<200 && !ready(); i++) await new Promise(r=>setTimeout(r,20));
    if (!ready()) { log('NO_API'); throw 0; }
    localStorage.clear(); window.infimine.main();

    /* A: the very first record - both badges */
    await winIn(5000);
    log('firstRecordBothBadges=' + (hasScoreBadge() && hasTimeBadge() ? 'ok' : 'FAILED:'+endLine().slice(-60)));
    log('firstRecordKeepsTime=' + (stored()[0][1].time === 5000 ? 'ok' : 'FAILED:'+JSON.stringify(stored()[0]&&stored()[0][1]&&stored()[0][1].time)));

    /* B: an equal score and a slower time - no badges (records must strictly improve) */
    await winIn(9000);
    log('noBadgeWhenNotBetter=' + (!hasScoreBadge() && !hasTimeBadge() ? 'ok' : 'FAILED:'+endLine().slice(-60)));
    log('recordCount=' + (stored().length === 2 ? 'ok' : 'FAILED:'+stored().length));

    /* C: worse records in storage -> both badges again */
    localStorage.setItem('bestScoreList_'+gk(), JSON.stringify([
      ['9999999999999999999', {score:'9999999999999999999', time:999999}, new Date(2020,0,1).toISOString()]
    ]));
    await winIn(1000);
    log('bothBadgesVsWorse=' + (hasScoreBadge() && hasTimeBadge() ? 'ok' : 'FAILED:'+endLine().slice(-60)));

    /* D: better score but slower time - score badge only */
    localStorage.setItem('bestScoreList_'+gk(), JSON.stringify([
      ['9999999999999999999', {score:'9999999999999999999', time:1000}, new Date(2020,0,1).toISOString()]
    ]));
    await winIn(60000);
    log('scoreBadgeOnly=' + (hasScoreBadge() && !hasTimeBadge() ? 'ok' : 'FAILED:'+endLine().slice(-60)));

    /* E: worse score but faster time - time badge only */
    localStorage.setItem('bestScoreList_'+gk(), JSON.stringify([
      ['100', {score:'100', time:100000}, new Date(2020,0,1).toISOString()]
    ]));
    await winIn(2000);
    log('timeBadgeOnly=' + (!hasScoreBadge() && hasTimeBadge() ? 'ok' : 'FAILED:'+endLine().slice(-60)));

    /* F: legacy records without time - the time badge still works, the score badge needs a lower score */
    localStorage.setItem('bestScoreList_'+gk(), JSON.stringify([
      ['100', {score:'100', bombs:1, marks:1}, new Date(2020,0,1).toISOString()]
    ]));
    await winIn(3000);
    log('legacyTimelessRecord=' + (hasTimeBadge() && !hasScoreBadge() ? 'ok' : 'FAILED:'+endLine().slice(-60)));

    /* G: a fresh game shows no leftover badges (there is no END line at all) */
    window.infimine.newGame('8_8_3_10');
    log('freshNoBadge=' + (!endLine().includes('NEW BEST') && !endLine().includes('END ---') ? 'ok' : 'FAILED'));
    window.infimine.setRandom(null);
  } catch(e) { log('EXC=' + e.message); }
  document.body.insertAdjacentHTML('beforeend','<pre id="t">'+s.join('\n')+'</pre>');
})();
</script>
