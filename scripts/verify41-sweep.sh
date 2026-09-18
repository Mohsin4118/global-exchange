#!/bin/bash
# Task 41 — Client Dashboard mobile scale + Source of Funds card verification (v2)
# All assertions computed browser-side; agent-browser returns flat JSON booleans.
cd /home/z/my-project
OUT=scripts/verify41
PASS=0; FAIL=0
check() {
  if [ "$2" = "true" ]; then PASS=$((PASS+1)); echo "  PASS: $1";
  else FAIL=$((FAIL+1)); echo "  FAIL: $1 -> $2"; fi
}

DASH_URL="http://localhost:3000/"

for VP in "375 812" "390 844" "393 852" "414 896" "430 932"; do
  W=$(echo $VP | cut -d' ' -f1); H=$(echo $VP | cut -d' ' -f2)
  echo "=== viewport ${W}x${H} ==="
  agent-browser set viewport $W $H >/dev/null 2>&1
  agent-browser open "$DASH_URL" >/dev/null 2>&1
  sleep 2.8

  R=$(agent-browser eval 'JSON.stringify((() => {
    const hdr=document.querySelector("header");
    const h1=document.querySelector("main h1");
    const hr=hdr?hdr.getBoundingClientRect():null;
    const r=h1?h1.getBoundingClientRect():null;
    const main=document.querySelector("main");
    const kpiCards=[...main.querySelectorAll("div.rounded-2xl")].filter(d=>/^(TOTAL BALANCE|CASH AVAILABLE|INVESTED|الرصيد الإجمالي|الأموال المتاحة|المستثمر)/i.test((d.textContent||"").trim()));
    const tbH=kpiCards.length?Math.round(kpiCards[0].getBoundingClientRect().height):-1;
    const sofDiv=[...main.querySelectorAll("div.rounded-2xl")].find(d=>/SOURCE OF FUNDS|مصدر الأموال/i.test(d.textContent||""));
    const sof=sofDiv?(()=>{const b=sofDiv.getBoundingClientRect();const cs=getComputedStyle(sofDiv);return {present:true,h:Math.round(b.height),radius:cs.borderRadius,pad:cs.paddingTop,sameFamily:sofDiv.className.includes("rounded-2xl")&&sofDiv.className.includes("border")&&sofDiv.className.includes("bg-white")&&sofDiv.className.includes("shadow")};})():{present:false};
    const nested=[];let el=main;
    while(el&&el!==document.body){const cs=getComputedStyle(el);if(/(auto|scroll)/.test(cs.overflowY)&&el.scrollHeight>el.clientHeight+2)nested.push(el.tagName);el=el.parentElement;}
    const hdrBtns=hdr?hdr.querySelectorAll("button").length:0;
    const order=(()=>{ // required order: h1 < badges < summary < acct < buttons < manager < kpis < chart < sof
      const txt=(e)=>e?e.getBoundingClientRect().top:-1;
      const kpiGridTop=kpiCards.length?Math.min(...kpiCards.map(c=>c.getBoundingClientRect().top)):-1;
      const chartTop=(()=>{const c=[...main.querySelectorAll("div.rounded-2xl")].find(d=>/Portfolio Performance|أداء المحفظة/i.test(d.textContent||""));return c?c.getBoundingClientRect().top:-1;})();
      const sofTop=sofDiv?sofDiv.getBoundingClientRect().top:-1;
      return {kpi:Math.round(kpiGridTop),chart:Math.round(chartTop),sof:Math.round(sofTop),ordered:kpiGridTop<chartTop&&chartTop<sofTop};
    })();
    return {
      ovf: document.documentElement.scrollWidth>window.innerWidth,
      atTop: window.scrollY===0,
      belowHdr: r&&hr?(r.top>=hr.bottom-1):false,
      h1InVp: r?(r.top>=0&&r.bottom<=window.innerHeight):false,
      h1NoClip: r?(r.right<=window.innerWidth+0.5&&r.width>0):false,
      hdrVisible: hr?(hr.top===0&&hr.height>40&&hr.height<80):false,
      hdrBtns: hdrBtns>=4,
      noNested: nested.length===0,
      tbH, sof, order
    };
  })())' 2>/dev/null | tail -1)
  echo "  $R" | head -c 600; echo
  get() { echo "$R" | python3 -c "
import json,sys
d=json.loads(json.loads(sys.stdin.read()))
v=d
for k in '$1'.split('.'):
    v=v[k]
print(str(v).lower() if isinstance(v,bool) else v)
" 2>/dev/null; }

  check "no horizontal overflow" "$(python3 -c "print('true' if '$(get ovf)'=='false' else 'false')")"
  check "opens at top (scrollY=0)" "$(get atTop)"
  check "welcome h1 starts below sticky header" "$(get belowHdr)"
  check "welcome h1 fully inside viewport at load" "$(get h1InVp)"
  check "welcome h1 not clipped horizontally" "$(get h1NoClip)"
  check "sticky header visible (40-80px)" "$(get hdrVisible)"
  check "header has 4+ buttons (menu/lang/bell/logout)" "$(get hdrBtns)"
  check "single page scroll (no nested scroller above main)" "$(get noNested)"
  check "Total Balance card compact (<175px)" "$(python3 -c "print('true' if 0<float('$(get tbH)')<175 else 'false')")"
  check "SOF card present on Overview" "$(get sof.present)"
  check "SOF card same design family (rounded-2xl/border/white/shadow)" "$(get sof.sameFamily)"
  check "SOF card compact (<140px)" "$(python3 -c "print('true' if 0<float('$(get sof.h)')<140 else 'false')")"
  check "order: KPIs < Performance < Source of Funds" "$(get order.ordered)"

  agent-browser screenshot "$OUT/m-${W}x${H}-top.png" >/dev/null 2>&1
done
echo "=============================="
echo "RESULT: PASS=$PASS FAIL=$FAIL"
