<script>
const s = [];
const log = m => { s.push(m); document.title = 'RESULT: ' + s.join(' | '); };
const ready = () => (window.infimine && typeof window.infimine.main === 'function');
const nMarks = () => document.querySelectorAll('td.mark').length;
const nOpen  = () => [...document.querySelectorAll('td.cell')].filter(c => /color\d|bomb/.test(c.className)).length;
const txt = () => document.getElementById('infimine').textContent.replace(/\s+/g,' ');
const key = (sel) => { const e = document.querySelector(sel); if (!e) throw new Error('missing: '+sel); e.dispatchEvent(new MouseEvent('click', {bubbles:true})); return e; };
(async () => {
  try {
    for (let i=0; i<200 && !ready(); i++) await new Promise(r=>setTimeout(r,20));
    const legacy = JSON.parse(localStorage.getItem('legacySummary'));
    log('lastGameParams=' + (txt().includes('Space Size: 12/14') && txt().includes('Lives: 4') && txt().includes('Bombs: 20') ? 'ok' : 'FAILED'));
    log('legacyFav=' + (document.querySelector('input[data-act="fav"]').value === 'Remove from Favorites' ? 'ok' : 'FAILED'));
    key('td[data-act="conf"]');
    key('input[data-act="load"]');
    log('loadClicks=' + (txt().includes('Clicks: ' + legacy.clicks) ? 'ok' : 'FAILED'));
    log('loadMarks=' + (nMarks() === legacy.marks ? 'ok('+nMarks()+')' : 'FAILED got='+nMarks()+' want='+legacy.marks));
    log('loadOpen=' + (nOpen() === legacy.open ? 'ok('+nOpen()+')' : 'FAILED got='+nOpen()+' want='+legacy.open));
    log('loadRunning=' + (txt().includes('Running ...') ? 'ok' : 'FAILED'));
    log('dataKeys=' + (document.querySelectorAll('td.cell[data-key]').length > 0 ? 'ok' : 'FAILED'));
    log('legacyTimerClean=' + (window.infimine.getElapsed() === 0 ? 'ok' : 'FAILED:'+window.infimine.getElapsed()));
    key('td[data-act="conf"]');
    key('button[data-tab="ConfBestScore"]');
    log('legacyScore=' + (document.getElementById('ConfBestScore').textContent.includes('4321') ? 'ok' : 'FAILED'));
    log('legacyScoreDashTime=' + (document.getElementById('ConfBestScore').textContent.includes('\u2013') ? 'ok' : 'FAILED'));
    key('button[data-tab="ConfPlayedGames"]');
    log('legacyPlayedGames=' + (document.getElementById('ConfPlayedGames').textContent.includes('12/14') ? 'ok' : 'FAILED'));
    key('input[data-act="save"]');
    const g = JSON.parse(localStorage.getItem('game'));
    const shape = ['field','spaceSize','viewSize','viewCenter','viewDim','currDimCoord','inGame','lives','markOnClick','clickCount','showConf','bombDensity','canOpenNeighbours','defaultLives','fixedBombs'];
    log('saveShape=' + (shape.every(k => k in g) ? 'ok' : 'FAILED missing=' + shape.filter(k=>!(k in g)).join(',')));
    log('saveField=' + (Object.keys(g.field).length === legacy.fieldKeys ? 'ok' : 'FAILED got='+Object.keys(g.field).length+' want='+legacy.fieldKeys));
    const cells = Object.entries(g.field);
    log('cellCoreProps=' + (cells.every(([k,c]) => ('isOpen' in c) && ('hasBomb' in c) && ('hasMark' in c)) ? 'ok' : 'FAILED'));
    log('openCellsHaveCount=' + (cells.filter(([k,c]) => c.isOpen===true && !('bombCount' in c)).length === 0 ? 'ok' : 'FAILED'));
    log('gameKeyStable=' + (localStorage.getItem('legacyGameKey') === JSON.stringify([g.spaceSize, g.defaultLives, (g.fixedBombs>0?g.fixedBombs:g.bombDensity)]) ? 'ok' : 'FAILED'));
    key('input[data-act="load"]');
    log('roundTrip=' + (nOpen() === legacy.open && nMarks() === legacy.marks ? 'ok' : 'FAILED'));
  } catch(e) { log('EXC=' + e.message); }
  document.body.insertAdjacentHTML('beforeend', '<pre id="t">'+s.join('\n')+'</pre>');
})();
</script>
