import { createContext, useContext, useMemo, useState, useEffect, useCallback } from 'react';

const AuditContext = createContext(null);
const STORAGE_KEY = 'student-dashboard-audit';

export function AuditProvider({ children }) {
  const [history, setHistory] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      return [];
    }
  });

  const persist = useCallback((nextHistory) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextHistory));
  }, []);

  const recordAuditEntry = useCallback(
    (action, entity, entityId, details = {}) => {
      const entry = {
        id:
          typeof crypto !== 'undefined' && crypto.randomUUID
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        action,
        entity,
        entityId: entityId || null,
        details,
        createdAt: new Date().toISOString(),
      };

      setHistory((current) => {
        const next = [entry, ...current].slice(0, 200);
        persist(next);
        return next;
      });
    },
    [persist]
  );

  const value = useMemo(
    () => ({
      history,
      recordAuditEntry,
    }),
    [history, recordAuditEntry]
  );

  return <AuditContext.Provider value={value}>{children}</AuditContext.Provider>;
}

export function useAudit() {
  const context = useContext(AuditContext);

  if (!context) {
    throw new Error('useAudit must be used inside AuditProvider');
  }

  return context;
}
