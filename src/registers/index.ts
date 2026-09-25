import { birthDeath } from './birthDeath'
import { buildingPlan } from './buildingPlan'
import { certCitizen } from './certCitizen'
import { certWarish } from './certWarish'
import { garbage } from './garbage'
import { garbageTrips } from './garbageTrips'
import { marketRent } from './marketRent'
import { rickshawLicence } from './rickshawLicence'
import { streetlight } from './streetlight'
import type { RegisterConfig } from './types'

/**
 * Registry of every config-driven register.
 * Adding a register = add a config file here, seed entries, and a sidebar link.
 */
export const REGISTERS: RegisterConfig[] = [
  streetlight,
  garbage,
  garbageTrips,
  certCitizen,
  certWarish,
  marketRent,
  rickshawLicence,
  buildingPlan,
  birthDeath,
]

export function getRegister(key: string | undefined): RegisterConfig | undefined {
  return REGISTERS.find((r) => r.key === key)
}

/** Registers a citizen can apply to online. */
export const CITIZEN_REGISTERS = REGISTERS.filter((r) => r.citizenFacing)

/** Looks a register up by the service catalogue key it implements. */
export function registerForService(serviceKey: string | undefined): RegisterConfig | undefined {
  return REGISTERS.find((r) => r.serviceKey === serviceKey)
}

export * from './types'
