<script>
const s = [];
const log = m => { s.push(m); document.title = 'RESULT: ' + s.join(' | '); };
const ready = () => (window.infimine && typeof window.infimine.main === 'function');
const key = sel => { const e = document.querySelector(sel); if (!e) throw new Error('missing: '+sel); e.dispatchEvent(new MouseEvent('click',{bubbles:true})); return e; };
const openConf = () => { if (!document.getElementById('conf')) key('td[data-act="conf"]'); }; //auto-restore may leave the config open - ensure, do not blind-toggle
(async () => {
  try {
    for (let i=0; i<200 && !ready(); i++) await new Promise(r=>setTimeout(r,20));
    /* legacy save from the previous run sits in storage (markOnClick=true inside game) */
    openConf(); key('input[data-act="load"]');
    log('legacyUiRestored=' + (document.querySelector('td.marker.marker-on') ? 'ok' : 'FAILED'));
    /* save keeps the legacy shape: ui keys are merged in (+ 4 timer keys) */
    key('input[data-act="save"]');
    const g = JSON.parse(localStorage.getItem('game'));
    log('saveHas19Keys=' + (Object.keys(g).length === 19 ? 'ok' : 'FAILED:'+Object.keys(g).length));
    log('saveCarriesUi=' + (g.markOnClick === true && 'showConf' in g ? 'ok' : 'FAILED'));
    /* toggle marker off -> save -> reload -> state must round-trip */
    key('td[data-act="marker"]');
    key('input[data-act="save"]'); key('input[data-act="load"]');
    log('roundTripOff=' + (document.querySelector('td.marker.marker-off') ? 'ok' : 'FAILED'));
    /* fresh game resets ui state (old behavior) */
    window.infimine.newGame('8_8_3_10');
    log('freshResetsUi=' + (document.querySelector('td.marker.marker-off') && !document.getElementById('conf') ? 'ok' : 'FAILED'));
    log('freshResetsTimer=' + (window.infimine.getElapsed() === 0 ? 'ok' : 'FAILED'));
  } catch(e) { log('EXC=' + e.message); }
  document.body.insertAdjacentHTML('beforeend','<pre id="t">'+s.join('\n')+'</pre>');
})();
</script>
