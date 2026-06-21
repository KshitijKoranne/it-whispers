import { beforeEach, describe, expect, it } from 'vitest';
import { loadSettings, saveSettings } from './save';

describe('settings storage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('loads saved settings for new games', () => {
    saveSettings({ sound: false, music: false, textSpeed: 'instant', reducedMotion: true });

    expect(loadSettings()).toEqual({
      sound: false,
      music: false,
      textSpeed: 'instant',
      reducedMotion: true,
    });
  });

  it('falls back safely when stored settings are malformed', () => {
    localStorage.setItem('it-whispers-settings', '{"sound":"nope","textSpeed":"fast"}');

    expect(loadSettings()).toEqual({
      sound: true,
      music: true,
      textSpeed: 'normal',
      reducedMotion: false,
    });
  });
});
