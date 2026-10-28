<script>
/* harness appended to the ORIGINAL version (git 76ac060) - it plays a little and saves,
   so the refactored version can be tested against that legacy save (shared browser profile) */
const s = [];
function log(m){ s.push(m); }
try {
  infimine.newGame('12_14_4_20');
  const valid = () => [...document.querySelectorAll('td.cell')].filter(c => c.id && c.id !== 'null');
  let closed = valid().filter(c => c.className.includes('shadow'));
  closed[closed.length-1].dispatchEvent(new MouseEvent('contextmenu', {bubbles:true, cancelable:true}));
  closed = valid().filter(c => c.className.includes('shadow'));
  closed[closed.length-1].dispatchEvent(new MouseEvent('contextmenu', {bubbles:true, cancelable:true}));
  valid().find(c => c.className.includes('shadow')).dispatchEvent(new MouseEvent('click', {bubbles:true}));
  document.querySelector('td.marker').dispatchEvent(new MouseEvent('click', {bubbles:true})); //old version: ui keys live in game
  infimine.save();
  const g = JSON.parse(localStorage.getItem('game'));
  const f = g.field;
  const summary = { clicks: g.clickCount,
    open: Object.values(f).filter(c => c.isOpen === true).length,
    marks: Object.values(f).filter(c => c.hasMark === true).length,
    fieldKeys: Object.keys(f).length, space: g.spaceSize, lives: g.defaultLives, fixedBombs: g.fixedBombs };
  const gk = JSON.stringify([g.spaceSize, g.defaultLives, (g.fixedBombs>0?g.fixedBombs:g.bombDensity)]);
  localStorage.setItem('legacySummary', JSON.stringify(summary));
  localStorage.setItem('legacyGameKey', gk);
  localStorage.setItem('bestScoreList_'+gk, JSON.stringify([['4321', {score:'4321', bombs:3, marks:5}, new Date()]]));
  localStorage.setItem('favoriteGames', JSON.stringify([gk]));
  log('LEGACY_SAVED clicks=' + summary.clicks + ' open=' + summary.open + ' marks=' + summary.marks + ' markOnClick=' + g.markOnClick);
} catch(e) { log('LEGACY_EXC=' + e.message); }
document.body.insertAdjacentHTML('beforeend', '<pre id="t">'+s.join('\n')+'</pre>');
</script>
