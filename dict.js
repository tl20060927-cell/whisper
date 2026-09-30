/* dict.js —— 字典拼句扩展（和 index.html 放在同一个文件夹）
   index.html 最后一行改成：</script><script src="dict.js"></script></body></html>  */
(function(){
// ================= 1. 内置字典：想加词直接在引号里加，用空格隔开 =================
const DICT={
  我:'我 我们 咱们',
  你:'你 你们',
  他:'他 她 大家',
  时:'今天 明天 昨天 现在 刚才 等会 晚上 早上 中午 周末 以后 一直 每天',
  副:'很 真的 特别 有点 好 超 还 也 都 就 又 已经 马上 一起 偷偷 一定 最',
  否:'不 没 别 不要 没有',
  动:'想 喜欢 爱 要 去 来 吃 喝 睡 看 听 玩 等 找 给 送 买 做 说 知道 觉得 记得 忘了 陪 抱 收到 准备 回家 出门 上班 下班 学习 休息 洗澡 做饭 散步 打电话 见面 想念 生气',
  名:'饭 礼物 花 猫 狗 蛋糕 电影 音乐 歌 书 家 房间 衣服 天气 雨 雪 太阳 月亮 星星 消息 电话 照片 奶茶 咖啡 水果 零食 梦 工作 作业 生日 惊喜 秘密',
  形:'好 开心 难过 累 困 饿 冷 热 忙 乖 可爱 漂亮 好看 好吃 舒服 无聊 害羞 安心 幸福 快乐 温柔',
  语:'呀 啊 呢 吧 嘛 哦 哈哈 嘿嘿 嗯 哼 啦',
  标:'。 ！ ～ …',
  应:'好的 嗯嗯 知道了 没问题 好呀 行 不要 才不 当然 真的吗 是吗 然后呢',
  成:'一心一意 心花怒放 迫不及待 念念不忘 形影不离 情不自禁 喜出望外 心心相印 朝思暮想 无微不至 一言为定 手舞足蹈 心满意足 自言自语 恋恋不舍 目不转睛 若有所思 欢天喜地'
};
// 句式模板：写类别名＝从该类随机取词；写其他字＝原样输出
const TPL=['我 副 动 名 语','我 副 形 语','时 我 动 名 语','你 副 形 语','我 也 副 动 你 语','名 副 形 语','成 语','我 否 动 名 语','你 动 名 了 吗','我 时 想 动 名'];
const TPLQ=['应 标','应 标 我 副 动 名 语','应 我 时 动 名 了','应 标 你 呢'];
const IDI_URLS=['https://cdn.jsdelivr.net/gh/pwxcoo/chinese-xinhua@master/data/idiom.json','https://raw.githubusercontent.com/pwxcoo/chinese-xinhua/master/data/idiom.json'];
const MODES=['关闭','字典拼句','字卡拼句','混合拼句'];
const CARD_RATE=0.4; // 开启拼句时，有 40% 的回复仍用纯字卡（0＝全拼句，1＝全字卡）
// 健康状况：之前字卡为空时会缓存空值好几天，这里改为空了就重新取；取 1~2 个词，保持 3~14 天不变
healthOf=function(f){const h=f.health;if(!h||!h.t||now()-h.ts>h.dur*864e5){const l=_pick('','hl',1+Math.floor(Math.random()*2));f.health={t:l.join('，'),ts:now(),dur:3+Math.floor(Math.random()*12)};if(l.length)save()}return f.health.t};

// ================= 2. 工具 =================
const rnd=a=>a[Math.floor(Math.random()*a.length)];
let IDI=[];try{IDI=(localStorage.getItem('jy_idiom')||'').split(' ').filter(Boolean)}catch(e){}
function words(){ // 内置 + 自定义词条
  const w={};for(const k in DICT)w[k]=DICT[k].split(/\s+/).filter(Boolean);
  String(S.dkw||'').split('\n').forEach(l=>{const p=l.trim().split(/\s+/);if(w[p[0]])w[p[0]].push(...p.slice(1))});
  return w}
function hits(q,W){ // 正向最大匹配，找出用户消息里出现的字典词
  const map={};for(const k in W)if(k!='标')W[k].forEach(x=>{if(!map[x])map[x]=k});
  const H={};for(let p=0;p<q.length;){let ok=0;for(let L=4;L>0;L--){const s=q.substr(p,L);if(s.length==L&&map[s]){(H[map[s]]=H[map[s]]||[]).push(s);p+=L;ok=1;break}}if(!ok)p++}
  return H}
function idiom(q){if(!IDI.length)return null;const c=new Set(q);const r=IDI.filter(x=>[...x].some(ch=>c.has(ch)));return rnd(r.length?r:IDI)}
function gen(q){ // 生成一句话（token 数组）
  const W=words(),H=hits(q,W);
  // 对方说“你”指 char 本人，所以 char 回答用“我”
  const isQ=/[吗？?]\s*$|什么|怎么|为什么|是不是|要不要|好不好|呢\s*$/.test(q);
  const tpl=(isQ&&Math.random()<.7?rnd(TPLQ):rnd(TPL)).split(' ');
  const pick=c=>{if(c=='成'){const i=Math.random()<.5&&idiom(q);if(i)return i}const h=H[c];return h&&h.length&&Math.random()<.75?rnd(h):rnd(W[c]||[c])};
  const t=tpl.map(c=>({w:W[c]?pick(c):c}));
  if(Math.random()<.12)t.push({w:'。'},{w:pick('成')});
  return t}
function out(t,sep){ // token → 一条或多条消息
  const s=a=>a.map(x=>x.card?' '+x.w+' ':x.w).join(sep).replace(/\s+/g,' ').trim();
  if(Math.random()<.55)return[s(t)];
  const g=[];t.forEach(x=>{const last=g[g.length-1];if(last&&(/^[。！～…？]$/.test(x.w)||DICT.语.includes(x.w)&&!x.card)&&!x.card)last.push(x);else if(last&&last.length<2&&Math.random()<.35)last.push(x);else g.push([x])});
  return g.map(s).filter(Boolean)}

// ================= 3. 接管原函数（不改原文件） =================
const TAG=new Map(),_pick=pickCards,_cp=cpush,_bc=bc,_set=settings;
pickCards=function(q,c='chat',n=0){
  const m=S.dkm|0;if(!m||c!='chat'||n)return _pick(q,c,n);
  if(m!=2&&Math.random()<CARD_RATE)return _pick(q,c,n); // 夹杂纯字卡回复
  q=String(q||'');let r,label=null;
  if(m==2){const cs=_pick(q,'chat',2+Math.floor(Math.random()*2));if(!cs.length)return[];r=out(cs.map(w=>({w,card:1})),' ')}
  else{const t=gen(q);label='字典拼句';
    if(m==3){const cd=_pick(q,'chat',1)[0];if(cd){label='混合拼句';Math.random()<.5?t.unshift({w:cd,card:1}):t.splice(Math.max(t.length-1,0),0,{w:cd,card:1})}}
    r=out(t,'')}
  if(label)r.forEach(x=>TAG.set(x,label));return r};
cpush=function(id,o){if(o&&o.k=='t'&&TAG.has(o.t)){o.dk=TAG.get(o.t);TAG.delete(o.t)}return _cp(id,o)};
bc=function(m,i){const r=_bc(m,i);if(m&&m.dk&&r&&!r.n)r.h+=`<div class="dk-tag">${m.dk}</div>`;return r};
settings=function(){
  const h=_set(),m=S.dkm|0,card=`<div class="card"><b>字典拼句</b><div style="margin-top:6px">${MODES.map((x,i)=>`<span class="tab2 tap ${m==i?'on':''}" data-dkmode="${i}">${x}</span>`).join('')}</div>
<p style="font-size:12px;color:var(--sub)">字典拼句：只用内置字典拼句，气泡下标注「字典拼句」。字卡拼句：只用字卡库，字卡间空格隔开。混合拼句：字卡＋字典，标注「混合拼句」。有时会拆成多条消息发出。</p>
<b style="font-size:14px">自定义词条</b><p style="font-size:12px;color:var(--sub);margin:4px 0">每行：类别 词 词 词。类别可用：${Object.keys(DICT).join(' ')}。例：名 火锅 小熊</p>
<textarea id="dkw" rows="4" style="width:100%;box-sizing:border-box;border-radius:8px;border:1px solid var(--line);background:transparent;color:inherit;padding:8px;font:inherit">${esc(D.dkdraft??S.dkw??'')}</textarea>
<div class="flex2" style="margin-top:8px"><button class="btn tap" data-dkact="save">保存词条</button><button class="btn g tap" data-dkact="idiom">${IDI.length?'成语库已载入 '+IDI.length+' 条':'下载新华字典成语库（联网）'}</button></div></div>`;
  const k='<div class="card"><b>数据备份</b>';return h.includes(k)?h.replace(k,card+k):h.replace(/<\/div>\s*$/,card+'</div>')};

// ================= 4. 事件与样式 =================
document.addEventListener('click',async e=>{const t=e.target.closest?.('[data-dkmode],[data-dkact]');if(!t)return;e.stopPropagation();
  if(t.dataset.dkmode!=null){S.dkm=+t.dataset.dkmode;save();toast('已切换：'+MODES[S.dkm]);return render()}
  const a=t.dataset.dkact;
  if(a=='save'){S.dkw=document.getElementById('dkw').value;D.dkdraft=null;save();toast('词条已保存');render()}
  if(a=='idiom'){toast('正在下载成语库，文件较大请稍候…');for(const u of IDI_URLS){try{const j=await (await fetch(u)).json();IDI=j.map(x=>x.word).filter(w=>w&&w.length==4);
    try{localStorage.setItem('jy_idiom',IDI.join(' '))}catch(_){toast('存储空间不足，本次有效，刷新后需重新下载')}
    toast('已载入 '+IDI.length+' 条成语');return render()}catch(_){}}toast('下载失败，请检查网络')}
},true);
addEventListener('input',e=>{if(e.target.id=='dkw')D.dkdraft=e.target.value});
const st=document.createElement('style');st.textContent='.dk-tag{font-size:10px;opacity:.55;text-align:right;margin-top:2px;line-height:1.2;white-space:nowrap}';document.head.appendChild(st);
if(S.page=='settings'||S.page=='chat')render();
})();
