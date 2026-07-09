'use client'

import { useState, useRef } from 'react'
import { analisarComprovativo } from '@/app/actions/ai'
import { submeterPagamentoMembro } from '@/app/actions/convite'

interface Props {
  token: string
  rondaId: string
  valorEsperado: number
  onSuccess: () => void
}

export default function SubmeterPagamento({ token, rondaId, valorEsperado, onSuccess }: Props) {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  
  const [isScanning, setIsScanning] = useState(false)
  const [scanResult, setScanResult] = useState<any>(null)
  const [scanError, setScanError] = useState<string | null>(null)
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (selected) {
      setFile(selected)
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result as string)
      }
      reader.readAsDataURL(selected)
      
      // Reset states
      setScanResult(null)
      setScanError(null)
    }
  }

  const handleAnalisar = async () => {
    if (!preview) return
    
    setIsScanning(true)
    setScanError(null)
    setScanResult(null)
    
    try {
      // O Base64 real seria enviado para a API
      const base64Image = preview.split(',')[1]
      
      const resultado = await analisarComprovativo(base64Image, valorEsperado)
      
      if (resultado.sucesso) {
        setScanResult(resultado)
      } else {
        setScanError(resultado.mensagem || 'Falha ao analisar a imagem.')
      }
    } catch (err) {
      setScanError('Ocorreu um erro ao comunicar com a Inteligência Artificial.')
    } finally {
      setIsScanning(false)
    }
  }

  const handleSubmeter = async () => {
    if (!scanResult?.dadosExtraidos) return
    
    setIsSubmitting(true)
    
    try {
      // Nota: Num caso real, faríamos o upload do ficheiro real para o Supabase Storage
      // Aqui vamos usar um placeholder de URL apenas para portefólio
      const fakeUrl = 'https://picsum.photos/400/800'
      
      const res = await submeterPagamentoMembro(
        token,
        rondaId,
        scanResult.dadosExtraidos.valor,
        scanResult.dadosExtraidos.metodo,
        fakeUrl, // comprovativoUrl
        scanResult.dadosExtraidos.transacaoId,
        scanResult.confianca > 90 // validado via IA se a confiança for alta
      )
      
      if (res.error) {
        setScanError(res.error)
      } else {
        onSuccess()
      }
    } catch (err) {
      setScanError('Erro ao submeter o pagamento.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="card" style={{ maxWidth: 600, margin: '0 auto' }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Submeter Comprovativo</h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>
        Faça o upload do print screen do seu pagamento M-Pesa, e-Mola ou transferência bancária.
      </p>

      {!preview ? (
        <div 
          style={{ 
            border: '2px dashed var(--border)', 
            borderRadius: 16, 
            padding: 40, 
            textAlign: 'center',
            cursor: 'pointer',
            background: 'var(--bg-input)'
          }}
          onClick={() => fileInputRef.current?.click()}
        >
          <div style={{ fontSize: 48, marginBottom: 16 }}>📸</div>
          <h3 style={{ fontWeight: 600, marginBottom: 8 }}>Toque para escolher uma imagem</h3>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>PNG, JPG até 5MB</p>
          <input 
            type="file" 
            accept="image/*" 
            ref={fileInputRef} 
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          
          {/* Image Preview Area */}
          <div style={{ 
            position: 'relative', 
            borderRadius: 16, 
            overflow: 'hidden',
            border: '1px solid var(--border)',
            background: '#000',
            maxHeight: 400,
            display: 'flex',
            justifyContent: 'center'
          }}>
            <img 
              src={preview} 
              alt="Comprovativo" 
              style={{ 
                maxHeight: 400, 
                objectFit: 'contain',
                opacity: isScanning ? 0.7 : 1,
                transition: 'opacity 0.3s'
              }} 
            />
            
            {/* Scanning Animation Overlay */}
            {isScanning && (
              <>
                <div style={{
                  position: 'absolute',
                  top: 0, left: 0, right: 0, bottom: 0,
                  background: 'rgba(34,197,94,0.1)'
                }} />
                <div className="scan-line" style={{
                  position: 'absolute',
                  top: 0, left: 0, right: 0,
                  height: 4,
                  background: 'var(--green-500)',
                  boxShadow: '0 0 15px 5px rgba(34,197,94,0.5)',
                  animation: 'scan 2s infinite ease-in-out'
                }} />
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  background: 'rgba(0,0,0,0.8)',
                  padding: '12px 24px',
                  borderRadius: 30,
                  color: 'white',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  backdropFilter: 'blur(4px)'
                }}>
                  <span className="loading-spinner" style={{ width: 16, height: 16 }}></span>
                  IA a ler dados...
                </div>
              </>
            )}
          </div>

          <style dangerouslySetInnerHTML={{__html: `
            @keyframes scan {
              0% { top: 0%; }
              50% { top: 100%; }
              100% { top: 0%; }
            }
          `}} />

          {/* Controls */}
          {!scanResult && !isScanning && (
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn btn-ghost" onClick={() => setPreview(null)} style={{ flex: 1 }}>
                Trocar Imagem
              </button>
              <button className="btn btn-primary" onClick={handleAnalisar} style={{ flex: 2 }}>
                🪄 Analisar com IA
              </button>
            </div>
          )}

          {scanError && (
            <div className="alert alert-red">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                <span>{scanError}</span>
                <button className="btn btn-ghost" onClick={() => setPreview(null)} style={{ padding: '4px 12px', minHeight: 'auto' }}>Tentar Novamente</button>
              </div>
            </div>
          )}

          {/* AI Result Card */}
          {scanResult?.dadosExtraidos && (
            <div style={{ background: 'rgba(34,197,94,0.05)', border: '1px solid var(--green-500)', borderRadius: 12, padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <span style={{ fontSize: 24 }}>🤖</span>
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--green-400)' }}>Leitura Concluída</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Precisão: {scanResult.confianca}%</div>
                </div>
              </div>

              <div className="grid-2" style={{ gap: 16, marginBottom: 20 }}>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Valor Lido</div>
                  <div style={{ fontWeight: 700, fontSize: 18, color: scanResult.dadosExtraidos.valor === valorEsperado ? 'var(--green-400)' : 'var(--amber-400)' }}>
                    {scanResult.dadosExtraidos.valor} MT
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>ID Transacção</div>
                  <div style={{ fontWeight: 600 }}>{scanResult.dadosExtraidos.transacaoId}</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Data</div>
                  <div style={{ fontWeight: 600 }}>{scanResult.dadosExtraidos.data}</div>
                </div>
              </div>

              <button 
                className="btn btn-primary" 
                onClick={handleSubmeter} 
                disabled={isSubmitting}
                style={{ width: '100%', padding: '16px' }}
              >
                {isSubmitting ? <span className="loading-spinner"></span> : 'Confirmar e Enviar Pagamento'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
