import type { AutomationRules, Backups, Profiles, Sessions, State, Users } from '@saifcontrol/shared';
import { SCHEMA_VERSIONS, STORAGE_FILES, StateSchema, now } from '@saifcontrol/shared';
import { getStore } from './store.js';

/** Default data for each storage file */
function defaultState(): State {
    return {
        schemaVersion: SCHEMA_VERSIONS.STATE,
        setupCompleted: false,
        setupStep: 0,
        createdAt: now(),
        updatedAt: now(),
    };
}

function defaultProfiles(): Profiles {
    return {
        schemaVersion: SCHEMA_VERSIONS.PROFILES,
        activeProfileId: null,
        profiles: [],
        updatedAt: now(),
    };
}

function defaultUsers(): Users {
    return {
        schemaVersion: SCHEMA_VERSIONS.USERS,
        users: [],
        updatedAt: now(),
    };
}

function defaultSessions(): Sessions {
    return {
        schemaVersion: SCHEMA_VERSIONS.SESSIONS,
        sessions: [],
        updatedAt: now(),
    };
}

function defaultAutomation(): AutomationRules {
    return {
        schemaVersion: SCHEMA_VERSIONS.AUTOMATION,
        rules: [],
        updatedAt: now(),
    };
}

function defaultBackups(): Backups {
    return {
        schemaVersion: SCHEMA_VERSIONS.BACKUPS,
        backups: [],
        updatedAt: now(),
    };
}

interface InitFileSpec<T> {
    filename: string;
    defaultData: () => T;
}

const FILES_TO_INIT: InitFileSpec<unknown>[] = [
    { filename: STORAGE_FILES.STATE, defaultData: defaultState },
    { filename: STORAGE_FILES.PROFILES, defaultData: defaultProfiles },
    { filename: STORAGE_FILES.USERS, defaultData: defaultUsers },
    { filename: STORAGE_FILES.SESSIONS, defaultData: defaultSessions },
    { filename: STORAGE_FILES.AUTOMATION, defaultData: defaultAutomation },
    { filename: STORAGE_FILES.BACKUPS, defaultData: defaultBackups },
];

/**
 * Initialize all storage files if they don't exist.
 * Run migrations if schema versions differ.
 */
export async function initializeStorage(): Promise<void> {
    const store = getStore();
    await store.ensureDir();

    for (const spec of FILES_TO_INIT) {
        if (!store.exists(spec.filename)) {
            await store.writeAtomic(spec.filename, spec.defaultData());
        }
    }

    // TODO: Add schema migration logic when SCHEMA_VERSIONS increment
}

/** Get current state */
export async function getState(): Promise<State> {
    const store = getStore();
    const state = await store.read(STORAGE_FILES.STATE, StateSchema);
    if (!state) {
        const def = defaultState();
        await store.writeAtomic(STORAGE_FILES.STATE, def);
        return def;
    }
    return state;
}

/** Update state */
export async function updateState(updater: (s: State) => State): Promise<State> {
    const store = getStore();
    return store.update(STORAGE_FILES.STATE, StateSchema, (current) => {
        const updated = updater(current);
        updated.updatedAt = now();
        return updated;
    });
}
