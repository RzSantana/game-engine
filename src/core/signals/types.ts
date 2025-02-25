import type { Signal } from "./Signal"

export type SignalCallback<T extends unknown[] = []> = (...args: T) => void

export type SignalMap = Map<string, Signal<unknown[]>>

/**
 * Interfaz para cualquier clase que pueda tener señales
 */
export interface SignalEmitter {
    readonly _signals?: SignalMap
}
