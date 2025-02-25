import { Node } from '../../../src/core/node'
import { Signal, signal } from '../../../src/core/signals'
import type { SignalCallback } from '../../../src/core/signals'

// Creamos clases de prueba para simular diferentes escenarios
class TestNode extends Node {
	@signal() declare valueChanged: Signal<[number]>
	@signal() declare connected: Signal<[]>
	@signal() declare dataChanged: Signal<[{ value: number }]>
}

class ChildNode extends Node {
	@signal() declare childSignal: Signal
}

describe('Sistema de Señales', () => {
	describe('Clase Signal', () => {
		let signal: Signal<[number]>

		beforeEach(() => {
			signal = new Signal()
		})

		describe('Inicialización de señales', () => {
			it('debería inicializar _signals bajo demanda', () => {
				const node = new TestNode()
				expect(node._signals).toBeUndefined()

				// Acceder a la señal debería crear el mapa
				node.valueChanged
				expect(node._signals).toBeInstanceOf(Map)
			})

			it('debería crear señales independientes para diferentes instancias', () => {
				const node1 = new TestNode()
				const node2 = new TestNode()

				expect(node1.valueChanged).not.toBe(node2.valueChanged)
			})
		})

		describe('Gestión básica de callbacks', () => {
			it('debería permitir conectar y emitir señales', () => {
				const mockCallback = jest.fn()
				signal.connect(mockCallback)
				signal.emit(42)
				expect(mockCallback).toHaveBeenCalledWith(42)
			})

			it('no debería permitir callbacks duplicados', () => {
				const mockCallback = jest.fn()
				signal.connect(mockCallback)
				signal.connect(mockCallback)
				signal.emit(42)
				expect(mockCallback).toHaveBeenCalledTimes(1)
			})

			it('debería permitir desconectar callbacks', () => {
				const mockCallback = jest.fn()
				signal.connect(mockCallback)
				signal.disconnect(mockCallback)
				signal.emit(42)
				expect(mockCallback).not.toHaveBeenCalled()
			})
		})

		describe('Señales de un solo uso', () => {
			it('debería ejecutar callbacks oneShot una sola vez', () => {
				const mockCallback = jest.fn()
				signal.connectOneShot(mockCallback)
				signal.emit(1)
				signal.emit(2)
				expect(mockCallback).toHaveBeenCalledTimes(1)
				expect(mockCallback).toHaveBeenCalledWith(1)
			})

			it('debería manejar múltiples callbacks oneShot correctamente', () => {
				const mockCallback1 = jest.fn()
				const mockCallback2 = jest.fn()
				signal.connectOneShot(mockCallback1)
				signal.connectOneShot(mockCallback2)
				signal.emit(42)
				expect(mockCallback1).toHaveBeenCalledTimes(1)
				expect(mockCallback2).toHaveBeenCalledTimes(1)
			})
		})

		describe('Limpieza de señales', () => {
			it('debería limpiar todos los callbacks al llamar _cleanup', () => {
				const mockCallback = jest.fn()
				signal.connect(mockCallback)
				signal._clearup()
				signal.emit(42)
				expect(mockCallback).not.toHaveBeenCalled()
			})
		})
	})

	describe('Integración con Nodos', () => {
		let rootNode: TestNode
		let childNode: ChildNode

		beforeEach(() => {
			rootNode = new TestNode()
			childNode = new ChildNode()
		})

		describe('Decorador @signal', () => {
			it('debería crear señales únicas para cada propiedad', () => {
				expect(rootNode.valueChanged).toBeInstanceOf(Signal)
				expect(rootNode.connected).toBeInstanceOf(Signal)
				expect(rootNode.valueChanged).not.toBe(rootNode.connected)
			})

			it('debería mantener la misma instancia de señal', () => {
				const signal1 = rootNode.valueChanged
				const signal2 = rootNode.valueChanged
				expect(signal1).toBe(signal2)
			})
		})

		describe('Jerarquía y limpieza', () => {
			beforeEach(() => {
				rootNode.addChild(childNode)
			})

			it('debería mantener señales al añadir nodos al árbol', () => {
				const mockCallback = jest.fn()
				childNode.childSignal.connect(mockCallback)
				childNode.childSignal.emit()
				expect(mockCallback).toHaveBeenCalled()
			})

			it('debería limpiar señales al remover nodos del árbol', () => {
				const mockCallback = jest.fn()
				childNode.childSignal.connect(mockCallback)
				rootNode.removeChild(childNode)
				childNode.childSignal.emit()
				expect(mockCallback).not.toHaveBeenCalled()
			})
		})

		describe('Casos de uso complejos', () => {
			it('debería manejar señales con tipos complejos', () => {
				const mockCallback = jest.fn()
				rootNode.dataChanged.connect(mockCallback)
				const data = { value: 42 }
				rootNode.dataChanged.emit(data)
				expect(mockCallback).toHaveBeenCalledWith(data)
			})

			it('debería manejar múltiples conexiones y desconexiones', () => {
				const callbacks: SignalCallback[] = Array.from(
					{ length: 5 },
					() => jest.fn(),
				)

				// Conectamos todos los callbacks
				for (const cb of callbacks) {
					rootNode.valueChanged.connect(cb)
				}

				// Desconectamos algunos
				rootNode.valueChanged.disconnect(callbacks[1])
				rootNode.valueChanged.disconnect(callbacks[3])

				rootNode.valueChanged.emit(42)

				// Verificamos que solo los callbacks conectados fueron llamados
				expect(callbacks[0]).toHaveBeenCalledWith(42)
				expect(callbacks[1]).not.toHaveBeenCalled()
				expect(callbacks[2]).toHaveBeenCalledWith(42)
				expect(callbacks[3]).not.toHaveBeenCalled()
				expect(callbacks[4]).toHaveBeenCalledWith(42)
			})

			it('debería manejar emisiones recursivas correctamente', () => {
				const results: number[] = []

				// Primer callback que emite otra señal cuando recibe 1
				rootNode.valueChanged.connect((value) => {
					results.push(value)
					if (value === 1) {
						rootNode.valueChanged.emit(2)
					}
				})

				// Segundo callback que simplemente registra el valor
				rootNode.valueChanged.connect((value) => {
					results.push(value)
				})

				rootNode.valueChanged.emit(1) // Emitimos el valor incial
				expect(results).toEqual([1, 1, 2, 2])
			})
		})
	})
})
