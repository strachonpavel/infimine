<script>
const s = [];
const log = m => { s.push(m); document.title = 'RESULT: ' + s.join(' | '); };
const ready = () => (window.infimine && typeof window.infimine.main === 'function' && typeof window.infimine.getElapsed === 'function');
/* fake clock - Date.now is fully virtual so assertions are exact regardless of real elapsed time */
let fakeNow = 1700000000000;
Date.now = () => fakeNow;
const advance = ms => { fakeNow += ms; };
const elapsed = () => window.infimine.getElapsed();
const timeTxt = () => { const e = document.getElementById('gameTime'); return e ? e.textContent : null; };
const pausedShown = () => document.getElementById('infimine').textContent.includes('(paused)');
const fieldCls = () => (document.querySelector('table.minefield')||{className:''}).className;
const key = sel => { const e = document.querySelector(sel); if (!e) throw new Error('missing: '+sel); e.dispatchEvent(new MouseEvent('click',{bubbles:true})); return e; };
const ctrlClick = sel => { const e = document.querySelector(sel); if (!e) throw new Error('missing: '+sel); e.dispatchEvent(new MouseEvent('click',{bubbles:true,ctrlKey:true})); return e; };
const saved = () => { window.infimine.save(); return JSON.parse(localStorage.getItem('game')); };
(async () => {
  try {
    for (let i=0; i<200 && !ready(); i++) await new Promise(r=>setTimeout(r,20));
    if (!ready()) { log('NO_API'); throw 0; }
    localStorage.clear(); window.infimine.main();

    /* A: fresh game - no time, no pause button */
    log('freshTime=' + (elapsed()===0 && timeTxt()==='0:00' ? 'ok' : 'FAILED:'+elapsed()+'/'+timeTxt()));
    log('freshNoPauseBtn=' + (document.querySelector('[data-act="pause"]') ? 'FAILED' : 'ok'));

    /* B: clock starts with the first click in the field (1a) */
    window.infimine.newGame('8_8_3_10');
    key('td[data-act="cell"]');
    log('startedOnClick=' + (elapsed()===0 ? 'ok' : 'FAILED:'+elapsed()));
    log('pauseBtnShown=' + (document.querySelector('[data-act="pause"]') ? 'ok' : 'FAILED'));
    advance(5000);
    log('tickRuns=' + (elapsed()===5000 ? 'ok' : 'FAILED:'+elapsed()));
    await new Promise(r=>setTimeout(r,1100)); //let the 1s ticker refresh the label
    log('display005=' + (timeTxt()==='0:05' ? 'ok' : 'FAILED:'+timeTxt()));

    /* C: pause freezes the clock; a click on the field ENDS the pause (without acting on the cell) */
    key('[data-act="pause"]');
    log('pauseFreezesNow=' + (elapsed()===5000 && pausedShown() ? 'ok' : 'FAILED:'+elapsed()));
    log('pausedFieldGrayed=' + (fieldCls().includes('paused') && !fieldCls().includes('noplay') ? 'ok' : 'FAILED:'+fieldCls()));
    advance(10000);
    log('pauseFreezes=' + (elapsed()===5000 ? 'ok' : 'FAILED:'+elapsed()));
    const c0 = saved().clickCount;
    key('td[data-act="cell"]');
    log('clickEndsPause=' + (pausedShown()===false ? 'ok' : 'FAILED:still paused'));
    log('fieldGrayGone=' + (fieldCls().includes('paused') ? 'FAILED:'+fieldCls() : 'ok'));
    log('pausedClickNotEaten=' + (saved().clickCount===c0 ? 'ok' : 'FAILED:'+c0+'->'+saved().clickCount));
    advance(2000);
    log('runsAfterClickResume=' + (elapsed()===7000 ? 'ok' : 'FAILED:'+elapsed()));

    /* D: the pause button still works both ways */
    key('[data-act="pause"]');
    advance(5000);
    log('buttonPauses=' + (elapsed()===7000 && pausedShown() ? 'ok' : 'FAILED:'+elapsed()));
    key('[data-act="pause"]');
    advance(1000);
    log('buttonResumes=' + (elapsed()===8000 && !pausedShown() ? 'ok' : 'FAILED:'+elapsed()));

    /* E: save keeps time, load continues from the stored value without offline gap (3a) */
    window.infimine.save();
    advance(60000);
    window.infimine.load();
    log('loadKeepsTime=' + (elapsed()===8000 ? 'ok' : 'FAILED:'+elapsed()));
    advance(1000);
    log('loadContinues=' + (elapsed()===9000 ? 'ok' : 'FAILED:'+elapsed()));

    /* F: save shape */
    const gs = saved();
    log('saveShape19=' + (Object.keys(gs).length===19 ? 'ok' : 'FAILED:'+Object.keys(gs).length));
    log('timerKeys=' + (['timeElapsed','timeRunningSince','timePaused','timeStarted'].every(k=>k in gs) ? 'ok' : 'FAILED'));

    /* G: pause state survives save/load */
    key('[data-act="pause"]');
    advance(9000);
    log('pauseSurvivesGap=' + (elapsed()===9000 ? 'ok' : 'FAILED:'+elapsed()));
    window.infimine.save();
    advance(30000);
    window.infimine.load();
    log('pauseRestored=' + (elapsed()===9000 ? 'ok' : 'FAILED:'+elapsed()));
    log('pauseBtnResume=' + (document.querySelector('[data-act="pause"]').textContent.includes('\u25b6') ? 'ok' : 'FAILED'));
    key('[data-act="pause"]');
    advance(1000);
    log('resumeAfterLoad=' + (elapsed()===10000 ? 'ok' : 'FAILED:'+elapsed()));

    /* H: restart resets the clock */
    window.infimine.newGame('8_8_3_10');
    advance(3000);
    log('restartResets=' + (elapsed()===0 && timeTxt()==='0:00' ? 'ok' : 'FAILED:'+elapsed()));

    /* I: game end freezes the clock, score records the time (4b) */
    window.infimine.setRandom(() => 1); //no bombs - guaranteed win
    window.infimine.newGame('8_8_3_10');
    ctrlClick('td[data-act="cell"]'); //mark -> starts the clock, no win yet (marked cell stays)
    advance(12000);
    ctrlClick('td[data-act="cell"]'); //unmark
    key('td[data-act="cell"]');        //opens everything -> win -> freeze
    advance(50000);
    log('endFrozen=' + (elapsed()===12000 ? 'ok' : 'FAILED:'+elapsed()));
    log('endDisplay=' + (timeTxt()==='0:12' ? 'ok' : 'FAILED:'+timeTxt()));
    log('endLine=' + (document.getElementById('infimine').textContent.includes('Time: 0:12') ? 'ok' : 'FAILED'));
    log('endNoPauseBtn=' + (document.querySelector('[data-act="pause"]') ? 'FAILED' : 'ok'));
    log('endFieldGrayed=' + (fieldCls().includes('noplay') && !fieldCls().includes('paused') ? 'ok' : 'FAILED:'+fieldCls()));
    const sk = Object.keys(localStorage).filter(k=>k.startsWith('bestScoreList_'));
    const rec = sk.length ? JSON.parse(localStorage.getItem(sk[0])) : [];
    log('scoreHasTime=' + (rec.length>0 && typeof rec[0][1].time==='number' && rec[0][1].time===12000 ? 'ok' : 'FAILED:'+JSON.stringify(rec[0]&&rec[0][1])));

    /* J: Best Score table shows the Time column */
    key('td[data-act="conf"]');
    key('button[data-tab="ConfBestScore"]');
    const bs = document.getElementById('ConfBestScore');
    log('scoreTimeColumn=' + (bs.textContent.includes('Time') && bs.textContent.includes('0:12') ? 'ok' : 'FAILED:'+bs.textContent.replace(/\s+/g,' ').slice(0,120)));

    /* K: legacy save without timer keys still loads, timer starts on next interaction */
    window.infimine.setRandom(null);
    //bombDensity 0 -> marking the only cell cannot trigger the win condition (leftOpen<=0 on a marked bomb)
    localStorage.setItem('game', JSON.stringify({field:{}, spaceSize:[8,8], viewSize:[10,10], viewCenter:[-1,-1], viewDim:[0,1], currDimCoord:[0,0], inGame:1, lives:3, clickCount:5, showConf:false, markOnClick:false, bombDensity:0, canOpenNeighbours:true, defaultLives:3, fixedBombs:null}));
    window.infimine.load();
    log('legacyLoadNoTime=' + (elapsed()===0 && timeTxt()==='0:00' ? 'ok' : 'FAILED:'+elapsed()));
    ctrlClick('td[data-act="cell"]'); //mark starts the clock without risking an instant win
    advance(4000);
    log('legacyStartsOnClick=' + (elapsed()===4000 ? 'ok' : 'FAILED:'+elapsed()));
  } catch(e) { log('EXC=' + e.message); }
  document.body.insertAdjacentHTML('beforeend','<pre id="t">'+s.join('\n')+'</pre>');
})();
</script>
