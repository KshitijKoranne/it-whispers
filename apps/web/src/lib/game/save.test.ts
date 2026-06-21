import { beforeEach, describe, expect, it } from 'vitest';
import { loadSettings, saveSettings } from './save';

describe('settings storage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('loads saved settings for new games', () => {
    saveSettings({
      sound: false,
      music: false,
      musicVolume: 0.6,
      effectsVolume: 0.7,
      textSpeed: 'instant',
      reducedMotion: true,
    });

    expect(loadSettings()).toEqual({
      sound: false,
      music: false,
      musicVolume: 0.6,
      effectsVolume: 0.7,
      textSpeed: 'instant',
      reducedMotion: true,
    });
  });

  it('falls back safely when stored settings are malformed', () => {
    localStorage.setItem(
      'it-whispers-settings',
      '{"sound":"nope","musicVolume":3,"effectsVolume":"loud","textSpeed":"fast"}'
    );

    expect(loadSettings()).toEqual({
      sound: true,
      music: true,
      musicVolume: 1,
      effectsVolume: 1,
      textSpeed: 'normal',
      reducedMotion: false,
    });
  });
});
