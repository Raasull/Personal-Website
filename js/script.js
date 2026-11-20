const revealTargets = document.querySelectorAll("[data-reveal]");
const siteHeader = document.querySelector(".site-header");

document.addEventListener("DOMContentLoaded", () => {
  const currentPage = window.location.pathname.split("/").pop().toLowerCase();
  const shouldActivateProjects = currentPage === "projects.html" || /^project-.+\.html$/.test(currentPage);

  document.querySelectorAll(".site-nav").forEach((nav) => {
    const pill = nav.querySelector(".nav-pill");
    const links = nav.querySelectorAll(".nav-link");
    if (shouldActivateProjects) {
      links.forEach((link) => {
        const isProjectsLink = link.textContent.trim() === "Projects";
        link.classList.toggle("active", isProjectsLink);
        if (isProjectsLink) {
          link.setAttribute("aria-current", "page");
        } else {
          link.removeAttribute("aria-current");
        }
      });
    }

    const activeLink = nav.querySelector(".nav-link.active");
    let hoveredLink = null;

    if (!pill || !activeLink) {
      return;
    }

    function movePill(target) {
      if (!target) return;
      pill.style.width = `${target.offsetWidth}px`;
      pill.style.transform = `translateX(${target.offsetLeft}px)`;
    }

    pill.style.transition = "none";
    movePill(activeLink);
    pill.getBoundingClientRect();
    pill.style.removeProperty("transition");
    nav.classList.add("is-ready");

    const updatePill = () => movePill(hoveredLink || activeLink);

    links.forEach((link) => {
      link.addEventListener("pointerenter", () => {
        hoveredLink = link;
        movePill(link);
      });
      link.addEventListener("click", () => {
        hoveredLink = link;
        movePill(link);
      });
    });

    nav.addEventListener("pointerleave", () => {
      hoveredLink = nav.contains(document.activeElement) && document.activeElement instanceof HTMLAnchorElement
        ? document.activeElement
        : null;
      updatePill();
    });

    nav.addEventListener("focusin", (event) => {
      if (event.target instanceof HTMLAnchorElement) {
        hoveredLink = event.target;
        movePill(event.target);
      }
    });

    nav.addEventListener("focusout", (event) => {
      if (!nav.contains(event.relatedTarget)) {
        hoveredLink = null;
        updatePill();
      }
    });

    window.addEventListener("resize", updatePill);
  });
});

if (siteHeader) {
  const updateHeader = () => {
    siteHeader.classList.toggle("is-scrolled", window.scrollY > 8);
  };

  window.addEventListener("scroll", updateHeader, { passive: true });
  updateHeader();
}

if ("IntersectionObserver" in window && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
      .forEach((entry, index) => {
        entry.target.style.setProperty("--reveal-delay", `${index * 90}ms`);
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
  }, {
    threshold: 0.01,
    rootMargin: "0px"
  });

  document.documentElement.classList.add("reveal-ready");
  revealTargets.forEach((target) => revealObserver.observe(target));
}

const questList = document.querySelector(".quest-list");

if (questList) {
  const items = [...questList.querySelectorAll("[data-quest-item]")];
  const action = document.querySelector("[data-quest-action]");
  const xpCounter = document.querySelector("[data-quest-xp]");
  const percentCounter = document.querySelector("[data-quest-percent]");
  const rankTitle = document.querySelector("[data-quest-rank]");
  const progress = document.querySelector(".quest-progress");
  const progressFill = document.querySelector("[data-quest-fill]");
  const completion = document.querySelector("[data-quest-complete]");

  function updateProgress() {
    const completedCount = items.filter((item) => item.classList.contains("completed")).length;
    const xp = completedCount * 25;
    const percent = xp;
    const level = Math.min(4, Math.floor(xp / 25) + 1);
    const ranks = ["OBSERVER", "EXPLORER", "MAKER", "BUILDER"];
    const allCompleted = completedCount === items.length;

    xpCounter.textContent = `${xp} / 100 XP`;
    percentCounter.textContent = `${percent}%`;
    rankTitle.textContent = `LVL ${String(level).padStart(2, "0")} — ${ranks[level - 1]}`;
    progress.setAttribute("aria-valuenow", String(percent));
    progressFill.style.width = `${percent}%`;
    progressFill.classList.toggle("is-complete", allCompleted);
    action.textContent = allCompleted ? "Reset" : "Expand All";
    completion.classList.toggle("is-visible", allCompleted);
    completion.setAttribute("aria-hidden", String(!allCompleted));
  }

  function setQuestCompleted(item, completed) {
    const trigger = item.querySelector(".quest-trigger");
    item.classList.toggle("completed", completed);
    trigger.setAttribute("aria-checked", String(completed));
    trigger.setAttribute("aria-expanded", String(completed));
  }

  items.forEach((item) => {
    item.addEventListener("click", () => {
      setQuestCompleted(item, !item.classList.contains("completed"));
      updateProgress();
    });
  });

  action.addEventListener("click", () => {
    const shouldComplete = items.some((item) => !item.classList.contains("completed"));
    items.forEach((item) => setQuestCompleted(item, shouldComplete));
    updateProgress();
  });
}

