const fs=require('fs');const r=f=>fs.readFileSync('src/'+f,'utf8');
// The secrets module ships scrambled: players reading the page source see no names, hints, triggers or story text.
// It is unscrambled in memory and run as its own script at the same point in the load order.
const crypto=require('crypto');
function seal(src){const key=crypto.randomBytes(16).toString('hex');let x=0;for(const c of key)x=(Math.imul(x,31)+c.charCodeAt(0))|0;x=x||1;
  const b=Buffer.from(src,'utf8');for(let i=0;i<b.length;i++){x^=x<<13;x^=x>>>17;x^=x<<5;b[i]^=x&255;}
  return `;(function(){var k=${JSON.stringify(key)},d=${JSON.stringify(b.toString('base64'))},x=0,i;for(i=0;i<k.length;i++)x=(Math.imul(x,31)+k.charCodeAt(i))|0;x=x||1;var s=atob(d),u=new Uint8Array(s.length);for(i=0;i<s.length;i++){x^=x<<13;x^=x>>>17;x^=x<<5;u[i]=s.charCodeAt(i)^(x&255);}var e=document.createElement('script');e.textContent=new TextDecoder().decode(u);document.head.appendChild(e);e.remove();})();`;}
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
${seal(r('secrets.js') + '\n' + r('lore.js'))}
${r('prestige.js')}
${r('classes.js')}
${r('companions.js')}
${r('quests.js')}
${r('pets.js')}
${r('engine.js')}
${r('state.js')}
${r('cloud.js')}
${r('social.js')}
${r('auction.js')}
${r('guild.js')}
${r('ui.js')}
</script></body></html>`;
fs.writeFileSync('index.html',html);fs.mkdirSync('releases',{recursive:true});fs.writeFileSync('releases/Thousandfold_'+VER+'.html',html);console.log(VER, html.length);
