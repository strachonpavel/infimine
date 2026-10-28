<script>
const s = [];
const log = m => { s.push(m); document.title = 'RESULT: ' + s.join(' | '); };
const ready = () => (window.infimine && typeof window.infimine.main === 'function' && typeof window.infimine.setRandom === 'function');
const snap = () => { window.infimine.save(); const g = JSON.parse(localStorage.getItem('game'));
  return JSON.stringify({f:g.field, lives:g.lives, inGame:g.inGame, clicks:g.clickCount, dens:g.bombDensity, cd:g.currDimCoord}); };
const nOpen = () => [...document.querySelectorAll('td.cell')].filter(c => /color\d|bomb/.test(c.className)).length;
const nPlayable = () => document.querySelectorAll('td.cell:not(.noplay)').length; // data-key is stripped once the game ends
const firstCellKey = () => { const c = [...document.querySelectorAll('td.cell[data-key]')][0]; return c ? c.dataset.key : null; };
const clickCellAt = (i) => { const c = [...document.querySelectorAll('td.cell[data-act="cell"]')][i]; c.dispatchEvent(new MouseEvent('click',{bubbles:true})); };
(async () => {
  try {
    for (let i=0; i<200 && !ready(); i++) await new Promise(r=>setTimeout(r,20));
    if (!ready()) { log('NO_API'); throw 0; }
    localStorage.clear(); window.infimine.main();

    /* A: render/viewport actions must not touch the model */
    window.infimine.newGame('12_14_4_20');
    clickCellAt(20);
    const before = snap();
    window.infimine.moveViewBy('R'); window.infimine.moveViewBy('D'); window.infimine.moveViewBy('L');
    window.infimine.toggleConfig(); window.infimine.toggleConfig();
    window.infimine.changeViewSize(9, 11);
    window.infimine.findCellCenterView();
    window.infimine.changeDim(1);
    const after = snap();
    log('renderIsPure=' + (before === after ? 'ok' : 'FAILED'));

    /* B: getters have no side effects -> definition must not drift */
    const g = JSON.parse(localStorage.getItem('game'));
    log('densityStable=' + (g.bombDensity === 0.2063 ? 'ok' : 'FAILED:'+g.bombDensity));
    log('cursorStable=' + (JSON.stringify(g.currDimCoord) === '[0,0]' ? 'ok' : 'FAILED:'+JSON.stringify(g.currDimCoord)));
    log('shapeKept=' + (['field','spaceSize','viewSize','viewCenter','viewDim','currDimCoord','inGame','lives','markOnClick','clickCount','showConf','bombDensity','canOpenNeighbours','defaultLives','fixedBombs'].every(k => k in g) ? 'ok' : 'FAILED'));

    /* C: deterministic RNG - no bombs -> single click wins the game */
    window.infimine.setRandom(() => 1);
    window.infimine.newGame('8_8_3_10');
    clickCellAt(0);
    const info = () => document.getElementById('infimine').textContent.replace(/\s+/g,' ');
    log('winPath=' + (info().includes('END --- Score') ? 'ok' : 'FAILED:'+info().slice(0,60)));
    log('winOpenedAll=' + (nOpen() === nPlayable() ? 'ok('+nOpen()+'/'+nPlayable()+')' : 'FAILED:'+nOpen()+'/'+nPlayable()));
    const scoreKeys = Object.keys(localStorage).filter(k => k.startsWith('bestScoreList_'));
    log('scoreSaved=' + (scoreKeys.length > 0 && JSON.parse(localStorage.getItem(scoreKeys[0])).length > 0 ? 'ok' : 'FAILED'));

    /* D: deterministic RNG - fixed bomb budget + safe first click */
    window.infimine.setRandom(() => 0);
    window.infimine.newGame('8_8_3_10');
    const k0 = firstCellKey();
    clickCellAt(0); clickCellAt(5); clickCellAt(12); clickCellAt(30);
    window.infimine.save();
    const gd = JSON.parse(localStorage.getItem('game'));
    const bombs = Object.values(gd.field).filter(c => c.hasBomb === true).length;
    log('firstClickSafe=' + (gd.field[k0] && gd.field[k0].hasBomb === false ? 'ok' : 'FAILED'));
    log('bombCap=' + (bombs <= 10 ? 'ok('+bombs+'/10)' : 'FAILED:'+bombs));
    log('bombsEverCreated=' + (bombs > 0 ? 'ok('+bombs+')' : 'FAILED'));

    window.infimine.setRandom(null); //back to Math.random

    /* E: marking still works */
    const closed = [...document.querySelectorAll('td.cell.shadow[data-act="cell"]')];
    if (closed[0]) closed[0].dispatchEvent(new MouseEvent('contextmenu',{bubbles:true,cancelable:true}));
    log('markStillWorks=' + (document.querySelector('td.mark') ? 'ok' : 'FAILED'));
    log('livesShown=' + (info().match(/Lives left: (\d+)/) ? 'ok' : 'FAILED'));
  } catch(e) { log('EXC=' + e.message); }
  document.body.insertAdjacentHTML('beforeend','<pre id="t">'+s.join('\n')+'</pre>');
})();
</script>
