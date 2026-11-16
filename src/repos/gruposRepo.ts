import crypto from "node:crypto";

import { generateGroupCode } from "@/src/domain/groupCode";
import { conflict, notFound } from "@/src/lib/errors";
import { getDb } from "@/src/lib/firebase";
import { isAlreadyExists } from "@/src/lib/firestoreErrors";
import { MAX_GROUP_MEMBERS, type Group } from "@/src/lib/types";

const GROUPS = "grupos";
const CODES = "codigos_grupo";
const MAX_CODE_ATTEMPTS = 5;

// El codigo de un grupo sirve para entrar, asi que no debe poder adivinarse.
// Por eso el azar sale de crypto (seguro) y no de Math.random.
function secureRandom(): number {
  const range = 2 ** 32;
  return crypto.randomInt(0, range) / range;
}

// Reserva un codigo unico creando codigos_grupo/{codigo} con create().
// Si el codigo ya existe, create() falla y se intenta con otro.
async function reserveCode(gid: string): Promise<string> {
  for (let attempt = 0; attempt < MAX_CODE_ATTEMPTS; attempt += 1) {
    const code = generateGroupCode(secureRandom);
    try {
      await getDb().collection(CODES).doc(code).create({ gid });
      return code;
    } catch (error) {
      if (!isAlreadyExists(error)) {
        throw error;
      }
    }
  }
  throw new Error("No se pudo generar un codigo de grupo unico");
}

export async function createGroup(uid: string, nombre: string, miNombre: string): Promise<Group> {
  const id = crypto.randomUUID();
  const codigo = await reserveCode(id);
  const group: Group = {
    id,
    nombre,
    codigo,
    creador_uid: uid,
    miembros: [uid],
    miembros_info: { [uid]: { nombre: miNombre } },
    creado_en: new Date().toISOString(),
  };
  await getDb().collection(GROUPS).doc(id).set(group);
  return group;
}

export async function findGroup(gid: string): Promise<Group | undefined> {
  const snapshot = await getDb().collection(GROUPS).doc(gid).get();
  return snapshot.data() as Group | undefined;
}

export async function listGroupsOf(uid: string): Promise<Group[]> {
  const result = await getDb().collection(GROUPS).where("miembros", "array-contains", uid).get();
  return result.docs.map((doc) => doc.data() as Group);
}

// Agrega al usuario al grupo del codigo. Se hace en una transaccion para que
// dos personas que entran al mismo tiempo no pasen el tope de miembros.
export async function joinGroupByCode(
  uid: string,
  codigo: string,
  miNombre: string,
): Promise<Group> {
  const db = getDb();
  const codeSnapshot = await db.collection(CODES).doc(codigo).get();
  const gid = codeSnapshot.data()?.gid;
  if (typeof gid !== "string") {
    throw notFound("Grupo no encontrado");
  }
  const groupRef = db.collection(GROUPS).doc(gid);
  return db.runTransaction(async (transaction) => {
    const group = (await transaction.get(groupRef)).data() as Group | undefined;
    if (!group) {
      throw notFound("Grupo no encontrado");
    }
    if (group.miembros.includes(uid)) {
      return group;
    }
    if (group.miembros.length >= MAX_GROUP_MEMBERS) {
      throw conflict("El grupo esta lleno");
    }
    const updated: Group = {
      ...group,
      miembros: [...group.miembros, uid],
      miembros_info: { ...group.miembros_info, [uid]: { nombre: miNombre } },
    };
    transaction.update(groupRef, {
      miembros: updated.miembros,
      miembros_info: updated.miembros_info,
    });
    return updated;
  });
}
