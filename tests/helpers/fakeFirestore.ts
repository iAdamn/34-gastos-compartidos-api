// Firestore de mentira, en memoria, para las pruebas.
// Solo imita lo que usan los repos: doc, get, set, create, update, where, orderBy, limit y transacciones.

type Data = Record<string, unknown>;
type Filter = { field: string; op: "array-contains" | ">"; value: unknown };

// Todos los documentos, guardados por su ruta completa, por ejemplo "grupos/g1/gastos/x".
const store = new Map<string, Data>();

export function resetFakeFirestore(): void {
  store.clear();
}

class FakeSnapshot {
  readonly id: string;
  readonly exists: boolean;
  private readonly value: Data | undefined;

  constructor(path: string, value: Data | undefined) {
    this.id = path.split("/").pop() ?? "";
    this.exists = value !== undefined;
    this.value = value;
  }

  data(): Data | undefined {
    return this.value ? { ...this.value } : undefined;
  }
}

class FakeDoc {
  readonly path: string;

  constructor(path: string) {
    this.path = path;
  }

  async get(): Promise<FakeSnapshot> {
    return new FakeSnapshot(this.path, store.get(this.path));
  }

  async set(data: Data): Promise<void> {
    store.set(this.path, { ...data });
  }

  // Igual que en Firestore: create falla con el codigo 6 si el documento ya existe.
  async create(data: Data): Promise<void> {
    if (store.has(this.path)) {
      throw Object.assign(new Error("ALREADY_EXISTS"), { code: 6 });
    }
    store.set(this.path, { ...data });
  }

  async update(data: Data): Promise<void> {
    const current = store.get(this.path);
    if (!current) {
      throw new Error("NOT_FOUND");
    }
    store.set(this.path, { ...current, ...data });
  }

  collection(name: string): FakeQuery {
    return new FakeQuery(`${this.path}/${name}`);
  }
}

function matches(data: Data, filter: Filter): boolean {
  const value = data[filter.field];
  if (filter.op === "array-contains") {
    return Array.isArray(value) && value.includes(filter.value);
  }
  return String(value) > String(filter.value);
}

class FakeQuery {
  private readonly path: string;
  private readonly filters: Filter[];
  private readonly orderField: string | undefined;
  private readonly max: number | undefined;

  constructor(path: string, filters: Filter[] = [], orderField?: string, max?: number) {
    this.path = path;
    this.filters = filters;
    this.orderField = orderField;
    this.max = max;
  }

  doc(id: string): FakeDoc {
    return new FakeDoc(`${this.path}/${id}`);
  }

  where(field: string, op: Filter["op"], value: unknown): FakeQuery {
    return new FakeQuery(
      this.path,
      [...this.filters, { field, op, value }],
      this.orderField,
      this.max,
    );
  }

  orderBy(field: string): FakeQuery {
    return new FakeQuery(this.path, this.filters, field, this.max);
  }

  limit(max: number): FakeQuery {
    return new FakeQuery(this.path, this.filters, this.orderField, max);
  }

  async get(): Promise<{ docs: FakeSnapshot[] }> {
    const depth = this.path.split("/").length + 1;
    let entries = [...store.entries()].filter(
      ([path, data]) =>
        path.startsWith(`${this.path}/`) &&
        path.split("/").length === depth &&
        this.filters.every((filter) => matches(data, filter)),
    );
    const orderField = this.orderField;
    if (orderField) {
      entries = entries.sort(([, a], [, b]) =>
        String(a[orderField]).localeCompare(String(b[orderField])),
      );
    }
    if (this.max !== undefined) {
      entries = entries.slice(0, this.max);
    }
    return { docs: entries.map(([path, data]) => new FakeSnapshot(path, data)) };
  }
}

type FakeTransaction = {
  get: (doc: FakeDoc) => Promise<FakeSnapshot>;
  update: (doc: FakeDoc, data: Data) => void;
};

export const fakeDb = {
  collection(name: string): FakeQuery {
    return new FakeQuery(name);
  },
  // La transaccion de mentira ejecuta todo de una vez: en las pruebas no hay dos peticiones a la vez.
  async runTransaction<T>(action: (transaction: FakeTransaction) => Promise<T>): Promise<T> {
    const pending: Promise<void>[] = [];
    const result = await action({
      get: (doc) => doc.get(),
      update: (doc, data) => {
        pending.push(doc.update(data));
      },
    });
    await Promise.all(pending);
    return result;
  },
};

// Tokens de prueba: "token-ana" pertenece al usuario "ana", y asi con cualquier nombre.
export const fakeAuth = {
  async verifyIdToken(token: string): Promise<{ uid: string; email: string }> {
    if (!token.startsWith("token-")) {
      throw new Error("token invalido");
    }
    const uid = token.replace("token-", "");
    return { uid, email: `${uid}@correo.test` };
  },
};
