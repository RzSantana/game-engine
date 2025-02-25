export enum ExposeType {
	NUMBER = 'number',
	STRING = 'string',
	BOOLEAN = 'boolean',
	VECTOR2 = 'vector2',
	COLOR = 'color',
	ANY = 'any',
}

/**
 * Opcines para propiedad expuesta al inspector
 */
export interface ExposeOptions {
	// Tipo de dato de propiedad
	type?: ExposeType

	// Valor por defecto
	default?: null

	// Valores mínimo y máximo (para números)
	min?: number
	max?: number

	// Incremento para controles numéricos
	step?: number

	// Texto de ayuda para mostrar en el editor
	hint?: string

	// Categoría en el inspecto (para organizar propiedades)
	category?: string
}

// Mapa para almacenar propiedades expuesta
const exposedPropertiesMap = new WeakMap<Function, Map<string, ExposeOptions>>()

/**
 * Decorador que expone una propiedad al inspector del editor.
 * Infiere automáticamente el tipo de la propiedad a partir del valor inical.
 *
 * @example Uso basico (infire el tipo automáticamente):
 *  @expose()
 *  speed: number = 100;
 *
 * @example Uso con opciones adiciones:
 *  @expose({min: 0, max: 100, hint: 'Velocidad del jugador'})
 *  speed: number = 100;
 */
export function expose(options: ExposeOptions = {}): PropertyDecorator {
	return function exposeDecorator(
		target: object,
		propertyKey: string | symbol,
	) {
		// Obtiene el constructor de la clase
		const classConstructor = target.constructor

		// Inicializa el mapa si no existe
		if (!exposedPropertiesMap.has(classConstructor)) {
			exposedPropertiesMap.set(classConstructor, new Map())
		}

		// Detecta el tipo de la propedad en tiempo de ejecución si no se especificó
		if (!options.type) {
			// El valor inicla de la propiedad está disponible en el descriptor
			const descriptor = Object.getOwnPropertyDescriptor(
				target,
				propertyKey,
			)
			const value = descriptor?.value

			// Inferimos el tipo basado en el valor
			if (typeof value === 'number') {
				options.type = ExposeType.NUMBER
			} else if (typeof value === 'string') {
				options.type = ExposeType.STRING
			} else if (typeof value === 'boolean') {
				options.type = ExposeType.BOOLEAN
			} else if (
				value &&
				typeof value === 'object' &&
				'x' in value &&
				'y' in value
			) {
                options.type = ExposeType.VECTOR2
			} else {
                options.type = ExposeType.ANY
            }

            const classProperties = exposedPropertiesMap.get(classConstructor)
            classProperties?.set(propertyKey.toString(), options)
		}
	}
}

/**
 * Función utilitaria que obtiene todas las propiedades expuestas para una instancia
 */
export function getExposedProperties(instance: unknown): Map<string, ExposeOptions> {
	const classConstructor = (instance as { constructor: new (...args: unknown[]) => unknown }).constructor;
    return exposedPropertiesMap.get(classConstructor) || new Map();
}
