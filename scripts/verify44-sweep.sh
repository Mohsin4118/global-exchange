#!/bin/bash
# Task 44 — SOURCE-below-Total-Balance + font/overflow sweep at 5 mobile viewports
cd /home/z/my-project
PASS=0; FAIL=0
for W in 375 390 393 414 430; do
  H=$((W + 420))
  agent-browser set viewport $W $H >/dev/null
  agent-browser reload >/dev/null
  agent-browser wait 1800 >/dev/null
  R=$(agent-browser eval "(() => {
    const findCard=(label)=>{
      const p=[...document.querySelectorAll('p')].find(e=>e.innerText.trim().toLowerCase()===label.toLowerCase());
      const c=p?.closest('.rounded-2xl'); if(!c) return null;
      const r=c.getBoundingClientRect();
      return {y:Math.round(r.top+window.scrollY), x:Math.round(r.left), w:Math.round(r.width), h:Math.round(r.height)};
    };
    const total=findCard('Total Balance'); const sof=findCard('Source'); const cash=findCard('Cash Available'); const inv=findCard('Invested');
    const overflow = document.documentElement.scrollWidth > window.innerWidth;
    const rootFs = getComputedStyle(document.documentElement).fontSize;
    // welcome visible at top
    const h1=document.querySelector('h1'); const h1top=h1?Math.round(h1.getBoundingClientRect().top):null;
    // computed style parity TOTAL vs SOURCE
    const pEls=[...document.querySelectorAll('p')];
    const tp=pEls.find(e=>e.innerText.trim().toLowerCase()==='total balance'); const sp=pEls.find(e=>e.innerText.trim().toLowerCase()==='source');
    const tc=tp?.closest('.rounded-2xl'); const sc=sp?.closest('.rounded-2xl');
    const diff={};
    if(tc&&sc){ const a=getComputedStyle(tc), b=getComputedStyle(sc);
      for(const k of ['borderRadius','backgroundColor','borderColor','borderWidth','boxShadow','paddingTop','paddingBottom','paddingLeft','paddingRight']){ if(a[k]!==b[k]) diff[k]=[a[k],b[k]]; } }
    // total vs source same width?
    const sameW = total&&sof ? Math.abs(total.w-sof.w)<=1 : false;
    const directlyBelow = total&&sof ? sof.y > total.y && (sof.y - (total.y+total.h)) < 30 : false;
    const orderOk = total&&sof&&cash&&inv ? (total.y < sof.y && sof.y < cash.y && inv.y >= cash.y) : false;
    const stickyVisible = (()=>{const hd=document.querySelector('header'); if(!hd) return false; const r=hd.getBoundingClientRect(); return r.top<=0 && r.height>40 && r.bottom>40;})();
    // floating contact buttons must not cover the financial cards
    const dock=[...document.querySelectorAll('a,button')].filter(e=>/whatsapp|telegram/i.test(e.getAttribute('aria-label')||''));
    const dockVisible = dock.length>0 ? dock.every(e=>{const r=e.getBoundingClientRect(); return r.top>=0&&r.left>=0&&r.right<=window.innerWidth&&r.bottom<=window.innerHeight;}) : true;
    const dockOverlaps = dock.length>0 && tc ? dock.some(e=>{const r=e.getBoundingClientRect(); const tr=tc.getBoundingClientRect(); return !(r.right<tr.left||r.left>tr.right||r.bottom<tr.top||r.top>tr.bottom);}) : false;
    return JSON.stringify({w:window.innerWidth, overflow, rootFs, h1top, orderOk, directlyBelow, sameW, diff, dockOverlaps, stickyVisible, sofH: sof?.h, totalH: total?.h});
  })()")
  echo "viewport $W: $R"
  # checks
  echo "$R" | python3 -c "
import json,sys
d=json.loads(json.loads(sys.stdin.read()))
ok=True
for k,cond in [('overflow',not d['overflow']),('orderOk',d['orderOk']),('directlyBelow',d['directlyBelow']),('sameW',d['sameW']),('styleDiff',d['diff']=={}),('noDockOverlap',not d['dockOverlaps']),('rootFs18',d['rootFs']=='18px'),('sticky',d['stickyVisible']),('h1visible',d['h1top'] is not None and d['h1top']>50)]:
    status='PASS' if cond else 'FAIL'
    if not cond: ok=False
    print(f'  {k}: {status}')
exit(0 if ok else 1)
" && PASS=$((PASS+1)) || FAIL=$((FAIL+1))
done
echo "=== VIEWPORTS PASSED: $PASS, FAILED: $FAIL ==="
