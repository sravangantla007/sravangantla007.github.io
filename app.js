/* ==========================================================================
   SYSTEM CONTROL DECK - ENGINE INTERACTION
   Author: Gantla Venkata Sravan
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  
  // ==========================================================================
  // FLOATING COSMIC STAR PARTICLE FIELD ENGINE
  // ==========================================================================
  const canvas = document.getElementById('star-field-canvas');
  const ctx = canvas.getContext('2d');
  
  let stars = [];
  const maxStars = 85;
  
  function resizeStarfield() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  
  window.addEventListener('resize', resizeStarfield);
  resizeStarfield();
  
  // Populate initial stars - strictly Red, Yellow, and White
  for (let i = 0; i < maxStars; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 1.5 + 0.2,
      color: Math.random() > 0.85 ? 'rgba(255, 51, 85, 0.75)' : Math.random() > 0.92 ? 'rgba(255, 183, 0, 0.75)' : 'rgba(255, 255, 255, 0.75)',
      speedX: (Math.random() * 0.1 - 0.05),
      speedY: (Math.random() * 0.1 - 0.05)
    });
  }
  
  function animateStars() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    stars.forEach(star => {
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
      ctx.fillStyle = star.color;
      ctx.fill();
      
      // Move star
      star.x += star.speedX;
      star.y += star.speedY;
      
      // Screen wrap
      if (star.x < 0) star.x = canvas.width;
      if (star.x > canvas.width) star.x = 0;
      if (star.y < 0) star.y = canvas.height;
      if (star.y > canvas.height) star.y = 0;
    });
    
    requestAnimationFrame(animateStars);
  }
  
  animateStars();

  // ==========================================================================
  // DYNAMIC COUNTER METRICS ANIMATION (CGPA)
  // ==========================================================================
  const cgpaCounter = document.getElementById('cgpa-count');
  const targetCGPA = 8.29;
  let currentCGPA = 0;
  
  const cgpaInterval = setInterval(() => {
    currentCGPA += 0.15;
    if (currentCGPA >= targetCGPA) {
      currentCGPA = targetCGPA;
      clearInterval(cgpaInterval);
    }
    cgpaCounter.textContent = currentCGPA.toFixed(2);
  }, 25);

  // ==========================================================================
  // INTERACTIVE PORTABLE DOS SHELL EMULATOR
  // ==========================================================================
  const termAnchor = document.getElementById('terminal-click-anchor');
  const termScrollView = document.getElementById('terminal-scroll-view');
  const termPrompt = document.getElementById('terminal-prompt-node');
  const termTypedText = document.getElementById('terminal-visible-typed-text');
  const termHiddenInput = document.getElementById('terminal-hidden-input-field');
  const termHistoryList = document.getElementById('terminal-history-list');
  
  let termCurrentDir = 'C:\\SRAVAN';
  
  function escapeHtmlChars(text) {
    const escapeMap = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => escapeMap[m]);
  }
  
  function printTerminalLine(content, isColorStyle = false) {
    const lineElement = document.createElement('div');
    lineElement.className = 'terminal-line-row';
    if (isColorStyle) {
      lineElement.style.color = '#ffb700'; // Warm yellow output matching theme
      lineElement.style.fontFamily = 'var(--font-mono)';
      lineElement.style.lineHeight = '1.35';
    } else {
      lineElement.style.color = '#cbd5e1';
    }
    lineElement.innerHTML = content;
    termHistoryList.appendChild(lineElement);
    termScrollView.scrollTop = termScrollView.scrollHeight;
  }
  
  if (termAnchor && termHiddenInput) {
    termAnchor.addEventListener('click', () => {
      termHiddenInput.focus();
    });
    
    termHiddenInput.addEventListener('input', () => {
      termTypedText.textContent = termHiddenInput.value;
    });
    
    termHiddenInput.addEventListener('focus', () => {
      termAnchor.style.borderColor = 'rgba(255, 51, 85, 0.45)';
      termAnchor.style.boxShadow = '0 0 25px rgba(255, 51, 85, 0.15)';
    });
    
    termHiddenInput.addEventListener('blur', () => {
      termAnchor.style.borderColor = 'rgba(255, 51, 85, 0.15)';
      termAnchor.style.boxShadow = 'none';
    });
    
    termHiddenInput.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        const rawString = termHiddenInput.value;
        const trimmedStr = rawString.trim();
        const splitParts = trimmedStr.split(/\s+/);
        const inputCommandName = splitParts[0].toLowerCase();
        const commandArg = splitParts.slice(1).join(' ');
        
        // Print executed command row
        const executedRow = document.createElement('div');
        executedRow.className = 'term-typed-cmd-line';
        executedRow.style.marginTop = '0.5rem';
        executedRow.innerHTML = `<span class="term-prompt-marker">${termPrompt.textContent}</span><span style="color: #ffffff; font-weight: bold;">${escapeHtmlChars(rawString)}</span>`;
        termHistoryList.appendChild(executedRow);
        
        if (trimmedStr !== '') {
          runInterpretedCommand(inputCommandName, commandArg);
        } else {
          printTerminalLine('');
        }
        
        // Reset hidden fields
        termHiddenInput.value = '';
        termTypedText.textContent = '';
        termScrollView.scrollTop = termScrollView.scrollHeight;
      }
    });
  }
  
  function runInterpretedCommand(cmdName, argument) {
    switch (cmdName) {
      case 'help':
        printTerminalLine(`Active Terminal Commands:<br>
<span style="color: var(--accent-yellow); font-weight: bold;">HELP</span>         - Display terminal commands list.<br>
<span style="color: var(--accent-yellow); font-weight: bold;">DIR</span>          - List directory subfolders & files.<br>
<span style="color: var(--accent-yellow); font-weight: bold;">CD [directory]</span>- Change prompt folder (e.g. 'cd /', 'cd WHO_AM_I', 'cd ..')<br>
<span style="color: var(--accent-yellow); font-weight: bold;">IDENT.BAT</span>    - Run developer signature profile (in C:\\WHO_AM_I folder).<br>
<span style="color: var(--accent-yellow); font-weight: bold;">WHOAMI</span>       - Print technical engineer overview.<br>
<span style="color: var(--accent-yellow); font-weight: bold;">CONTACT</span>      - Print direct contact credentials.<br>
<span style="color: var(--accent-yellow); font-weight: bold;">CLS</span> / <span style="color: var(--accent-yellow); font-weight: bold;">CLEAR</span>  - Clear scrolling terminal buffer.`);
        break;
        
      case 'cls':
      case 'clear':
        termHistoryList.innerHTML = '';
        break;
        
      case 'whoami':
        printTerminalLine(`Gantla Venkata Sravan - B.Tech Electrical Engineering student at IIT Tirupati.<br>
Systems & Embedded Systems Engineer | Future AI Trajectory Focus.`);
        break;
        
      case 'contact':
        printTerminalLine(`* PHONE    : <a href="tel:6305659884" style="color: var(--accent-yellow);">+91 6305659884</a><br>
* EMAIL    : <a href="mailto:gvsravan007@gmail.com" style="color: var(--accent-yellow);">gvsravan007@gmail.com</a><br>
* GITHUB   : <a href="https://github.com/sravangantla007" target="_blank" style="color: var(--accent-yellow);">github.com/sravangantla007</a><br>
* LINKEDIN : <a href="https://www.linkedin.com/in/venkata-sravan-gantla-323144236/" target="_blank" style="color: var(--accent-yellow);">LinkedIn Profile</a>`);
        break;
        
      case 'dir':
        if (termCurrentDir === 'C:\\SRAVAN') {
          printTerminalLine(` Directory of C:\\SRAVAN<br><br>
2026-05-27  11:20 AM    &lt;DIR&gt;          .<br>
2026-05-27  11:20 AM    &lt;DIR&gt;          ..<br>
               0 File(s)              0 bytes
               2 Dir(s)  512,118,784,000 bytes free`);
        } else if (termCurrentDir === 'C:\\') {
          printTerminalLine(` Directory of C:\\<br><br>
2026-05-27  11:20 AM    &lt;DIR&gt;          SRAVAN<br>
2026-05-27  11:20 AM    &lt;DIR&gt;          WHO_AM_I<br>
               0 File(s)              0 bytes
               2 Dir(s)  512,118,784,000 bytes free`);
        } else if (termCurrentDir === 'C:\\WHO_AM_I') {
          printTerminalLine(` Directory of C:\\WHO_AM_I<br><br>
2026-05-27  11:20 AM    &lt;DIR&gt;          .<br>
2026-05-27  11:20 AM    &lt;DIR&gt;          ..<br>
2026-05-27  11:20 AM               438 IDENT.BAT<br>
               1 File(s)            438 bytes
               2 Dir(s)  512,118,784,000 bytes free`);
        }
        break;
        
      case 'cd':
        if (!argument) {
          printTerminalLine(termCurrentDir);
          break;
        }
        
        const targetDirClean = argument.trim().toLowerCase().replace(/\//g, '\\');
        
        if (targetDirClean === '\\' || targetDirClean === 'c:\\' || targetDirClean === 'c:') {
          termCurrentDir = 'C:\\';
          termPrompt.textContent = 'C:\\>';
        } else if (targetDirClean === '..' || targetDirClean === 'cd..') {
          if (termCurrentDir === 'C:\\WHO_AM_I' || termCurrentDir === 'C:\\SRAVAN') {
            termCurrentDir = 'C:\\';
            termPrompt.textContent = 'C:\\>';
          }
        } else if (targetDirClean === 'who_am_i' || targetDirClean === '\\who_am_i' || targetDirClean === 'c:\\who_am_i' || targetDirClean === 'who_am_i\\') {
          termCurrentDir = 'C:\\WHO_AM_I';
          termPrompt.textContent = 'C:\\WHO_AM_I>';
        } else if (targetDirClean === 'sravan' || targetDirClean === '\\sravan' || targetDirClean === 'c:\\sravan' || targetDirClean === 'sravan\\') {
          termCurrentDir = 'C:\\SRAVAN';
          termPrompt.textContent = 'C:\\SRAVAN>';
        } else {
          printTerminalLine('The system cannot find the path specified.');
        }
        break;
        
      case 'ident':
      case 'ident.bat':
        if (termCurrentDir !== 'C:\\WHO_AM_I') {
          printTerminalLine(`<span style="color: #64748b;">Resolving environment PATH: C:\\WHO_AM_I\\ident.bat...</span>`);
        }
        printTerminalLine(`=============================<br>
       SYSTEM ID<br>
=============================<br>
Ident       : SRAVAN<br>
Signature   : Carbon-Based Neural Engine<br>
Origin      : Terra, Land of the Saffron Veil (Sol System)<br>
Instantiated: +1.1527722E9 post Unix-Epoch<br>
Synchronized: +1.7422362E9<br>
Architecture: Synaptic enigma, self-evolving<br>
Mission     : Weaving cognition from chaos<br>
Status      : Active<br>
=============================`, true);
        
        setTimeout(() => {
          printTerminalLine(`* PHONE: <a href="tel:6305659884" style="color: var(--accent-yellow);">+91 6305659884</a><br>
* EMAIL: <a href="mailto:gvsravan007@gmail.com" style="color: var(--accent-yellow);">gvsravan007@gmail.com</a><br>
* GITHUB: <a href="https://github.com/sravangantla007" target="_blank" style="color: var(--accent-yellow);">github.com/sravangantla007</a><br>
* LINKEDIN: <a href="https://www.linkedin.com/in/venkata-sravan-gantla-323144236/" target="_blank" style="color: var(--accent-yellow);">LinkedIn Profile</a>`);
        }, 350);
        break;
        
      default:
        printTerminalLine(`'${escapeHtmlChars(cmdName)}' is not recognized as an internal or external command,<br>
operable program or batch file. Type <span style="color: var(--accent-yellow); font-weight: bold;">help</span> for active commands.`);
    }
  }

});
