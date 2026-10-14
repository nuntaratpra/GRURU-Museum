/**
 * GRURU MUSEUM - Executive Presentation Web App Core Engine
 * Hand-crafted with vanilla JavaScript for zero-dependency high reliability
 */

(function () {
  'use strict';

  // --- State Management ---
  const state = {
    currentSlide: 1,
    totalSlides: window.GRURU_DATA.slides.length,
    viewMode: 'deck', // 'deck' | 'grid'
    notesOpen: false,
    gridOpen: false,
    soundEnabled: true,
    autoplay: false,
    autoplayInterval: null,
    booming: {
      topicIndex: 0,
      exploded: false,
      level: 1,
      hoveredNode: null,
      animFrame: null
    },
    graph: {
      selectedCategory: 'all',
      hoveredNode: null,
      selectedNode: window.GRURU_DATA.kgNodes[1], // Default Penicillin
      simulation: null,
      animFrame: null
    }
  };

  // --- Web Audio API Sci-Fi Sound Synthesizer ---
  let audioCtx = null;
  function getAudioContext() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) audioCtx = new AudioContext();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  function playSound(type) {
    if (!state.soundEnabled) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;

      if (type === 'tick') {
        // High crisp HUD tick
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.exponentialRampToValueAtTime(1760, now + 0.04);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.04);
      } else if (type === 'slide') {
        // Sci-Fi scan swoosh
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(640, now + 0.12);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.12);
      } else if (type === 'boom') {
        // Deep resonance bass drop + neon high chime
        const subOsc = ctx.createOscillator();
        const subGain = ctx.createGain();
        subOsc.type = 'sine';
        subOsc.frequency.setValueAtTime(150, now);
        subOsc.frequency.exponentialRampToValueAtTime(38, now + 0.45);
        subGain.gain.setValueAtTime(0.35, now);
        subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
        subOsc.connect(subGain);
        subGain.connect(ctx.destination);
        subOsc.start(now);
        subOsc.stop(now + 0.45);

        // High pulse chime
        const chime = ctx.createOscillator();
        const chimeGain = ctx.createGain();
        chime.type = 'sine';
        chime.frequency.setValueAtTime(1200, now);
        chime.frequency.exponentialRampToValueAtTime(2400, now + 0.25);
        chimeGain.gain.setValueAtTime(0.12, now);
        chimeGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        chime.connect(chimeGain);
        chimeGain.connect(ctx.destination);
        chime.start(now);
        chime.stop(now + 0.25);
      }
    } catch (e) {
      console.warn('Audio synthesis bypassed:', e);
    }
  }

  // --- Presentation Deck Navigation ---
  function goToSlide(slideNum) {
    if (slideNum < 1) slideNum = 1;
    if (slideNum > state.totalSlides) slideNum = state.totalSlides;
    if (slideNum === state.currentSlide) return;

    state.currentSlide = slideNum;
    updateDeckUI();
    playSound('slide');

    // Trigger special slide setups
    if (slideNum === 7) {
      initBoomingCanvas();
    } else if (slideNum === 8) {
      initForceGraphCanvas();
    }
  }

  function nextSlide() {
    if (state.currentSlide < state.totalSlides) {
      goToSlide(state.currentSlide + 1);
    }
  }

  function prevSlide() {
    if (state.currentSlide > 1) {
      goToSlide(state.currentSlide - 1);
    }
  }

  function updateDeckUI() {
    // Hide all frames, show current
    const frames = document.querySelectorAll('.slide-frame');
    frames.forEach((f, idx) => {
      f.classList.toggle('active', idx + 1 === state.currentSlide);
    });

    // Update Counter
    const curElem = document.getElementById('current-slide-num');
    if (curElem) {
      curElem.textContent = String(state.currentSlide).padStart(2, '0');
    }

    // Update Progress Bar
    const progressFill = document.getElementById('deck-progress-fill');
    if (progressFill) {
      const pct = (state.currentSlide / state.totalSlides) * 100;
      progressFill.style.width = pct + '%';
    }

    // Update Speaker Notes
    const notesContent = document.getElementById('notes-content');
    if (notesContent) {
      const curData = window.GRURU_DATA.slides[state.currentSlide - 1];
      notesContent.innerHTML = `
        <div style="margin-bottom: 6px;"><strong style="color:var(--gr-lime);">${curData.specimenId} // ${curData.titleTh}</strong></div>
        <p style="color:#E2E2EC; margin-bottom: 8px;"><strong>ประเด็นสำคัญสำหรับผู้บริหาร:</strong> ${curData.notes}</p>
        <div style="font-family:var(--font-mono); font-size:0.75rem; color:var(--gr-fog);">Era: ${curData.era} • Target Delivery: 3-Second Grasp</div>
      `;
    }

    // Update Thumbnail Active States
    document.querySelectorAll('.thumb-card').forEach((card, idx) => {
      card.classList.toggle('active', idx + 1 === state.currentSlide);
    });

    // Close grid if open
    if (state.gridOpen) {
      toggleGrid(false);
    }
  }

  function toggleNotes(force) {
    state.notesOpen = force !== undefined ? force : !state.notesOpen;
    const drawer = document.getElementById('notes-drawer');
    const btn = document.getElementById('btn-notes-toggle');
    if (drawer) drawer.classList.toggle('open', state.notesOpen);
    if (btn) btn.classList.toggle('active', state.notesOpen);
    playSound('tick');
  }

  function toggleGrid(force) {
    state.gridOpen = force !== undefined ? force : !state.gridOpen;
    const drawer = document.getElementById('grid-drawer');
    const btn = document.getElementById('btn-grid-toggle');
    if (drawer) drawer.classList.toggle('open', state.gridOpen);
    if (btn) btn.classList.toggle('active', state.gridOpen);
    playSound('tick');
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
    }
    playSound('tick');
  }

  function toggleSound() {
    state.soundEnabled = !state.soundEnabled;
    const btn = document.getElementById('btn-sound-toggle');
    if (btn) {
      btn.innerHTML = state.soundEnabled 
        ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg> <span class="btn-text-hide">SOUND ON</span>`
        : `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line></svg> <span class="btn-text-hide">MUTED</span>`;
      btn.classList.toggle('active', state.soundEnabled);
    }
    if (state.soundEnabled) playSound('tick');
  }

  // --- Data Booming Interactive Simulator (Slide 7) ---
  let boomCanvas = null;
  let boomCtx = null;
  let boomNodes = [];
  let boomShockwave = 0;

  function initBoomingCanvas() {
    boomCanvas = document.getElementById('booming-canvas');
    if (!boomCanvas) return;
    boomCtx = boomCanvas.getContext('2d');

    if (state.booming.animFrame) {
      cancelAnimationFrame(state.booming.animFrame);
      state.booming.animFrame = null;
    }

    // Resize
    const rect = boomCanvas.parentElement.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    boomCanvas.width = rect.width * dpr;
    boomCanvas.height = rect.height * dpr;
    boomCtx.setTransform(1, 0, 0, 1, 0, 0);
    boomCtx.scale(dpr, dpr);

    prepareBoomingNodes();
    renderBooming();
  }

  function prepareBoomingNodes() {
    const topic = window.GRURU_DATA.boomingTopics[state.booming.topicIndex];
    const width = boomCanvas.parentElement.clientWidth;
    const height = boomCanvas.parentElement.clientHeight;
    const cx = width / 2;
    const cy = height / 2;

    boomNodes = [];

    // Central Seed Node
    boomNodes.push({
      id: 'center',
      x: cx,
      y: cy,
      targetX: cx,
      targetY: cy,
      radius: 38,
      label: topic.titleTh,
      sublabel: topic.seedLabel,
      color: '#D7FF3A',
      isCenter: true,
      scale: 1,
      alpha: 1
    });

    const children = topic.children;
    const count = children.length;
    const radiusDist = Math.min(width, height) * 0.38;

    children.forEach((c, idx) => {
      const angle = (idx / count) * Math.PI * 2 - Math.PI / 2;
      const targetX = cx + Math.cos(angle) * radiusDist;
      const targetY = cy + Math.sin(angle) * radiusDist;

      const catInfo = window.GRURU_DATA.colorTokens.categories[c.cat] || { color: '#8C6BFF' };

      boomNodes.push({
        id: c.id,
        x: cx,
        y: cy,
        targetX: targetX,
        targetY: targetY,
        radius: 22,
        label: c.title,
        desc: c.desc,
        relation: c.relation,
        color: catInfo.color,
        isCenter: false,
        scale: 0,
        alpha: 0,
        delay: idx * 40
      });
    });

    state.booming.exploded = false;
    boomShockwave = 0;
    updateBoomingTelemetry(0, topic);

    const boomBtn = document.getElementById('btn-trigger-boom');
    if (boomBtn) {
      boomBtn.innerHTML = `⚡ BOOM! ระเบิดความรู้`;
    }
  }

  function triggerBoom() {
    const topic = window.GRURU_DATA.boomingTopics[state.booming.topicIndex];
    const boomBtn = document.getElementById('btn-trigger-boom');

    if (state.booming.exploded) {
      // Reset first then explode
      prepareBoomingNodes();
      setTimeout(() => {
        executeBoomExplosion(topic, boomBtn);
      }, 100);
    } else {
      executeBoomExplosion(topic, boomBtn);
    }
  }

  function executeBoomExplosion(topic, boomBtn) {
    state.booming.exploded = true;
    boomShockwave = 1;
    playSound('boom');

    if (boomBtn) {
      boomBtn.innerHTML = `↺ BOOM อีกครั้ง (EXPLODE AGAIN)`;
    }

    const startTime = performance.now();
    boomNodes.forEach(node => {
      if (!node.isCenter) {
        node.startTime = startTime + node.delay;
      }
    });

    // Run connection counter animation
    let count = 0;
    const maxCount = topic.children.length;
    const counterTimer = setInterval(() => {
      count++;
      updateBoomingTelemetry(count, topic);
      if (count >= maxCount) clearInterval(counterTimer);
    }, 45);
  }

  function updateBoomingTelemetry(count, topic) {
    const valElem = document.getElementById('telemetry-count');
    const nameElem = document.getElementById('telemetry-topic-name');
    const descElem = document.getElementById('telemetry-topic-desc');
    const takeawayElem = document.getElementById('telemetry-takeaway');

    if (valElem) valElem.textContent = `${count} CONNECTIONS`;
    if (nameElem) nameElem.textContent = topic.titleTh + ` (${topic.era})`;
    if (descElem) descElem.textContent = topic.summary;
    if (takeawayElem) takeawayElem.textContent = topic.everydayTakeaway;
  }

  function renderBooming() {
    if (!boomCtx || !boomCanvas) return;
    const width = boomCanvas.parentElement.clientWidth;
    const height = boomCanvas.parentElement.clientHeight;

    boomCtx.clearRect(0, 0, width, height);

    const now = performance.now();
    const cx = width / 2;
    const cy = height / 2;

    // Shockwave ring animation
    if (boomShockwave > 0) {
      boomShockwave += 4;
      boomCtx.save();
      boomCtx.beginPath();
      boomCtx.arc(cx, cy, boomShockwave, 0, Math.PI * 2);
      boomCtx.strokeStyle = `rgba(215, 255, 58, ${Math.max(0, 1 - boomShockwave / 240)})`;
      boomCtx.lineWidth = 3;
      boomCtx.stroke();
      boomCtx.restore();

      if (boomShockwave > 240) boomShockwave = 0;
    }

    // Draw links
    if (state.booming.exploded) {
      boomNodes.forEach(node => {
        if (!node.isCenter && node.alpha > 0.05) {
          boomCtx.save();
          boomCtx.beginPath();
          boomCtx.moveTo(cx, cy);
          boomCtx.lineTo(node.x, node.y);
          boomCtx.strokeStyle = `rgba(46, 230, 255, ${node.alpha * 0.4})`;
          boomCtx.lineWidth = 1.5;
          boomCtx.setLineDash([4, 4]);
          boomCtx.stroke();
          boomCtx.restore();
        }
      });
    }

    // Update and draw nodes
    boomNodes.forEach(node => {
      if (node.isCenter) {
        // Glowing center
        boomCtx.save();
        boomCtx.shadowColor = 'rgba(215, 255, 58, 0.4)';
        boomCtx.shadowBlur = 18;
        boomCtx.beginPath();
        boomCtx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        boomCtx.fillStyle = '#D7FF3A';
        boomCtx.fill();
        boomCtx.strokeStyle = '#0B0B0F';
        boomCtx.lineWidth = 3;
        boomCtx.stroke();
        boomCtx.restore();

        // Center text
        boomCtx.save();
        boomCtx.fillStyle = '#0B0B0F';
        boomCtx.font = 'bold 12px "Chakra Petch", sans-serif';
        boomCtx.textAlign = 'center';
        boomCtx.textBaseline = 'middle';
        boomCtx.fillText(node.label, node.x, node.y);
        boomCtx.restore();
      } else {
        // Explosion motion physics
        if (state.booming.exploded && node.startTime) {
          if (now >= node.startTime) {
            const elapsed = (now - node.startTime) / 380; // 380ms transition
            const t = Math.min(1, Math.max(0, elapsed));
            // Archeo cubic easing
            const ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

            node.x = cx + (node.targetX - cx) * ease;
            node.y = cy + (node.targetY - cy) * ease;
            node.alpha = ease;
            node.scale = ease;
          }
        }

        if (node.alpha > 0) {
          boomCtx.save();
          boomCtx.globalAlpha = node.alpha;
          boomCtx.beginPath();
          boomCtx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
          boomCtx.fillStyle = '#17171F';
          boomCtx.fill();
          boomCtx.strokeStyle = node.color;
          boomCtx.lineWidth = 2;
          boomCtx.stroke();

          // Label under node
          boomCtx.fillStyle = '#F2EDE3';
          boomCtx.font = '11px "IBM Plex Sans Thai", sans-serif';
          boomCtx.textAlign = 'center';
          boomCtx.fillText(node.label, node.x, node.y + node.radius + 14);
          boomCtx.restore();
        }
      }
    });

    if (state.currentSlide === 7) {
      state.booming.animFrame = requestAnimationFrame(renderBooming);
    }
  }

  // --- Force-Directed Knowledge Graph Simulator (Slide 8) ---
  let kgCanvas = null;
  let kgCtx = null;
  let kgNodesList = [];
  let kgLinksList = [];
  let isDragging = false;
  let draggedNode = null;

  function initForceGraphCanvas() {
    kgCanvas = document.getElementById('force-graph-canvas');
    if (!kgCanvas) return;
    kgCtx = kgCanvas.getContext('2d');

    if (state.graph.animFrame) {
      cancelAnimationFrame(state.graph.animFrame);
      state.graph.animFrame = null;
    }

    const rect = kgCanvas.parentElement.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    kgCanvas.width = rect.width * dpr;
    kgCanvas.height = rect.height * dpr;
    kgCtx.setTransform(1, 0, 0, 1, 0, 0);
    kgCtx.scale(dpr, dpr);

    setupKgSimulation(rect.width, rect.height);
    renderForceGraph();
  }

  function setupKgSimulation(w, h) {
    kgNodesList = window.GRURU_DATA.kgNodes.map((n, i) => {
      const angle = (i / window.GRURU_DATA.kgNodes.length) * Math.PI * 2;
      const r = Math.min(w, h) * 0.32;
      return {
        ...n,
        x: w / 2 + Math.cos(angle) * r + (Math.random() - 0.5) * 40,
        y: h / 2 + Math.sin(angle) * r + (Math.random() - 0.5) * 40,
        vx: 0,
        vy: 0,
        radius: Math.max(12, n.weight * 0.7)
      };
    });

    kgLinksList = window.GRURU_DATA.kgLinks.map(l => {
      return {
        ...l,
        sourceNode: kgNodesList.find(n => n.id === l.source),
        targetNode: kgNodesList.find(n => n.id === l.target)
      };
    }).filter(l => l.sourceNode && l.targetNode);

    // Initial inspector setup
    updateNodeInspector(state.graph.selectedNode || kgNodesList[1]);
  }

  function updateNodeInspector(node) {
    if (!node) return;
    state.graph.selectedNode = node;

    const codeElem = document.getElementById('inspector-specimen');
    const titleElem = document.getElementById('inspector-title');
    const groupElem = document.getElementById('inspector-group');
    const eraElem = document.getElementById('inspector-era');
    const summaryElem = document.getElementById('inspector-summary');
    const takeawayElem = document.getElementById('inspector-takeaway');

    const catInfo = window.GRURU_DATA.colorTokens.categories[node.group] || { name: node.group, color: '#D7FF3A' };

    if (codeElem) codeElem.textContent = node.specimen;
    if (titleElem) titleElem.textContent = node.label;
    if (groupElem) {
      groupElem.textContent = catInfo.name;
      groupElem.style.color = catInfo.color;
      groupElem.style.borderColor = catInfo.color;
    }
    if (eraElem) eraElem.textContent = `ERA: ${node.era}`;
    if (summaryElem) summaryElem.textContent = node.summary;
    if (takeawayElem) takeawayElem.textContent = node.takeaway;
  }

  function renderForceGraph() {
    if (!kgCtx || !kgCanvas) return;
    const w = kgCanvas.parentElement.clientWidth;
    const h = kgCanvas.parentElement.clientHeight;

    kgCtx.clearRect(0, 0, w, h);

    // Filter active check
    const activeCat = state.graph.selectedCategory;

    // Physics step
    const cx = w / 2;
    const cy = h / 2;

    kgNodesList.forEach(n1 => {
      // Center gravity
      n1.vx += (cx - n1.x) * 0.0006;
      n1.vy += (cy - n1.y) * 0.0006;

      // Node repulsion
      kgNodesList.forEach(n2 => {
        if (n1 === n2) return;
        const dx = n1.x - n2.x;
        const dy = n1.y - n2.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        if (dist < 130) {
          const force = (130 - dist) / dist * 0.08;
          n1.vx += dx * force;
          n1.vy += dy * force;
        }
      });
    });

    // Link spring attraction
    kgLinksList.forEach(l => {
      const dx = l.targetNode.x - l.sourceNode.x;
      const dy = l.targetNode.y - l.sourceNode.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const targetDist = 110;
      const force = (dist - targetDist) * 0.002;
      l.sourceNode.vx += dx * force;
      l.sourceNode.vy += dy * force;
      l.targetNode.vx -= dx * force;
      l.targetNode.vy -= dy * force;
    });

    // Position integration with damping
    kgNodesList.forEach(n => {
      if (n !== draggedNode) {
        n.vx *= 0.88;
        n.vy *= 0.88;
        n.x += n.vx;
        n.y += n.vy;

        // Boundaries
        n.x = Math.max(30, Math.min(w - 30, n.x));
        n.y = Math.max(30, Math.min(h - 30, n.y));
      }
    });

    // Draw Links
    kgLinksList.forEach(l => {
      const isVisible = activeCat === 'all' || 
                        l.sourceNode.group === activeCat || 
                        l.targetNode.group === activeCat;

      const isHighlighted = (state.graph.selectedNode && 
                            (l.sourceNode.id === state.graph.selectedNode.id || 
                             l.targetNode.id === state.graph.selectedNode.id));

      kgCtx.save();
      kgCtx.beginPath();
      kgCtx.moveTo(l.sourceNode.x, l.sourceNode.y);
      kgCtx.lineTo(l.targetNode.x, l.targetNode.y);

      if (isHighlighted) {
        kgCtx.strokeStyle = '#D7FF3A';
        kgCtx.lineWidth = 2.5;
        kgCtx.setLineDash([]);
      } else {
        kgCtx.strokeStyle = isVisible ? 'rgba(46, 230, 255, 0.28)' : 'rgba(44, 44, 58, 0.15)';
        kgCtx.lineWidth = 1;
        if (l.type === 'dashed') kgCtx.setLineDash([4, 4]);
        else if (l.type === 'dotted') kgCtx.setLineDash([2, 3]);
        else kgCtx.setLineDash([]);
      }
      kgCtx.stroke();
      kgCtx.restore();
    });

    // Draw Nodes
    kgNodesList.forEach(n => {
      const isCatActive = activeCat === 'all' || n.group === activeCat;
      const isSelected = state.graph.selectedNode && state.graph.selectedNode.id === n.id;
      const isHovered = state.graph.hoveredNode && state.graph.hoveredNode.id === n.id;

      const catInfo = window.GRURU_DATA.colorTokens.categories[n.group] || { color: '#8C6BFF' };

      kgCtx.save();
      if (!isCatActive) kgCtx.globalAlpha = 0.2;

      // Glow if selected
      if (isSelected || isHovered) {
        kgCtx.shadowColor = 'rgba(215, 255, 58, 0.55)';
        kgCtx.shadowBlur = 18;
      }

      kgCtx.beginPath();
      kgCtx.arc(n.x, n.y, isSelected ? n.radius + 3 : n.radius, 0, Math.PI * 2);
      kgCtx.fillStyle = isSelected ? '#D7FF3A' : '#17171F';
      kgCtx.fill();
      kgCtx.strokeStyle = isSelected ? '#FFFFFF' : catInfo.color;
      kgCtx.lineWidth = isSelected ? 3 : 2;
      kgCtx.stroke();
      kgCtx.restore();

      // Node text label
      if (isCatActive) {
        kgCtx.save();
        kgCtx.fillStyle = isSelected ? '#D7FF3A' : '#F2EDE3';
        kgCtx.font = (isSelected ? 'bold ' : '') + '11px "IBM Plex Sans Thai", sans-serif';
        kgCtx.textAlign = 'center';
        kgCtx.fillText(n.label, n.x, n.y + n.radius + 12);
        kgCtx.restore();
      }
    });

    if (state.currentSlide === 8) {
      state.graph.animFrame = requestAnimationFrame(renderForceGraph);
    }
  }

  // --- Attach Event Listeners ---
  function setupEvents() {
    // Nav buttons
    document.getElementById('btn-prev-slide')?.addEventListener('click', prevSlide);
    document.getElementById('btn-next-slide')?.addEventListener('click', nextSlide);

    // Top HUD controls
    document.getElementById('btn-notes-toggle')?.addEventListener('click', () => toggleNotes());
    document.getElementById('btn-grid-toggle')?.addEventListener('click', () => toggleGrid());
    document.getElementById('btn-fullscreen-toggle')?.addEventListener('click', toggleFullscreen);
    document.getElementById('btn-sound-toggle')?.addEventListener('click', toggleSound);

    // Keyboard Shortcuts
    window.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        nextSlide();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prevSlide();
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        toggleNotes();
      } else if (e.key === 'g' || e.key === 'G') {
        e.preventDefault();
        toggleGrid();
      } else if (e.key === 'Escape') {
        if (state.gridOpen) toggleGrid(false);
        if (state.notesOpen) toggleNotes(false);
      }
    });

    // Booming controls
    document.getElementById('btn-trigger-boom')?.addEventListener('click', () => {
      triggerBoom();
    });

    document.querySelectorAll('.topic-tab-btn').forEach((btn, idx) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.topic-tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.booming.topicIndex = idx;
        prepareBoomingNodes();
        playSound('tick');
      });
    });

    // Force Graph Filter Buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.graph.selectedCategory = btn.dataset.category;
        playSound('tick');
      });
    });

    // Force Graph Mouse Drag & Click
    const fCanvas = document.getElementById('force-graph-canvas');
    if (fCanvas) {
      fCanvas.addEventListener('mousedown', (e) => {
        const rect = fCanvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;

        for (let i = kgNodesList.length - 1; i >= 0; i--) {
          const n = kgNodesList[i];
          const dist = Math.hypot(n.x - mx, n.y - my);
          if (dist <= n.radius + 6) {
            isDragging = true;
            draggedNode = n;
            updateNodeInspector(n);
            playSound('tick');
            break;
          }
        }
      });

      window.addEventListener('mousemove', (e) => {
        if (isDragging && draggedNode && fCanvas) {
          const rect = fCanvas.getBoundingClientRect();
          draggedNode.x = e.clientX - rect.left;
          draggedNode.y = e.clientY - rect.top;
        }
      });

      window.addEventListener('mouseup', () => {
        isDragging = false;
        draggedNode = null;
      });
    }

    // Pipeline steps click
    document.querySelectorAll('.pipeline-step-item').forEach((step, idx) => {
      step.addEventListener('click', () => {
        document.querySelectorAll('.pipeline-step-item').forEach(s => s.classList.remove('active'));
        step.classList.add('active');
        playSound('tick');
      });
    });

    // Window resize
    window.addEventListener('resize', () => {
      if (state.currentSlide === 7 && boomCanvas) {
        initBoomingCanvas();
      } else if (state.currentSlide === 8 && kgCanvas) {
        initForceGraphCanvas();
      }
    });
  }

  // --- Initializer ---
  document.addEventListener('DOMContentLoaded', () => {
    updateDeckUI();
    setupEvents();
  });

  // Expose global nav API for thumbnails
  window.GRURU_NAV = {
    goToSlide: goToSlide,
    nextSlide: nextSlide,
    prevSlide: prevSlide,
    toggleNotes: toggleNotes,
    toggleGrid: toggleGrid
  };
})();
