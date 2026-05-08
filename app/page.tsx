import Link from "next/link"
import { Store, LogIn, Video, Zap, TrendingUp } from "lucide-react"
import { AppFooter } from "@/components/app-footer"
import { Logo } from "@/components/ui/logo"

const features = [
  { icon: Video, label: "Vídeo ao vivo" },
  { icon: Zap, label: "Pedido rápido" },
  { icon: TrendingUp, label: "Mais vendas" },
]

export default function Home() {
  return (
    <>
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-8px); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .lp-fade-up {
          opacity: 0;
          animation: fadeUp 0.55s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
        .lp-icon-float {
          animation: float 3.5s ease-in-out infinite;
        }
        .lp-btn {
          transition: transform 0.18s ease, box-shadow 0.18s ease;
          box-shadow: 0 4px 18px oklch(0.55 0.17 150 / 0.38);
        }
        .lp-btn:hover {
          transform: scale(1.02);
          box-shadow: 0 8px 28px oklch(0.55 0.17 150 / 0.55);
        }
        .lp-btn:active {
          transform: scale(0.98);
        }
      `}</style>

      <div
        className="min-h-screen flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden"
        style={{
          background:
            "linear-gradient(145deg, oklch(0.96 0.04 148) 0%, oklch(0.99 0.01 85) 52%, oklch(0.97 0.025 148) 100%)",
        }}
      >
        {/* Mesh blobs de fundo */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div
            className="absolute -top-40 -left-40 w-96 h-96 rounded-full"
            style={{
              background:
                "radial-gradient(circle, oklch(0.78 0.16 145 / 0.22), transparent 70%)",
            }}
          />
          <div
            className="absolute -bottom-32 -right-28 w-80 h-80 rounded-full"
            style={{
              background:
                "radial-gradient(circle, oklch(0.86 0.12 80 / 0.18), transparent 70%)",
            }}
          />
          <div
            className="absolute top-1/3 -right-48 w-[30rem] h-[30rem] rounded-full"
            style={{
              background:
                "radial-gradient(circle, oklch(0.70 0.18 148 / 0.10), transparent 70%)",
            }}
          />
        </div>

        {/* Conteúdo principal */}
        <div className="w-full max-w-md flex flex-col items-center text-center gap-6 relative z-10">

          {/* Ícone folha flutuante */}
          <div className="lp-fade-up" style={{ animationDelay: "0ms" }}>
            <div className="lp-icon-float">
              <div
                className="w-20 h-20 rounded-3xl bg-white flex items-center justify-center overflow-hidden"
                style={{ boxShadow: "0 8px 32px oklch(0.55 0.17 150 / 0.28)" }}
              >
                <Logo className="w-20 h-20" iconClassName="w-11 h-11" width={80} height={80} priority />
              </div>
            </div>
          </div>

          {/* Título + subtítulo (wrapper sem animação, filhos animam separado) */}
          <div className="flex flex-col items-center gap-2">
            <h1
              className="lp-fade-up text-3xl font-extrabold tracking-tight leading-tight"
              style={{
                animationDelay: "100ms",
                background:
                  "linear-gradient(135deg, oklch(0.30 0.13 150), oklch(0.55 0.17 150))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              HortiFruti Online
            </h1>
            <p
              className="lp-fade-up text-sm font-medium"
              style={{
                animationDelay: "200ms",
                color: "oklch(0.50 0.02 150)",
              }}
            >
              Plataforma de Catálogos Online para Hortifrutis
            </p>
          </div>

          {/* Card glassmorphism */}
          <div
            className="lp-fade-up w-full rounded-2xl p-5 flex items-center gap-3 text-left"
            style={{
              animationDelay: "300ms",
              background: "oklch(1 0 0 / 0.65)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              border: "1px solid oklch(1 0 0 / 0.60)",
              boxShadow: "0 2px 16px oklch(0.55 0.17 150 / 0.07)",
            }}
          >
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "oklch(0.94 0.03 145)" }}
            >
              <Store
                className="w-4 h-4"
                style={{ color: "oklch(0.50 0.05 150)" }}
              />
            </div>
            <p
              className="text-sm leading-relaxed"
              style={{ color: "oklch(0.50 0.02 150)" }}
            >
              Procurando uma loja? Solicite o link do catálogo diretamente ao seu lojista.
            </p>
          </div>

          {/* CTA */}
          <div
            className="lp-fade-up w-full flex flex-col items-center gap-3"
            style={{ animationDelay: "400ms" }}
          >
            <p
              className="text-[11px] font-semibold uppercase tracking-widest"
              style={{ color: "oklch(0.55 0.04 150)" }}
            >
              Área do Lojista
            </p>
            <Link
              href="/login"
              className="lp-btn w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl text-sm font-bold text-white"
              style={{
                background:
                  "linear-gradient(135deg, oklch(0.58 0.18 148), oklch(0.46 0.16 152))",
              }}
            >
              <LogIn className="w-4 h-4" />
              Acessar Painel Admin
            </Link>
          </div>

          {/* Mini-cards de features */}
          <div
            className="lp-fade-up w-full grid grid-cols-3 gap-2.5"
            style={{ animationDelay: "500ms" }}
          >
            {features.map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex flex-col items-center gap-2 py-3.5 px-2 rounded-2xl"
                style={{
                  background: "oklch(1 0 0 / 0.60)",
                  backdropFilter: "blur(8px)",
                  WebkitBackdropFilter: "blur(8px)",
                  border: "1px solid oklch(1 0 0 / 0.55)",
                  boxShadow: "0 1px 8px oklch(0.55 0.17 150 / 0.06)",
                }}
              >
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ background: "oklch(0.94 0.03 145)" }}
                >
                  <Icon
                    className="w-4 h-4"
                    style={{ color: "oklch(0.55 0.17 150)" }}
                  />
                </div>
                <span
                  className="text-[11px] font-semibold leading-tight"
                  style={{ color: "oklch(0.30 0.06 150)" }}
                >
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer com mais respiração e opacidade reduzida */}
        <div className="mt-10 opacity-50 relative z-10">
          <AppFooter />
        </div>
      </div>
    </>
  )
}
