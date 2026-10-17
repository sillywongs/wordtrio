"""Real-browser checks for WordTrio (headless Chromium at phone sizes). Run: python3 browser-test.py (needs Playwright)."""
import functools, http.server, os, socketserver, threading, sys
from playwright.sync_api import sync_playwright
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*a): pass
HERE=os.path.dirname(os.path.abspath(__file__))
httpd=socketserver.TCPServer(("127.0.0.1",0),functools.partial(Q,directory=HERE)); URL="http://127.0.0.1:%d/index.html"%httpd.server_address[1]
threading.Thread(target=httpd.serve_forever,daemon=True).start()
res=[]
def ok(n,c,e=""): res.append(bool(c)); print(("PASS " if c else "FAIL ")+n+("" if c else " :: "+str(e)))
with sync_playwright() as p:
    b=p.chromium.launch()
    def pf(w,api=None):
        c=b.new_context(viewport={"width":w,"height":700},device_scale_factor=2,has_touch=True,is_mobile=True); pg=c.new_page(); pg.errs=[]; pg.on("pageerror",lambda e:pg.errs.append(str(e))); pg.route("**/sw.js",lambda r:r.abort())
        pg.calls=[]
        def h(r):
            w=r.request.url.rsplit('/',1)[1]; pg.calls.append(w)
            if api=='offline': return r.abort()
            r.fulfill(status=200 if w in (api or ()) else 404,content_type='application/json',headers={'access-control-allow-origin':'*'},body='[]')
        pg.route("**/api.dictionaryapi.dev/**",h); return pg
    def go(pg,tab): pg.goto(URL+"#"+tab); pg.wait_for_timeout(350)
    # Pyramid layout
    for w in (320,360,412):
        pg=pf(w); go(pg,"pyra")
        i=pg.evaluate("""()=>{const ns=[...document.querySelectorAll('#pyraSvg .n')];const rs=ns.map(n=>n.querySelector('rect').getBoundingClientRect());
          let ov=0;for(let a=0;a<rs.length;a++)for(let c=a+1;c<rs.length;c++){const A=rs[a],B=rs[c];if(A.left<B.right-.5&&B.left<A.right-.5&&A.top<B.bottom-.5&&B.top<A.bottom-.5)ov++;}
          return [ns.length,ov,ns.every(n=>n.querySelector('text').getBBox().width<=n.querySelector('rect').getBBox().width-6)]}""")
        ok("%dpx pyramid: 15 words, no overlap, words fit"%w, i==[15,0,True] and not pg.errs,(i,pg.errs)); pg.context.close()
    # Pyramid: group moves
    pg=pf(360); go(pg,"pyra"); pos=lambda i: pg.evaluate("(()=>{const r=document.querySelector('#pyraSvg .n[data-i=\"%d\"] rect').getBoundingClientRect();return [r.left+r.width/2,r.top+r.height/2]})()"%i)
    def drag(a,z):
        s=pos(a); t=pos(z); pg.mouse.move(*s); pg.mouse.down(); pg.mouse.move((s[0]+t[0])/2,(s[1]+t[1])/2,steps=4); pg.mouse.move(*t,steps=4); pg.mouse.up(); pg.wait_for_timeout(150)
    pg.evaluate("P.arr=pyraP.nodes.slice();P.marks=[P.arr[1]+'|'+P.arr[3],P.arr[1]+'|'+P.arr[4]];store.set('pyra',P);renderPyra()")
    before=pg.evaluate("P.arr.slice()"); drag(1,7)
    msg=pg.evaluate("document.getElementById('msg').textContent")
    ok("pyramid: dragging a marked group where its links would break is refused, words snap back, message shown", pg.evaluate("P.arr.slice()")==before and 'break' in msg, msg)
    drag(1,2)
    g=pg.evaluate("(()=>{const n=pyraP.nodes;const es=new Set(Core.EDGES.map(([a,b])=>P.arr[a]+'|'+P.arr[b]));return [P.arr.indexOf(n[1]),es.has(n[1]+'|'+n[3]),es.has(n[1]+'|'+n[4]),P.arr.slice().sort().join()==n.slice().sort().join()]})()")
    ok("pyramid: dragging the group to the other side moves it whole with its links intact", g==[2,True,True,True], g)
    before=pg.evaluate("P.arr.slice()"); drag(9,pg.evaluate("P.arr.indexOf(pyraP.nodes[3])"))
    ok("pyramid: dropping a loose word onto a marked group's word is refused", pg.evaluate("P.arr.slice()")==before)
    ok("pyramid: no script errors", not pg.errs, pg.errs); pg.context.close()
    # Wordle
    def type_word(pg,w):
        for ch in w: pg.keyboard.press(ch)
        pg.keyboard.press('Enter'); pg.wait_for_timeout(400)
    pg=pf(360,api=('hoxed',)); go(pg,"wordle"); type_word(pg,'qzxjk')
    ok("wordle: a made-up word is refused, and the row stays for editing", pg.evaluate("W.guesses.length===0 && W.cur==='qzxjk'") and 'real word' in pg.evaluate("document.getElementById('msg').textContent"), pg.evaluate("[W.guesses,W.cur,document.getElementById('msg').textContent]"))
    for _ in range(5): pg.keyboard.press('Backspace')
    type_word(pg,'crane'); ok("wordle: a real word in the list is accepted without any online check", pg.evaluate("W.guesses.length===1") and pg.calls==['qzxjk'], pg.calls)
    type_word(pg,'hoxed'); ok("wordle: a word not in the list but confirmed by the online dictionary is accepted", pg.evaluate("W.guesses.length===2") and pg.calls==['qzxjk','hoxed'], pg.calls)
    ok("wordle: no script errors", not pg.errs, pg.errs); pg.context.close()
    pg=pf(360,api='offline'); go(pg,"wordle"); type_word(pg,'hoxed')
    ok("wordle: offline and not in the list -> not accepted, with a message", pg.evaluate("W.guesses.length===0") and 'offline' in pg.evaluate("document.getElementById('msg').textContent"), pg.evaluate("document.getElementById('msg').textContent")); pg.context.close()
    # Circuit
    pg=pf(360); go(pg,"circuit")
    ok("circuit: 12 words, nothing coloured", pg.evaluate("document.querySelectorAll('.ctile').length")==12 and pg.evaluate("document.querySelectorAll('.ctile.good,.ctile.wrong').length")==0)
    ctr=lambda k: pg.evaluate("(()=>{const r=document.querySelectorAll('.ctile')[%d].getBoundingClientRect();return [r.left+r.width/2,r.top+r.height/2]})()"%k)
    bef=pg.evaluate("CIRC.arr.slice()"); s=ctr(0); t=ctr(4)
    pg.mouse.move(*s); pg.mouse.down(); pg.mouse.move(s[0]+5,s[1]+30,steps=3); pg.mouse.move(*t,steps=8)
    mid=pg.evaluate("[document.querySelectorAll('.ctile.ghost').length,document.querySelectorAll('.ctile.over').length]")
    pg.mouse.up(); pg.wait_for_timeout(120); aft=pg.evaluate("CIRC.arr.slice()")
    ok("circuit: drag and drop swaps two words", mid==[1,1] and aft[0]==bef[4] and aft[4]==bef[0], (mid,bef,aft))
    for k in range(4):
        pg.click("#ccheck"); pg.wait_for_timeout(150)
        if pg.evaluate("CIRC.over"): break
    ok("circuit: four checks, then the game ends", pg.evaluate("CIRC.guesses")==4 and pg.evaluate("CIRC.over") and not pg.errs, pg.errs); pg.context.close()
    b.close()
print("\n%d checks, %d failed"%(len(res),res.count(False))); sys.exit(1 if False in res else 0)
