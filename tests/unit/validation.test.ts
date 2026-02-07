/**
 * Tests unitaires pour lib/validation.ts
 *
 * Teste les fonctions de sanitization et validation securisee
 */

import { describe, it, expect } from 'vitest'
import {
  escapeHtml,
  stripHtml,
  sanitizeString,
  sanitizeObject,
  containsDangerousChars,
  hasPathTraversal,
  sanitizeFilename,
  validateImageFile,
  validateCsvFile,
  // Schemas
  uuidSchema,
  emailSchema,
  pinSchema,
  phoneSchema,
  montantSchema,
  quantiteSchema,
  pourcentageSchema,
  nomSchema,
  adresseSchema,
} from '@/lib/validation'

// ============================================================================
// Tests de sanitization HTML
// ============================================================================

describe('escapeHtml - Echappement HTML', () => {
  it('echappe les balises script', () => {
    const input = '<script>alert("XSS")</script>'
    const result = escapeHtml(input)
    expect(result).not.toContain('<script>')
    expect(result).not.toContain('</script>')
  })

  it('echappe les caracteres speciaux', () => {
    expect(escapeHtml('&')).toBe('&amp;')
    expect(escapeHtml('<')).toBe('&lt;')
    expect(escapeHtml('>')).toBe('&gt;')
    expect(escapeHtml('"')).toBe('&quot;')
    expect(escapeHtml("'")).toBe('&#x27;')
  })

  it('preserve le texte normal', () => {
    expect(escapeHtml('Hello World')).toBe('Hello World')
    expect(escapeHtml('Prix: 5000 FCFA')).toBe('Prix: 5000 FCFA')
  })

  it('echappe les tentatives dattaque combinee', () => {
    const input = '"><img src=x onerror=alert(1)>'
    const result = escapeHtml(input)
    expect(result).not.toContain('<img')
    expect(result).not.toContain('onerror')
  })
})

describe('stripHtml - Suppression balises HTML', () => {
  it('supprime les balises simples', () => {
    expect(stripHtml('<p>Hello</p>')).toBe('Hello')
    expect(stripHtml('<div>World</div>')).toBe('World')
  })

  it('supprime les balises avec attributs', () => {
    expect(stripHtml('<a href="test">Link</a>')).toBe('Link')
    expect(stripHtml('<img src="test" />')).toBe('')
  })

  it('gere les balises imbriquees', () => {
    expect(stripHtml('<div><p>Hello</p></div>')).toBe('Hello')
  })

  it('preserve le texte sans balises', () => {
    expect(stripHtml('Just text')).toBe('Just text')
  })
})

describe('sanitizeString - Sanitization complete', () => {
  it('combine stripHtml et escapeHtml', () => {
    const input = '<script>alert("XSS")</script>'
    const result = sanitizeString(input)
    expect(result).not.toContain('<')
    expect(result).not.toContain('>')
    expect(result).not.toContain('"')
  })

  it('preserve le contenu textuel', () => {
    const input = 'Poulet braise - 5000 FCFA'
    const result = sanitizeString(input)
    expect(result).toBe('Poulet braise - 5000 FCFA')
  })
})

describe('sanitizeObject - Sanitization recursive', () => {
  it('sanitize les strings dans un objet', () => {
    const input = {
      nom: '<script>alert(1)</script>',
      prix: 5000,
    }
    const result = sanitizeObject(input)
    expect(result.nom).not.toContain('<script>')
    expect(result.prix).toBe(5000)
  })

  it('sanitize les objets imbriques', () => {
    const input = {
      produit: {
        nom: '<img onerror=alert(1)>Test',
      },
    }
    const result = sanitizeObject(input)
    expect(result.produit.nom).not.toContain('<img')
  })

  it('sanitize les tableaux de strings', () => {
    const input = {
      tags: ['<script>', 'normal', '<b>bold</b>'],
    }
    const result = sanitizeObject(input)
    expect(result.tags[0]).not.toContain('<')
    expect(result.tags[1]).toBe('normal')
  })

  it('preserve les autres types', () => {
    const input = {
      nombre: 42,
      actif: true,
      vide: null,
    }
    const result = sanitizeObject(input)
    expect(result.nombre).toBe(42)
    expect(result.actif).toBe(true)
    expect(result.vide).toBe(null)
  })
})

describe('containsDangerousChars - Detection XSS', () => {
  it('detecte les scripts', () => {
    expect(containsDangerousChars('<script>alert(1)</script>')).toBe(true)
    expect(containsDangerousChars('javascript:alert(1)')).toBe(true)
  })

  it('detecte les handlers devenements', () => {
    expect(containsDangerousChars('onclick=alert(1)')).toBe(true)
    expect(containsDangerousChars('onload=alert(1)')).toBe(true)
    expect(containsDangerousChars('onerror=alert(1)')).toBe(true)
  })

  it('detecte les data URIs', () => {
    expect(containsDangerousChars('data:text/html')).toBe(true)
  })

  it('detecte les iframes', () => {
    expect(containsDangerousChars('<iframe src="evil.com">')).toBe(true)
  })

  it('accepte le texte normal', () => {
    expect(containsDangerousChars('Poulet braise')).toBe(false)
    expect(containsDangerousChars('Prix: 5000 FCFA')).toBe(false)
    expect(containsDangerousChars('email@example.com')).toBe(false)
  })
})

