# R3V4 Reverb Engine v1.0
## Official Production Manual

---

### Overview

The R3V4 Reverb Engine is the flagship spatial processor of the R3 NATIVE ecosystem. It delivers studio-quality ambience through an 8×8 Feedback Delay Network with real-time 3D visualization and AI-assisted parameter optimization.

### Design Language

| Element | Specification |
|---------|--------------|
| Primary Background | Midnight Black (#080808) |
| Accent | Neon Native Green (#B7FF00) |
| Hardware | Titanium Silver (#E6E6E6) |
| Panels | Graphite (#242424) |
| Typography | System sans-serif, tabular nums |

### DSP Architecture

- **Core**: 8×8 Hadamard FDN matrix (energy-preserving, orthonormal)
- **Diffusion**: 4-stage allpass cascade per delay line
- **Early Reflections**: 12-tap sparse delay network
- **Modulation**: Sine LFO with per-line phase offset
- **Oversampling**: 2x selectable (zero-stuffing + LPF)
- **Latency**: 2.1ms (at 48kHz, 128-sample buffer)

### Parameter Reference

| Parameter | Range | Default | Function |
|-----------|-------|---------|----------|
| Pre-Delay | 0–500 ms | 45 ms | Transient clarity before reverb onset |
| Decay | 0.1–30 s | 2.5 s | T60 reverberation time |
| Size | 0–100 | 65 | Virtual room dimensions |
| Diffusion | 0–100 | 78 | Reflection density (echoes → smooth) |
| Damping | 0–100 | 42 | High-frequency absorption |
| High Cut | 1–20 kHz | 12 kHz | Reverb tail lowpass |
| Low Cut | 20–1000 Hz | 120 Hz | Reverb tail highpass |
| Bass Damping | 0–100 | 35 | LF buildup control |
| Stereo Width | 0–200% | 100% | Mono → Ultra Wide |
| Early Reflections | 0–100 | 60 | Pre-decay wall bounce level |
| Crosstalk | 0–100 | 50 | Mid/Side interaction |
| Modulation | 0–100 | 15 | Subtle chorus movement |
| Dry | 0–100% | 80% | Direct signal level |
| ER | 0–100% | 40% | Early reflection level |
| Wet | 0–100% | 25% | Reverb tail level |

### Space Modes

- **Hall**: Balanced, medium-density, 1.5–3.0s decay
- **Room**: Tight, high-density, 0.5–1.5s
- **Plate**: Bright, diffuse, 1.0–2.5s
- **Spring**: Metallic, resonant, 0.8–2.0s
- **Cathedral**: Massive, sparse early reflections, 3–10s
- **Arena**: Wide, explosive, 2–6s
- **Studio**: Controlled, neutral, 0.5–2.0s
- **Chamber**: Warm, intimate, 1.5–3.5s
- **Ambient**: Evolving, low-density, 5–30s
- **Infinite**: Sustained, self-oscillating

### Platform Targets

| Platform | Status |
|----------|--------|
| Standalone (Web) | ✅ Ready |
| VST3 | 🔄 JUCE wrapper |
| AU | 🔄 JUCE wrapper |
| AAX | 🔄 JUCE wrapper |
| Linux | ✅ Ready |
| Windows | ✅ Ready |
| macOS | ✅ Ready |

### Building from Source

```bash
npm install
npm run build:all
```

### License

Proprietary — R3 NATIVE Labs. All rights reserved.
