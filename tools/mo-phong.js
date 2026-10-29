// Mô phỏng máy đấu máy để đo cân bằng. Cách chạy: node tools/mo-phong.js [số trận mỗi cặp] [de|thuong|kho] [dmg]
// Mô phỏng máy đấu máy để bắt lỗi và đo tỷ lệ thắng
const fs=require('fs'), vm=require('vm');
const root=require('path').join(__dirname,'..','js')+'/';
const ctx={window:{addEventListener(){}}, navigator:{}, console, Math, Proxy, Set, Object, Array, Infinity};
ctx.window.window=ctx.window; vm.createContext(ctx);
for (const f of ['data.js','fighter.js','game.js','input.js','ai.js']) vm.runInContext(fs.readFileSync(root+f,'utf8').replace("'use strict';",''), ctx, {filename:f});
const G=ctx.window.G;
const D={}; const TK={}; G.onDmg=(c,k,d,v)=>{D[c]=D[c]||{}; D[c][k]=(D[c][k]||0)+d; TK[v]=(TK[v]||0)+d};
const N=+process.argv[2]||2, lvl=process.argv[3]||'kho';
const ids=G.CHARS.map(c=>c.id); const wins={}, games={}; ids.forEach(i=>{wins[i]=0;games[i]=0});
let errs=0, totalFrames=0, timeouts=0;
const mat={};
for (const a of ids) for (const b of ids) { if (a===b) continue;
  for (let k=0;k<N;k++){
    const g=new G.Game({defs:[G.charById(a),G.charById(b)], stage:G.STAGES[0], mode:'cpu', pads:[new G.Pad(),new G.Pad()], sources:[new G.AISource(lvl), new G.AISource(lvl)]});
    let w=null; g.on((t,d)=>{ if(t==='matchEnd') w=d.winner; if(t==='banner'&&d.text==='HẾT GIỜ') timeouts++; });
    try { for (let f=0; f<60*60*6 && w===null; f++) g.step(); totalFrames+=g.frame; }
    catch(e){ errs++; if (errs<5) console.log(a,b,e.stack); }
    games[a]++; games[b]++;
    if (w===0) wins[a]++; else if (w===1) wins[b]++;
    mat[a+'-'+b]=(mat[a+'-'+b]||0)+(w===0?1:0);
  }
}
console.log('errors',errs,'avg match sec',(totalFrames/(ids.length*(ids.length-1)*N)/60).toFixed(1),'timeouts(rounds)',timeouts);
for (const i of ids) console.log(i.padEnd(5), (100*wins[i]/games[i]).toFixed(1)+'%');
if (process.argv[4]) for (const i of ids){ const t=D[i]||{}; const tot=Object.values(t).reduce((a,b)=>a+b,0); console.log(i, 'gây',Math.round(tot/games[i]),'nhận',Math.round((TK[i]||0)/games[i]), Object.entries(t).sort((a,b)=>b[1]-a[1]).map(([k,v])=>k+':'+Math.round(v/games[i])).join(' ')); }
