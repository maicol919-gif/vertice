import { useEffect, useState } from 'react'
import type { Session as AuthSession } from '@supabase/supabase-js'
import { supabase } from './lib/supabase'
import { useVerticeData } from './lib/useVerticeData'
import Login from './screens/Login'
import Hoy from './screens/Hoy'
import Resumen from './screens/Resumen'
import UpdateBanner from './UpdateBanner'

type Tab = 'hoy' | 'resumen'

const TABS: [Tab, string][] = [
  ['hoy', 'Hoy'],
  ['resumen', 'Resumen'],
]

function Panel() {
  const { data, error } = useVerticeData()
  const [tab, setTab] = useState<Tab>('hoy')

  return (
    <>
      <main>
        {error && <div className="screen"><p className="err">No se pudieron leer tus datos: {error}</p></div>}
        {!error && !data && <div className="screen"><p>Cargando…</p></div>}
        {data && tab === 'hoy' && <Hoy data={data} />}
        {data && tab === 'resumen' && <Resumen data={data} />}
      </main>
      <nav className="tabs">
        {TABS.map(([k, label]) => (
          <button key={k} className={tab === k ? 'active' : ''} onClick={() => setTab(k)}>{label}</button>
        ))}
      </nav>
    </>
  )
}

export default function App() {
  const [auth, setAuth] = useState<AuthSession | null | undefined>(undefined)

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => setAuth(data.session))
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setAuth(s))
    return () => data.subscription.unsubscribe()
  }, [])

  if (auth === undefined) return <div className="center"><p>Cargando…</p></div>
  if (!auth) return (
    <>
      <Login />
      <UpdateBanner />
    </>
  )

  return (
    <>
      <UpdateBanner />
      <Panel />
    </>
  )
}
