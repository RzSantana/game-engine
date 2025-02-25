import { v4 as uuid } from 'uuid'
import type { INode, NodeID, NodePath } from './NodeTypes'
import type { SignalEmitter, SignalMap } from '../signals/SignalTypes'

/**
 * Implementación base del sistema de nodos.
 * Esta clase provee la funcionalidad fundamental que todos los nodos del engine necesitan.
 */
export class Node implements INode, SignalEmitter {
	readonly id: NodeID
	name: string
	parent: Node | null = null
	children: Node[] = []
    _signals?: SignalMap;

	/**
	 * Constructor del nodo
	 * @param name - Nombre del nodo. Si no se proporcionam, se genera uno basado en el nombre de la clase
	 */
	constructor(name = '') {
		this.id = uuid()
		this.name = name || this.constructor.name
	}

	/**
	 * Obtine la ruta completa del nodo en el árbol.
	 * La ruta se contruye concatenando los nombres de los nodos padre
	 * separados por '/', comenzando desde la raíz.
	 */
	get path(): NodePath {
		if (!this.parent) {
			return `/${this.name}`
		}

		return `${this.parent.path}/${this.name}`
	}

	/**
	 * Añade un node hijo al nodo actual.
	 * Si el nodo ya tiene un padre, primero se elimina de su padre actual.
	 */
	addChild(child: Node): void {
		if (child.parent) child.parent.removeChild(child)

		// Establecida relacion padre-hijo
		child.parent = this
		this.children.push(child)

		child._enter_tree() // Notificación al nodo que ha entrado en el árbol
	}

	/**
	 * Elimina un nodo hijo del nodo actual.
	 * Si el nodo o es hijo de ese nodo, no hace nada
	 */
	removeChild(child: Node): void {
		const index = this.children.indexOf(child)
		if (index !== -1) {
			child._exit_tree() // Notificación al nodo que va a salir del árbol

			// Removida relación padre-hijo
			child.parent = null
			this.children.splice(index, 1)
		}
	}

	/**
	 * Obtine un hijo directo por su nombre
	 * @returns El nodo hijo si se encuentra, null si no existe
	 */
	getChild(name: string): Node | null {
		return this.children.find((child) => child.name === name) || null
	}

	/**
	 * Obtiene un nodo utilizando una ruta obsoluta o relativa
	 * Las rutas absolutas comienzan con '/' y son relativas a la raíz
	 * Las rutas relativas son relativas al nodo actual
	 */
	getNodeByPath(path: NodePath): Node | null {
		// Si la ruta es absoluta
		if (path.startsWith('/')) {
			let root: Node = this
			while (root.parent) {
				root = root.parent
			}
			return root.getNodeByRelativePath(path.slice(1))
		}

		return this.getNodeByRelativePath(path)
	}

	/**
	 * Método interno para procesar rutas relativas.
	 * Soporta navegación hacia arriva usando '..'
	 */
	private getNodeByRelativePath(path: string): Node | null {
		if (path === '') return this

		const parts = path.split('/')
		const childName = parts[0]

		// Manejo de navegación hacia arriba (..)
		if (childName === '..') {
			return (
				this.parent?.getNodeByRelativePath(parts.splice(1).join('/')) ||
				null
			)
		}

		const child = this.getChild(childName)
		if (!child || parts.length === 1) return child

		return child.getNodeByRelativePath(parts.splice(1).join('/'))
	}

    /**
     * Método que se llama cuando el nodo entra en el árbol de la escenas.
     * Los nodos derivados pueden sobrescribir este método para realizar
     * inicializaciones cuando el nodo se añade al árbol.
     */
    protected _enter_tree(): void {
        // Propagar el evento a los hijos
		for (const child of this.children) {
			child._enter_tree();
		}
    }

    /**
     * Método que se llama cuando el nodo sale del árbol de escenas.
     * Los nodos derivados pueden sobrescribir este método para realizar
     * limpieza cuando el nodo se elimina del árbol.
     */
    protected _exit_tree(): void {
        // Limpiamos las señales si tiene
        if (this._signals) {
            for (const signal of this._signals.values()) {
                signal._clearup()
            }
        }

        // Propagar el evento a los hijos
        for (const child of this.children) {
            child._exit_tree()
        }
    }
 }
