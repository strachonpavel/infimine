<script>
const s = [];
const log = m => { s.push(m); document.title = 'RESULT: ' + s.join(' | '); };
const ready = () => (window.infimine && typeof window.infimine.main === 'function');
const key = sel => { const e = document.querySelector(sel); if (!e) throw new Error('missing: '+sel); e.dispatchEvent(new MouseEvent('click',{bubbles:true})); return e; };
const ctrlClick = sel => { const e = document.querySelector(sel); if (!e) throw new Error('missing: '+sel); e.dispatchEvent(new MouseEvent('click',{bubbles:true,ctrlKey:true})); return e; };
const saved = () => JSON.parse(localStorage.getItem('game'));
const endLine = () => document.getElementById('infimine').textContent.replace(/\s+/g,' ');
(async () => {
  try {
    for (let i=0; i<200 && !ready(); i++) await new Promise(r=>setTimeout(r,20));
    if (!ready()) { log('NO_API'); throw 0; }

    /* A: a fresh start is auto-saved right away */
    localStorage.clear();
    window.infimine.main();
    const g0 = saved();
    log('freshAutoSaved=' + (g0 && g0.inGame===0 && 'timeStarted' in g0 ? 'ok' : 'FAILED:'+JSON.stringify(g0&&g0.inGame)));

    /* B: a click auto-saves the progress (game over included) */
    window.infimine.setRandom(() => 1); //no bombs -> one click wins
    window.infimine.newGame('8_8_3_10');
    key('td[data-act="cell"]');
    const g1 = saved();
    log('clickAutoSaves=' + (g1 && g1.inGame===2 && Object.keys(g1.field).length>0 ? 'ok' : 'FAILED:'+JSON.stringify(g1&&g1.inGame)));

    /* C: reload of a FINISHED game starts a fresh one (lastGame), not the dead board */
    window.infimine.main();
    log('overGameNotRestored=' + (endLine().includes('Click to start') && !endLine().includes('END ---') ? 'ok' : 'FAILED:'+endLine().slice(0,80)));

    /* D: a mid-game state IS restored - the point of auto-save */
    window.infimine.setRandom(null); //real bombs; marks never end the game
    window.infimine.newGame('12_12_5_25');
    ctrlClick('td[data-act="cell"]');
    ctrlClick('td.cell.shadow[data-act="cell"]'); //second marked cell
    const g2 = saved();
    log('midGameSaved=' + (g2 && g2.inGame!==2 && Object.keys(g2.field).length===2 ? 'ok' : 'FAILED:'+JSON.stringify(g2&&Object.keys(g2.field||{}).length)));
    window.infimine.main(); //simulated page reload
    log('midGameRestored=' + (document.querySelectorAll('td.mark').length===2 && endLine().includes('Clicks: '+g2.clickCount) ? 'ok' : 'FAILED:marks='+document.querySelectorAll('td.mark').length));
    log('restoredSameGame=' + (endLine().includes('Space Size: 12/12') && endLine().includes('Lives: 5') ? 'ok' : 'FAILED:'+endLine().slice(0,80)));

    /* E: auto-pause when the tab is hidden (2) */
    window.infimine.newGame('8_8_3_10');
    ctrlClick('td[data-act="cell"]'); //starts the clock, cannot end the game
    log('runningBeforeHide=' + (document.querySelector('table.minefield.paused') ? 'FAILED' : 'ok'));
    Object.defineProperty(document, 'hidden', {value:true, configurable:true});
    window.infimine.onVisibilityChange();
    log('hidePauses=' + (document.querySelector('table.minefield.paused') ? 'ok' : 'FAILED'));

    /* F: coming back does NOT auto-resume */
    Object.defineProperty(document, 'hidden', {value:false, configurable:true});
    window.infimine.onVisibilityChange();
    log('showStaysPaused=' + (document.querySelector('table.minefield.paused') ? 'ok' : 'FAILED'));
    key('td[data-act="cell"]');
    log('clickResumes=' + (document.querySelector('table.minefield.paused') ? 'FAILED' : 'ok'));

    /* G: hide before the first click does nothing (clock not started) */
    window.infimine.newGame('8_8_3_10');
    Object.defineProperty(document, 'hidden', {value:true, configurable:true});
    window.infimine.onVisibilityChange();
    log('hideBeforeStartNoop=' + (document.querySelector('table.minefield.paused') ? 'FAILED' : 'ok'));

    /* H: hide after game over does nothing */
    window.infimine.setRandom(() => 1);
    window.infimine.newGame('8_8_3_10');
    key('td[data-act="cell"]'); //wins
    window.infimine.onVisibilityChange();
    log('hideAfterEndNoop=' + (endLine().includes('END --- Score') && !document.querySelector('table.minefield.paused') ? 'ok' : 'FAILED'));
    Object.defineProperty(document, 'hidden', {value:false, configurable:true});
    window.infimine.setRandom(null);

    /* I: manual Save/Load buttons still work after the auto-save change */
    window.infimine.newGame('8_8_3_10');
    ctrlClick('td[data-act="cell"]');
    key('td[data-act="conf"]');
    key('input[data-act="save"]');
    key('input[data-act="load"]');
    log('manualButtonsStillWork=' + (document.querySelectorAll('td.mark').length===1 ? 'ok' : 'FAILED'));
  } catch(e) { log('EXC=' + e.message); }
  document.body.insertAdjacentHTML('beforeend','<pre id="t">'+s.join('\n')+'</pre>');
})();
</script>
