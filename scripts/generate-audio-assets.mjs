import fs from 'node:fs';
import path from 'node:path';

const outDir = path.resolve('apps/web/public/assets/audio');
fs.mkdirSync(outDir, { recursive: true });

const sampleRate = 22050;
let seed = 0x51f15e;

function rand() {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 0xffffffff;
}

function clamp(sample) {
  return Math.max(-1, Math.min(1, sample));
}

function envelope(t, duration, attack = 0.02, release = 0.08) {
  const fadeIn = Math.min(1, t / attack);
  const fadeOut = Math.min(1, (duration - t) / release);
  return Math.max(0, Math.min(fadeIn, fadeOut));
}

function lowpass(samples, amount = 0.92) {
  let held = 0;
  for (let i = 0; i < samples.length; i += 1) {
    held = held * amount + samples[i] * (1 - amount);
    samples[i] = held;
  }
  return samples;
}

function writeWav(name, samples) {
  const dataLength = samples.length * 2;
  const buffer = Buffer.alloc(44 + dataLength);
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataLength, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataLength, 40);

  for (let i = 0; i < samples.length; i += 1) {
    buffer.writeInt16LE(Math.round(clamp(samples[i]) * 32767), 44 + i * 2);
  }

  fs.writeFileSync(path.join(outDir, name), buffer);
}

function makeWind(durationSeconds) {
  const length = Math.floor(sampleRate * durationSeconds);
  const samples = new Float32Array(length);
  for (let i = 0; i < length; i += 1) {
    const t = i / sampleRate;
    const gust = 0.45 + 0.35 * Math.sin(t * Math.PI * 0.31) + 0.2 * Math.sin(t * Math.PI * 0.73);
    const rumble = Math.sin(t * Math.PI * 2 * 42) * 0.018;
    samples[i] = ((rand() * 2 - 1) * 0.18 * gust + rumble) * envelope(t, durationSeconds, 0.8, 1.2);
  }
  return lowpass(samples, 0.985);
}

function makeCandle(durationSeconds) {
  const length = Math.floor(sampleRate * durationSeconds);
  const samples = new Float32Array(length);
  let crackle = 0;
  for (let i = 0; i < length; i += 1) {
    const t = i / sampleRate;
    const flutter = 0.45 + 0.35 * Math.sin(t * Math.PI * 8.7);
    if (rand() > 0.992) crackle = 0.14 + rand() * 0.18;
    crackle *= 0.72;
    samples[i] = ((rand() * 2 - 1) * 0.055 * flutter + crackle) * envelope(t, durationSeconds, 0.12, 0.18);
  }
  return lowpass(samples, 0.78);
}

function makeWhisper(durationSeconds) {
  const length = Math.floor(sampleRate * durationSeconds);
  const samples = new Float32Array(length);
  let band = 0;
  for (let i = 0; i < length; i += 1) {
    const t = i / sampleRate;
    const rise = Math.sin(Math.min(1, t / durationSeconds) * Math.PI);
    const breath = rand() * 2 - 1;
    band = band * 0.9 + breath * 0.1;
    const formant = Math.sin(t * Math.PI * 2 * (310 + Math.sin(t * 7) * 35)) * 0.035;
    samples[i] = (band * 0.18 + formant) * rise * envelope(t, durationSeconds, 0.18, 0.65);
  }
  return lowpass(samples, 0.88);
}

function makeStoneClick(durationSeconds) {
  const length = Math.floor(sampleRate * durationSeconds);
  const samples = new Float32Array(length);
  for (let i = 0; i < length; i += 1) {
    const t = i / sampleRate;
    const hit = Math.exp(-t * 34);
    const scrape = Math.exp(-t * 9) * (rand() * 2 - 1) * 0.08;
    samples[i] =
      (Math.sin(t * Math.PI * 2 * 180) * 0.25 +
        Math.sin(t * Math.PI * 2 * 520) * 0.09 +
        scrape) *
      hit;
  }
  return lowpass(samples, 0.62);
}

writeWav('cemetery-wind-loop.wav', makeWind(12));
writeWav('candle-flame-loop.wav', makeCandle(8));
writeWav('whisper-sting.wav', makeWhisper(2.4));
writeWav('action-stone-click.wav', makeStoneClick(0.34));

console.log(`wrote audio assets to ${outDir}`);
