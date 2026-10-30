/* One shared HTMLAudioElement keeps playback exclusive and comparisons aligned. */
(() => {
  'use strict';
  const $ = (selector) => document.querySelector(selector);
  const audio = $('#shared-audio');
  const state = { cases: [], facts: null, caseIndex: 0, targetIndex: 0, track: null, position: 0, playing: false, request: 0, n: 3 };
  const playbackLabels = { mixture: 'Input mixture', reference: 'Target reference', early: 'Early fusion', late: 'Late fusion' };
  const icons = {
    play: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 2.3 13 8l-9 5.7Z"/></svg>',
    pause: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 2h3v12H3zm7 0h3v12h-3z"/></svg>'
  };
  const escape = (text) => String(text ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmtTime = t => `${Math.floor(Math.max(0, t || 0) / 60)}:${String(Math.floor(Math.max(0, t || 0) % 60)).padStart(2, '0')}`;
  const currentCase = () => state.cases[state.caseIndex];
  const currentTarget = () => currentCase()?.targets[state.targetIndex];
  const number = value => typeof value === 'number' && Number.isFinite(value);
  const metric = kind => { const x = currentTarget()?.metrics?.[kind]; return number(x) ? x : (number(x?.si_sdr) ? x.si_sdr : x?.si_sdr_db); };
  const angle = x => number(x) ? `${Number(x.toFixed(1))}°` : '—';
  const trackData = kind => kind === 'mixture' ? currentCase()?.mixture : currentTarget()?.tracks?.[kind];
  const categoryLabels = { standard: 'Correct DOA', doa: 'DOA offset', unseen: 'Unseen readers' };

  function renderArrayGeometry() {
    const host = $('#array-geometry');
    if (!host) return;
    const c = currentCase(), selected = currentTarget();
    const cx = 150, cy = 122, colors = ['#24557a', '#a66729'];
    const point = (degrees, radius) => {
      const radians = degrees * Math.PI / 180;
      return [cx + radius * Math.cos(radians), cy - radius * Math.sin(radians)];
    };
    const coord = value => value.toFixed(2);
    const ticks = Array.from({length:24}, (_, i) => {
      const a = point(i * 15, 81), b = point(i * 15, i % 6 === 0 ? 89 : 85);
      return `<line x1="${coord(a[0])}" y1="${coord(a[1])}" x2="${coord(b[0])}" y2="${coord(b[1])}" stroke="#a6afb5"/>`;
    }).join('');
    const rays = c.targets.map((t, i) => {
      const p = point(t.doaDeg, 81), active = i === state.targetIndex;
      return `<g><line x1="${cx}" y1="${cy}" x2="${coord(p[0])}" y2="${coord(p[1])}" stroke="${colors[i]}" stroke-width="${active ? 2.2 : 1.25}"/><circle cx="${coord(p[0])}" cy="${coord(p[1])}" r="9" fill="#fff" stroke="${colors[i]}" stroke-width="${active ? 2 : 1.25}"/><text x="${coord(p[0])}" y="${coord(p[1]+3.5)}" text-anchor="middle" fill="${colors[i]}" font-size="10" font-weight="600">${i+1}</text></g>`;
    }).join('');
    const microphones = Array.from({length:6}, (_,i) => {
      const p = point(i*60,23);
      return `<circle cx="${coord(p[0])}" cy="${coord(p[1])}" r="3" fill="#fff" stroke="#4c5961" stroke-width="1.3"/>`;
    }).join('');
    const delta = ((c.targets[1].doaDeg-c.targets[0].doaDeg+540)%360)-180;
    const arcStart = point(c.targets[0].doaDeg,55), arcEnd = point(c.targets[1].doaDeg,55);
    const arc = `<path d="M${coord(arcStart[0])},${coord(arcStart[1])} A55,55 0 0,${delta>=0?0:1} ${coord(arcEnd[0])},${coord(arcEnd[1])}" fill="none" stroke="#9ca5ac" stroke-dasharray="2 3"/>`;
    const requested = selected.requestedDoaDeg ?? selected.doaDeg;
    const offset = Math.abs(((requested-selected.doaDeg+540)%360)-180);
    const p = point(requested,98);
    const steering = offset > .01 ? `<line x1="${cx}" y1="${cy}" x2="${coord(p[0])}" y2="${coord(p[1])}" stroke="${colors[state.targetIndex]}" stroke-width="1.5" stroke-dasharray="5 3"/><path d="M${coord(p[0]-3)},${coord(p[1]-3)}l6,6m0,-6l-6,6" stroke="${colors[state.targetIndex]}"/>` : '';
    host.innerHTML = `<svg viewBox="0 0 320 280" role="img" aria-labelledby="array-diagram-title array-diagram-desc" style="font-family:Arial,sans-serif"><title id="array-diagram-title">Source azimuths for ${escape(c.title)}</title><desc id="array-diagram-desc">Six microphones on a circular array. Target 1: ${angle(c.targets[0].doaDeg)}. Target 2: ${angle(c.targets[1].doaDeg)}. Selected ${escape(selected.label)}; supplied direction ${angle(requested)}. Schematic directions, not a beam pattern.</desc><text x="150" y="16" text-anchor="middle" font-size="12" fill="#40515b">Source separation Δθ = ${angle(c.separationDeg)}</text><g fill="none" stroke="#dce1e5" stroke-width="1"><circle cx="150" cy="122" r="84"/><path d="M50 122H250M150 24V220"/></g>${ticks}<g fill="#64717b" font-size="10"><text x="256" y="126">0°</text><text x="150" y="32" text-anchor="middle">90°</text><text x="40" y="126" text-anchor="end">180°</text><text x="150" y="231" text-anchor="middle">270°</text></g>${arc}${rays}${steering}<circle cx="150" cy="122" r="23" fill="#fff" stroke="#b3bcc2"/>${microphones}<text x="150" y="125.5" text-anchor="middle" fill="#58636a" font-size="9">6 ch.</text><g font-size="11"><circle cx="27" cy="249" r="3" fill="${colors[0]}"/><text x="36" y="253" fill="#36464f">Target 1: ${angle(c.targets[0].doaDeg)}</text><circle cx="166" cy="249" r="3" fill="${colors[1]}"/><text x="175" y="253" fill="#36464f">Target 2: ${angle(c.targets[1].doaDeg)}</text><text x="150" y="273" text-anchor="middle" fill="${colors[state.targetIndex]}">${escape(selected.label)} steering: ${angle(requested)}${offset>.01?' · dashed line':''}</text></g></svg>`;
  }

  function waveform(peaks, id) {
    if (!Array.isArray(peaks) || !peaks.length) return '<svg viewBox="0 0 600 34" preserveAspectRatio="none" aria-hidden="true"><path d="M0 17H600" stroke="#4b6571"/></svg>';
    const max = Math.max(...peaks.map(v => Array.isArray(v) ? Math.max(...v.map(Math.abs)) : Math.abs(Number(v))), 1e-9);
    const pitch = 600 / peaks.length;
    const bars = peaks.map((v, i) => {
      const amplitude = Array.isArray(v) ? Math.max(...v.map(Math.abs)) : Math.abs(Number(v));
      const height = Math.max(1.2, Math.min(31, amplitude / max * 31));
      return `<rect x="${(i * pitch).toFixed(2)}" y="${((34-height)/2).toFixed(2)}" width="${Math.max(1,pitch*.52).toFixed(2)}" height="${height.toFixed(2)}" rx=".7"/>`;
    }).join('');
    return `<svg viewBox="0 0 600 34" preserveAspectRatio="none" aria-hidden="true"><defs><clipPath id="${id}"><rect class="progress-clip" x="0" y="0" width="0" height="34"/></clipPath></defs><g class="wave-base">${bars}</g><g class="wave-progress" clip-path="url(#${id})">${bars}</g></svg>`;
  }

  function renderCases() {
    $('#case-count').textContent = String(state.cases.length).padStart(2, '0');
    $('#case-list').innerHTML = state.cases.map((c, index) => `<button type="button" class="case-choice" data-case="${index}" role="tab" aria-controls="workbench" aria-selected="${index===state.caseIndex}" tabindex="${index===state.caseIndex?0:-1}"><span class="case-index">${String(index+1).padStart(2,'0')}</span><span><strong>${escape(c.title)}</strong><small>${escape(c.separationDeg)}° separation · ${escape(c.snrDb)} dB array SNR</small><span class="case-type">${escape(categoryLabels[c.category] || c.kicker || 'Selected example')}</span></span></button>`).join('');
  }

  function renderExample() {
    const c = currentCase(); const target = currentTarget();
    $('#workbench').setAttribute('aria-busy', 'false');
    $('#case-kicker').textContent = c.kicker || categoryLabels[c.category] || 'SELECTED EXAMPLE';
    $('#case-title').textContent = c.title;
    $('#case-description').textContent = c.description || 'Compare matched Early and Late fusion on the same mixture and requested target.';
    $('#scene-meta').innerHTML = `<span><strong>${escape(c.snrDb)} dB</strong> array SNR</span><span><strong>${escape(c.separationDeg)}°</strong> separation</span><span><strong>${escape(c.duration || 31)} s</strong> full recording</span>${c.offsetKind && c.offsetKind !== 'zero' ? `<span><strong>${escape(Math.abs(c.offsetDeg || 0))}°</strong> ${escape(c.offsetKind)} interferer</span>` : '<span>True target DOA</span>'}`;
    $('#target-tabs').innerHTML = c.targets.map((t,index) => `<button type="button" class="target-button" data-target="${index}" role="tab" aria-label="${escape(t.label || `Target ${index+1}`)} at ${angle(t.doaDeg)}" aria-controls="tracks" aria-selected="${index===state.targetIndex}" tabindex="${index===state.targetIndex?0:-1}">${escape(t.label || `Target ${index+1}`)}<span class="target-direction">${angle(t.doaDeg)}</span></button>`).join('');
    $('#tracks').innerHTML = ['mixture','reference','early','late'].map((kind,index) => {
      const track = trackData(kind); const score = metric(kind);
      const scoreText = (kind==='early' || kind==='late') && number(score) ? `<span class="track-metric">${score.toFixed(2)}<small>dB SI-SDR</small></span>` : '';
      return `<div class="audio-track ${state.track===kind?'active':''}" data-kind="${kind}"><button type="button" class="play-button" data-play="${kind}" aria-label="Play ${playbackLabels[kind]} for ${escape(target.label || 'selected target')}" ${track?.src?'':'disabled'}>${icons.play}</button><div class="track-label"><strong>${playbackLabels[kind]}</strong>${kind==='late'?'<span class="track-tag">PROPOSED</span>':''}${scoreText}</div><div class="waveform-wrap">${waveform(track?.peaks,`wave-${index}`)}<span class="waveform-cursor"></span><input class="track-seek" type="range" min="0" max="${c.duration || 31}" step="0.01" value="${state.position}" data-seek="${kind}" aria-label="Playback position for ${playbackLabels[kind]}" ${track?.src?'':'disabled'}></div>${track?.src?`<a class="track-download" href="${escape(track.src)}" download aria-label="Download ${playbackLabels[kind]} WAV">↓</a>`:''}<span class="track-time">${fmtTime(state.position)}</span></div>`;
    }).join('');
    const early = metric('early'), late = metric('late');
    const delta = number(early) && number(late) ? `${late-early>=0?'+':''}${(late-early).toFixed(2)} dB` : '—';
    $('#scene-details-content').innerHTML = `<dl><dt>Selected target</dt><dd>${escape(target.label || `Target ${state.targetIndex+1}`)}</dd><dt>True / supplied DOA</dt><dd>${angle(target.doaDeg)} / ${angle(target.requestedDoaDeg ?? target.doaDeg)}</dd><dt>Late − Early</dt><dd>${delta} SI-SDR, full ${escape(c.duration || 31)}-second recording</dd><dt>Reference</dt><dd>Early-reflected target speech at microphone 0.</dd><dt>Source pool</dt><dd>${escape(c.category==='unseen'?'Readers absent from training and validation':(c.sourcePool || 'Original test source pool'))}</dd><dt>Scene ID</dt><dd>${escape(c.sceneId || c.id)}</dd></dl><p>Nominal array SNR uses total reverberant speech power and additive-noise power across all six microphones. The input player presents microphone 0.</p><p>Each method receives the same mixture and requested direction. Both target outputs are available via the tabs above. Waveforms show shape, with each visual normalized for legibility; audio levels use a common gain within the scene.</p>`;
    renderArrayGeometry();
    updatePlayback();
  }

  function updatePlayback() {
    const duration = currentCase()?.duration || 31;
    const progress = Math.max(0,Math.min(1,state.position/duration));
    document.querySelectorAll('.audio-track').forEach(row => {
      const kind = row.dataset.kind, active = kind===state.track;
      row.classList.toggle('active', active);
      const play = row.querySelector('.play-button');
      play.innerHTML = active && state.playing ? icons.pause : icons.play;
      play.setAttribute('aria-label',`${active && state.playing?'Pause':'Play'} ${playbackLabels[kind]} for ${currentTarget()?.label || 'selected target'}`);
      const seek = row.querySelector('.track-seek');
      if(document.activeElement!==seek)seek.value=state.position;
      seek.setAttribute('aria-valuetext',`${fmtTime(state.position)} of ${fmtTime(duration)}`);
      row.querySelector('.track-time').textContent = fmtTime(state.position);
      const clip=row.querySelector('.progress-clip');if(clip)clip.setAttribute('width',String(progress*600));
      row.querySelector('.waveform-cursor').style.left = `${progress*100}%`;
    });
    $('#global-time').textContent=`${fmtTime(state.position)} / ${fmtTime(duration)}`;
  }

  function status(message) { $('#playback-status').textContent=message; }
  async function loadTrack(kind, shouldPlay, time=state.position) {
    const data=trackData(kind);if(!data?.src){status('This audio file is unavailable.');return;}
    const request=++state.request;
    audio.pause();state.playing=false;state.track=kind;state.position=time;
    status(`Loading ${playbackLabels[kind].toLowerCase()}…`);updatePlayback();
    const ready=new Promise((resolve,reject) => {
      const onReady=()=>{cleanup();resolve();};const onError=()=>{cleanup();reject(new Error('Audio unavailable'));};
      const cleanup=()=>{audio.removeEventListener('loadedmetadata',onReady);audio.removeEventListener('error',onError);};
      audio.addEventListener('loadedmetadata',onReady,{once:true});audio.addEventListener('error',onError,{once:true});
    });
    audio.src=data.src;audio.load();
    try {
      await ready;if(request!==state.request)return;
      const end=Number.isFinite(audio.duration)?audio.duration:(currentCase()?.duration||31);
      audio.currentTime=Math.min(Math.max(time,0),Math.max(0,end-.01));
      if(shouldPlay)await audio.play();
      if(request!==state.request)return;
      state.playing=!audio.paused;
      status(`${state.playing?'Playing':'Ready'} · ${playbackLabels[kind]}`);
      updatePlayback();
    }catch(error){if(request===state.request){state.playing=false;status('Audio could not play. Try the play button or download the WAV.');updatePlayback();}}
  }

  function play(kind) {
    if(state.track===kind && audio.src){
      if(!audio.paused){audio.pause();state.playing=false;status(`Paused · ${playbackLabels[kind]}`);updatePlayback();}
      else {if(audio.ended || state.position>=(currentCase()?.duration||31)-.05)audio.currentTime=0;audio.play().catch(()=>status('Select play again to enable audio.'));}
    }else loadTrack(kind,true);
  }
  function selectCase(index) {
    if(index===state.caseIndex)return;
    ++state.request;audio.pause();audio.removeAttribute('src');audio.load();
    state.caseIndex=index;state.targetIndex=0;state.position=0;state.playing=false;state.track=null;
    renderCases();renderExample();status('Select a track to listen');
  }
  function selectTarget(index) {
    if(index===state.targetIndex)return;
    const playing=!audio.paused;const kind=state.track;const time=state.position;
    state.targetIndex=index;renderExample();
    if(kind)loadTrack(kind,playing,time);
    else status('Select a track to listen');
  }
  $('#case-list').addEventListener('click',e=>{const b=e.target.closest('[data-case]');if(b)selectCase(Number(b.dataset.case));});
  $('#target-tabs').addEventListener('click',e=>{const b=e.target.closest('[data-target]');if(b)selectTarget(Number(b.dataset.target));});
  function tabKeys(container,selector,select) {
    container.addEventListener('keydown',e=>{
      if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'].includes(e.key))return;
      const tabs=[...container.querySelectorAll(selector)];const current=tabs.indexOf(document.activeElement);if(current<0)return;
      e.preventDefault();let next=e.key==='Home'?0:e.key==='End'?tabs.length-1:(current+(['ArrowLeft','ArrowUp'].includes(e.key)?-1:1)+tabs.length)%tabs.length;
      select(next);container.querySelectorAll(selector)[next].focus();
    });
  }
  tabKeys($('#case-list'),'[data-case]',selectCase);tabKeys($('#target-tabs'),'[data-target]',selectTarget);
  $('#tracks').addEventListener('click',e=>{const b=e.target.closest('[data-play]');if(b)play(b.dataset.play);});
  $('#tracks').addEventListener('input',e=>{if(!e.target.matches('[data-seek]'))return;const kind=e.target.dataset.seek;const t=Number(e.target.value);if(kind!==state.track)loadTrack(kind,state.playing,t);else{audio.currentTime=t;state.position=t;updatePlayback();}});
  $('#restart').addEventListener('click',()=>{state.position=0;if(state.track && audio.src)audio.currentTime=0;updatePlayback();status(state.playing?`Playing · ${playbackLabels[state.track]}`:'Ready at the beginning');});
  audio.addEventListener('timeupdate',()=>{state.position=audio.currentTime;updatePlayback();});
  audio.addEventListener('play',()=>{state.playing=true;status(`Playing · ${playbackLabels[state.track]}`);updatePlayback();});
  audio.addEventListener('pause',()=>{state.playing=false;updatePlayback();});
  audio.addEventListener('ended',()=>{state.playing=false;status('Finished · select another track or start over');updatePlayback();});

  function renderEfficiency(n) {
    state.n=n;const rows=state.facts?.matched_efficiency;
    const early=rows?.find(v=>v.id==='controlled_early') || {gmac_per_second:[2.58,5.10,7.62],offline_rtf:[.122,.238,.348]};
    const late=rows?.find(v=>v.id==='controlled_late') || {gmac_per_second:[2.59,3.75,4.90],offline_rtf:[.116,.157,.192]};
    const a=early.gmac_per_second[n-1],b=late.gmac_per_second[n-1];const reduction=(1-b/a)*100;
    $('#early-mac').textContent=a.toFixed(2);$('#late-mac').textContent=b.toFixed(2);
    $('#early-mac-bar').style.width=`${a/7.62*100}%`;$('#late-mac-bar').style.width=`${b/7.62*100}%`;
    $('#early-rtf').textContent=early.offline_rtf[n-1].toFixed(3);$('#late-rtf').textContent=late.offline_rtf[n-1].toFixed(3);
    $('#mac-reduction').textContent=n===1?'≈ same':`${Math.round(reduction)}%`;
    $('#mac-reduction-caption').textContent=n===1?'comparable one-target cost':`fewer operations at ${n===2?'two':'three'} targets`;
    document.querySelectorAll('[data-n]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.n)===n)));
  }
  document.querySelector('.number-switch').addEventListener('click',e=>{const b=e.target.closest('[data-n]');if(b)renderEfficiency(Number(b.dataset.n));});

  let citation='';
  function renderFacts(facts) {
    state.facts=facts.public || facts;
    const f=state.facts;
    if(f.title)$('#paper-title').textContent=f.title;
    if(f.authors?.length)$('#authors').innerHTML=f.authors.map(a=>`${escape(a)}${f.author_affiliation_ids?.[a]?`<sup>${f.author_affiliation_ids[a].join(',')}</sup>`:''}`).join(' · ');
    if(f.affiliations?.length)$('#affiliations').innerHTML=f.affiliations.map(a=>`<p><sup>${escape(a.id)}</sup>${escape(a.name)}${a.city?', '+escape(a.city):''}</p>`).join('');
    if(f.aggregate_quality){$('#aggregate-early').innerHTML=`${f.aggregate_quality.early.si_sdr_db.toFixed(2)}<small>dB</small>`;$('#aggregate-late').innerHTML=`${f.aggregate_quality.late.si_sdr_db.toFixed(2)}<small>dB</small>`;}
    citation=`@misc{chi2026sharedfront,\n  title = {${f.title || $('#paper-title').textContent}},\n  author = {${(f.authors || ['Cheng Chi','Yuxuan Ke','Andong Li','Dan Rao','Xiaodong Li','Chengshi Zheng']).join(' and ')}},\n  year = {2026},\n  note = {Research manuscript}\n}`;
    $('#bibtex').textContent=citation;renderEfficiency(state.n);
  }
  $('#copy-citation').addEventListener('click',async()=>{
    try{await navigator.clipboard.writeText(citation);$('#citation-status').textContent='BibTeX copied to clipboard.';}
    catch{$('.citation-details').open=true;const range=document.createRange();range.selectNodeContents($('#bibtex'));const selection=window.getSelection();selection.removeAllRanges();selection.addRange(range);$('#citation-status').textContent='Citation selected. Copy it using your browser.';}
  });

  async function load() {
    renderFacts({});
    try{
      const [examples,facts]=await Promise.all([fetch('data/examples.json').then(r=>{if(!r.ok)throw new Error('Missing examples');return r.json();}),fetch('data/facts.json').then(r=>r.ok?r.json():null).catch(()=>null)]);
      const cases=examples.cases || examples.examples;
      if(!Array.isArray(cases)||!cases.length||cases.some(c=>!Array.isArray(c.targets)||!c.targets.length))throw new Error('No complete examples');
      state.cases=cases;if(facts)renderFacts(facts);renderCases();renderExample();
    }catch(error){
      $('#workbench').setAttribute('aria-busy','false');$('#case-title').textContent='The audio library is unavailable';
      $('#case-description').textContent='Please reload the page. If viewing the downloaded files locally, serve the folder through a local web server so the audio manifest can load.';
      $('#case-list').innerHTML='<p class="error-note">Examples could not be loaded.</p>';status('Listening examples have not loaded.');
    }
  }
  load();
})();
