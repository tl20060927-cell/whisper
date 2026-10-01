/* dict.js —— 字典补词扩展（和 index.html 放在同一个文件夹）
   index.html 最后一行改成：</script><script src="dict.js"></script></body></html>
   作用：字典里的字词当作“额外的字卡”，和用户字卡一起随机发出，不拼完整句子。 */
(function(){
// ================= 1. 内置词库：想加词直接往里写，空格或换行隔开 =================
const DICT=`
我 我们 咱们 你 你们 他 她 大家
今天 明天 昨天 现在 刚才 等会 晚上 早上 中午 周末 以后 一直 每天
很 真的 特别 有点 超 还 也 都 就 又 已经 马上 一起 偷偷 一定 最
不 没 别 不要 没有
想 喜欢 爱 要 去 来 吃 喝 睡 看 听 玩 等 找 给 送 买 做 说 知道 觉得 记得 忘了 陪 抱 收到 准备 回家 出门 上班 下班 学习 休息 洗澡 做饭 散步 打电话 见面 想念 生气
饭 礼物 花 猫 狗 蛋糕 电影 音乐 歌 书 家 房间 衣服 天气 雨 雪 太阳 月亮 星星 消息 电话 照片 奶茶 咖啡 水果 零食 梦 工作 作业 生日 惊喜 秘密
好 开心 难过 累 困 饿 冷 热 忙 乖 可爱 漂亮 好看 好吃 舒服 无聊 害羞 安心 幸福 快乐 温柔
呀 啊 呢 吧 嘛 哦 哈哈 嘿嘿 嗯 哼 啦
好的 嗯嗯 知道了 没问题 好呀 行 才不 当然 真的吗 是吗 然后呢
一心一意 心花怒放 迫不及待 念念不忘 形影不离 情不自禁 喜出望外 心心相印 朝思暮想 无微不至 一言为定 手舞足蹈 心满意足 自言自语 恋恋不舍 目不转睛 若有所思 欢天喜地`;
const MODES=['关闭','只用字典','字卡＋字典'];
const MIX_RATE=0.6;   // 字卡＋字典模式下，有 60% 的回复会掺入字典词
const IDIOM_RATE=0.1; // 抽到成语库的概率（需先下载成语库）
const IDI_URLS=['https://cdn.jsdelivr.net/gh/pwxcoo/chinese-xinhua@master/data/idiom.json','https://raw.githubusercontent.com/pwxcoo/chinese-xinhua/master/data/idiom.json'];
const OLDCAT=new Set('时副否动名形语标应成'.split('')); // 兼容旧版“类别 词 词”写法

// 健康状况（保留旧版修复）
healthOf=function(f){const h=f.health;if(!h||!h.t||now()-h.ts>h.dur*864e5){const l=_pick('','hl',1+Math.floor(Math.random()*2));f.health={t:l.join('，'),ts:now(),dur:3+Math.floor(Math.random()*12)};if(l.length)save()}return f.health.t};

// ================= 2. 取词 =================
const rnd=a=>a[Math.floor(Math.random()*a.length)];
let IDI=[];try{IDI=(localStorage.getItem('jy_idiom')||'').split(' ').filter(Boolean)}catch(e){}
function pool(){
  const s=new Set(DICT.split(/\s+/).filter(Boolean));
  String(S.dkw||'').split('\n').forEach(l=>{const p=l.trim().split(/\s+/).filter(Boolean);if(OLDCAT.has(p[0]))p.shift();p.forEach(w=>s.add(w))});
  return[...s]}
// 和对方消息沾边的词（出现过或有相同字）更容易被抽到，但不强求
function dictPick(q,k){
  const P=pool(),cs=new Set(q),res=[];
  const wt=w=>q.includes(w)?3:[...w].some(c=>cs.has(c))?2:1;
  for(let i=0;i<k&&P.length;i++){
    if(IDI.length&&Math.random()<IDIOM_RATE){const r=IDI.filter(x=>[...x].some(c=>cs.has(c)));res.push(rnd(r.length?r:IDI));continue}
    const ws=P.map(wt),sum=ws.reduce((a,b)=>a+b,0);let x=Math.random()*sum,j=0;
    while((x-=ws[j])>0)j++;res.push(P.splice(j,1)[0])}
  return res}

// ================= 3. 接管原函数 =================
const TAG=new Set(),_pick=pickCards,_cp=cpush,_bc=bc,_set=settings;
pickCards=function(q,c='chat',n=0){
  const m=Math.min(S.dkm|0,2);if(!m||c!='chat'||n)return _pick(q,c,n);
  q=String(q||'');
  if(m==2&&Math.random()>MIX_RATE)return _pick(q,c,n); // 这次只发字卡
  let r=m==2?_pick(q,c,n).slice():[];
  const add=dictPick(q,m==1?1+Math.floor(Math.random()*3):1+Math.floor(Math.random()*2));
  add.forEach(w=>{
    TAG.add(w);
    const roll=Math.random();
    if(r.length&&roll<.25)r[Math.floor(Math.random()*r.length)]=w;           // 替换一张字卡
    else if(r.length&&roll<.45){const i=Math.floor(Math.random()*r.length);TAG.add(r[i]=Math.random()<.5?r[i]+' '+w:w+' '+r[i])} // 和字卡并在一条
    else r.splice(Math.floor(Math.random()*(r.length+1)),0,w)});           // 单独一条
  return r};
cpush=function(id,o){if(o&&o.k=='t'&&TAG.has(o.t)){o.dk='字典';TAG.delete(o.t)}return _cp(id,o)};
bc=function(m,i){const r=_bc(m,i);if(m&&m.dk&&S.dktag!==0&&r&&!r.n)r.h+=`<div class="dk-tag">${m.dk}</div>`;return r};
settings=function(){
  const h=_set(),m=Math.min(S.dkm|0,2),card=`<div class="card"><b>字典补词</b><div style="margin-top:6px">${MODES.map((x,i)=>`<span class="tab2 tap ${m==i?'on':''}" data-dkmode="${i}">${x}</span>`).join('')}</div>
<p style="font-size:12px;color:var(--sub)">字典里的字词当作额外字卡，和你的字卡一起随机发出，不拼完整句子。和对方消息沾边的词更容易出现。</p>
<div style="margin:6px 0"><span class="tab2 tap ${S.dktag!==0?'on':''}" data-dkact="tag">气泡下显示「字典」标记</span></div>
<b style="font-size:14px">自定义词</b><p style="font-size:12px;color:var(--sub);margin:4px 0">直接写词，空格或换行隔开。例：火锅 小熊 晚安</p>
<textarea id="dkw" rows="4" style="width:100%;box-sizing:border-box;border-radius:8px;border:1px solid var(--line);background:transparent;color:inherit;padding:8px;font:inherit">${esc(D.dkdraft??S.dkw??'')}</textarea>
<div class="flex2" style="margin-top:8px"><button class="btn tap" data-dkact="save">保存</button><button class="btn g tap" data-dkact="idiom">${IDI.length?'成语库已载入 '+IDI.length+' 条':'下载成语库（联网）'}</button></div></div>`;
  const k='<div class="card"><b>数据备份</b>';return h.includes(k)?h.replace(k,card+k):h.replace(/<\/div>\s*$/,card+'</div>')};

// ================= 4. 事件与样式 =================
document.addEventListener('click',async e=>{const t=e.target.closest?.('[data-dkmode],[data-dkact]');if(!t)return;e.stopPropagation();
  if(t.dataset.dkmode!=null){S.dkm=+t.dataset.dkmode;save();toast('已切换：'+MODES[S.dkm]);return render()}
  const a=t.dataset.dkact;
  if(a=='tag'){S.dktag=S.dktag===0?1:0;save();return render()}
  if(a=='save'){S.dkw=document.getElementById('dkw').value;D.dkdraft=null;save();toast('已保存');render()}
  if(a=='idiom'){toast('正在下载成语库，请稍候…');for(const u of IDI_URLS){try{const j=await (await fetch(u)).json();IDI=j.map(x=>x.word).filter(w=>w&&w.length==4);
    try{localStorage.setItem('jy_idiom',IDI.join(' '))}catch(_){toast('存储空间不足，本次有效，刷新后需重新下载')}
    toast('已载入 '+IDI.length+' 条成语');return render()}catch(_){}}toast('下载失败，请检查网络')}
},true);
addEventListener('input',e=>{if(e.target.id=='dkw')D.dkdraft=e.target.value});
const st=document.createElement('style');st.textContent='.dk-tag{font-size:10px;opacity:.55;text-align:right;margin-top:2px;line-height:1.2;white-space:nowrap}';document.head.appendChild(st);
if(S.page=='settings'||S.page=='chat')render();
})();
