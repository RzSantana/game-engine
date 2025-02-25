import type { Node } from '../node'
import { type IScriptComponent, ScriptState } from './ScriptTypes'

export class ScriptComponent implements IScriptComponent {
	// Nodo al que está conectado este script
	protected node: Node | null = null

	// Estado actual del script
	protected _state: ScriptState = ScriptState.DETACHED

	// Indica si el script está habilitado
	private _enable = true

	/**
	 * Conecta este script a un nodo
	 * Este méto es llamado internamente por Node.setScript()
	 */
	_attachToNode(node: Node): void {
		// Si ya esta conectado a otro nodo, desconectarlo primero
		if (this.node) {
			this._detachFromNode()
		}

		this.node = node
		this._state = ScriptState.READY

		// Si el nodo ya está en el árbol, llamar a _ready inmediatamente
		if (node.parent) {
			this._onReady()
		}
	}

	/**
	 * Desconecta este script del nodo actual
	 * Este método es llamado internamente por Node.removeScript()
	 */
	_detachFromNode(): void {
		this.node = null
		this._state = ScriptState.DETACHED
	}

	/**
	 * Método interno llamado cuando el nodo está listo
	 * Cambia el estado a ACTIVE y llama al método _ready
	 */
	_onReady(): void {
		if (this._state === ScriptState.READY) {
			this._ready()
			this._state = ScriptState.ACTIVE
		}
	}

	/**
	 * Habilita o deshabilita el script
	 * Un script deshabilidato no procesará sus métodos _process y _physicsProcess
	 */
	setEnabled(enabled: boolean): void {
		this._enable = enabled

		// Si el nodo está activo, actualizar el estado
		if (this.node && this._state === ScriptState.ACTIVE && !enabled) {
			this._state = ScriptState.DISABLED
		} else if (
			this.node &&
			this._state === ScriptState.DISABLED &&
			enabled
		) {
			this._state = ScriptState.ACTIVE
		}
	}

	/**
	 * Devuelve si el script está habilitado
	 */
	isEnabled(): boolean {
		return this._enable
	}

	/**
	 * Devuelve el estado actual del script
	 */
	getState(): ScriptState {
		return this._state
	}

	/**
	 * Método que ayuda para obtener un nodo por ruta relativa a este nodo
	 */
	getNode<T extends Node = Node>(path: string): T | null {
		if (!this.node) return null
		return this.node.getNodeByPath(path) as T | null
	}

	// --------------- Métodos del ciclo de vida ----------------

	/**
	 * Lamado cuando el nodo está listo
	 * Es el momento idela para inicializar el estado del script
	 */
	_ready(): void {}

	/**
	 * Llamado cada frame para la lógica de actualización
	 * @param daltaTime Tiempo transcurrido desde el frame anterior en segundos
	 */
	_process(deltaTime: number): void {}

	/**
	 * Llamado a una tasa fija para la lógica de física
	 * @param deltaTime Tiempo fijo entre actualizacions de física
	 */
	_physics_process(deltaTime: number): void {}
}
