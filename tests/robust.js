<script>
const s = [];
const log = m => { s.push(m); document.title = 'RESULT: ' + s.join(' | '); };
const ready = () => (window.infimine && typeof window.infimine.main === 'function');
(async () => {
  try {
    for (let i=0; i<200 && !ready(); i++) await new Promise(r=>setTimeout(r,20));
    /* poisoned storage - every value is invalid */
    localStorage.setItem('game', '{broken');
    localStorage.setItem('lastGame', 'not_a_key');
    localStorage.setItem('favoriteGames', '{"not":"array"}');
    localStorage.setItem('bestScoreList_[[8,8],3,10]', 'garbage');
    localStorage.setItem('bestScoreList_corrupt', '[[1');
    window.infimine.load(); /* corrupted 'game' must be rejected, current game kept */
    log('corruptLoadRejected=' + (document.body.textContent.includes('corrupted') && document.querySelector('table.minefield') ? 'ok' : 'FAILED')); // toast lives in body, not #infimine
    window.infimine.main();  /* must not throw, must fall back to a fresh game */
    log('mainSurvives=' + (document.querySelector('table.minefield') ? 'ok' : 'FAILED'));
    log('gameStarted=' + (document.getElementById('infimine').textContent.includes('Click to start') ? 'ok' : 'FAILED'));
    window.infimine.toggleFavoriteGame('[[8,8],3,10]');
    log('favRecovers=' + (JSON.parse(localStorage.getItem('favoriteGames')).length === 1 ? 'ok' : 'FAILED'));
    document.querySelector('td[data-act="conf"]').dispatchEvent(new MouseEvent('click',{bubbles:true}));
    window.infimine.newGame('8_8_3_10');
    document.querySelector('td[data-act="conf"]').dispatchEvent(new MouseEvent('click',{bubbles:true}));
    log('playedGamesRenders=' + (document.getElementById('ConfPlayedGames') ? 'ok' : 'FAILED'));
    log('badScoreKeyIgnored=' + (document.getElementById('ConfPlayedGames').textContent.includes('Unknown game') ? 'ok' : 'FAILED')); // corrupted key -> parseGameKey fallback, no crash
  } catch(e) { log('EXC=' + e.message); }
  document.body.insertAdjacentHTML('beforeend','<pre id="t">'+s.join('\n')+'</pre>');
})();
</script>