// ============================================================================
// Tests de validation de chemins
// ============================================================================

describe('hasPathTraversal - Detection path traversal', () => {
  it('detecte ../', () => {
    expect(hasPathTraversal('../etc/passwd')).toBe(true)
    expect(hasPathTraversal('foo/../bar')).toBe(true)
  })

  it('detecte ..\\', () => {
    expect(hasPathTraversal('..\\windows\\system32')).toBe(true)
  })

  it('detecte les encodages URL', () => {
    expect(hasPathTraversal('%2e%2e/etc/passwd')).toBe(true)
    expect(hasPathTraversal('%252e%252e/etc/passwd')).toBe(true)
  })

  it('accepte les chemins normaux', () => {
    expect(hasPathTraversal('/images/produit.jpg')).toBe(false)
    expect(hasPathTraversal('uploads/2025/01/file.png')).toBe(false)
  })
})

describe('sanitizeFilename - Nom de fichier securise', () => {
  it('supprime les caracteres Windows invalides', () => {
    expect(sanitizeFilename('file<>:"/\\|?*name.txt')).toBe('file_________name.txt')
  })

  it('supprime les path traversal', () => {
    expect(sanitizeFilename('../secret.txt')).toBe('__secret.txt')
  })

  it('gere les fichiers caches', () => {
    expect(sanitizeFilename('.htaccess')).toBe('_htaccess')
  })

  it('tronque les noms trop longs', () => {
    const longName = 'a'.repeat(300) + '.txt'
    const result = sanitizeFilename(longName)
    expect(result.length).toBeLessThanOrEqual(255)
  })

  it('preserve les noms valides', () => {
    expect(sanitizeFilename('document.pdf')).toBe('document.pdf')
    expect(sanitizeFilename('image_2025.jpg')).toBe('image_2025.jpg')
  })
})

// ============================================================================
// Tests de validation de fichiers
// ============================================================================

describe('validateImageFile - Validation images', () => {
  const createMockFile = (name: string, type: string, size: number): File => {
    const blob = new Blob([''], { type })
    return new File([blob], name, { type })
  }

  it('accepte les types dimage valides', () => {
    const types = [
      { name: 'test.jpg', type: 'image/jpeg' },
      { name: 'test.png', type: 'image/png' },
      { name: 'test.gif', type: 'image/gif' },
      { name: 'test.webp', type: 'image/webp' },
    ]

    for (const { name, type } of types) {
      const file = createMockFile(name, type, 1000)
      const result = validateImageFile(file)
      expect(result.valid).toBe(true)
    }
  })

  it('rejette les types non autorises', () => {
    const file = createMockFile('test.exe', 'application/x-msdownload', 1000)
    const result = validateImageFile(file)
    expect(result.valid).toBe(false)
    expect(result.error).toContain('Type de fichier')
  })

  it('rejette les fichiers trop volumineux', () => {
    const file = createMockFile('big.jpg', 'image/jpeg', 6 * 1024 * 1024) // 6 MB
    const result = validateImageFile(file)
    expect(result.valid).toBe(false)
    expect(result.error).toContain('volumineux')
  })

  it('rejette les extensions invalides', () => {
    const file = createMockFile('test.txt', 'image/jpeg', 1000)
    const result = validateImageFile(file)
    expect(result.valid).toBe(false)
  })
})

describe('validateCsvFile - Validation CSV', () => {
  const createMockFile = (name: string, type: string, size: number): File => {
    const blob = new Blob([''], { type })
    return new File([blob], name, { type })
  }

  it('accepte les fichiers CSV valides', () => {
    const file = createMockFile('data.csv', 'text/csv', 1000)
    const result = validateCsvFile(file)
    expect(result.valid).toBe(true)
  })

  it('accepte les fichiers avec extension .csv meme si type incorrect', () => {
    const file = createMockFile('data.csv', 'application/octet-stream', 1000)
    const result = validateCsvFile(file)
    expect(result.valid).toBe(true)
  })

  it('rejette les fichiers non-CSV', () => {
    const file = createMockFile('data.xlsx', 'application/vnd.openxmlformats', 1000)
    const result = validateCsvFile(file)
    expect(result.valid).toBe(false)
  })

  it('rejette les fichiers trop volumineux', () => {
    const file = createMockFile('big.csv', 'text/csv', 11 * 1024 * 1024) // 11 MB
    const result = validateCsvFile(file)
    expect(result.valid).toBe(false)
    expect(result.error).toContain('volumineux')
  })
})

// ============================================================================
// Tests des schemas Zod
// ============================================================================

describe('uuidSchema - Validation UUID', () => {
  it('accepte un UUID valide', () => {
    const result = uuidSchema.safeParse('550e8400-e29b-41d4-a716-446655440000')
    expect(result.success).toBe(true)
  })

  it('rejette un UUID invalide', () => {
    const result = uuidSchema.safeParse('not-a-uuid')
    expect(result.success).toBe(false)
  })
})

