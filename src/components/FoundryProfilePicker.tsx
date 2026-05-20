import figures from 'figures'
import React, { useMemo, useState } from 'react'
import { Box, Text } from '../ink.js'
import { useKeybinding } from '../keybindings/useKeybinding.js'
import type { SettingsJson } from '../utils/settings/types.js'
import { Select } from './CustomSelect/index.js'
import TextInput from './TextInput.js'

type FoundrySettings = NonNullable<SettingsJson['foundry']>
type FoundryProfile = NonNullable<FoundrySettings['profiles']>[number]

type Props = {
  initialFoundry: SettingsJson['foundry'] | undefined
  onComplete: (nextFoundry: SettingsJson['foundry']) => void
  onCancel: () => void
}

type Step =
  | 'pick-profile'
  | 'name'
  | 'baseUrl'
  | 'apiKey'
  | 'apiVersion'
  | 'modelId'
  | 'modelName'
  | 'activate'

function createProfileId(): string {
  return `foundry-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

export function FoundryProfilePicker({
  initialFoundry,
  onComplete,
  onCancel,
}: Props): React.ReactNode {
  const [step, setStep] = useState<Step>('pick-profile')
  const [cursorOffset, setCursorOffset] = useState(0)
  const [selectedProfileId, setSelectedProfileId] = useState<string | undefined>()
  const [name, setName] = useState('')
  const [baseUrl, setBaseUrl] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [apiVersion, setApiVersion] = useState('')
  const [modelId, setModelId] = useState('')
  const [modelName, setModelName] = useState('')
  const [validationMessage, setValidationMessage] = useState<string | null>(null)

  const existingProfiles = initialFoundry?.profiles ?? []

  useKeybinding('confirm:no', onCancel, { context: 'Settings' })

  function goTo(nextStep: Step, valueForCursor = ''): void {
    setStep(nextStep)
    setCursorOffset(valueForCursor.length)
  }

  function handlePickProfile(value: string): void {
    if (value === '__disable__') {
      onComplete({
        profiles: existingProfiles,
      })
      return
    }

    if (value === '__new__') {
      setValidationMessage(null)
      setSelectedProfileId(undefined)
      setName('')
      setBaseUrl('')
      setApiKey('')
      setApiVersion('')
      setModelId('')
      setModelName('')
      goTo('name')
      return
    }

    const existing = existingProfiles.find(p => p.id === value)
    if (!existing) {
      return
    }

    setSelectedProfileId(existing.id)
    setName(existing.name)
    setBaseUrl(existing.baseUrl)
    setApiKey(existing.apiKey)
    setApiVersion(existing.apiVersion ?? '')
    setModelId(existing.modelId)
    setModelName(existing.modelName)
    setValidationMessage(null)
    goTo('name', existing.name)
  }

  function getFirstInvalidRequiredStep(): Step | null {
    if (name.trim().length === 0) return 'name'
    if (baseUrl.trim().length === 0) return 'baseUrl'
    if (apiKey.trim().length === 0) return 'apiKey'
    if (modelId.trim().length === 0) return 'modelId'
    if (modelName.trim().length === 0) return 'modelName'
    return null
  }

  function validateBaseUrl(value: string): string | null {
    let parsed: URL
    try {
      parsed = new URL(value.trim())
    } catch {
      return 'Base URL must be a valid URL (for example: https://my-resource.services.ai.azure.com)'
    }

    if (parsed.protocol !== 'https:') {
      return 'Base URL must use https://'
    }

    if (!parsed.hostname) {
      return 'Base URL must include a hostname'
    }

    return null
  }

  function saveProfile(activate: boolean): void {
    const profileId = selectedProfileId ?? createProfileId()
    const nextProfile: FoundryProfile = {
      id: profileId,
      name: name.trim(),
      baseUrl: baseUrl.trim(),
      apiKey: apiKey.trim(),
      ...(apiVersion.trim() ? { apiVersion: apiVersion.trim() } : {}),
      modelId: modelId.trim(),
      modelName: modelName.trim(),
    }

    const withoutCurrent = existingProfiles.filter(p => p.id !== profileId)
    const nextProfiles = [...withoutCurrent, nextProfile]
    const previousActive = initialFoundry?.activeProfileId

    onComplete({
      profiles: nextProfiles,
      ...(activate
        ? { activeProfileId: profileId }
        : previousActive
          ? { activeProfileId: previousActive }
          : {}),
    })
  }

  const canContinue = useMemo(
    () =>
      name.trim().length > 0 &&
      baseUrl.trim().length > 0 &&
      apiKey.trim().length > 0 &&
      modelId.trim().length > 0 &&
      modelName.trim().length > 0,
    [name, baseUrl, apiKey, modelId, modelName],
  )

  if (step === 'pick-profile') {
    const options = [
      ...existingProfiles.map(profile => ({
        label:
          initialFoundry?.activeProfileId === profile.id
            ? `${profile.name} (active)`
            : profile.name,
        value: profile.id,
      })),
      ...(initialFoundry?.activeProfileId
        ? [{ label: 'Disable active Foundry profile', value: '__disable__' }]
        : []),
      { label: 'Create new Foundry profile', value: '__new__' },
    ]

    return (
      <Box flexDirection="column" gap={1}>
        <Text>Choose a Foundry profile to edit, or create a new one:</Text>
        <Select options={options} onChange={handlePickProfile} onCancel={onCancel} />
      </Box>
    )
  }

  if (step === 'activate') {
    return (
      <Box flexDirection="column" gap={1}>
        <Text>Activate this profile now?</Text>
        <Select
          options={[
            { label: 'Yes, activate now', value: 'yes' },
            { label: 'Save only', value: 'no' },
          ]}
          onChange={value => saveProfile(value === 'yes')}
          onCancel={onCancel}
        />
      </Box>
    )
  }

  const current = {
    name: {
      value: name,
      set: setName,
      label: 'Profile name',
      placeholder: `e.g., Team Foundry${figures.ellipsis}`,
      next: 'baseUrl' as Step,
    },
    baseUrl: {
      value: baseUrl,
      set: setBaseUrl,
      label: 'Foundry base URL',
      placeholder: `https://my-resource.services.ai.azure.com${figures.ellipsis}`,
      next: 'apiKey' as Step,
    },
    apiKey: {
      value: apiKey,
      set: setApiKey,
      label: 'Foundry API key',
      placeholder: `Paste API key${figures.ellipsis}`,
      next: 'apiVersion' as Step,
    },
    apiVersion: {
      value: apiVersion,
      set: setApiVersion,
      label: 'Foundry API version (optional)',
      placeholder: `e.g., 2025-06-01-preview${figures.ellipsis}`,
      next: 'modelId' as Step,
    },
    modelId: {
      value: modelId,
      set: setModelId,
      label: 'Model/deployment ID',
      placeholder: `e.g., claude-sonnet-4-5${figures.ellipsis}`,
      next: 'modelName' as Step,
    },
    modelName: {
      value: modelName,
      set: setModelName,
      label: 'Display name',
      placeholder: `e.g., Sonnet 4.5 (Foundry)${figures.ellipsis}`,
      next: 'activate' as Step,
    },
  }[step]

  const value = current.value
  const submit = (): void => {
    setValidationMessage(null)

    if (step !== 'apiVersion' && value.trim().length === 0) {
      setValidationMessage('This field is required.')
      return
    }

    if (step === 'baseUrl') {
      const baseUrlError = validateBaseUrl(value)
      if (baseUrlError) {
        setValidationMessage(baseUrlError)
        return
      }
    }

    if (current.next === 'activate' && !canContinue) {
      const firstInvalidStep = getFirstInvalidRequiredStep()
      if (firstInvalidStep) {
        setValidationMessage('Some required fields are missing. Jumping to the first one.')
        goTo(firstInvalidStep)
      }
      return
    }

    goTo(current.next)
  }

  return (
    <Box flexDirection="column" gap={1}>
      <Text>{current.label}:</Text>
      <Box flexDirection="row" gap={1}>
        <Text>{figures.pointer}</Text>
        <TextInput
          value={value}
          onChange={current.set}
          onSubmit={submit}
          focus
          showCursor
          placeholder={current.placeholder}
          columns={80}
          cursorOffset={cursorOffset}
          onChangeCursorOffset={setCursorOffset}
          mask={step === 'apiKey' ? '*' : undefined}
        />
      </Box>
      {step === 'apiVersion' ? (
        <Text dimColor>Leave empty if your SDK path does not require it.</Text>
      ) : null}
      {validationMessage ? <Text color="error">{validationMessage}</Text> : null}
    </Box>
  )
}
