// Interactive Web Audio Synthesizer for Celebration Events
let audioCtx: AudioContext | null = null;
let bgNode: OscillatorNode | null = null;
let bgGain: GainNode | null = null;

function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
}

// Play balloon pop sound
export function playPopSound() {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.type = "sine";
    // Quick pitch drop representing air popping out
    osc.frequency.setValueAtTime(400, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.15);
    
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.15);
  } catch (err) {
    console.warn("Audio Context blocked or failed:", err);
  }
}

// Play fireplace crackle or cozy soft crackle
export function playCozySpark() {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.type = "triangle";
    osc.frequency.setValueAtTime(880 + Math.random() * 400, ctx.currentTime);
    
    gain.gain.setValueAtTime(0.05, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.05);
  } catch (err) {}
}

// Play giant celebratory firework burst sound
export function playCelebrationBurst() {
  try {
    const ctx = getAudioContext();
    
    // Low rumble boom
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    
    osc1.type = "sawtooth";
    osc1.frequency.setValueAtTime(150, ctx.currentTime);
    osc1.frequency.linearRampToValueAtTime(30, ctx.currentTime + 0.6);
    
    gain1.gain.setValueAtTime(0.4, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    
    osc1.start();
    osc1.stop(ctx.currentTime + 0.6);
    
    // Crackle scatter sound shortly after
    for (let i = 0; i < 5; i++) {
      const delay = 0.1 + i * 0.08;
      setTimeout(() => {
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        
        osc2.type = "triangle";
        osc2.frequency.setValueAtTime(600 + Math.random() * 1000, ctx.currentTime);
        gain2.gain.setValueAtTime(0.08, ctx.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
        
        osc2.start();
        osc2.stop(ctx.currentTime + 0.08);
      }, delay * 1000);
    }
  } catch (err) {}
}

// Celebration Invitation Chiptune melody notes: [Note name, Duration multiplier of beat]
const MELODY: [string, number][] = [
  ["C5", 0.5], ["E5", 0.5], ["G5", 0.5], ["C6", 1.25],
  ["E5", 0.5], ["G5", 0.5], ["C6", 0.5], ["E6", 1.25],
  ["G5", 0.5], ["C6", 0.5], ["E6", 0.5], ["G6", 1.5],
  ["E6", 0.5], ["C6", 0.5], ["G5", 0.5], ["C6", 2]
];

const NOTE_FREQS: Record<string, number> = {
  "G4": 392.00, "A4": 440.00, "B4": 493.88, "C5": 523.25, "D5": 587.33,
  "E5": 659.25, "F5": 698.46, "G5": 783.99, "C6": 1046.50, "E6": 1318.51,
  "G6": 1567.98
};

// Play a single chiptune note
function playNote(freq: number, startTime: number, duration: number, type: OscillatorType = "triangle") {
  const ctx = getAudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.connect(gain);
  gain.connect(ctx.destination);
  
  osc.type = type;
  osc.frequency.setValueAtTime(freq, startTime);
  
  // Clean envelope: rapid attack, gentle decay
  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(0.18, startTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration - 0.02);
  
  osc.start(startTime);
  osc.stop(startTime + duration);
}

// Play full Invitation Theme Melody
export function playInvitationTheme() {
  try {
    const ctx = getAudioContext();
    const tempo = 140; // BPM
    const beatDuration = 60 / tempo;
    
    let timeOffset = ctx.currentTime;
    
    MELODY.forEach(([noteName, beats]) => {
      const freq = NOTE_FREQS[noteName];
      if (freq) {
        const duration = beats * beatDuration;
        playNote(freq, timeOffset, duration, "triangle");
        timeOffset += duration;
      }
    });
  } catch (err) {
    console.warn("Melody playback failed:", err);
  }
}

// Ambient Background synth pad
export function startAmbientBackground(theme: string) {
  try {
    const ctx = getAudioContext();
    stopAmbientBackground();
    
    bgNode = ctx.createOscillator();
    bgGain = ctx.createGain();
    
    bgNode.connect(bgGain);
    bgGain.connect(ctx.destination);
    
    let frequency = 220; // Default A3
    let waveType: OscillatorType = "sine";
    let volume = 0.05;
    
    switch (theme) {
      case "brutalist":
        frequency = 110; // low stark wave
        waveType = "triangle";
        volume = 0.03;
        break;
      case "acid":
        frequency = 130.81; // C3 retro synth vibe
        waveType = "sawtooth";
        volume = 0.015;
        break;
      case "swiss":
        frequency = 220; // Perfect tone A3
        waveType = "sine";
        volume = 0.05;
        break;
      case "sunset":
        frequency = 261.63; // Dreamy C4
        waveType = "sine";
        volume = 0.06;
        break;
      case "aurora":
        frequency = 73.42; // Deep space pad
        waveType = "sine";
        volume = 0.08;
        break;
    }
    
    bgNode.type = waveType;
    bgNode.frequency.setValueAtTime(frequency, ctx.currentTime);
    
    // Smooth fade-in
    bgGain.gain.setValueAtTime(0, ctx.currentTime);
    bgGain.gain.linearRampToValueAtTime(volume, ctx.currentTime + 3);
    
    bgNode.start();
  } catch (err) {}
}

export function stopAmbientBackground() {
  try {
    if (bgGain && audioCtx) {
      // Smooth fade-out before stopping to prevent pops
      const curTime = audioCtx.currentTime;
      bgGain.gain.cancelScheduledValues(curTime);
      bgGain.gain.setValueAtTime(bgGain.gain.value, curTime);
      bgGain.gain.exponentialRampToValueAtTime(0.001, curTime + 0.8);
      
      const nodeToStop = bgNode;
      setTimeout(() => {
        try {
          nodeToStop?.stop();
        } catch (e) {}
      }, 900);
    }
  } catch (err) {}
  bgNode = null;
  bgGain = null;
}
