const fs=require('fs');const r=f=>fs.readFileSync('src/'+f,'utf8');
const VER=(r('patchnotes.js').match(/GAME_VERSION = '([^']+)'/)||[])[1]||'';
const html=`<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Thousandfold ${VER}</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Alegreya+Sans:wght@400;500;700&family=IM+Fell+English+SC&display=swap" rel="stylesheet">
<style>
${r('style.css')}
</style></head><body>
<div id="root"></div><div class="toasts" id="toasts" aria-live="polite"></div>
<script>
${r('patchnotes.js')}
${r('balance.js')}
${r('data.js')}
${r('content.js')}
${r('world.js')}
${r('classes.js')}
${r('companions.js')}
${r('quests.js')}
${r('pets.js')}
${r('engine.js')}
${r('state.js')}
${r('cloud.js')}
${r('social.js')}
${r('auction.js')}
${r('ui.js')}
</script></body></html>`;
fs.writeFileSync('index.html',html);fs.mkdirSync('releases',{recursive:true});fs.writeFileSync('releases/Thousandfold_'+VER+'.html',html);console.log(VER, html.length);
