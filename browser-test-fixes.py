"""Real-browser checks for the Word freeze fix and the Pyramid highlights. Run: python3 browser-test-fixes.py (needs Playwright)."""
import functools, http.server, os, socketserver, threading, sys, time
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
    def pf(mode):
        c=b.new_context(viewport={"width":360,"height":700},device_scale_factor=2,has_touch=True,is_mobile=True); pg=c.new_page(); pg.errs=[]; pg.on("pageerror",lambda e:pg.errs.append(str(e))); pg.route("**/sw.js",lambda r:r.abort())
        def h(r):
            if mode=='hang': return          # never answers
            if mode=='404': return r.fulfill(status=404,content_type='application/json',headers={'access-control-allow-origin':'*'},body='{}')
            if mode=='500': return r.fulfill(status=500,content_type='text/plain',headers={'access-control-allow-origin':'*'},body='boom')
            if mode=='block': return r.abort()
            r.fulfill(status=200,content_type='application/json',headers={'access-control-allow-origin':'*'},body='[]')
        pg.route("**/api.dictionaryapi.dev/**",h); return pg
    def typ(pg,w,wait=400):
        for ch in w: pg.keyboard.press(ch)
        pg.keyboard.press('Enter'); pg.wait_for_timeout(wait)
    msg=lambda pg: pg.evaluate("document.getElementById('msg').textContent")
    for mode,expect in (('404','Not a real word'),('500','could not check'),('block','could not check'),('hang','could not check')):
        pg=pf(mode); pg.goto(URL+"#wordle"); pg.wait_for_timeout(300)
        t0=time.time(); typ(pg,'qzxjk',wait=400 if mode!='hang' else 4600)
        ok("%s: a made-up word gets a clear message (%s)"%(mode,msg(pg)[:40]), expect in msg(pg), msg(pg))
        for _ in range(5): pg.keyboard.press('Backspace')
        ok("%s: the row can be cleared afterwards"%mode, pg.evaluate("W.cur===''"), pg.evaluate("W.cur"))
        typ(pg,'crane'); ok("%s: the game still works: a real word is accepted next"%mode, pg.evaluate("W.guesses.length===1"), pg.evaluate("[W.guesses,W.cur]"))
        typ(pg,'trees'); ok("%s: and another one"%mode, pg.evaluate("W.guesses.length===2") and not pg.errs, pg.errs); pg.context.close()
    # typing while a check is waiting must not be swallowed
    pg=pf('hang'); pg.goto(URL+"#wordle"); pg.wait_for_timeout(300)
    for ch in 'qzxjk': pg.keyboard.press(ch)
    pg.keyboard.press('Enter'); pg.wait_for_timeout(300)
    for _ in range(5): pg.keyboard.press('Backspace')
    for ch in 'crane': pg.keyboard.press(ch)
    pg.keyboard.press('Enter'); pg.wait_for_timeout(500)
    ok("hang: you can edit the row and submit a real word while the old check is still waiting", pg.evaluate("W.guesses.length===1 && W.guesses[0]==='crane'"), pg.evaluate("[W.guesses,W.cur]")); pg.context.close()
    # Pyramid highlights and refusal
    pg=pf('404'); pg.goto(URL+"#pyra"); pg.wait_for_timeout(300)
    pos=lambda i: pg.evaluate("(()=>{const r=document.querySelector('#pyraSvg .n[data-i=\"%d\"] rect').getBoundingClientRect();return [r.left+r.width/2,r.top+r.height/2]})()"%i)
    pg.evaluate("P.arr=pyraP.nodes.slice();P.marks=[P.arr[0]+'|'+P.arr[1],P.arr[1]+'|'+P.arr[3]];store.set('pyra',P);renderPyra()")
    before=pg.evaluate("P.arr.slice()"); s=pos(0); t=pos(9)
    pg.mouse.move(*s); pg.mouse.down(); pg.mouse.move(s[0]+4,s[1]+30,steps=3)
    cls=pg.evaluate("[...document.querySelectorAll('#pyraSvg .n')].map(n=>n.classList.contains('yes')?'Y':n.classList.contains('no')?'N':'-').join('')")
    hint=pg.evaluate("document.getElementById('pyraHint').textContent")
    ok("pyramid: picking up a 3-layer locked group lights up only the other second-layer spot, and dims everything lower", cls=='--Y-NNNNNNNNNNN', cls)
    ok("pyramid: a hint explains the locked group", '3 words across 3 layers' in hint, hint)
    pg.mouse.move(*t,steps=6); pg.mouse.up(); pg.wait_for_timeout(200)
    ok("pyramid: dropping it lower down is refused, words snap back, message stays", pg.evaluate("P.arr.slice()")==before and 'does not fit' in msg(pg), msg(pg))
    ok("pyramid: lights are cleared after the drop", pg.evaluate("document.querySelectorAll('#pyraSvg .n.yes,#pyraSvg .n.no').length")==0)
    s=pos(0); t=pos(2); pg.mouse.move(*s); pg.mouse.down(); pg.mouse.move(*t,steps=8); pg.mouse.up(); pg.wait_for_timeout(200)
    r=pg.evaluate("(()=>{const es=new Set(Core.EDGES.map(([a,b])=>P.arr[a]+'|'+P.arr[b]));const n=pyraP.nodes;return [P.arr.indexOf(n[0]),es.has(n[0]+'|'+n[1]),es.has(n[1]+'|'+n[3])]})()")
    ok("pyramid: dropping it one layer down (where it fits) works and keeps its links", r==[2,True,True], r)
    ok("pyramid: tap-select also lights up the spots", (lambda: (pg.mouse.click(*pos(2)), pg.wait_for_timeout(150), pg.evaluate("document.querySelectorAll('#pyraSvg .n.yes').length")>0)[2])())
    ok("pyramid: no script errors", not pg.errs, pg.errs); pg.context.close()
    b.close()
print("\n%d checks, %d failed"%(len(res),res.count(False))); sys.exit(1 if False in res else 0)
