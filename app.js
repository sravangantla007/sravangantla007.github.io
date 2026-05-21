/* ==========================================================================
   AVIONICS DECK - INTERACTIVE SYSTEM ENGINE
   Author: Gantla Venkata Sravan
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  
  // ==========================================================================
  // HUD SYSTEM CLOCK
  // ==========================================================================
  const hudClock = document.getElementById('hud-clock');
  const pageStartTime = Date.now();

  function updateHUDClock() {
    const elapsedMs = Date.now() - pageStartTime;
    const totalSecs = Math.floor(elapsedMs / 1000);
    
    const hours = String(Math.floor(totalSecs / 3600)).padStart(2, '0');
    const minutes = String(Math.floor((totalSecs % 3600) / 60)).padStart(2, '0');
    const seconds = String(totalSecs % 60).padStart(2, '0');
    
    hudClock.textContent = `T+00:${minutes}:${seconds}`;
  }
  setInterval(updateHUDClock, 1000);

  // Core Temp Fluctuation
  const coreTempElement = document.getElementById('core-temp-val');
  setInterval(() => {
    const baseTemp = 28.4;
    const fluctuation = (Math.random() * 0.4 - 0.2).toFixed(1);
    const currentTemp = (baseTemp + parseFloat(fluctuation)).toFixed(1);
    coreTempElement.textContent = `${currentTemp}°C`;
  }, 3000);

  // ==========================================================================
  // TECHNICAL STACK GRID (SKILL CHIPS MATRIX)
  // Transitioned from progress bars to modern, glowing flex tags.
  // ==========================================================================

  // ==========================================================================
  // REAL-TIME ROCKET TELEMETRY ENGINE & SIMULATOR
  // ==========================================================================
  
  // System States
  const STATE_SAFE = 0;
  const STATE_IDLE = 1;
  const STATE_ARMED = 2;
  const STATE_IGNITION = 3;
  const STATE_POST_IGNITION = 4;
  
  let systemState = STATE_SAFE;
  let telemetryInterval = null;
  let telemetryTime = 0; // ms
  let burnData = [];
  
  // DOM Elements
  const btnArm = document.getElementById('btn-arm');
  const btnFire = document.getElementById('btn-fire');
  const btnAbort = document.getElementById('btn-abort');
  
  const globalStatusDot = document.getElementById('global-status-dot');
  const globalStatusLbl = document.getElementById('global-status-lbl');
  const systemStateBox = document.getElementById('system-state-box');
  const terminalStream = document.getElementById('terminal-stream');
  
  const burnElapsed = document.getElementById('burn-elapsed');
  const daqClockLbl = document.getElementById('daq-clock-lbl');
  const peakThrustLbl = document.getElementById('peak-thrust-lbl');
  const peakPressureLbl = document.getElementById('peak-pressure-lbl');
  const igniterContinuityLbl = document.getElementById('igniter-continuity-lbl');
  const loggingStatusLbl = document.getElementById('logging-status-lbl');
  
  // Thermocouple Elements
  const tcNodes = [];
  const tcVals = [];
  const tcBars = [];
  
  const tcBaselines = [27.5, 26.8, 27.1, 26.5, 28.0, 28.4, 26.9, 25.5, 26.2, 27.0, 0.0];
  const tcCurrent = [...tcBaselines];
  
  for(let i = 1; i <= 11; i++) {
    tcNodes.push(document.getElementById(`tc-node-${i}`));
    tcVals.push(document.getElementById(`tc-val-${i}`));
    tcBars.push(document.getElementById(`tc-bar-${i}`));
  }

  // ==========================================================================
  // CANVAS PLOTTER ENGINE
  // ==========================================================================
  const canvas = document.getElementById('telemetryChart');
  const ctx = canvas.getContext('2d');
  
  // Resize Canvas to fit container
  function resizeCanvas() {
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    drawChart();
  }
  
  window.addEventListener('resize', resizeCanvas);
  
  // Initial draw
  setTimeout(resizeCanvas, 100);

  function drawChart() {
    const w = canvas.width;
    const h = canvas.height;
    
    // Clear canvas
    ctx.fillStyle = '#05060A';
    ctx.fillRect(0, 0, w, h);
    
    // Draw Grid Lines
    ctx.strokeStyle = 'rgba(0, 242, 254, 0.04)';
    ctx.lineWidth = 1;
    
    const gridCols = 10;
    const gridRows = 6;
    
    for (let i = 1; i < gridCols; i++) {
      const x = (w / gridCols) * i;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    
    for (let i = 1; i < gridRows; i++) {
      const y = (h / gridRows) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
    
    // Border highlights
    ctx.strokeStyle = 'rgba(0, 242, 254, 0.1)';
    ctx.strokeRect(0, 0, w, h);
    
    if (burnData.length === 0) {
      // Draw Standby message
      ctx.fillStyle = '#4F5E71';
      ctx.font = "11px 'Fira Code', monospace";
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText("AWAITING IGNITION COMMAND DECK SIGNAL...", w / 2, h / 2);
      return;
    }
    
    // Max values for scaling (T_max = 6.0s, Thrust_max = 1000N, Pressure_max = 500 PSI)
    const MAX_TIME = 6000; // 6 seconds in ms
    const MAX_THRUST = 1000;
    const MAX_PRESSURE = 500;
    
    const paddingLeft = 40;
    const paddingRight = 40;
    const paddingTop = 20;
    const paddingBottom = 25;
    
    const plotWidth = w - paddingLeft - paddingRight;
    const plotHeight = h - paddingTop - paddingBottom;
    
    // Draw Axis Labels
    ctx.fillStyle = 'rgba(0, 242, 254, 0.5)';
    ctx.font = "8px 'Fira Code', monospace";
    ctx.textAlign = 'left';
    ctx.fillText("THRUST (N)", paddingLeft, paddingTop - 8);
    
    ctx.fillStyle = 'rgba(255, 87, 34, 0.6)';
    ctx.textAlign = 'right';
    ctx.fillText("PSI", w - paddingRight, paddingTop - 8);
    
    ctx.fillStyle = '#4F5E71';
    ctx.textAlign = 'center';
    ctx.fillText("TIME (T+ seconds)", w / 2, h - 6);
    
    // Plot Thrust (Cyan)
    ctx.beginPath();
    ctx.strokeStyle = '#00F2FE';
    ctx.lineWidth = 2.5;
    ctx.shadowBlur = 8;
    ctx.shadowColor = 'rgba(0, 242, 254, 0.5)';
    
    burnData.forEach((d, idx) => {
      const x = paddingLeft + (d.time / MAX_TIME) * plotWidth;
      const y = paddingTop + plotHeight - (d.thrust / MAX_THRUST) * plotHeight;
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
    
    // Plot Chamber Pressure (Orange/Red)
    ctx.beginPath();
    ctx.strokeStyle = '#FF5722';
    ctx.lineWidth = 1.5;
    ctx.shadowBlur = 6;
    ctx.shadowColor = 'rgba(255, 87, 34, 0.5)';
    
    burnData.forEach((d, idx) => {
      const x = paddingLeft + (d.time / MAX_TIME) * plotWidth;
      const y = paddingTop + plotHeight - (d.pressure / MAX_PRESSURE) * plotHeight;
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
    
    // Reset shadow
    ctx.shadowBlur = 0;
  }

  // ==========================================================================
  // SYSTEM TERMINAL CONSOLE PRINT UTILITY
  // ==========================================================================
  function printTerm(content, type = 'log') {
    const line = document.createElement('div');
    line.className = 'term-line';
    
    const now = new Date();
    const timeStr = now.toISOString().slice(11, 23);
    
    let prefix = `<span class="text-muted">[${timeStr}]</span> `;
    
    if (type === 'cmd') {
      prefix += `<span class="console-prompt">GVS_DAQ_CLI> </span>`;
      line.innerHTML = prefix + `<span style="color: #FFF; font-weight: bold;">${content}</span>`;
    } else if (type === 'err') {
      prefix += `<span style="color: var(--color-fire); font-weight: bold;">[ERROR] </span>`;
      line.innerHTML = prefix + content;
    } else if (type === 'success') {
      prefix += `<span style="color: var(--color-safe); font-weight: bold;">[OK] </span>`;
      line.innerHTML = prefix + content;
    } else if (type === 'armed') {
      prefix += `<span style="color: var(--color-armed); font-weight: bold;">[ARMED] </span>`;
      line.innerHTML = prefix + content;
    } else if (type === 'csv') {
      line.className = 'term-line mono';
      line.style.color = '#8E9AA8';
      line.innerHTML = `<span style="color: var(--color-safe); font-size: 0.7rem;">&gt;&gt;</span> ${content}`;
    } else {
      prefix += `<span class="text-muted">[SYS] </span>`;
      line.innerHTML = prefix + content;
    }
    
    const promptLine = terminalStream.querySelector('.term-input-prompt');
    terminalStream.insertBefore(line, promptLine);
    
    // Auto-scroll to bottom
    terminalStream.scrollTop = terminalStream.scrollHeight;
  }

  // ==========================================================================
  // HARDWARE STATE MACHINE CONTROLLER
  // ==========================================================================
  
  function updateSystemStateUI() {
    // Reset classes
    systemStateBox.className = 'state-box';
    globalStatusDot.className = 'status-dot';
    
    if (systemState === STATE_SAFE) {
      systemStateBox.classList.add('safe');
      systemStateBox.textContent = 'SYSTEM_SAFE';
      
      globalStatusDot.classList.add('safe');
      globalStatusLbl.textContent = 'SAFE';
      globalStatusLbl.style.color = 'var(--color-safe)';
      
      btnArm.disabled = false;
      btnFire.disabled = true;
      btnAbort.disabled = true;
      loggingStatusLbl.textContent = 'STANDBY';
    } 
    else if (systemState === STATE_ARMED) {
      systemStateBox.classList.add('armed');
      systemStateBox.textContent = 'SYSTEM_ARMED';
      
      globalStatusDot.classList.add('armed');
      globalStatusLbl.textContent = 'ARMED';
      globalStatusLbl.style.color = 'var(--color-armed)';
      
      btnArm.disabled = true;
      btnFire.disabled = false;
      btnAbort.disabled = false;
      loggingStatusLbl.textContent = 'READY';
    }
    else if (systemState === STATE_IGNITION) {
      systemStateBox.classList.add('firing');
      systemStateBox.textContent = 'SYSTEM_IGNITION';
      
      globalStatusDot.classList.add('firing');
      globalStatusLbl.textContent = 'BURN_ACTIVE';
      globalStatusLbl.style.color = 'var(--color-fire)';
      
      btnArm.disabled = true;
      btnFire.disabled = true;
      btnAbort.disabled = false;
      loggingStatusLbl.textContent = 'LOGGING';
    }
    else if (systemState === STATE_POST_IGNITION) {
      systemStateBox.className = 'state-box';
      systemStateBox.style.background = 'rgba(0, 242, 254, 0.1)';
      systemStateBox.style.color = 'var(--color-cyan)';
      systemStateBox.style.border = '1px solid var(--color-cyan)';
      systemStateBox.textContent = 'POST_IGNITION';
      
      globalStatusDot.className = 'status-dot';
      globalStatusDot.style.background = 'var(--color-cyan)';
      globalStatusDot.style.boxShadow = '0 0 8px var(--color-cyan)';
      
      globalStatusLbl.textContent = 'COOLING';
      globalStatusLbl.style.color = 'var(--color-cyan)';
      
      btnArm.disabled = false;
      btnFire.disabled = true;
      btnAbort.disabled = true;
      loggingStatusLbl.textContent = 'SAVED';
    }
  }

  // ARM Action Trigger
  btnArm.addEventListener('click', () => {
    if (systemState !== STATE_SAFE && systemState !== STATE_POST_IGNITION) return;
    
    printTerm("ARM", "cmd");
    printTerm("Initiating system arming protocol sequence...", "log");
    
    // Simulate continuity verification delay
    setTimeout(() => {
      printTerm("Checking igniter loop continuity values...", "log");
      setTimeout(() => {
        printTerm("IGN_LOOP_A check: continuity valid (5.12V, R=1.2Ω)", "success");
        printTerm("IGN_LOOP_B check: continuity valid (5.08V, R=1.1Ω)", "success");
        
        // Check thermocouple states
        printTerm("Checking 11x K-type thermocouple nodes...", "log");
        printTerm("Nodes TC_01 - TC_10 showing standard baseline continuity.", "success");
        printTerm("Node TC_11: [OPEN CIRCUIT ERROR] - flagged & software bypassed.", "err");
        
        systemState = STATE_ARMED;
        updateSystemStateUI();
        printTerm("SYSTEM TRANSITION: STATE = SYSTEM_ARMED. Firing safety relay unlocked.", "armed");
      }, 600);
    }, 400);
  });

  // IGNITION Firing Engine
  btnFire.addEventListener('click', () => {
    if (systemState !== STATE_ARMED) return;
    
    printTerm("FIR", "cmd");
    printTerm("Safety key verified. Activating firing relays in 3, 2, 1...", "armed");
    
    setTimeout(() => {
      systemState = STATE_IGNITION;
      updateSystemStateUI();
      printTerm("IGNITION SIGNAL DETECTED. Ignition relay latch closed.", "success");
      
      // Initialize dynamic logging loop
      telemetryTime = 0;
      burnData = [];
      
      let peakThrust = 0;
      let peakPressure = 0;
      
      telemetryInterval = setInterval(() => {
        telemetryTime += 100; // Increment by 100ms (10 Hz rate)
        
        // Generate mathematical motor curve
        // Standard high-impulse solid propellant burn profile:
        // Peak thrust around 1.5s, progressive regress, burnout at 4.2s
        const t = telemetryTime / 1000; // in seconds
        let thrust = 0;
        let pressure = 0;
        
        if (t <= 0.2) {
          // Ignition transient spikes upward
          thrust = (t / 0.2) * 650;
        } else if (t <= 1.8) {
          // Progressive peak thrust
          const progress = (t - 0.2) / 1.6;
          thrust = 650 + Math.sin(progress * Math.PI / 2) * 280;
        } else if (t <= 3.8) {
          // Regressive burn phase
          const regress = (t - 1.8) / 2.0;
          thrust = 930 - regress * 600;
        } else if (t <= 4.5) {
          // Rapid burnout/slippage
          const burnout = (t - 3.8) / 0.7;
          thrust = 330 * (1 - burnout);
        } else {
          thrust = 0;
        }
        
        // Add subtle sensor noise (±3N)
        if (thrust > 0) {
          thrust += (Math.random() * 6 - 3);
          thrust = Math.max(0, parseFloat(thrust.toFixed(1)));
        } else {
          thrust = 0;
        }
        
        // Chamber Pressure is highly proportional to thrust
        pressure = parseFloat((thrust * 0.48 + (thrust > 0 ? Math.random() * 8 - 4 : 0)).toFixed(1));
        pressure = Math.max(0, pressure);
        
        // Track high points
        if (thrust > peakThrust) {
          peakThrust = thrust;
          peakThrustLbl.textContent = `${peakThrust.toFixed(1)} N`;
        }
        if (pressure > peakPressure) {
          peakPressure = pressure;
          peakPressureLbl.textContent = `${peakPressure.toFixed(1)} PSI`;
        }
        
        // Push frames
        burnData.push({ time: telemetryTime, thrust, pressure });
        
        // Update labels
        const secondsStr = (telemetryTime / 1000).toFixed(1);
        burnElapsed.textContent = `T+${secondsStr}s`;
        daqClockLbl.textContent = `00:0${Math.floor(t)}.${String(telemetryTime % 1000).slice(0,2)}`;
        
        // Spike Thermocouple Values dynamically
        // Throat and Nozzle Base spike massive heat
        // Combustion core peaks highest
        tcCurrent.forEach((base, idx) => {
          if (idx === 10) return; // Skip open circuit TC_11
          
          let targetMax = 27.0;
          if (idx === 0) targetMax = 320.0;       // Nozzle Base
          else if (idx === 1) targetMax = 880.0;  // Combustion lower
          else if (idx === 2) targetMax = 920.0;  // Combustion mid
          else if (idx === 3) targetMax = 840.0;  // Combustion upper
          else if (idx === 4) targetMax = 450.0;  // Throat entrance
          else if (idx === 5) targetMax = 1120.0; // Throat constriction (Highest heat velocity!)
          else if (idx === 6) targetMax = 290.0;  // Nozzle Bell
          else if (idx === 7) targetMax = 110.0;  // Casing Outer
          else if (idx === 8) targetMax = 95.0;   // Bulkhead Base
          else if (idx === 9) targetMax = 180.0;  // Igniter base
          
          if (t <= 4.5) {
            // Heat spreads exponentially during active burn
            const heatRatio = t / 4.5;
            tcCurrent[idx] = parseFloat((base + (targetMax - base) * Math.pow(heatRatio, 1.8)).toFixed(1));
          } else {
            // Post burn slow cooling curve
            const coolRatio = (t - 4.5) / 1.5;
            tcCurrent[idx] = parseFloat((targetMax - (targetMax - base) * coolRatio * 0.15).toFixed(1));
          }
          
          tcVals[idx].textContent = `${tcCurrent[idx]} °C`;
          
          // Color indicator & styling thresholds
          const barWidth = Math.min(100, Math.floor((tcCurrent[idx] / 1200) * 100));
          tcBars[idx].style.width = `${barWidth}%`;
          
          if (tcCurrent[idx] > 300) {
            tcNodes[idx].classList.add('hot');
            tcBars[idx].style.backgroundColor = 'var(--color-fire)';
          }
        });
        
        // Print 10 Hz Comma Separated CSV Frame
        // Format: T+ms, Thrust, PSI, TC_01...10, SYS_STATE
        const tempsCsv = tcCurrent.slice(0,10).map(v => v.toFixed(1)).join(',');
        const csvFrame = `${telemetryTime},${thrust.toFixed(1)},${pressure.toFixed(1)},${tempsCsv},3`;
        printTerm(csvFrame, "csv");
        
        // Re-draw chart
        drawChart();
        
        // Check for natural burn completion
        if (telemetryTime >= 6000) {
          clearInterval(telemetryInterval);
          systemState = STATE_POST_IGNITION;
          updateSystemStateUI();
          
          printTerm("MOTOR BURN COMPLETED. Cutoff confirmed. Transitioning states...", "log");
          printTerm("STATE MACHINE TRANSITION: POST_IGNITION (Cooling Active)", "log");
          printTerm("Automatically saving static fire flight logs locally...", "log");
          
          setTimeout(() => {
            printTerm("Flight log file generated successfully: /logs/VelR_StaticFire_EE24B013.csv", "success");
            igniterContinuityLbl.textContent = "OPEN (BURNT)";
            igniterContinuityLbl.className = "sys-val-num alert";
          }, 800);
        }
      }, 100);
      
    }, 500);
  });

  // ABORT SAFETY ROUTINE Engage
  btnAbort.addEventListener('click', () => {
    printTerm("DAR", "cmd");
    printTerm("ABORT SEQUENCE TRIGGERED! ENGAGING FIRING DECK KILL SWITCH...", "err");
    
    if (telemetryInterval) {
      clearInterval(telemetryInterval);
    }
    
    systemState = STATE_SAFE;
    updateSystemStateUI();
    
    // Clear thrust and pressure
    burnData = [];
    drawChart();
    
    // Update dashboard readings
    burnElapsed.textContent = "T+0.0s";
    daqClockLbl.textContent = "00:00.00";
    igniterContinuityLbl.textContent = "OPEN (ABORTED)";
    igniterContinuityLbl.className = "sys-val-num alert";
    
    printTerm("HARDWARE SAFE INITIATED. Firing relay locked. Continuity loop disconnected.", "err");
    printTerm("SYSTEM TRANSITION: STATE = SYSTEM_SAFE", "success");
  });

  // ==========================================================================
  // INTERACTIVE DOS TERMINAL EMULATOR
  // ==========================================================================
  const terminalFrame = document.getElementById('interactive-dos-terminal');
  const dosHistory = document.getElementById('dos-history');
  const dosPrompt = document.getElementById('dos-prompt');
  const dosTypedText = document.getElementById('dos-typed-text');
  const dosHiddenInput = document.getElementById('dos-hidden-input');

  let currentDir = 'C:\\Users';

  function escapeHtml(text) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, function(m) { return map[m]; });
  }

  function appendOutput(content, isGreen = false) {
    const line = document.createElement('div');
    line.className = 'console-output-text';
    if (isGreen) {
      line.style.color = '#00FF87';
      line.style.fontFamily = 'var(--font-mono)';
      line.style.lineHeight = '1.3';
    } else {
      line.style.color = '#8E9AA8';
    }
    line.innerHTML = content;
    dosHistory.appendChild(line);
    dosHistory.scrollTop = dosHistory.scrollHeight;
  }

  if (terminalFrame && dosHiddenInput) {
    // Focus invisible input on terminal container click
    terminalFrame.addEventListener('click', () => {
      dosHiddenInput.focus();
    });

    // Keyboard sync typed characters
    dosHiddenInput.addEventListener('input', () => {
      dosTypedText.textContent = dosHiddenInput.value;
    });

    // Handle backspace or scroll to view active input
    dosHiddenInput.addEventListener('focus', () => {
      terminalFrame.style.borderColor = 'rgba(0, 242, 254, 0.4)';
      terminalFrame.style.boxShadow = '0 0 15px rgba(0, 242, 254, 0.1)';
    });

    dosHiddenInput.addEventListener('blur', () => {
      terminalFrame.style.borderColor = 'rgba(0, 242, 254, 0.2)';
      terminalFrame.style.boxShadow = 'none';
    });

    dosHiddenInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const rawInput = dosHiddenInput.value;
        const inputTrimmed = rawInput.trim();
        const cmdParts = inputTrimmed.split(/\s+/);
        const command = cmdParts[0].toLowerCase();
        const arg = cmdParts.slice(1).join(' ');

        // 1. Add current line to history
        const line = document.createElement('div');
        line.className = 'console-input-row';
        line.style.display = 'flex';
        line.style.alignItems = 'flex-start';
        line.innerHTML = `<span class="console-prompt" style="margin-right: 0.5rem; font-weight: bold; color: var(--color-cyan); white-space: nowrap;">${dosPrompt.textContent}</span><span style="color: #FFF;">${escapeHtml(rawInput)}</span>`;
        dosHistory.appendChild(line);

        // 2. Process Command
        if (inputTrimmed !== '') {
          executeCommand(command, arg);
        } else {
          appendOutput('');
        }

        // 3. Clear Input
        dosHiddenInput.value = '';
        dosTypedText.textContent = '';
        dosHistory.scrollTop = dosHistory.scrollHeight;
      }
    });
  }

  function executeCommand(command, arg) {
    switch (command) {
      case 'help':
        appendOutput(`Available Commands:<br>
<span style="color: var(--color-cyan); font-weight: bold;">HELP</span>        - Display this menu of active commands<br>
<span style="color: var(--color-cyan); font-weight: bold;">DIR</span>         - List directory files & subfolders<br>
<span style="color: var(--color-cyan); font-weight: bold;">CD [path]</span>   - Change directory (e.g., 'cd /', 'cd WHO_AM_I', 'cd Users', 'cd ..')<br>
<span style="color: var(--color-cyan); font-weight: bold;">IDENT.BAT</span>   - Run System ID initialization sequence (only in C:\\WHO_AM_I)<br>
<span style="color: var(--color-cyan); font-weight: bold;">WHOAMI</span>      - Print technical developer profile<br>
<span style="color: var(--color-cyan); font-weight: bold;">CONTACT</span>     - Print full phone, email, github contact links<br>
<span style="color: var(--color-cyan); font-weight: bold;">CLS</span> / <span style="color: var(--color-cyan); font-weight: bold;">CLEAR</span> - Clear history buffer screen`);
        break;

      case 'cls':
      case 'clear':
        dosHistory.innerHTML = '';
        break;

      case 'whoami':
        appendOutput(`Gantla Venkata Sravan - Systems & Embedded Engineer | Control Systems<br>
B.Tech Electrical Engineering @ IIT Tirupati | Uptime Lead for high-reliability embedded platforms.`);
        break;

      case 'contact':
        appendOutput(`* PHONE    : <a href="tel:6305659884" style="color: var(--color-cyan);">+91 6305659884</a><br>
* EMAIL    : <a href="mailto:gvsravan007@gmail.com" style="color: var(--color-cyan);">gvsravan007@gmail.com</a><br>
* GITHUB   : <a href="https://github.com/sravangantla007" target="_blank" style="color: var(--color-cyan);">github.com/sravangantla007</a><br>
* LINKEDIN : <a href="https://www.linkedin.com/in/venkata-sravan-gantla-323144236/" target="_blank" style="color: var(--color-cyan);">LinkedIn Profile</a>`);
        break;

      case 'dir':
        if (currentDir === 'C:\\Users') {
          appendOutput(` Directory of C:\\Users<br><br>
2026-05-21  11:15 PM    &lt;DIR&gt;          .<br>
2026-05-21  11:15 PM    &lt;DIR&gt;          ..<br>
2026-05-21  11:15 PM    &lt;DIR&gt;          gvsra<br>
               0 File(s)              0 bytes<br>
               3 Dir(s)  345,122,816,000 bytes free`);
        } else if (currentDir === 'C:\\') {
          appendOutput(` Directory of C:\\<br><br>
2026-05-21  11:15 PM    &lt;DIR&gt;          Users<br>
2026-05-21  11:15 PM    &lt;DIR&gt;          WHO_AM_I<br>
               0 File(s)              0 bytes<br>
               2 Dir(s)  345,122,816,000 bytes free`);
        } else if (currentDir === 'C:\\WHO_AM_I') {
          appendOutput(` Directory of C:\\WHO_AM_I<br><br>
2026-05-21  11:15 PM    &lt;DIR&gt;          .<br>
2026-05-21  11:15 PM    &lt;DIR&gt;          ..<br>
2026-05-21  11:15 PM               438 ident.bat<br>
               1 File(s)            438 bytes<br>
               2 Dir(s)  345,122,816,000 bytes free`);
        }
        break;

      case 'cd':
        if (!arg) {
          appendOutput(currentDir);
          break;
        }

        const target = arg.trim().toLowerCase().replace(/\//g, '\\');

        if (target === '\\' || target === 'c:\\' || target === 'c:') {
          currentDir = 'C:\\';
          dosPrompt.textContent = 'C:\\>';
        } else if (target === '..' || target === 'cd..') {
          if (currentDir === 'C:\\WHO_AM_I' || currentDir === 'C:\\Users') {
            currentDir = 'C:\\';
            dosPrompt.textContent = 'C:\\>';
          }
        } else if (target === 'who_am_i' || target === '\\who_am_i' || target === 'c:\\who_am_i' || target === 'who_am_i\\') {
          currentDir = 'C:\\WHO_AM_I';
          dosPrompt.textContent = 'C:\\WHO_AM_I>';
        } else if (target === 'users' || target === '\\users' || target === 'c:\\users' || target === 'users\\') {
          currentDir = 'C:\\Users';
          dosPrompt.textContent = 'C:\\Users>';
        } else if (target === 'gvsra' || target === 'users\\gvsra' || target === '\\users\\gvsra' || target === 'c:\\users\\gvsra' || target === 'gvsra\\') {
          if ((currentDir === 'C:\\Users' && target === 'gvsra') || target.includes('users')) {
            appendOutput('Access Denied: encrypted system sector.');
          } else {
            appendOutput('The system cannot find the path specified.');
          }
        } else {
          appendOutput('The system cannot find the path specified.');
        }
        break;

      case 'ident':
      case 'ident.bat':
        if (currentDir !== 'C:\\WHO_AM_I') {
          appendOutput(`<span style="color: #4F5E71;">Resolving environment PATH: C:\\WHO_AM_I\\ident.bat...</span>`);
        }
        appendOutput(`=============================<br>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;SYSTEM ID<br>
=============================<br>
Ident&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: SRAVAN<br>
Signature&nbsp;&nbsp;&nbsp;: Carbon-Based Neural Engine<br>
Origin&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: Terra, Land of the Saffron Veil (Sol System)<br>
Instantiated: +1.1527722E9 post Unix-Epoch<br>
Synchronized: +1.7422362E9<br>
Architecture: Synaptic enigma, self-evolving<br>
Mission&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: Weaving cognition from chaos<br>
Status&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: Active<br>
=============================`, true);

        setTimeout(() => {
          appendOutput(`* PHONE: <a href="tel:6305659884" style="color: var(--color-cyan);">+91 6305659884</a><br>
* EMAIL: <a href="mailto:gvsravan007@gmail.com" style="color: var(--color-cyan);">gvsravan007@gmail.com</a><br>
* GITHUB: <a href="https://github.com/sravangantla007" target="_blank" style="color: var(--color-cyan);">github.com/sravangantla007</a><br>
* LINKEDIN: <a href="https://www.linkedin.com/in/venkata-sravan-gantla-323144236/" target="_blank" style="color: var(--color-cyan);">LinkedIn Profile</a>`);
        }, 400);
        break;

      default:
        appendOutput(`'${escapeHtml(command)}' is not recognized as an internal or external command,<br>
operable program or batch file. Type <span style="color: var(--color-cyan); font-weight: bold;">help</span> for active commands.`);
    }
  }

});
