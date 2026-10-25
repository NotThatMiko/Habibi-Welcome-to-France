"""User-flow checks through Chrome DevTools, using only the Python standard library.

Start the app on 127.0.0.1:4173 and a dedicated headless Chrome profile with
--remote-debugging-port=9223 --remote-allow-origins=http://localhost:9223.
Never use a personal browser profile: this check clears test-origin storage.
"""
import base64
import json
import os
from pathlib import Path
import socket
import struct
import time
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
ORIGIN = "http://127.0.0.1:4173"


class Browser:
    def __init__(self):
        with urllib.request.urlopen("http://127.0.0.1:9223/json/list") as response:
            pages = json.load(response)
        page = next(p for p in pages if p["type"] == "page")
        path = page["webSocketDebuggerUrl"].split(":9223", 1)[1]
        self.sock = socket.create_connection(("127.0.0.1", 9223), timeout=15)
        key = base64.b64encode(os.urandom(16)).decode()
        self.sock.sendall((f"GET {path} HTTP/1.1\r\nHost: localhost:9223\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Key: {key}\r\nSec-WebSocket-Version: 13\r\nOrigin: http://localhost:9223\r\n\r\n").encode())
        header = bytearray()
        while not header.endswith(b"\r\n\r\n"):
            header.extend(self.sock.recv(1))
        if not header.startswith(b"HTTP/1.1 101 "):
            raise RuntimeError(header.decode())
        self.serial = 0
        self.errors = []
        self.call("Runtime.enable")
        self.call("Page.enable")
        self.call("Network.enable")
        self.call("Network.setCacheDisabled", {"cacheDisabled": True})
        self.call("Page.addScriptToEvaluateOnNewDocument", {"source": "window.__docId=crypto.randomUUID(); window.__spoken=[]; if(window.speechSynthesis) window.speechSynthesis.speak = u => window.__spoken.push({text:u.text,lang:u.lang,rate:u.rate});"})

    def exact(self, n):
        data = bytearray()
        while len(data) < n:
            part = self.sock.recv(n - len(data))
            if not part:
                raise RuntimeError("Chrome connection closed")
            data.extend(part)
        return bytes(data)

    def receive(self):
        chunks = []
        while True:
            first, second = self.exact(2)
            length = second & 127
            if length == 126:
                length = struct.unpack("!H", self.exact(2))[0]
            elif length == 127:
                length = struct.unpack("!Q", self.exact(8))[0]
            mask = self.exact(4) if second & 128 else None
            payload = self.exact(length)
            if mask:
                payload = bytes(c ^ mask[i % 4] for i, c in enumerate(payload))
            opcode = first & 15
            if opcode == 8:
                raise RuntimeError("Chrome closed the websocket")
            if opcode == 9:
                self.send(payload, 10)
                continue
            chunks.append(payload)
            if first & 128:
                return json.loads(b"".join(chunks))

    def send(self, payload, opcode=1):
        mask = os.urandom(4)
        length = len(payload)
        header = bytes([128 | opcode])
        if length < 126:
            header += bytes([128 | length])
        elif length < 65536:
            header += bytes([128 | 126]) + struct.pack("!H", length)
        else:
            header += bytes([128 | 127]) + struct.pack("!Q", length)
        self.sock.sendall(header + mask + bytes(c ^ mask[i % 4] for i, c in enumerate(payload)))

    def call(self, method, params=None):
        self.serial += 1
        self.send(json.dumps({"id": self.serial, "method": method, "params": params or {}}).encode())
        while True:
            message = self.receive()
            if message.get("method") == "Runtime.exceptionThrown":
                self.errors.append(message["params"]["exceptionDetails"].get("exception", {}).get("description", message["params"]["exceptionDetails"]["text"]))
            if message.get("id") == self.serial:
                if "error" in message:
                    raise RuntimeError(message["error"])
                return message.get("result", {})

    def js(self, expression):
        data = self.call("Runtime.evaluate", {"expression": expression, "awaitPromise": True, "returnByValue": True})
        if "exceptionDetails" in data:
            raise AssertionError(data["exceptionDetails"])
        return data.get("result", {}).get("value")

    def wait(self, expression, timeout=8):
        until = time.monotonic() + timeout
        while time.monotonic() < until:
            if self.js(expression):
                return
            time.sleep(.06)
        raise AssertionError("Timed out: " + expression)

    def route(self, route):
        self.js("location.hash=" + json.dumps("#/" + route))
        self.wait("!!document.querySelector('#main') && !document.querySelector('.loading')")
        time.sleep(.1)

    def navigate(self, url):
        old = self.js('window.__docId')
        self.call('Page.navigate', {'url': url})
        self.wait('!!window.__docId && window.__docId !== ' + json.dumps(old))

    def reload(self):
        old = self.js('window.__docId')
        self.call('Page.reload', {'ignoreCache': True})
        self.wait('!!window.__docId && window.__docId !== ' + json.dumps(old))

    def click(self, selector):
        assert self.js(f"!!document.querySelector({json.dumps(selector)})"), selector
        self.js(f"document.querySelector({json.dumps(selector)}).click()")

    def screenshot(self, filename, width, height):
        self.call("Emulation.setDeviceMetricsOverride", {"width": width, "height": height, "deviceScaleFactor": 1, "mobile": width < 761})
        self.js("window.scrollTo(0,0)")
        self.js("document.fonts.ready")
        data = self.call("Page.captureScreenshot", {"format": "png", "captureBeyondViewport": False})
        folder = ROOT / "artifacts"
        folder.mkdir(exist_ok=True)
        (folder / filename).write_bytes(base64.b64decode(data["data"]))


