import type { SettingsJson } from './settings/types.js'

type FoundryProfile = NonNullable<SettingsJson['foundry']>['profiles'] extends
  | (infer T)[]
  | undefined
  ? T
  : never

export function getActiveFoundryProfile(
  settings: SettingsJson | undefined,
): FoundryProfile | undefined {
  const foundry = settings?.foundry
  if (!foundry?.activeProfileId || !foundry.profiles?.length) {
    return undefined
  }

  return foundry.profiles.find(p => p.id === foundry.activeProfileId)
}

export function getFoundryProfileEnv(
  settings: SettingsJson | undefined,
): Record<string, string> {
  const activeProfile = getActiveFoundryProfile(settings)
  if (!activeProfile) {
    return {}
  }

  return {
    CLAUDE_CODE_USE_BEDROCK: '0',
    CLAUDE_CODE_USE_VERTEX: '0',
    CLAUDE_CODE_USE_FOUNDRY: '1',
    ANTHROPIC_FOUNDRY_BASE_URL: activeProfile.baseUrl,
    ANTHROPIC_FOUNDRY_API_KEY: activeProfile.apiKey,
    ...(activeProfile.apiVersion
      ? { ANTHROPIC_FOUNDRY_API_VERSION: activeProfile.apiVersion }
      : {}),
    ANTHROPIC_CUSTOM_MODEL_OPTION: activeProfile.modelId,
    ANTHROPIC_CUSTOM_MODEL_OPTION_NAME: activeProfile.modelName,
    ANTHROPIC_MODEL: activeProfile.modelId,
  }
}