const frequencyTuner = document.querySelector("[data-frequency-tuner]");

if (frequencyTuner) {
  const slider = frequencyTuner.querySelector("#frequency-slider");
  const frequencyReadout = frequencyTuner.querySelector("[data-frequency-readout]");
  const lockReadout = frequencyTuner.querySelector("[data-lock-count]");
  const signalState = frequencyTuner.querySelector("[data-signal-state]");
  const signalLabel = frequencyTuner.querySelector("[data-signal-label]");
  const progress = frequencyTuner.querySelector("[data-frequency-progress]");
  const progressFill = frequencyTuner.querySelector("[data-frequency-progress-fill]");
  const decryptAllButton = frequencyTuner.querySelector("[data-decrypt-all]");
  const audioToggle = frequencyTuner.querySelector("[data-audio-toggle]");
  const completionBanner = frequencyTuner.querySelector("[data-frequency-complete]");
  const canvas = frequencyTuner.querySelector("[data-signal-scope]");
  const profileCards = [...frequencyTuner.querySelectorAll("[data-profile-card]")];
  const notches = [...frequencyTuner.querySelectorAll("[data-target-frequency]")];
  const lockedFrequencies = new Set();
  const targets = profileCards.map((card) => ({
    frequency: Number(card.dataset.profileFrequency),
    card
  }));
  const audioContextConstructor = window.AudioContext || window.webkitAudioContext;
  const canvasContext = canvas.getContext("2d");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let signalClarity = 0;
  let audioEnabled = false;
  let audioContext = null;
  let canvasWidth = 0;
  let canvasHeight = 160;

  function formatFrequency(value) {
    return `${Number(value).toFixed(1)} MHz`;
  }

  function playLockTone() {
    if (!audioEnabled || !audioContext) return;

    const startTime = audioContext.currentTime;
    const oscillator = audioContext.createOscillator();
    const volume = audioContext.createGain();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(480, startTime);
    oscillator.frequency.exponentialRampToValueAtTime(760, startTime + 0.2);
    volume.gain.setValueAtTime(0.0001, startTime);
    volume.gain.exponentialRampToValueAtTime(0.035, startTime + 0.035);
    volume.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.75);
    oscillator.connect(volume);
    volume.connect(audioContext.destination);
    oscillator.start(startTime);
    oscillator.stop(startTime + 0.76);
  }

  function updateDecryptButton() {
    const allDecrypted = profileCards.every((card) => card.classList.contains("is-decrypted"));
    decryptAllButton.setAttribute("aria-pressed", String(allDecrypted));
    decryptAllButton.textContent = allDecrypted
      ? "ALL CHANNELS DECRYPTED"
      : "Decrypt All / Standard View";
    decryptAllButton.disabled = allDecrypted;
  }

  function flashCard(card) {
    card.classList.add("is-newly-unlocked");
    window.setTimeout(() => card.classList.remove("is-newly-unlocked"), 700);
  }

  function decryptCard(card) {
    if (card.classList.contains("is-decrypted")) return false;

    card.classList.add("is-decrypted");
    card.querySelector(".profile-card-content").setAttribute("aria-hidden", "false");
    card.querySelector("[data-decrypt-badge]").setAttribute("aria-hidden", "true");
    updateDecryptButton();
    return true;
  }

  function updateLockedProgress() {
    const count = lockedFrequencies.size;
    const complete = count === targets.length;
    lockReadout.textContent = `${count}/${targets.length}`;
    progress.setAttribute("aria-valuenow", String(count));
    progress.setAttribute("aria-valuetext", `${count} of ${targets.length} profile frequencies synchronized`);
    progressFill.style.width = `${(count / targets.length) * 100}%`;
    completionBanner.classList.toggle("is-visible", complete);
    completionBanner.setAttribute("aria-hidden", String(!complete));
  }

  function updateTuner() {
    const frequency = Number(slider.value);
    const nearestTarget = targets.reduce((nearest, target) => {
      return Math.abs(target.frequency - frequency) < Math.abs(nearest.frequency - frequency)
        ? target
        : nearest;
    }, targets[0]);
    const distance = Math.abs(nearestTarget.frequency - frequency);
    const isLocked = distance <= 0.4000001;

    frequencyReadout.textContent = formatFrequency(frequency);
    slider.setAttribute("aria-valuetext", `${frequency.toFixed(1)} megahertz`);

    signalClarity = isLocked
      ? 1
      : Math.max(0, 1 - distance / 1.25);
    signalClarity = signalClarity * signalClarity * (3 - 2 * signalClarity);
    signalState.classList.toggle("is-locked", isLocked);
    signalLabel.textContent = isLocked ? "LOCKED // 100% CLARITY" : "SIGNAL: NOISY";

    notches.forEach((notch) => {
      const targetFrequency = Number(notch.dataset.targetFrequency);
      const isTargetActive = Math.abs(targetFrequency - frequency) <= 1.25;
      const isTargetLocked = lockedFrequencies.has(targetFrequency);
      notch.classList.toggle("is-active", isTargetActive);
      notch.classList.toggle("is-locked", isTargetLocked);
      notch.setAttribute("aria-pressed", String(isTargetLocked));
    });

    if (isLocked && !lockedFrequencies.has(nearestTarget.frequency)) {
      lockedFrequencies.add(nearestTarget.frequency);
      decryptCard(nearestTarget.card);
      flashCard(nearestTarget.card);
      updateLockedProgress();
      playLockTone();
    }

    if (isLocked) {
      nearestTarget.card.classList.add("is-decrypted");
    }

    if (reducedMotion.matches) drawSignal(0);
  }

  function resizeCanvas() {
    if (!canvasContext) return;

    const bounds = canvas.getBoundingClientRect();
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    canvasWidth = bounds.width;
    canvasHeight = bounds.height;
    canvas.width = Math.round(canvasWidth * pixelRatio);
    canvas.height = Math.round(canvasHeight * pixelRatio);
    canvasContext.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    drawSignal(0);
  }

  function drawSignal(timestamp) {
    if (!canvasContext || canvasWidth === 0) return;

    const now = reducedMotion.matches ? 0 : timestamp;
    const centerY = canvasHeight / 2;
    canvasContext.clearRect(0, 0, canvasWidth, canvasHeight);

    canvasContext.lineWidth = 1;
    canvasContext.strokeStyle = "rgba(255, 255, 255, 0.055)";
    canvasContext.beginPath();
    for (let x = 0; x <= canvasWidth; x += 48) {
      canvasContext.moveTo(x, 0);
      canvasContext.lineTo(x, canvasHeight);
    }
    for (let y = 16; y < canvasHeight; y += 32) {
      canvasContext.moveTo(0, y);
      canvasContext.lineTo(canvasWidth, y);
    }
    canvasContext.stroke();

    canvasContext.strokeStyle = "rgba(255, 255, 255, 0.12)";
    canvasContext.beginPath();
    canvasContext.moveTo(0, centerY);
    canvasContext.lineTo(canvasWidth, centerY);
    canvasContext.stroke();

    const noiseAmount = 1 - signalClarity;
    const amplitude = canvasHeight * 0.22;
    canvasContext.beginPath();
    for (let x = 0; x <= canvasWidth; x += 2) {
      const harmonic = Math.sin(x * 0.025 + now * 0.0015) * amplitude;
      const staticNoise = (
        Math.sin(x * 1.55 + now * 0.027) * 0.52
        + Math.sin(x * 4.7 - now * 0.035) * 0.31
        + Math.sin(x * 10.8 + now * 0.075) * 0.17
      ) * noiseAmount * 11;
      const y = centerY + harmonic + staticNoise;
      if (x === 0) {
        canvasContext.moveTo(x, y);
      } else {
        canvasContext.lineTo(x, y);
      }
    }
    canvasContext.strokeStyle = "rgba(238, 238, 238, 0.9)";
    canvasContext.lineWidth = 1.45;
    canvasContext.shadowColor = "rgba(230, 230, 230, 0.7)";
    canvasContext.shadowBlur = 3 + signalClarity * 9;
    canvasContext.stroke();
    canvasContext.shadowBlur = 0;

    if (!reducedMotion.matches) {
      window.requestAnimationFrame(drawSignal);
    }
  }

  slider.addEventListener("input", updateTuner);
  notches.forEach((notch) => {
    notch.addEventListener("click", () => {
      slider.value = notch.dataset.targetFrequency;
      slider.dispatchEvent(new Event("input", { bubbles: true }));
    });
  });

  decryptAllButton.addEventListener("click", () => {
    profileCards.forEach(decryptCard);
  });

  if (audioContextConstructor) {
    audioToggle.addEventListener("click", () => {
      audioEnabled = !audioEnabled;
      if (audioEnabled) {
        audioContext = audioContext || new audioContextConstructor();
        if (audioContext.state === "suspended") audioContext.resume();
      }
      audioToggle.setAttribute("aria-pressed", String(audioEnabled));
      audioToggle.textContent = `AUDIO: ${audioEnabled ? "ON" : "OFF"}`;
    });
  } else {
    audioToggle.disabled = true;
    audioToggle.title = "Web Audio is not available in this browser.";
  }

  if ("ResizeObserver" in window) {
    new ResizeObserver(resizeCanvas).observe(canvas);
  } else {
    window.addEventListener("resize", resizeCanvas);
  }

  updateTuner();
  updateLockedProgress();
  resizeCanvas();
}
