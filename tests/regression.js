<script>
const out = [];
function log(m){ out.push(m); document.title = 'RESULT: ' + out.join(' | '); }
const ready = () => (window.infimine && typeof window.infimine.main === 'function');
const allKeys = () => [...document.querySelectorAll('td.cell[data-key]')].map(c=>c.dataset.key).join(',');
const nCells = () => document.querySelectorAll('td.cell').length;
const closed = () => [...document.querySelectorAll('td.cell.shadow[data-act="cell"]')];
const key = (sel) => { const e = document.querySelector(sel); if (!e) throw new Error('missing: '+sel); e.dispatchEvent(new MouseEvent('click', {bubbles:true})); return e; };
(async () => {
  try {
    for (let i=0; i<200 && !ready(); i++) await new Promise(r=>setTimeout(r,20));
    if (!ready()) { log('NO_API'); throw 0; }
    localStorage.clear(); window.infimine.main();

    document.querySelector('td.cell[data-act="cell"]').dispatchEvent(new MouseEvent('click', {bubbles:true}));
    log('cellClick=' + (document.body.innerHTML.indexOf('Running ...')>-1 ? 'ok' : 'FAILED'));
    closed()[0].dispatchEvent(new MouseEvent('click', {bubbles:true, ctrlKey:true}));
    log('ctrlMark=' + (document.querySelector('td.mark') ? 'ok' : 'FAILED'));
    closed()[1].dispatchEvent(new MouseEvent('contextmenu', {bubbles:true, cancelable:true}));
    log('ctxMarks=' + (document.querySelectorAll('td.mark').length >= 2 ? 'ok' : 'FAILED'));
    const ev = new MouseEvent('contextmenu', {bubbles:true, cancelable:true});
    document.querySelector('table.minefield').dispatchEvent(ev);
    log('ctxPrevented=' + (ev.defaultPrevented ? 'ok' : 'FAILED'));

    window.infimine.newGame('60_60_3_10');
    log('bigmap=' + nCells());
    const k1 = allKeys(); key('td[data-act="move"][data-dir="R"]'); const k2 = allKeys();
    key('td[data-act="move"][data-dir="D"]'); const k4 = allKeys();
    log('moveR=' + (k1!==k2 ? 'ok' : 'FAILED'));
    log('moveD=' + (k2!==k4 ? 'ok' : 'FAILED'));
    const k5 = allKeys();
    window.dispatchEvent(new KeyboardEvent('keydown', {key:'ArrowLeft', bubbles:true}));
    log('arrow=' + (k5!==allKeys() ? 'ok' : 'FAILED'));

    key('td[data-act="find"]'); log('find=ok');
    key('td[data-act="marker"]');
    log('marker=' + (document.querySelector('td.marker.marker-on') ? 'ok' : 'FAILED'));

    key('td[data-act="conf"]');
    log('conf=' + (document.getElementById('conf') ? 'ok' : 'FAILED'));
    key('button[data-tab="ConfInfo"]');
    log('tabInfo=' + (document.getElementById('ConfInfo').style.display==='block' && document.querySelector('button[data-tab="ConfInfo"]').className.includes('active') ? 'ok' : 'FAILED'));
    key('button[data-tab="ConfNewGame"]');

    document.getElementById('viewH').value = '10';
    document.getElementById('viewW').value = '12';
    key('input[data-act="viewsize"]');
    log('viewsize=' + nCells());

    key('input[data-act="changedim"][data-dim="1"]');
    key('input[data-act="changedim"][data-dim="0"]');
    log('changedim=ok');

    const iBefore = allKeys();
    document.getElementById('ngSpaceH').dispatchEvent(new KeyboardEvent('keydown', {key:'ArrowRight', bubbles:true}));
    log('arrowInInput=' + (allKeys()===iBefore ? 'ok' : 'MOVED'));

    key('input[data-act="save"]');
    log('save=' + (localStorage.getItem('game') ? 'ok' : 'FAILED'));
    key('input[data-act="load"]'); log('load=ok');
    key('input[data-act="resetscore"]'); log('resetscore=ok');
    key('input[data-act="loaddisk"]'); log('loaddisk=ok');

    localStorage.setItem('game', JSON.stringify({
      bombDensity:0.2, canOpenNeighbours:true, defaultLives:3, spaceSize:[8,8,4], fixedBombs:null,
      field:{}, viewSize:[10,10], viewCenter:[-1,-1], viewDim:[0,1], currDimCoord:[0,0,0],
      inGame:0, lives:3, markOnClick:false, clickCount:0, showConf:true,
      timeElapsed:0, timeRunningSince:0, timePaused:false, timeStarted:false
    }));
    key('input[data-act="load"]');
    const mi = document.querySelector('input[data-act="moveindim"][data-dim="2"]');
    if (!mi) { log('moveindim=MISSING'); }
    else { const v = mi.value; key('input[data-act="moveindim"][data-dim="2"]'); log('moveindim=' + (document.querySelector('input[data-dim="2"]').value !== v ? 'ok' : 'FAILED')); }

    const favBefore = localStorage.getItem('favoriteGames');
    key('input[data-act="fav"]');
    log('fav=' + (localStorage.getItem('favoriteGames') !== favBefore ? 'ok' : 'FAILED'));

    key('input[data-act="newgame"][data-key="8_8_3_10"]');
    const n1 = nCells();
    log('newgame=' + n1);
    key('td[data-act="restart"]');
    log('restart=' + (nCells()===n1 ? 'ok' : 'FAILED:'+nCells()));
    log('leaked=' + [typeof window.props, typeof window.sk, typeof window.delta].join(','));
  } catch(e) { log('EXC=' + e.message); }
  document.body.insertAdjacentHTML('beforeend', '<pre id="t">'+out.join('\n')+'</pre>');
})();
</script>