def check_progress_reset(browser):
    browser.route('progression')
    before = browser.js("(async()=>structuredClone((await import('./js/store.js')).getState()))()")
    backup = browser.js("(async()=>(await import('./js/store.js')).exportProgress())()")
    assert before['events'] and before['drafts'], 'Reset check needs existing progress and a created lesson'

    browser.click('[data-action="reset-progress"]')
    assert browser.js("document.querySelector('#modal').open && document.querySelector('#confirm-progress-reset').disabled")
    for wrong in ['', '7bib', '7BIBI', '7bibi ', 'autre']:
        browser.js("(() => {const input=document.querySelector('#reset-progress-confirmation');input.value=" + json.dumps(wrong) + ";input.dispatchEvent(new Event('input'));})()")
        assert browser.js("document.querySelector('#confirm-progress-reset').disabled")
        browser.js("document.querySelector('#reset-progress-form').dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}))")
        assert browser.js("JSON.parse(localStorage.getItem('habibi:v1'))") == before
    browser.click('#cancel-progress-reset')
    assert not browser.js("document.querySelector('#modal').open")
    assert browser.js("JSON.parse(localStorage.getItem('habibi:v1'))") == before

    browser.click('[data-action="reset-progress"]')
    for event in ['keyDown', 'keyUp']:
        browser.call('Input.dispatchKeyEvent', {'type': event, 'key': 'Escape', 'code': 'Escape', 'windowsVirtualKeyCode': 27})
    browser.wait("!document.querySelector('#modal').open")
    assert browser.js("JSON.parse(localStorage.getItem('habibi:v1'))") == before

    browser.click('[data-action="reset-progress"]')
    browser.js("(() => {const input=document.querySelector('#reset-progress-confirmation');input.value='7bibi';input.dispatchEvent(new Event('input'));})()")
    assert not browser.js("document.querySelector('#confirm-progress-reset').disabled")
    browser.js("""(() => {
      window.__resetSetItem = Storage.prototype.setItem;
      Storage.prototype.setItem = function(key,value) {
        if(key==='habibi:v1') throw new DOMException('Test storage unavailable','QuotaExceededError');
        return window.__resetSetItem.call(this,key,value);
      };
    })()""")
    try:
        browser.click('#confirm-progress-reset')
        assert browser.js("document.querySelector('#modal').open && !document.querySelector('#reset-progress-error').hidden")
        assert browser.js("(async()=>structuredClone((await import('./js/store.js')).getState()))()") == before
        assert browser.js("JSON.parse(localStorage.getItem('habibi:v1'))") == before
    finally:
        browser.js("Storage.prototype.setItem=window.__resetSetItem;delete window.__resetSetItem")

    browser.click('#confirm-progress-reset')
    browser.wait("!document.querySelector('#modal').open")
    after = browser.js("JSON.parse(localStorage.getItem('habibi:v1'))")
    assert after['events'] == []
    assert {key: value for key, value in after.items() if key != 'events'} == {key: value for key, value in before.items() if key != 'events'}
    assert browser.js("[...document.querySelectorAll('.stat-card > strong')].map(e=>e.textContent)") == ['0', '0', '—']
    assert browser.js("(async()=>(await import('./js/store.js')).exportProgress().events.length)()") == 0
    browser.reload()
    browser.wait("!!document.querySelector('.stats-grid')")
    assert browser.js("JSON.parse(localStorage.getItem('habibi:v1'))") == after

    browser.js("""(() => {
      const file=new File([JSON.stringify(""" + json.dumps(backup, ensure_ascii=False) + """)],'progression.json',{type:'application/json'});
      const transfer=new DataTransfer();transfer.items.add(file);
      const input=document.querySelector('#import-progress');input.files=transfer.files;input.dispatchEvent(new Event('change'));
    })()""")
    browser.wait("JSON.parse(localStorage.getItem('habibi:v1')).events.length===" + str(len(before['events'])))
    restored = browser.js("JSON.parse(localStorage.getItem('habibi:v1'))")
    assert sorted(restored['events'], key=lambda event: event['id']) == sorted(before['events'], key=lambda event: event['id'])
    assert restored['drafts'] == before['drafts']


