/**
 * Background Music Settings & Autoplay Configuration.
 *
 * Controls whether background music autoplays when a guest lands on the cover screen,
 * and whether it autoplays when they open/enter the invitation page.
 */

export interface MusicSettings {
  /** If true, audio attempts to play when guest views/interacts with the cover screen (default: true). */
  autoPlayCover: boolean;
  /** If true, audio attempts to play when guest opens the invitation (default: true). */
  autoPlayInvitation: boolean;
}

export const DEFAULT_MUSIC_SETTINGS: MusicSettings = {
  autoPlayCover: true,
  autoPlayInvitation: true,
};

/**
 * Normalizes music settings from any raw input (from event, template config, or section_visibility).
 */
export function normalizeMusicSettings(raw: any): MusicSettings {
  if (!raw || typeof raw !== "object") {
    return { ...DEFAULT_MUSIC_SETTINGS };
  }

  // Handle explicit boolean properties directly on object or within section_visibility
  const coverProp =
    raw.autoPlayCover !== undefined
      ? raw.autoPlayCover
      : raw.music_autoplay_cover !== undefined
      ? raw.music_autoplay_cover
      : raw.section_visibility?.music_autoplay_cover !== undefined
      ? raw.section_visibility.music_autoplay_cover
      : raw.section_visibility?.music_settings?.autoPlayCover !== undefined
      ? raw.section_visibility.music_settings.autoPlayCover
      : undefined;

  const invProp =
    raw.autoPlayInvitation !== undefined
      ? raw.autoPlayInvitation
      : raw.music_autoplay_invitation !== undefined
      ? raw.music_autoplay_invitation
      : raw.section_visibility?.music_autoplay_invitation !== undefined
      ? raw.section_visibility.music_autoplay_invitation
      : raw.section_visibility?.music_settings?.autoPlayInvitation !== undefined
      ? raw.section_visibility.music_settings.autoPlayInvitation
      : undefined;

  // Handle mode strings like "cover" | "invitation" | "both" | "none" | "disabled"
  const mode =
    raw.music_autoplay_mode ||
    raw.autoPlayMode ||
    raw.section_visibility?.music_autoplay_mode ||
    raw.section_visibility?.music_settings?.mode;

  if (mode === "cover") {
    return {
      autoPlayCover: coverProp !== undefined ? Boolean(coverProp) : true,
      autoPlayInvitation: invProp !== undefined ? Boolean(invProp) : false,
    };
  }
  if (mode === "invitation") {
    return {
      autoPlayCover: coverProp !== undefined ? Boolean(coverProp) : false,
      autoPlayInvitation: invProp !== undefined ? Boolean(invProp) : true,
    };
  }
  if (mode === "none" || mode === "disabled" || mode === "off") {
    return {
      autoPlayCover: coverProp !== undefined ? Boolean(coverProp) : false,
      autoPlayInvitation: invProp !== undefined ? Boolean(invProp) : false,
    };
  }
  if (mode === "both") {
    return {
      autoPlayCover: coverProp !== undefined ? Boolean(coverProp) : true,
      autoPlayInvitation: invProp !== undefined ? Boolean(invProp) : true,
    };
  }

  return {
    autoPlayCover: coverProp !== undefined ? Boolean(coverProp) : true,
    autoPlayInvitation: invProp !== undefined ? Boolean(invProp) : true,
  };
}
