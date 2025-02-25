import { Node } from "../../../src/core/node"
import { ScriptComponent, ScriptState } from "../../../src/core/scripting"

describe('ScriptComponent', () => {
	// Una subclase simple para probar
	class TestScript extends ScriptComponent {
		readyCalled = false
		processCalled = false
		physicsProcessCalled = false

		_ready(): void {
			this.readyCalled = true
		}

		_process(delta: number): void {
			this.processCalled = true
		}

		_physicsProcess(delta: number): void {
			this.physicsProcessCalled = true
		}
	}

	let node: Node
	let script: TestScript

	beforeEach(() => {
		// Configuración antes de cada test
		node = new Node('TestNode')
		script = new TestScript()
	})

	test('debería inicializarse en estado detached', () => {
		expect(script.getState()).toBe(ScriptState.DETACHED)
		expect(script.isEnabled()).toBe(true)
	})

	test('debería cambiar a estado ready al vincularse a un nodo', () => {
		node.setScript(script)
		expect(script.getState()).toBe(ScriptState.READY)
	})

	test('debería llamar a _ready cuando el nodo entra en el árbol', () => {
		// Crear un nodo raíz y añadir nuestro nodo de prueba
		const root = new Node('Root')
		node.setScript(script)

		// Verificar que _ready no se ha llamado aún
		expect(script.readyCalled).toBe(false)

		// Añadir al árbol
		root.addChild(node)

		// Verificar que _ready se ha llamado y el estado ha cambiado
		expect(script.readyCalled).toBe(true)
		expect(script.getState()).toBe(ScriptState.ACTIVE)
	})

	test('debería procesar solo cuando está activo y habilitado', () => {
		const root = new Node('Root')
		node.setScript(script)
		root.addChild(node)

		// El script está activo, debería procesarse
		node._process(0.016) // simular un frame de 16ms
		expect(script.processCalled).toBe(true)

		// Resetear flags
		script.processCalled = false

		// Deshabilitar el script
		script.setEnabled(false)
		expect(script.getState()).toBe(ScriptState.DISABLED)

		// No debería procesar cuando está deshabilitado
		node._process(0.016)
		expect(script.processCalled).toBe(false)

		// Habilitar de nuevo
		script.setEnabled(true)
		expect(script.getState()).toBe(ScriptState.ACTIVE)

		// Debería procesar de nuevo
		node._process(0.016)
		expect(script.processCalled).toBe(true)
	})

	test('debería desvincularse correctamente del nodo', () => {
		node.setScript(script)
		expect(node.getScript()).toBe(script)

		node.removeScript()
		expect(node.getScript()).toBeNull()
		expect(script.getState()).toBe(ScriptState.DETACHED)
	})

	test('getNode debería devolver el nodo correcto por ruta', () => {
		const root = new Node('Root')
		const child1 = new Node('Child1')
		const child2 = new Node('Child2')

		root.addChild(child1)
		child1.addChild(child2)

		// Vincular script a child1
		child1.setScript(script)

		// Verificar acceso a nodos
		expect(script.getNode('Child2')).toBe(child2)
		expect(script.getNode('/Root')).toBe(root)
		expect(script.getNode ('../')).toBe(root)
	})
})
