import Link from 'next/link'

export default function HomePage() {
  return (
    <main style={{
      minHeight: '100vh',
      background: 'var(--bg-body)',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Navbar */}
      <nav style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '20px 40px',
        borderBottom: '1px solid var(--border)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36,
            background: 'linear-gradient(135deg, var(--green-600), var(--green-400))',
            borderRadius: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, fontSize: 14, color: '#fff',
          }}>XF</div>
          <span style={{ fontWeight: 700, fontSize: 18 }}>Xitique Fácil</span>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <Link href="/login" className="btn btn-secondary">Entrar</Link>
          <Link href="/register" className="btn btn-primary">Criar conta</Link>
        </div>
      </nav>

      {/* Hero */}
      <section style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '80px 24px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Background glow */}
        <div style={{
          position: 'absolute',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 600, height: 600,
          background: 'radial-gradient(circle, rgba(34,197,94,0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: '6px 16px',
          borderRadius: 999,
          border: '1px solid rgba(34,197,94,0.3)',
          background: 'rgba(34,197,94,0.08)',
          fontSize: 13,
          color: 'var(--green-400)',
          marginBottom: 32,
          fontWeight: 500,
        }}>
          🇲🇿 Feito para Moçambique
        </div>

        <h1 style={{
          fontSize: 'clamp(36px, 6vw, 72px)',
          fontWeight: 800,
          lineHeight: 1.1,
          marginBottom: 24,
          maxWidth: 800,
        }}>
          Gerencie o seu{' '}
          <span style={{
            background: 'linear-gradient(90deg, var(--green-400), var(--amber-400))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            Xitique
          </span>
          {' '}sem confusões
        </h1>

        <p style={{
          fontSize: 18,
          color: 'var(--text-secondary)',
          maxWidth: 560,
          marginBottom: 40,
          lineHeight: 1.7,
        }}>
          Organize as contribuições, controle quem já recebeu, e partilhe
          links de acesso directo com os membros — sem precisarem de criar conta.
        </p>

        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
          <Link href="/register" className="btn btn-primary" style={{ padding: '14px 32px', fontSize: 16 }}>
            Começar gratuitamente →
          </Link>
          <Link href="/login" className="btn btn-secondary" style={{ padding: '14px 32px', fontSize: 16 }}>
            Já tenho conta
          </Link>
        </div>
      </section>

      {/* Features */}
      <section style={{
        padding: '60px 24px',
        maxWidth: 1100,
        margin: '0 auto',
        width: '100%',
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 24,
        }}>
          {[
            {
              icon: '🔗',
              title: 'Links sem login',
              desc: 'Gere um link exclusivo para cada membro. Eles preenchem os seus dados e escolhem a posição sem precisarem de password.',
            },
            {
              icon: '📊',
              title: 'Dashboard claro',
              desc: 'Veja quem recebe na ronda actual, o total confirmado vs em falta, e o histórico completo de pagamentos.',
            },
            {
              icon: '📱',
              title: 'PWA Instalável',
              desc: 'Instale a app no seu telemóvel directamente do browser. Funciona como uma app nativa no Android e iPhone.',
            },
            {
              icon: '🔒',
              title: 'Seguro e privado',
              desc: 'Os dados são armazenados na sua conta Supabase. Cada grupo só é visível pelo administrador que o criou.',
            },
            {
              icon: '💸',
              title: 'M-Pesa, e-Mola, Banco',
              desc: 'Registe pagamentos em qualquer método. Aprove ou rejeite contribuições com um clique.',
            },
            {
              icon: '📝',
              title: 'Auditoria completa',
              desc: 'Historial de todas as acções do administrador: criação de grupos, confirmações e pagamentos registados.',
            },
          ].map(f => (
            <div key={f.title} className="card" style={{ padding: 28 }}>
              <div style={{ fontSize: 32, marginBottom: 16 }}>{f.icon}</div>
              <h3 style={{ fontWeight: 700, fontSize: 18, marginBottom: 10 }}>{f.title}</h3>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, fontSize: 14 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        textAlign: 'center',
        padding: '32px 24px',
        borderTop: '1px solid var(--border)',
        color: 'var(--text-muted)',
        fontSize: 13,
        display: 'flex',
        flexDirection: 'column',
        gap: 8
      }}>
        <div>Xitique Fácil — Gestão de Poupança Rotativa em Moçambique</div>
        <div>
          Desenvolvido por{' '}
          <a 
            href="https://nexovibe.netlify.app/" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ color: 'var(--green-400)', textDecoration: 'none', fontWeight: 600 }}
          >
            Nexo Vibe
          </a>
        </div>
      </footer>
    </main>
  )
}
