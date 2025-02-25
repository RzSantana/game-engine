import { Signal } from './Signal'
import type { SignalEmitter, SignalMap } from './types'

/**
 * Decorador que crea una señal cuando se accede por primera vez
 */
export function signal(): PropertyDecorator {
	return function signalDecorator(
		target: object,
		propertyKey: string | symbol,
	): void {
		Object.defineProperty(target, propertyKey, {
			// Funcion que se ejecutara al intentar leer la propiedad
			// Por ejemplo: player.healthChanged
			get(this: SignalEmitter) {
				// Inicializa el mapa de señales si no existe
				if (!this._signals) {
                    Object.defineProperty(this, '_signals', {
                        value: new Map() as SignalMap,
                        writable: true,
                        configurable: true,
                    })
                }

				// Cremos la señal si no existe
				if (!this._signals?.has(propertyKey.toString())) {
					const newSignal = new Signal()
					this._signals?.set(propertyKey.toString(), newSignal)
				}

				return this._signals?.get(propertyKey.toString())
			},
            enumerable: true,
            configurable: true,
		})
	}
}
