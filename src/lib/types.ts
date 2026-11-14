// Formas de los documentos, con los nombres del enunciado y de docs/contrato-api.md.

export type Group = {
  id: string;
  nombre: string;
  codigo: string;
  creador_uid: string;
  miembros: string[];
  miembros_info: Record<string, { nombre: string }>;
  creado_en: string;
};

export type Expense = {
  id: string;
  pagador_uid: string;
  descripcion: string;
  monto_centavos: number;
  participantes: string[];
  porcentajes: Record<string, number> | null;
  fecha: string;
  creado_por: string;
  lat: null;
  lng: null;
  creado_en: string;
  updated_at: string;
  deleted_at: string | null;
};

export type Payment = {
  id: string;
  de_uid: string;
  a_uid: string;
  monto_centavos: number;
  fecha: string;
  creado_por: string;
  updated_at: string;
};

// Maximo de miembros por grupo (RF-01).
export const MAX_GROUP_MEMBERS = 20;

// Maximo de elementos por lista en la ruta de cambios.
export const MAX_SYNC_ITEMS = 500;
