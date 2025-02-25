import type { SignalCallback } from './SignalTypes'

/**
 * Clase que representa un señal que puede ser emitida y conectada.
 * Las señales son la base del sistema de comunicación entre nodos.
 */
export class Signal<T extends unknown[] = []> {
	private _callbacks: Array<{
		fn: SignalCallback<T>
		once: boolean
	}> = []
	private _isProcessing = false // Flag para controlar si se esta emitiendo la señal
	private _emissionQueue: T[] = [] // Cola de emisiones pendientes

	/**
	 * Conecta un callback a esta señal
	 */
	connect(callback: SignalCallback<T>, once = false): void {
		// Evitar duplicados verificando la función origial
		const isConnected = this._callbacks.some(
			(registeredCallback) => registeredCallback.fn === callback,
		)
		if (!isConnected) {
			this._callbacks.push({ fn: callback, once })
		}
	}

	/**
	 * Conecta un callback de una ejecución a esta señal
	 */
	connectOneShot(callback: SignalCallback<T>): void {
		this.connect(callback, true)
	}

	/**
	 * Desconecta un callback de esta señal
	 */
	disconnect(callback: SignalCallback<T>): void {
		const index = this._callbacks.findIndex(
			(registeredCallback) => registeredCallback.fn === callback,
		)

		if (index !== -1) {
			this._callbacks.splice(index, 1)
		}
	}

	/**
	 * Emite la señal, ejecutando todos los _callbacks conectados
	 */
	emit(...args: T): void {
		// Si ya se esta emitiendo la señal, encolamos la emisión
		if (this._isProcessing) {
			this._emissionQueue.push(args)
			return
		}

		try {
			this._isProcessing = true
			this._processEmission(args)

			// Proceso de cualquier emisión pendiente que se haya encolado
			while (this._emissionQueue.length > 0) {
				const pendingEmission = this._emissionQueue.shift() as T
				this._processEmission(pendingEmission)
			}
		} finally {
			this._isProcessing = false
		}
	}

	private _processEmission(args: T): void {
		// Copia del array de _callbacks para evitar modificacions durante la iteracion
		const currentCallbacks = [...this._callbacks]

		// Identificacion de los _callbacks de un solo uso
		const oneTimeCallbacks = currentCallbacks.filter(
			(registeredCallback) => registeredCallback.once,
		)

		// Ejecucion de todos los _callbacks con los argumentos actuales
		for (const callback of currentCallbacks) {
            try {
                callback.fn(...args)
            } catch (error) {
                console.error(`[Signal] Error en callback: ${error}`);
            }
		}

		// Limpieza de _callbacks de un solo uso
		for (const callback of oneTimeCallbacks) {
			this.disconnect(callback.fn)
		}
	}

	/**
	 * Método interno para limpiar la señal.
	 * Este método solo debe ser llamado por el sistema de nodos
	 * cuando el nodo se está eliminando del árbol
	 */
	_clearup(): void {
		this._callbacks = []
	}
}
