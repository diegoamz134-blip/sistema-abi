import { supabase } from "./supabase";

export const fetcher = async (key: string) => {
  const firstColonIndex = key.indexOf(':');
  const table = firstColonIndex === -1 ? key : key.slice(0, firstColonIndex);
  const queryStr = firstColonIndex === -1 ? null : key.slice(firstColonIndex + 1);
  
  let parsedQuery: any = {};
  if (queryStr) {
    try {
      parsedQuery = JSON.parse(queryStr);
    } catch (e) {
      console.error("Error parsing SWR query:", e);
    }
  }

  // Extraer parámetros especiales para evitar duplicarlos como métodos
  const { select: customSelect, count, ...methods } = parsedQuery;
  
  // Inicializar la query con el select y count adecuados
  const selectArgs = customSelect || '*';
  const selectOptions = count ? { count } : undefined;
  
  let dbQuery: any = supabase.from(table).select(selectArgs, selectOptions);
  
  // Aplicar filtros dinámicos (eq, order, etc) sólo si el método existe en el builder
  Object.entries(methods).forEach(([method, args]) => {
    if (typeof dbQuery[method] === 'function') {
      dbQuery = dbQuery[method](...(Array.isArray(args) ? args : [args]));
    } else {
      console.warn(`SWR Fetcher: El método '${method}' no existe en el query builder de InsForge.`);
    }
  });

  const { data, error } = await dbQuery;
  if (error) {
    console.error(`SWR Fetcher error (${table}):`, error.message);
    throw error;
  }
  
  return data;
};
