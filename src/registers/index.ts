import { garbageTrips } from './garbage-trips'
import { streetlightRepair } from './streetlight-repair'
import type { RegisterConfig } from './types'

/**
 * Registry of every config-driven register.
 * Adding a register = add a config file here, seed entries, and a sidebar link.
 */
export const REGISTERS: RegisterConfig[] = [streetlightRepair, garbageTrips]

export function getRegister(key: string | undefined): RegisterConfig | undefined {
  return REGISTERS.find((r) => r.key === key)
}

export type { RegisterConfig, RegisterField, FieldType } from './types'
