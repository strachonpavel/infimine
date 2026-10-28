<script>
const s = [];
const log = m => { s.push(m); document.title = 'RESULT: ' + s.join(' | '); };
const ready = () => (window.infimine && typeof window.infimine.main === 'function' && typeof window.infimine.setRandom === 'function');
const bombs = () => document.querySelectorAll('td.bomb').length;
const marks = () => document.querySelectorAll('td.mark').length;
const markbad = () => document.querySelectorAll('td.markbad').length;
const over = () => document.querySelector('table.minefield.noplay') !== null;
const endLine = () => document.getElementById('infimine').textContent.replace(/\s+/g,' ');
const key = sel => { const e = document.querySelector(sel); if (!e) throw new Error('missing: '+sel); e.dispatchEvent(new MouseEvent('click',{bubbles:true})); return e; };
const ctrlClick = sel => { const e = document.querySelector(sel); if (!e) throw new Error('missing: '+sel); e.dispatchEvent(new MouseEvent('click',{bubbles:true,ctrlKey:true})); return e; };
const nthOpen = i => { const c = [...document.querySelectorAll('td[data-act="cell"]')][i]; c.dispatchEvent(new MouseEvent('click',{bubbles:true})); };
(async () => {
  try {
    for (let i=0; i<200 && !ready(); i++) await new Promise(r=>setTimeout(r,20));
    if (!ready()) { log('NO_API'); throw 0; }
    localStorage.clear(); window.infimine.main();

    /* A: loss - closed mines are revealed, a wrong flag is struck out
       note: the first opened cell AND its whole neighbourhood are always safe (game rule),
       so the mines are clicked only after the game has started */
    window.infimine.setRandom(() => 0); //every new cell is a mine
    window.infimine.newGame('8_8_3_10');
    ctrlClick('td[data-act="cell"]');        //marked BEFORE the game starts -> cell created bombless -> the flag is WRONG
    nthOpen(1);                              //first open: safe region, game running
    log('noRevealDuringPlay=' + (marks()===1 && bombs()===0 && !over() ? 'ok' : 'FAILED:marks='+marks()+' bombs='+bombs()));
    const nClosed = () => document.querySelectorAll('td.cell.shadow[data-act="cell"]').length;
    const clickClosed = () => { //re-query every time: the view is re-rendered after each click
      const c = document.querySelector('td.cell.shadow[data-act="cell"]');
      c.dispatchEvent(new MouseEvent('click',{bubbles:true}));
    };
    log('closedAreMines=' + (nClosed() >= 3 ? 'ok' : 'FAILED:only '+nClosed()));
    clickClosed(); //mine - 1 life lost
    clickClosed(); //mine - 2 lives lost
    clickClosed(); //mine - lives gone -> game over
    log('gameEnded=' + (over() && endLine().includes('END --- Game over') ? 'ok' : 'FAILED'));
    log('lossNoScoreShown=' + (!endLine().includes('Score:') && !endLine().includes('NEW BEST') ? 'ok' : 'FAILED:'+endLine().slice(-60)));
    log('bombsRevealed=' + (bombs() > 3 ? 'ok('+bombs()+')' : 'FAILED:'+bombs()+' (only the 3 opened)'));
    log('wrongFlagStruck=' + (markbad()===1 && marks()===0 ? 'ok' : 'FAILED:markbad='+markbad()+' marks='+marks()));
    const anyClosed = document.querySelector('td.cell.shadow') || document.querySelector('td.cell.noplay');
    const cur = getComputedStyle(anyClosed).cursor;
    log('cursorDefaultAtEnd=' + (cur === 'default' ? 'ok' : 'FAILED:'+cur));

    /* B: a CORRECT flag stays a flag after the end */
    window.infimine.setRandom(() => 0);
    window.infimine.newGame('8_8_3_10');
    nthOpen(0);                               //first open: safe region, game running, 3 lives left
    ctrlClick('td.cell.shadow[data-act="cell"]'); //flag a closed cell -> a real mine (rng 0) -> CORRECT flag
    log('correctFlagDuringPlay=' + (marks()===1 && bombs()===0 ? 'ok' : 'FAILED:marks='+marks()+' bombs='+bombs()));
    clickClosed(); //mine
    clickClosed(); //mine
    clickClosed(); //mine -> over
    log('correctFlagKept=' + (over() && marks()===1 && markbad()===0 ? 'ok' : 'FAILED:marks='+marks()+' markbad='+markbad()));

    /* C: win still works and everything is open - no closed cells left to reveal */
    window.infimine.setRandom(() => 1); //no mines at all
    window.infimine.newGame('8_8_3_10');
    nthOpen(0); //opens everything -> win
    log('winStillWorks=' + (over() && endLine().includes('END --- Score') ? 'ok' : 'FAILED'));
    log('winNoStruckFlags=' + (markbad()===0 && bombs()===0 ? 'ok' : 'FAILED:markbad='+markbad()+' bombs='+bombs()));
    window.infimine.setRandom(null);
  } catch(e) { log('EXC=' + e.message); }
  document.body.insertAdjacentHTML('beforeend','<pre id="t">'+s.join('\n')+'</pre>');
})();
</script>