describe('emailSchema - Validation email', () => {
  it('accepte un email valide', () => {
    const result = emailSchema.safeParse('test@orema.ga')
    expect(result.success).toBe(true)
  })

  it('normalise en minuscules', () => {
    const result = emailSchema.safeParse('TEST@OREMA.GA')
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toBe('test@orema.ga')
    }
  })

  it('rejette un email invalide', () => {
    const result = emailSchema.safeParse('invalid-email')
    expect(result.success).toBe(false)
  })
})

describe('pinSchema - Validation PIN', () => {
  it('accepte un PIN 4 chiffres', () => {
    expect(pinSchema.safeParse('1234').success).toBe(true)
  })

  it('accepte un PIN 6 chiffres', () => {
    expect(pinSchema.safeParse('123456').success).toBe(true)
  })

  it('rejette un PIN trop court', () => {
    expect(pinSchema.safeParse('123').success).toBe(false)
  })

  it('rejette un PIN avec lettres', () => {
    expect(pinSchema.safeParse('12ab').success).toBe(false)
  })
})

describe('phoneSchema - Validation telephone gabonais', () => {
  it('accepte un numero local', () => {
    const result = phoneSchema.safeParse('77123456')
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toBe('+24177123456')
    }
  })

  it('accepte un numero avec indicatif', () => {
    const result = phoneSchema.safeParse('+24177123456')
    expect(result.success).toBe(true)
  })

  it('normalise le format', () => {
    const result = phoneSchema.safeParse('24177123456')
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toBe('+24177123456')
    }
  })

  it('rejette un numero trop court', () => {
    expect(phoneSchema.safeParse('12345').success).toBe(false)
  })
})

describe('montantSchema - Validation montant FCFA', () => {
  it('accepte un montant entier positif', () => {
    expect(montantSchema.safeParse(5000).success).toBe(true)
  })

  it('accepte zero', () => {
    expect(montantSchema.safeParse(0).success).toBe(true)
  })

  it('rejette un montant negatif', () => {
    expect(montantSchema.safeParse(-100).success).toBe(false)
  })

  it('rejette un montant decimal', () => {
    expect(montantSchema.safeParse(100.50).success).toBe(false)
  })

  it('rejette un montant trop eleve', () => {
    expect(montantSchema.safeParse(9999999999).success).toBe(false)
  })
})

describe('quantiteSchema - Validation quantite', () => {
  it('accepte une quantite positive', () => {
    expect(quantiteSchema.safeParse(5).success).toBe(true)
  })

  it('rejette zero', () => {
    expect(quantiteSchema.safeParse(0).success).toBe(false)
  })

  it('rejette une quantite negative', () => {
    expect(quantiteSchema.safeParse(-1).success).toBe(false)
  })

  it('rejette une quantite decimale', () => {
    expect(quantiteSchema.safeParse(1.5).success).toBe(false)
  })
})

describe('pourcentageSchema - Validation pourcentage', () => {
  it('accepte 0%', () => {
    expect(pourcentageSchema.safeParse(0).success).toBe(true)
  })

  it('accepte 100%', () => {
    expect(pourcentageSchema.safeParse(100).success).toBe(true)
  })

  it('accepte 50%', () => {
    expect(pourcentageSchema.safeParse(50).success).toBe(true)
  })

  it('rejette > 100%', () => {
    expect(pourcentageSchema.safeParse(101).success).toBe(false)
  })

  it('rejette < 0%', () => {
    expect(pourcentageSchema.safeParse(-1).success).toBe(false)
  })
})

describe('nomSchema - Validation nom', () => {
  it('accepte un nom simple', () => {
    expect(nomSchema.safeParse('Dupont').success).toBe(true)
  })

  it('accepte un nom compose', () => {
    expect(nomSchema.safeParse('Jean-Pierre').success).toBe(true)
  })

  it('accepte les apostrophes', () => {
    expect(nomSchema.safeParse("N'Guema").success).toBe(true)
  })

  it('accepte les accents', () => {
    expect(nomSchema.safeParse('Mbengue').success).toBe(true)
  })

  it('rejette les chiffres', () => {
    expect(nomSchema.safeParse('Jean123').success).toBe(false)
  })

  it('rejette les caracteres speciaux', () => {
    expect(nomSchema.safeParse('Jean@Dupont').success).toBe(false)
  })
})

describe('adresseSchema - Validation adresse', () => {
  it('accepte une adresse valide', () => {
    const result = adresseSchema.safeParse('Quartier Louis, BP 123, Libreville')
    expect(result.success).toBe(true)
  })

  it('rejette une adresse trop courte', () => {
    expect(adresseSchema.safeParse('BP').success).toBe(false)
  })

  it('sanitize les caracteres dangereux', () => {
    const result = adresseSchema.safeParse('Rue <script>alert(1)</script>')
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).not.toContain('<script>')
    }
  })
})
