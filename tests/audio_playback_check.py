"""Decode bundled audio and test actual HTML media playback without Web Speech.

Uses the dedicated Chrome profile and local server described in browser_check.py.
Playback is muted, but HTMLMediaElement.play is real, not mocked.
"""
import argparse
import json
import time

from browser_check import Browser, ORIGIN


def user_click(browser, selector):
    point = browser.js("""(()=>{
      const el=document.querySelector(%s);
      if(!el)throw Error('Missing audio button');
      el.scrollIntoView({block:'center'});
      const r=el.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2};
    })()""" % json.dumps(selector))
    browser.call('Input.dispatchMouseEvent', dict(type='mousePressed', button='left', clickCount=1, **point))
    browser.call('Input.dispatchMouseEvent', dict(type='mouseReleased', button='left', clickCount=1, **point))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--url', default=ORIGIN)
    base = parser.parse_args().url.rstrip('/')
    browser = Browser()
    scripts = []
    try:
        scripts.append(browser.call('Page.addScriptToEvaluateOnNewDocument', {'source': """
          Object.defineProperty(window,'speechSynthesis',{value:undefined,configurable:true});
          Object.defineProperty(window,'SpeechSynthesisUtterance',{value:undefined,configurable:true});
          window.__mediaPlays=[];
          const realPlay=HTMLMediaElement.prototype.play;
          HTMLMediaElement.prototype.play=function(){
            this.muted=true;window.__player=this;window.__mediaPlays.push(this.src);
            return realPlay.call(this);
          };
        """})['identifier'])
        browser.errors.clear()  # Ignore exceptions already present in the previous test document.
        browser.navigate(base + '/?audio-test=' + str(time.time_ns()) + '#/cours/pronoms')
        browser.wait("!!document.querySelector('[data-speak=\"Je\"]')")
        assert browser.js('!window.speechSynthesis&&!window.SpeechSynthesisUtterance')
        user_click(browser, '[data-speak="Je"]')
        browser.wait('window.__player?.currentTime>.05&&window.__player.readyState>=2')
        assert browser.js('window.__player.duration>0&&!window.__player.error')
        assert browser.js("!document.querySelector('#toast.visible')")
        print('Real media playback works without Web Speech', flush=True)

        # Switching speakers reuses one player, and navigation stops it.
        user_click(browser, '[data-speak="Tu"]')
        browser.wait('window.__mediaPlays.length===2&&window.__player.currentTime>.05')
        assert browser.js('window.__mediaPlays[0]!==window.__mediaPlays[1]')
        browser.route('cours')
        assert browser.js("window.__player.paused&&!window.__player.getAttribute('src')")

        # Each asset must decode to a nonempty, nonsilent audio buffer.
        decoded = browser.js("""(async()=>{
          const {recordedAudio}=await import('./js/audio-manifest.js');
          const context=new AudioContext();let count=0;
          try {
            for(const [text,file] of Object.entries(recordedAudio)){
              const response=await fetch('./assets/audio/fr/'+file);
              if(!response.ok)throw Error('Missing recording: '+text);
              const buffer=await context.decodeAudioData(await response.arrayBuffer());
              const samples=buffer.getChannelData(0);
              if(buffer.duration<=0||!samples.some(value=>Math.abs(value)>.001))throw Error('Silent recording: '+text);
              count++;
            }
          } finally {await context.close()}
          return count;
        })()""")
        assert decoded >= 50
        print('Decoded ' + str(decoded) + ' nonsilent recordings', flush=True)

        browser.route('quiz/pronoms')
        browser.click('[data-action="start"]')
        browser.wait("!!document.querySelector('.question-listen')")
        user_click(browser, '.question-listen')
        browser.wait('window.__mediaPlays.length===3&&window.__player.currentTime>.05')
        browser.click('.answer-option')
        assert browser.js('window.__mediaPlays.length===3'), 'Quiz choices must stay silent'

        # Future unrecorded custom texts get a clear message on this browser.
        browser.js("import('./js/ui.js').then(ui=>ui.speak('Texte de test absent des enregistrements.'))")
        browser.wait("document.querySelector('#toast.visible')?.textContent.includes('ce texte')")
        assert browser.js('window.__mediaPlays.length===3')

        # An exposed but failing speech engine must also fall back to media.
        scripts.append(browser.call('Page.addScriptToEvaluateOnNewDocument', {'source': """
          Object.defineProperty(window,'SpeechSynthesisUtterance',{value:class {constructor(text){this.text=text}},configurable:true});
          Object.defineProperty(window,'speechSynthesis',{value:{
            getVoices:()=>[],cancel:()=>{},addEventListener:()=>{},
            speak:utterance=>utterance.onerror({error:'synthesis-unavailable'})
          },configurable:true});
        """})['identifier'])
        browser.navigate(base + '/?audio-error-test=' + str(time.time_ns()) + '#/cours/etre-avoir')
        browser.wait("!!document.querySelector('[data-speak=\"être\"]')")
        user_click(browser, '[data-speak="être"]')
        browser.wait('window.__player?.currentTime>.05&&window.__player.readyState>=2')
        assert not browser.errors, browser.errors
        print(json.dumps({'decoded_recordings': decoded, 'media_without_speech': 'passed', 'navigation_stop': 'passed', 'quiz_choices_silent': 'passed', 'speech_error_fallback': 'passed'}))
    finally:
        for identifier in scripts:
            browser.call('Page.removeScriptToEvaluateOnNewDocument', {'identifier': identifier})
        browser.navigate(base + '/?audio-test-cleanup=' + str(time.time_ns()))
        browser.sock.close()


if __name__ == '__main__':
    main()
