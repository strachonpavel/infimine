<script>
const s = [];
const log = m => { s.push(m); document.title = 'RESULT: ' + s.join(' | '); };
const ready = () => (window.infimine && typeof window.infimine.main === 'function');
const key = sel => { const e = document.querySelector(sel); if (!e) throw new Error('missing: '+sel); e.dispatchEvent(new MouseEvent('click',{bubbles:true})); return e; };
const scoreRows = () => [...document.querySelectorAll('#ConfBestScore table tr')].slice(1).map(r => parseInt(r.cells[0].textContent));
const storedScores = () => { const k = Object.keys(localStorage).filter(x=>x.startsWith('bestScoreList_'));
  return k.length ? JSON.parse(localStorage.getItem(k[0])).map(e => parseInt(e[0])) : []; };
(async () => {
  try {
    for (let i=0; i<200 && !ready(); i++) await new Promise(r=>setTimeout(r,20));
    if (!ready()) { log('NO_API'); throw 0; }
    localStorage.clear(); window.infimine.main();

    /* A: a list stored in the WRONG (descending) order by an older version is sorted on read */
    window.infimine.newGame('8_8_3_10');
    const gk = JSON.stringify([[8,8],3,10]);
    const old = [500,100,400,200,300].map((v,i) => [String(v), {score:String(v), bombs:1, marks:1}, new Date(2020,0,i+1).toISOString()]);
    localStorage.setItem('bestScoreList_'+gk, JSON.stringify(old));
    key('td[data-act="conf"]'); key('button[data-tab="ConfBestScore"]');
    log('readSortsAscending=' + (JSON.stringify(scoreRows()) === '[100,200,300,400,500]' ? 'ok' : 'FAILED:'+JSON.stringify(scoreRows())));
    log('headerHint=' + (document.querySelector('#ConfBestScore table tr td').getAttribute('title') === 'Lower is better' ? 'ok' : 'FAILED'));

    /* B: ending a game writes the new score, keeps the 5 LOWEST and drops the rest */
    const endLine = () => document.getElementById('infimine').textContent.replace(/\s+/g,' ');
    window.infimine.setRandom(() => 1); //guaranteed win -> a (huge) score entry
    window.infimine.newGame('8_8_3_10');
    document.querySelector('td[data-act="cell"]').dispatchEvent(new MouseEvent('click',{bubbles:true}));
    const sm = endLine().match(/END --- Score: (\d+)/);
    if (!sm) { log('END_NOT_FOUND'); throw 0; }
    const newScore = parseInt(sm[1]);
    const expected = [...[500,100,400,200,300], newScore].sort((a,b)=>a-b).slice(0,5);
    const got = storedScores();
    log('writeKeepsLowest5=' + (JSON.stringify(got) === JSON.stringify(expected) ? 'ok' : 'FAILED got='+JSON.stringify(got)+' want='+JSON.stringify(expected)));
    log('hugeScoreDoesNotWin=' + (newScore > 500 ? (got.indexOf(newScore) === -1 ? 'ok (newScore '+newScore+' dropped)' : 'FAILED:entered at '+got.indexOf(newScore)) : 'skip(newScore small)'));
    log('listIsAscending=' + (got.every((v,i) => i===0 || got[i-1] <= v) ? 'ok' : 'FAILED:'+JSON.stringify(got)));

    /* C: the table shows the best (lowest) score in the first row */
    key('td[data-act="conf"]'); key('button[data-tab="ConfBestScore"]');
    const rows = scoreRows();
    log('tableBestFirst=' + (rows[0] === 100 && rows.length === 5 ? 'ok' : 'FAILED:'+JSON.stringify(rows)));

    /* D: a genuinely BETTER (lower) score would be inserted first - verify the write path with a low entry */
    // simulate: seed 4 decent scores + let a second game end add one more, all 5 must survive sorted
    localStorage.setItem('bestScoreList_'+gk, JSON.stringify([50,60,70,80].map((v,i) => [String(v), {score:String(v)}, new Date(2021,0,i+1).toISOString()])));
    window.infimine.newGame('8_8_3_10');
    document.querySelector('td[data-act="cell"]').dispatchEvent(new MouseEvent('click',{bubbles:true}));
    const got2 = storedScores();
    log('keepsAllWhen5thWorse=' + (got2.length === 5 && JSON.stringify(got2.slice(0,4)) === '[50,60,70,80]' ? 'ok' : 'FAILED:'+JSON.stringify(got2)));
    log('newScoreLast=' + (got2[4] >= 80 ? 'ok' : 'FAILED:'+JSON.stringify(got2)));

    /* E: a LOST game must NOT be recorded - only a finished (won) game counts */
    const beforeLoss = JSON.stringify(storedScores());
    window.infimine.setRandom(() => 0); //every new cell is a mine -> certain loss
    window.infimine.newGame('8_8_3_10');
    document.querySelector('td[data-act="cell"]').dispatchEvent(new MouseEvent('click',{bubbles:true})); //first open: safe region, game running
    const clickClosed = () => { //re-query every time: the view is re-rendered after each click
      const c = document.querySelector('td.cell.shadow[data-act="cell"]');
      c.dispatchEvent(new MouseEvent('click',{bubbles:true}));
    };
    clickClosed(); clickClosed(); clickClosed(); //3 mines -> lives gone -> game over
    log('lossEndedGame=' + (endLine().includes('END --- Game over') ? 'ok' : 'FAILED:'+endLine().slice(0,60)));
    log('lossShowsNoScore=' + (!endLine().includes('Score:') && !endLine().includes('NEW BEST') ? 'ok' : 'FAILED:'+endLine().slice(-60)));
    log('lossNotRecorded=' + (JSON.stringify(storedScores()) === beforeLoss ? 'ok' : 'FAILED got='+JSON.stringify(storedScores())));

    /* F: a loss shows no NEW BEST badge either */
    log('lossNoBestBadge=' + (!endLine().includes('NEW BEST') ? 'ok' : 'FAILED:'+endLine().slice(-60)));

    /* G: the very next WIN is still recorded normally (clean list -> exactly one entry) */
    localStorage.removeItem('bestScoreList_'+gk);
    window.infimine.setRandom(() => 1); //no mines -> guaranteed win
    window.infimine.newGame('8_8_3_10');
    document.querySelector('td[data-act="cell"]').dispatchEvent(new MouseEvent('click',{bubbles:true}));
    const afterWin = storedScores();
    log('winRecordedAfterLoss=' + (afterWin.length === 1 ? 'ok' : 'FAILED:'+JSON.stringify(afterWin)));
    window.infimine.setRandom(null);
  } catch(e) { log('EXC=' + e.message); }
  document.body.insertAdjacentHTML('beforeend','<pre id="t">'+s.join('\n')+'</pre>');
})();
</script>
