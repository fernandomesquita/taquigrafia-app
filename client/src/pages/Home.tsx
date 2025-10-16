import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { APP_LOGO, APP_TITLE, getLoginUrl } from "@/const";
import { BarChart3, Calendar, FileText, TrendingUp } from "lucide-react";
import { useEffect } from "react";
import { useLocation } from "wouter";

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      setLocation("/dashboard");
    }
  }, [loading, isAuthenticated, setLocation]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {APP_LOGO && <img src={APP_LOGO} alt="Logo" className="h-8" />}
            <h1 className="text-2xl font-bold text-gray-900">{APP_TITLE}</h1>
          </div>
          <Button onClick={() => (window.location.href = getLoginUrl())}>
            Fazer Login
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold text-gray-900 mb-4">
            Sistema de Registro de Taquigrafia
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Gerencie seus quartos de trabalho, acompanhe suas metas diárias e visualize seu desempenho mensal de forma simples e eficiente.
          </p>
          <div className="mt-8">
            <Button
              size="lg"
              onClick={() => (window.location.href = getLoginUrl())}
              className="text-lg px-8 py-6"
            >
              Começar Agora
            </Button>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-16">
          <Card className="border-2 hover:shadow-lg transition-shadow">
            <CardHeader>
              <Calendar className="h-10 w-10 text-blue-600 mb-2" />
              <CardTitle>Registro Diário</CardTitle>
              <CardDescription>
                Registre seus quartos realizados com data e hora automáticas
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:shadow-lg transition-shadow">
            <CardHeader>
              <TrendingUp className="h-10 w-10 text-green-600 mb-2" />
              <CardTitle>Metas Flexíveis</CardTitle>
              <CardDescription>
                Ajuste suas metas diárias conforme necessário (licenças, feriados, etc)
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:shadow-lg transition-shadow">
            <CardHeader>
              <BarChart3 className="h-10 w-10 text-purple-600 mb-2" />
              <CardTitle>Visão Consolidada</CardTitle>
              <CardDescription>
                Acompanhe seu desempenho mensal e dos últimos 12 meses
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:shadow-lg transition-shadow">
            <CardHeader>
              <FileText className="h-10 w-10 text-orange-600 mb-2" />
              <CardTitle>Exportação PDF</CardTitle>
              <CardDescription>
                Exporte relatórios detalhados do mês em formato PDF
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Info Section */}
        <div className="mt-16 bg-white rounded-lg shadow-lg p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">Como funciona?</h3>
          <div className="space-y-4 text-gray-700">
            <p>
              <strong>Quartos:</strong> Cada quarto representa 4 minutos de trabalho de taquigrafia. 
              De segunda a sexta, a meta padrão é de 5 quartos por dia (20 minutos).
            </p>
            <p>
              <strong>Registro:</strong> Registre quantos quartos você realizou ao longo do dia. 
              O sistema marca automaticamente a data e hora do registro.
            </p>
            <p>
              <strong>Metas:</strong> A meta mensal é calculada automaticamente com base nos dias úteis. 
              Você pode ajustar a meta de dias específicos quando necessário.
            </p>
            <p>
              <strong>Saldo:</strong> Acompanhe em tempo real se você está acima ou abaixo da meta mensal.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-16">
        <div className="container mx-auto px-4 py-6 text-center text-gray-600">
          <p>© 2025 Sistema de Registro de Taquigrafia. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