def check_learning_questions(browser):
    data = browser.js("""(async()=>{
      const {makeBaseQuestions,conjugations,validateLesson}=await import('./js/content.js');
      const {getState,preference}=await import('./js/store.js');
      preference('autoAudio',true);
      const questions=makeBaseQuestions();
      const forms=questions['etre-avoir'].quiz.filter(q=>q.prompt.startsWith('Quelle est la forme'));
      const verbOnly=questions['etre-avoir'].quiz.filter(q=>q.prompt.startsWith('Complète'));
      const sameSubjects=forms.every(q=>{
        const subject=q.prompt.match(/avec « (.+) »/)[1];
        return q.options.length===4&&q.options.every(o=>o.text.startsWith(subject+' '))&&q.correct===conjugations.find(row=>row.subject===subject).etre.fr;
      });
      const noAnswerPronouns=verbOnly.every(q=>q.prompt.includes('…')&&q.options.length===4&&q.options.every(o=>['ai','as','a','avons','avez','ont'].includes(o.text)));
      const hints=questions.pronoms.exercises.every(q=>q.hint?.ar&&q.hint?.darija&&!/Choisis|Utilise/.test(q.prompt));
      const sibling=questions.pronoms.exercises.find(q=>q.correct==='Elle');
      const draft=getState().drafts[0];
      let badHintRejected=false;
      try {validateLesson({...draft,exercises:[{...draft.exercises[0],hint:{fr:'Indice',ar:'',darija:'Indice'}}]})} catch {badHintRejected=true}
      return {formCount:forms.length,completionCount:verbOnly.length,sameSubjects,noAnswerPronouns,hints,sibling:sibling.hint.darija,badHintRejected};
    })()""")
    assert data == {'formCount': 9, 'completionCount': 9, 'sameSubjects': True, 'noAnswerPronouns': True, 'hints': True, 'sibling': 'Hiya 3ndha khou.', 'badHintRejected': True}, data

    browser.route('quiz/pronoms')
    browser.click('[data-action="start"]')
    browser.js('window.__spoken=[]')
    for _ in range(9):
        q = browser.js("(async()=>(await import('./js/content.js')).makeBaseQuestions().pronoms.quiz.find(q=>q.prompt===document.querySelector('.question-text').textContent))()")
        assert browser.js("document.querySelectorAll('.question-panel-header .question-listen').length===1&&!document.querySelector('.question-audio,.question-panel .audio-button,.answer-option .option-volume,.answer-option [data-speak]')")
        spoken = browser.js('window.__spoken.length')
        for index in range(len(q['options'])):
            browser.click('[data-answer="' + str(index) + '"]')
        assert browser.js('window.__spoken.length') == spoken, 'Selecting Darija answers must stay silent'
        browser.click('.question-panel-header .question-listen')
        assert browser.js('window.__spoken.at(-1).text') == q['audio']
        assert browser.js('window.__spoken.at(-1).lang') == 'fr-FR'
        browser.js("[...document.querySelectorAll('[data-answer]')].find(b=>b.children[1].textContent===" + json.dumps(q['correct'], ensure_ascii=False) + ").click()")
        assert browser.js('window.__spoken.length') == spoken + 1
        browser.click('[data-action="check"]')
        browser.click('.answer-feedback-heading .question-listen')
        assert browser.js('window.__spoken.at(-1).text') == q['audio']
        assert browser.js('window.__spoken.at(-1).lang') == 'fr-FR'
        browser.click('[data-action="next"]')
    assert browser.js("document.querySelector('.score-ring>span').textContent.replace(/\\s/g,'')") == '9/9'

    browser.route('quiz/etre-avoir')
    browser.click('[data-action="start"]')
    spoken = browser.js('window.__spoken.length')
    browser.click('[data-answer="0"]')
    assert browser.js('window.__spoken.length') == spoken

    browser.route('exercices/pronoms')
    browser.click('[data-action="start"]')
    for _ in range(9):
        q = browser.js("(async()=>(await import('./js/content.js')).makeBaseQuestions().pronoms.exercises.find(q=>q.prompt===document.querySelector('.question-text').textContent))()")
        assert q and q['hint'], q
        for language in ['ar', 'darija']:
            browser.js("document.querySelector('#language').value=" + json.dumps(language) + ";document.querySelector('#language').dispatchEvent(new Event('change'))")
            hint = browser.js("(() => {const hint=document.querySelector('.question-hint');return {text:hint.textContent,dir:hint.dir,lang:hint.lang}})()")
            assert hint == {'text': q['hint'][language], 'dir': 'rtl' if language == 'ar' else 'ltr', 'lang': 'ar' if language == 'ar' else 'ary-Latn'}, hint
        browser.js("[...document.querySelectorAll('[data-answer]')].find(b=>b.children[1].textContent===" + json.dumps(q['correct'], ensure_ascii=False) + ").click()")
        assert browser.js('window.__spoken.at(-1).text') == q['sentence']
        assert browser.js('window.__spoken.at(-1).lang') == 'fr-FR'
        browser.click('[data-action="check"]')
        browser.click('[data-action="next"]')
    assert browser.js("document.querySelector('.score-ring>span').textContent.replace(/\\s/g,'')") == '9/9'


