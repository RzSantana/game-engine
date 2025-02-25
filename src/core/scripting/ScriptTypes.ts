export enum ScriptState {
    /** No está vinculado a ningún nodo */
    DETACHED = 'detached',

    /** Está vinculado y listo para ser inicializado */
    READY = 'ready',

    /** Está inicializado y procesando normalmente */
    ACTIVE = 'active',

    /** Está vinculado pero temporalmente deshabilitado */
    DISABLED = 'disabled'
}

/**
 * Interfaz base para componentes de script
 * Define los métodos que todo script debe implementar
 */
export interface IScriptComponent {
  // Métodos de ciclo de vida
  _ready(): void;
  _process(deltaTime: number): void;
  _physics_process(deltaTime: number): void;

  // Gestión del estado
  isEnabled(): boolean;
  setEnabled(enabled: boolean): void;
}
