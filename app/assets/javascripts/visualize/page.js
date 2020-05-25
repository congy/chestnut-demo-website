// Javascript for the page UI.

const xmlns = "http://www.w3.org/2000/svg";
async function get_model() {
  const res = await fetch('/api/cnpy' + window.location.search, { method: 'post' });
  let text = await res.text();
  text = text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1);
  return JSON.parse(text);
}
async function init() {
  const modelPromise = get_model();

  window.svg = document.getElementsByTagName('svg')[0];
  window.ctrl = new VisualizerController(svg);
  
  const model = await modelPromise;
  const { ds, qp, data } = model;
  ctrl.load(data);

  ctrl.draw();
  document.getElementById('json').innerText = JSON.stringify(model, null, 2);
  const qpContexts = handleQueryPlans(model);
  window.qpContexts = qpContexts; // TODO removeme

  const playerEl = document.getElementById('player');
  window.player = new Player(playerEl);

  document.getElementById('clear').onclick = () => {
    window.player.rejectAll();
    window.ctrl.clearPlans();
    return false;
  }

  await ctrl.play(ds);
  
  // // TODO
  // await delay(1000);
  // const i = 0; // TODO
  // await ctrl.playQp(qp[i], qpContexts[i]);
}

function replay() {
  ctrl.draw();
  let _ignoredPromise = ctrl.play();
  return false;
}

function handleQueryPlans({ ds, qp, data: _data }) {
  const buttonsEl = document.getElementById('buttons');
  const plansEl = document.getElementById('plans');
  const qpContexts = [];
  let i = 0;
  for (let i = 0; i < qp.length; i++) {
    const qpInfo = qp[i];
    const qpContext = qpToContext(qpInfo, ds);
    qpContexts.push(qpContext);

    const a = document.createElement('a');
    a.innerText = `Query ${qpInfo.qid}`;
    a.href = '#';
    a.onclick = () => { ctrl.playQp(qp[i], qpContext, window.player.getDelayer(400)); return false; };
    a.style['margin-left'] = '1em';
    buttonsEl.appendChild(a);

    const h1 = document.createElement('h1')
    h1.innerText = `${i} Query ${qpInfo.qid}, Plan ${qpInfo.pid}`;
    plansEl.appendChild(h1);

    let pre = document.createElement('pre');
    pre.className = 'prettyprint lang-py linenums';
    pre.innerText = qpContext.toString();
    plansEl.appendChild(pre);

    pre = document.createElement('pre');
    pre.className = 'prettyprint lang-json linenums bigjson';
    pre.innerText = JSON.stringify(qpInfo, null, 2);
    plansEl.appendChild(pre);
  }
  PR.prettyPrint();

  return qpContexts;
}

const CHAR_PLAY  = '\u25B6';
const CHAR_PAUSE = '\u23F8';
const CHAR_NEXT  = '\u23ED';
class Player {
  constructor(el) {
    this.el;

    // If the player is paused.
    this.paused = true;
    // Promises to be resolved (probably just 1).
    this.resolvers = [];

    const pp = document.createElement('a');
    pp.href = '#';
    pp.onclick = () => {
      this.paused = !this.paused;
      if (this.paused)
        pp.innerText = CHAR_PLAY;
      else {
        pp.innerText = CHAR_PAUSE;
        while (this.resolvers.length)
          this.resolvers.pop().resolve();
      }
      return false;
    };
    pp.innerText = CHAR_PLAY;

    const nx = document.createElement('a');
    nx.href = '#';
    nx.onclick = () => {
      if (this.paused && this.resolvers.length)
        this.resolvers.pop().resolve();
      return false;
    };
    nx.innerText = CHAR_NEXT;

    el.appendChild(pp);
    el.appendChild(nx);
  }
  rejectAll() {
    while (this.resolvers.length)
      this.resolvers.pop().reject('Player rejecting all.');
  }
  getDelayer(d) {
    return (s = 1) => {
      if (!this.paused)
        return delay(s * d);
      return new Promise((resolve, reject) => this.resolvers.unshift({ resolve, reject }));
    };
  }
}