def main():
    browser = Browser()
    browser.navigate(ORIGIN + '/?qa=' + str(time.time_ns()))
    browser.wait("!!document.querySelector('.theme-card')")
    browser.js("localStorage.clear()")
    browser.reload()
    browser.wait("document.querySelectorAll('.theme-card').length === 2")
    assert browser.js("document.querySelector('.translation').lang") == "ar"
    browser.screenshot("desktop.png", 1440, 1100)
    browser.screenshot("mobile.png", 390, 844)
    checks = []

    for width, height in [(320, 700), (390, 844), (760, 1024), (1024, 768), (1440, 1100)]:
        browser.call("Emulation.setDeviceMetricsOverride", {"width": width, "height": height, "deviceScaleFactor": 1, "mobile": width < 761})
        for route in ["cours", "cours/pronoms", "cours/etre-avoir", "quiz", "exercices", "progression", "atelier"]:
            browser.route(route)
            overflow = browser.js("document.documentElement.scrollWidth > innerWidth + 1")
            assert not overflow, f"Horizontal overflow at {width}px on {route}"
        checks.append(f"Responsive routes at {width}px")

    browser.route("cours/pronoms")
    assert browser.js("document.querySelectorAll('.word-card').length") == 9
    browser.click('[data-action="mark-read"]')
    assert browser.js("document.querySelector('[data-action=\"mark-read\"]').disabled")
    browser.js("document.querySelector('#language').value='darija'; document.querySelector('#language').dispatchEvent(new Event('change'))")
    assert browser.js("document.querySelector('.word-top .translation').textContent") == "ana"
    browser.click('[data-speak="Je"]')
    assert browser.js("window.__spoken.at(-1).lang") == "fr-FR"
    assert browser.js("window.__spoken.at(-1).text") == "Je"
    checks.append("9 pronouns, course read state, Arabic/Darija switch, French speech dispatch")

    browser.route("quiz/pronoms")
    browser.click('[data-action="start"]')
    assert browser.js("document.querySelector('[data-action=\"check\"]').disabled")
    # Deliberately submit one wrong response, then finish with correct responses.
    for n in range(9):
        assert browser.js("!!document.querySelector('.question-text')")
        browser.js("""(async()=>{
          const {makeBaseQuestions}=await import('./js/content.js');
          const q=makeBaseQuestions().pronoms.quiz.find(q=>q.prompt===document.querySelector('.question-text').textContent);
          const buttons=[...document.querySelectorAll('[data-answer]')];
          const wrong=""" + str(n == 0).lower() + """;
          buttons.find(b=>(b.children[1].textContent===q.correct)!==wrong).click();
        })()""")
        browser.click('[data-action="check"]')
        assert browser.js("!!document.querySelector('.answer-feedback .translation')")
        browser.click('[data-action="next"]')
    assert browser.js("!!document.querySelector('.result-panel')")
    assert browser.js("document.querySelector('.score-ring>span').textContent.replace(/\\s/g,'')") == "8/9"
    browser.click('[data-action="retry-result"]')
    assert browser.js("document.querySelector('.session-progress-label').textContent.includes('1 sur 1')")
    browser.click('[data-action="quit"]')
    assert browser.js("document.querySelector('#modal').open")
    browser.click('#leave-session')
    checks.append("Quiz completion 8/9, bilingual feedback, revision of exactly one mistake, pause dialog")

    browser.route("exercices/etre-avoir")
    browser.click('[data-action="start"]')
    browser.click('[data-answer="0"]')
    assert browser.js("document.querySelector('.blank').textContent !== '…'")
    browser.click('[data-action="check"]')
    assert browser.js("!!document.querySelector('.answer-feedback')")
    browser.route('progression')
    browser.js("window.__backup = JSON.parse(localStorage.getItem('habibi:v1'))")
    result = browser.js("""(async()=>{
      const store=await import('./js/store.js');
      const file=store.exportProgress();
      const before=store.getState().events.length;
      const duplicate=store.importProgress(file);
      const newEvent={id:'import-test-read',kind:'read',topic:'etre-avoir',at:new Date().toISOString()};
      const added=store.importProgress({...file,events:[...file.events,newEvent]});
      const again=store.importProgress({...file,events:[...file.events,newEvent]});
      let rejected=false;try{store.importProgress({version:1,type:'habibi-progress',events:[{id:'bad'}]})}catch{rejected=true}
      return {duplicate,added,again,rejected,read:store.isRead('pronoms'),count:store.getState().events.length-before};
    })()""")
    assert result == {"duplicate": 0, "added": 1, "again": 0, "rejected": True, "read": True, "count": 1}, result
    browser.reload()
    browser.wait("!!document.querySelector('.stats-grid')")
    assert browser.js("JSON.parse(localStorage.getItem('habibi:v1')).language") == 'darija'
    checks.append("Fill-in exercises, saved progress after reload, idempotent merge, invalid-file rejection")

    browser.route('atelier')
    browser.js("""(()=>{
      const values={'title.fr':'Les salutations','title.ar':'التحيات','title.darija':'Tta7iyat','description.fr':'Dire bonjour.','description.ar':'إلقاء التحية.','description.darija':'Ngolo salam.','intro.fr':'Bonjour et bonsoir.','intro.ar':'مرحبًا ومساء الخير.','intro.darija':'Salam w msa lkhir.'};
      for(const [path,value] of Object.entries(values)){const el=document.querySelector(`[data-model="${path}"]`);el.value=value;el.dispatchEvent(new Event('input'));}
    })()""")
    browser.click('[data-add="cards"]')
    browser.click('[data-add="quiz"]')
    browser.click('[data-add="exercises"]')
    browser.js("""(()=>{
      const values={'cards.0.fr':'Bonjour','cards.0.ar':'مرحبًا','cards.0.darija':'Salam','quiz.0.prompt':'Comment dire bonjour ?','quiz.0.correct':'Bonjour','quiz.0.distractors.0':'Au revoir','quiz.0.explanation.fr':'Bonjour est une salutation.','quiz.0.explanation.ar':'مرحبًا هي تحية.','quiz.0.explanation.darija':'Bonjour hiya salam.','exercises.0.prompt':'… ! Comment vas-tu ?','exercises.0.correct':'Bonjour','exercises.0.distractors.0':'Bonne nuit','exercises.0.explanation.fr':'On dit bonjour.','exercises.0.explanation.ar':'نقول مرحبًا.','exercises.0.explanation.darija':'Kangolo salam.'};
      for(const [path,value] of Object.entries(values)){const el=document.querySelector(`[data-model="${path}"]`);el.value=value;el.dispatchEvent(new Event('input'));}
      document.querySelector('#lesson-form').requestSubmit();
    })()""")
    assert browser.js("!!document.querySelector('.save-success')"), browser.js("document.querySelector('#editor-status').textContent")
    assert not browser.js("document.querySelector('#export-lessons').disabled")
    draft = browser.js("JSON.parse(localStorage.getItem('habibi:v1')).drafts[0]")
    assert draft['title']['fr'] == 'Les salutations'
    assert len(draft['quiz']) == 1 and len(draft['exercises']) == 1
    browser.route('cours/' + draft['id'])
    assert browser.js("document.querySelector('.word-top .primary').textContent") == 'Bonjour'
    browser.route('quiz/' + draft['id'])
    browser.click('[data-action="start"]')
    assert browser.js("document.querySelector('.question-text').textContent") == 'Comment dire bonjour ?'
    browser.route('atelier')
    browser.click('[data-edit="' + draft['id'] + '"]')
    assert browser.js("document.querySelector('[data-model=\"title.fr\"]').value") == 'Les salutations'
    checks.append("Form creates a translated lesson with a word, quiz and exercise; saved lesson works in courses and quiz; editing round-trip")

    data = browser.js("""(async()=>{
      const {makeBaseQuestions,validateLesson}=await import('./js/content.js');
      const qs=makeBaseQuestions();let total=0;
      for(const topic of Object.values(qs))for(const questions of Object.values(topic))for(const q of questions){
        if(q.options.filter(o=>o.text===q.correct).length!==1)throw Error(q.id);
        if(new Set(q.options.map(o=>o.text)).size!==q.options.length)throw Error('duplicate '+q.id);
        if(!q.explanation.ar||!q.explanation.darija)throw Error('translation '+q.id);total++;
      }
      const draft=JSON.parse(localStorage.getItem('habibi:v1')).drafts[0];validateLesson(draft);
      let invalid=false;try{validateLesson({...draft,quiz:[{...draft.quiz[0],options:[{text:'Bonjour'},{text:'Bonjour'}]}]})}catch{invalid=true}
      return {total,invalid};
    })()""")
    assert data == {'total': 48, 'invalid': True}, data
    checks.append("48 initial questions have distinct options and bilingual corrections; malformed custom questions are rejected")

    check_learning_questions(browser)
    checks.append("Darija answers stay silent; compact French listening works in questions and corrections; verb distractors keep the question's subject; pronoun exercises show Arabic/Darija hints and accept the French pronoun")

    check_progress_reset(browser)
    checks.append("Progress reset requires exact 7bibi confirmation; cancel/Escape preserve data; storage failure rolls back; successful reset survives reload, preserves lessons/preferences and accepts a previous backup")

    browser.js("localStorage.clear()")
    browser.navigate(ORIGIN + '/?qa=' + str(time.time_ns()) + '#/cours')
    browser.wait("document.querySelectorAll('.theme-card').length===2")
    browser.screenshot('desktop.png', 1440, 1100)
    browser.screenshot('mobile.png', 390, 844)
    assert not browser.errors, browser.errors
    print(json.dumps({'status': 'PASS', 'checks': checks, 'runtime_errors': browser.errors, 'screenshots': ['artifacts/desktop.png', 'artifacts/mobile.png']}, ensure_ascii=False, indent=2))
    browser.sock.close()


if __name__ == '__main__':
    main()
