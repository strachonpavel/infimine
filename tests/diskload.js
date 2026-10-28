<script>
const s = [];
const log = m => { s.push(m); document.title = 'RESULT: ' + s.join(' | '); };
const ready = () => (window.infimine && typeof window.infimine.main === 'function');
const nOpen = () => [...document.querySelectorAll('td.cell')].filter(c => /color\d|bomb/.test(c.className)).length;
const nMarks = () => document.querySelectorAll('td.mark').length;
const txt = () => document.getElementById('infimine').textContent.replace(/\s+/g,' ');
const key = sel => { const e = document.querySelector(sel); if (!e) throw new Error('missing: '+sel); e.dispatchEvent(new MouseEvent('click',{bubbles:true})); return e; };
(async () => {
  try {
    for (let i=0; i<200 && !ready(); i++) await new Promise(r=>setTimeout(r,20));
    localStorage.clear(); window.infimine.main();

    // config split: all five tab panes exist and are switchable
    key('td[data-act="conf"]');
    const ids = ['ConfNewGame','ConfSaveLoad','ConfBestScore','ConfPlayedGames','ConfInfo'];
    log('panes=' + (ids.every(i => document.getElementById(i)) ? 'ok' : 'FAILED:'+ids.filter(i=>!document.getElementById(i)).join(',')));
    log('tabCount=' + (document.querySelectorAll('.conftablinks').length===5 ? 'ok' : 'FAILED'));
    log('inputs=' + (['ngSpaceH','ngSpaceW','ngLives','ngBombDensity','ngBombs','viewH','viewW','loadDiskFile'].every(i=>document.getElementById(i)) ? 'ok' : 'FAILED'));
    log('defaultTab=' + (document.getElementById('defaultConfTab') ? 'ok' : 'FAILED'));

    // loadFromDisk through the real file input + delegated button
    const diskSave = {
      bombDensity:0.15, canOpenNeighbours:true, defaultLives:5, spaceSize:[8,8], fixedBombs:null,
      field:{ '0|0':{isOpen:true,hasBomb:false,bombCount:0,hasMark:false},
              '0|1':{isOpen:true,hasBomb:false,bombCount:1,hasMark:false},
              '1|1':{isOpen:false,hasBomb:true,hasMark:true} },
      viewSize:[10,10], viewCenter:[-1,-1], viewDim:[0,1], currDimCoord:[0,0],
      inGame:1, lives:5, markOnClick:false, clickCount:7, showConf:true,
      timeElapsed:42000, timeRunningSince:12345, timePaused:false, timeStarted:true
    };
    const dt = new DataTransfer();
    dt.items.add(new File([JSON.stringify(diskSave)], 'infimine.save', {type:'application/json'}));
    document.getElementById('loadDiskFile').files = dt.files;
    key('input[data-act="loaddisk"]');
    await new Promise(r => setTimeout(r, 300));
    log('diskOpen=' + (nOpen()===2 ? 'ok(2)' : 'FAILED:'+nOpen()));
    log('diskMark=' + (nMarks()===1 ? 'ok(1)' : 'FAILED:'+nMarks()));
    log('diskClicks=' + (txt().includes('Clicks: 7') ? 'ok' : 'FAILED'));
    log('diskLives=' + (txt().includes('Lives left: 5') ? 'ok' : 'FAILED:'+txt().match(/Lives left: [^ ]*/)));
    log('diskDensity=' + (txt().includes('15.00') ? 'ok' : 'FAILED'));
    log('diskConfStillOpen=' + (document.getElementById('conf') ? 'ok' : 'FAILED'));
    const te = window.infimine.getElapsed();
    log('diskTimeRestored=' + (te >= 42000 && te < 45000 ? 'ok('+te+')' : 'FAILED:'+te));
    log('diskTimeRow=' + (document.getElementById('gameTime') ? 'ok' : 'FAILED'));

    // malformed file must not break the page
    const dt2 = new DataTransfer();
    dt2.items.add(new File(['{not json'], 'broken.save', {type:'application/json'}));
    document.getElementById('loadDiskFile').files = dt2.files;
    key('input[data-act="loaddisk"]');
    await new Promise(r => setTimeout(r, 300));
    log('brokenFileHandled=' + (document.getElementById('infimine') && document.querySelector('table.minefield') ? 'ok' : 'FAILED'));
  } catch(e) { log('EXC=' + e.message); }
  document.body.insertAdjacentHTML('beforeend','<pre id="t">'+s.join('\n')+'</pre>');
})();
</script>
