<script>
const s = [];
const log = m => { s.push(m); document.title = 'RESULT: ' + s.join(' | '); };
const ready = () => (window.infimine && typeof window.infimine.main === 'function');
const key = sel => { const e = document.querySelector(sel); if (!e) throw new Error('missing: '+sel); e.dispatchEvent(new MouseEvent('click',{bubbles:true})); return e; };
const openConf = () => { if (!document.getElementById('conf')) key('td[data-act="conf"]'); }; //the loaded save may have the config closed
const txt = () => document.getElementById('infimine').textContent.replace(/\s+/g,' ');
const gk = () => JSON.stringify([[8,8],3,10]);
const readBlob = b => new Promise(res => { const fr = new FileReader(); fr.onload = e => res(e.target.result); fr.readAsText(b); });
const setFiles = (id, name, content) => {
  const dt = new DataTransfer();
  dt.items.add(new File([content], name, {type:'application/json'}));
  document.getElementById(id).files = dt.files;
};
(async () => {
  try {
    for (let i=0; i<200 && !ready(); i++) await new Promise(r=>setTimeout(r,20));
    if (!ready()) { log('NO_API'); throw 0; }
    localStorage.clear(); window.infimine.main();

    /* seed: score list, favorites, a crafted save, and a foreign key that must never be touched */
    localStorage.setItem('bestScoreList_'+gk(), JSON.stringify([[500, {score:'500', time:12000}, new Date(2020,0,1).toISOString()]]));
    localStorage.setItem('favoriteGames', JSON.stringify([gk()]));
    localStorage.setItem('game', JSON.stringify({field:{}, spaceSize:[8,8], viewSize:[10,10], viewCenter:[-1,-1], viewDim:[0,1], currDimCoord:[0,0], inGame:1, lives:3, clickCount:42, showConf:false, markOnClick:false, bombDensity:0.2, canOpenNeighbours:true, defaultLives:3, fixedBombs:null, timeElapsed:0, timeRunningSince:0, timePaused:false, timeStarted:false}));
    localStorage.setItem('foreign_app_key', 'untouched');

    /* A: export captures the blob the download would receive */
    let exported = null;
    const origCreate = URL.createObjectURL;
    URL.createObjectURL = b => { exported = b; return origCreate.call(URL, b); };
    key('td[data-act="conf"]');
    key('input[data-act="exportstorage"]');
    URL.createObjectURL = origCreate;
    log('exportTriggered=' + (exported ? 'ok' : 'FAILED:no blob'));
    const exp = JSON.parse(await readBlob(exported));
    log('exportShape=' + (exp.format==='infimine-storage' && typeof exp.version==='number' && typeof exp.data==='object' ? 'ok' : 'FAILED:'+JSON.stringify(exp).slice(0,80)));
    log('exportHasAllKeys=' + (['game','lastGame','favoriteGames','bestScoreList_'+gk()].every(k => k in exp.data) ? 'ok' : 'FAILED:'+Object.keys(exp.data).join(',')));
    log('exportSkipsForeign=' + (!('foreign_app_key' in exp.data) ? 'ok' : 'FAILED:foreign key leaked'));
    exp.data['foreign_app_key'] = 'evil'; //an attacker-ish payload: foreign keys in the file must be ignored on import

    /* B: wipe the storage (a fresh browser), keep the foreign key, import */
    localStorage.clear();
    localStorage.setItem('foreign_app_key', 'untouched');
    localStorage.setItem('bestScoreList_'+gk(), JSON.stringify([[999, {score:'999'}, new Date(2021,0,1).toISOString()]])); //must be overwritten
    setFiles('importStorageFile', 'infimine.storage', JSON.stringify(exp));
    key('input[data-act="importstorage"]');
    await new Promise(r => setTimeout(r, 300));
    log('importRestoredScore=' + (localStorage.getItem('bestScoreList_'+gk()) === exp.data['bestScoreList_'+gk()] ? 'ok' : 'FAILED'));
    log('importRestoredFavorites=' + (localStorage.getItem('favoriteGames') === exp.data['favoriteGames'] ? 'ok' : 'FAILED'));
    log('importRestoredGame=' + (localStorage.getItem('game') === exp.data['game'] ? 'ok' : 'FAILED'));
    log('importSkipsForeign=' + (localStorage.getItem('foreign_app_key') === 'untouched' ? 'ok' : 'FAILED:'+localStorage.getItem('foreign_app_key')));
    log('importToast=' + (document.body.textContent.includes('Imported') ? 'ok' : 'FAILED'));

    /* C: the imported game is loadable through the regular Load button */
    key('input[data-act="load"]');
    log('importedGameLoads=' + (txt().includes('Clicks: 42') ? 'ok' : 'FAILED:'+txt().slice(0,80)));

    /* D: a garbage file must not change anything */
    const before = localStorage.getItem('bestScoreList_'+gk());
    openConf();
    setFiles('importStorageFile', 'broken.storage', '{not json');
    key('input[data-act="importstorage"]');
    await new Promise(r => setTimeout(r, 300));
    log('garbageRejected=' + (document.body.textContent.includes('Import failed') && localStorage.getItem('bestScoreList_'+gk())===before ? 'ok' : 'FAILED'));

    /* E: a file without any managed key changes nothing */
    setFiles('importStorageFile', 'empty.storage', JSON.stringify({format:'infimine-storage', version:1, data:{some_other_app:'x'}}));
    key('input[data-act="importstorage"]');
    await new Promise(r => setTimeout(r, 300));
    log('noManagedKeysRejected=' + (localStorage.getItem('bestScoreList_'+gk())===before ? 'ok' : 'FAILED'));

    /* F: import button without a file - no crash */
    key('input[data-act="importstorage"]');
    log('importWithoutFileSafe=' + (document.querySelector('table.minefield') ? 'ok' : 'FAILED'));
  } catch(e) { log('EXC=' + e.message); }
  document.body.insertAdjacentHTML('beforeend','<pre id="t">'+s.join('\n')+'</pre>');
})();
</script>
