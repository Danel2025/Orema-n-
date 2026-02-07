# 🛡️ Solution Cookie Session Invalide - Résumé

## Problème Initial

```
Cookie: orema_session = JWT { etablissementId: "abc-123" }
                                                  ↓
                                    N'existe plus en base !
                                                  ↓
                                    Boucle de redirection ∞
```

## 🎯 Solution Multi-Couches (Defense in Depth)

### Couche 1: Validation Serveur (PRINCIPAL)

```typescript
// lib/auth/session.ts - getSession()
┌─────────────────────────────────────────┐
│ 1. Récupérer cookie                     │
│ 2. Vérifier signature JWT               │
│ 3. ✨ NOUVEAU: Vérifier établissement   │
│    existe en DB                          │
│ 4. Si invalide → supprimer cookie       │
└─────────────────────────────────────────┘
```

**Activation**: Automatique sur chaque appel à `getSession()`

### Couche 2: Protection Boucle de Redirection

```javascript
// app/layout.tsx - Script <head>
┌─────────────────────────────────────────┐
│ Compteur redirections (sessionStorage)  │
│ Si > 5 en 5 secondes:                   │
│   1. Supprimer cookie                   │
│   2. Appeler /api/clear-session         │
│   3. Rediriger vers /login              │
└─────────────────────────────────────────┘
```

**Activation**: Automatique au chargement de chaque page

### Couche 3: Route API Explicite

```typescript
// app/api/clear-session/route.ts
POST /api/clear-session
→ Supprime cookie orema_session
→ Force maxAge=0
→ Retourne { success: true }
```

**Utilisation**:
```bash
curl -X POST http://localhost:3000/api/clear-session
```

### Couche 4: Composant React (Optionnel)

```typescript
// components/session-validator.tsx
<SessionValidator />
→ Surveille erreurs de navigation
→ Nettoie après 3 erreurs consécutives
```

**Usage**:
```tsx
export default function Layout({ children }) {
  return (
    <>
      <SessionValidator /> {/* Ajouter ici */}
      {children}
    </>
  )
}
```

### Couche 5: Server Actions (Optionnel)

```typescript
// app/actions/clear-session.ts
clearSessionAction() → Nettoie + redirige
clearSessionSilent() → Nettoie sans redirection
```

**Usage**:
```tsx
<form action={clearSessionAction}>
  <button>Logout</button>
</form>
```

## 🚀 Déploiement Immédiat

### Changements Actifs (Sans Action Requise)

✅ **Validation automatique** dans `getSession()`
✅ **Script protection** dans le layout racine
✅ **Route API** `/api/clear-session` disponible

### Changements Optionnels

⭕ Ajouter `<SessionValidator />` dans les layouts critiques
⭕ Utiliser `clearSessionAction` pour logout
⭕ Utiliser `useClearSession` hook dans les composants

## 📊 Test de la Solution

### Test Automatique

```bash
# Exécuter le script de test
npx tsx scripts/test-session-cleanup.ts
```

### Test Manuel

1. **Se connecter normalement**
   ```bash
   # Login avec utilisateur valide
   ```

2. **Supprimer l'établissement en base**
   ```sql
   DELETE FROM etablissements WHERE id = '...';
   ```

3. **Rafraîchir la page**
   ```
   ✅ Devrait automatiquement nettoyer le cookie
   ✅ Devrait rediriger vers /login
   ✅ Pas de boucle infinie
   ```

4. **Vérifier les logs**
   ```
   [getSession] Session invalide: établissement ... n'existe plus
   ```

## 🔍 Diagnostic

### Comment savoir si le problème arrive ?

**Symptômes**:
- ❌ Redirections infinies entre pages
- ❌ Impossible d'accéder au dashboard
- ❌ Cookie présent mais session null

**Vérification**:
```javascript
// Console navigateur
document.cookie // Vérifier orema_session

// Décoder le JWT (jwt.io)
{
  "etablissementId": "abc-123", // Copier cet ID
  ...
}

// Vérifier en base
SELECT * FROM etablissements WHERE id = 'abc-123';
-- Si vide → problème confirmé
```

### Solutions par Priorité

1. **Attendre 5 secondes** → Script auto-cleanup se déclenche
2. **Appeler** `POST /api/clear-session`
3. **Supprimer cookie manuellement**:
   ```javascript
   document.cookie = 'orema_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
   window.location.href = '/login'
   ```

## 📈 Performance

| Couche | Impact Performance | Latence |
|--------|-------------------|---------|
| Validation getSession() | +1 requête SQL | ~5-10ms |
| Script protection | Inline 2KB | <1ms |
| SessionValidator | Passive listener | 0ms |

**Conclusion**: Impact négligeable, gain en stabilité énorme.

## 🔒 Sécurité

✅ Cookie `httpOnly` → Non accessible via JS malveillant
✅ Cookie `secure` → HTTPS only en production
✅ Cookie `sameSite: lax` → Protection CSRF
✅ Validation côté serveur → Impossible de bypass
✅ Pas de données sensibles dans logs

## 📝 Checklist Déploiement

- [x] Modifier `lib/auth/session.ts` (getSession)
- [x] Modifier `app/api/clear-session/route.ts`
- [x] Modifier `app/layout.tsx` (script protection)
- [x] Créer `components/session-validator.tsx`
- [x] Créer `app/actions/clear-session.ts`
- [x] Créer documentation complète
- [x] Créer script de test

**Statut**: ✅ Prêt pour production

## 🎓 Pour les Développeurs

### Scénarios Couverts

1. ✅ Établissement supprimé
2. ✅ JWT corrompu
3. ✅ JWT expiré (déjà géré)
4. ✅ Boucle de redirection
5. ✅ Erreurs de navigation répétées

### Scénarios Non Couverts (hors scope)

- ❌ Cookie complètement absent (normal)
- ❌ Utilisateur désactivé (à gérer séparément)
- ❌ Permissions insuffisantes (à gérer séparément)

### Extension Future

Pour étendre la validation, modifier `getSession()`:

```typescript
// Vérifier utilisateur actif
const user = await prisma.utilisateur.findUnique({
  where: { id: session.userId },
  select: { actif: true }
})

if (!user || !user.actif) {
  await deleteSessionCookie()
  return null
}
```

## 📞 Support

**En cas de problème**:
1. Vérifier les logs serveur
2. Vérifier la console navigateur
3. Exécuter `npx tsx scripts/test-session-cleanup.ts`
4. Consulter `docs/SESSION_CLEANUP.md`

**Fichiers modifiés**:
- `lib/auth/session.ts`
- `app/api/clear-session/route.ts`
- `app/layout.tsx`

**Fichiers créés**:
- `components/session-validator.tsx`
- `app/actions/clear-session.ts`
- `docs/SESSION_CLEANUP.md`
- `docs/SESSION_CLEANUP_SUMMARY.md`
- `scripts/test-session-cleanup.ts`
