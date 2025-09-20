/**
 * Función para filtrar y limpiar los IDs de PAGA
 * Elimina duplicados, valores vacíos y textos como "NO APLICA"
 */
export function filterPagaIds(ids: string | string[] | null | undefined): string[] {
  if (!ids) return [];

  // Convertir a array si es string
  let idsArray: string[] = [];

  if (typeof ids === 'string') {
    // Separar por comas o saltos de línea
    idsArray = ids.split(/[,\n]/).map(id => id.trim());
  } else if (Array.isArray(ids)) {
    idsArray = ids.map(id => String(id).trim());
  }

  // Palabras/frases a filtrar (ignorar mayúsculas/minúsculas)
  const invalidValues = [
    'no aplica',
    'n/a',
    'na',
    'no disponible',
    'sin id',
    'sin paga',
    'ninguno',
    'none',
    'null',
    'undefined',
    '-',
    '--',
    '---'
  ];

  // Filtrar y limpiar
  const filtered = idsArray.filter((id, index, self) => {
    // Eliminar vacíos
    if (!id || id.length === 0) return false;

    // Eliminar valores inválidos (ignorar case)
    const idLower = id.toLowerCase().trim();
    if (invalidValues.some(invalid => idLower === invalid || idLower.includes(invalid))) {
      return false;
    }

    // Eliminar IDs que solo contienen espacios o caracteres especiales repetidos
    if (/^[\s\-_]+$/.test(id)) return false;

    // Eliminar duplicados (mantener solo la primera ocurrencia)
    return self.indexOf(id) === index;
  });

  return filtered;
}

/**
 * Función para formatear los IDs de PAGA para mostrar
 * Retorna un string formateado o null si no hay IDs válidos
 */
export function formatPagaIds(ids: string | string[] | null | undefined, separator: string = ', '): string | null {
  const filtered = filterPagaIds(ids);

  if (filtered.length === 0) return null;

  return filtered.join(separator);
}