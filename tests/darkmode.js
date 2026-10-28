<script>
const s = [];
const log = m => { s.push(m); document.title = 'RESULT: ' + s.join(' | '); };
const ready = () => (window.infimine && typeof window.infimine.main === 'function');
(async () => {
  try {
    for (let i=0; i<200 && !ready(); i++) await new Promise(r=>setTimeout(r,20));
    if (!ready()) { log('NO_API'); throw 0; }
    /* headless chromium cannot emulate prefers-color-scheme via CLI,
       so the dark theme is verified by parsing the stylesheet (a broken @media block would drop rules) */
    const sheet = document.styleSheets[0];
    const rules = [...sheet.cssRules];
    const media = rules.find(r => r.conditionText && r.conditionText.indexOf('prefers-color-scheme: dark') > -1);
    log('darkMediaParses=' + (media ? 'ok' : 'FAILED'));
    log('darkRulesCount=' + (media && media.cssRules.length >= 15 ? 'ok(' + media.cssRules.length + ')' : 'FAILED:' + (media ? media.cssRules.length : 'no media')));
    const darkRules = media ? [...media.cssRules] : [];
    const sel = name => darkRules.find(r => r.selectorText === name);
    const prop = (name, p) => { const r = sel(name); return r ? r.style.getPropertyValue(p) : null; };
    /* cssRules serializes colors to rgb() */
    log('darkHasShadow=' + (prop('.shadow', 'background-color') === 'rgb(74, 79, 85)' && prop('.shadow', 'color') === 'rgb(216, 216, 216)' ? 'ok' : 'FAILED:' + prop('.shadow', 'background-color')));
    log('darkHasField=' + (prop('table.minefield', 'background-color') === 'rgb(42, 45, 49)' ? 'ok' : 'FAILED:' + prop('table.minefield', 'background-color')));
    log('darkHasMarkbad=' + (sel('.markbad') !== undefined ? 'ok' : 'FAILED'));
    log('darkCoversAllColors=' + ([0,1,2,3,4,5,6,7,8,9].every(i => sel('.color'+i)) ? 'ok' : 'FAILED'));
    /* the light theme must still be in effect and unbroken */
    const lbg = getComputedStyle(document.querySelector('table.minefield')).backgroundColor;
    log('lightFieldIntact=' + (lbg === 'rgb(255, 255, 255)' ? 'ok' : 'FAILED:' + lbg));
    const sbg = getComputedStyle(document.querySelector('td.cell.shadow')).backgroundColor;
    log('lightShadowIntact=' + (sbg === 'rgb(211, 211, 211)' ? 'ok' : 'FAILED:' + sbg));
  } catch(e) { log('EXC=' + e.message); }
  document.body.insertAdjacentHTML('beforeend','<pre id="t">'+s.join('\n')+'</pre>');
})();
</script>
