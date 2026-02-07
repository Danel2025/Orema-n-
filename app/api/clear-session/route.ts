import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Route API pour nettoyer toutes les sessions (custom JWT + Supabase Auth)
 * Supporte GET et POST pour maximum de compatibilité
 */
async function clearSession() {
  try {
    const cookieStore = await cookies()

    // 1. Supprimer la session custom JWT
    cookieStore.delete('orema_session')
    cookieStore.set('orema_session', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    })

    // 2. Déconnecter de Supabase Auth (supprime les cookies sb-*)
    try {
      const supabase = await createClient()
      await supabase.auth.signOut()
    } catch {
      // Ignorer les erreurs de signOut (session peut déjà être invalide)
    }

    // 3. Supprimer manuellement les cookies Supabase connus
    const allCookies = cookieStore.getAll()
    for (const cookie of allCookies) {
      if (cookie.name.startsWith('sb-')) {
        cookieStore.delete(cookie.name)
      }
    }

    return NextResponse.json({
      success: true,
      message: 'All sessions cleared successfully'
    })
  } catch (error) {
    console.error('[clear-session] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to clear session',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return clearSession()
}

export async function POST() {
  return clearSession()
}
