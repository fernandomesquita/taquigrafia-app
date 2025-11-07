import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

/**
 * Página temporária para corrigir dataRegistro de quartos específicos
 * REMOVER após correções serem aplicadas
 */
export default function AdminFix() {
  const [codigoQuarto, setCodigoQuarto] = useState("");
  const [novaData, setNovaData] = useState("");
  const [loading, setLoading] = useState(false);

  const fixMutation = trpc.quartos.fixDataRegistro.useMutation({
    onSuccess: (data) => {
      toast.success(`✅ Quarto ${data.quarto} corrigido com sucesso!`);
      setCodigoQuarto("");
      setNovaData("");
    },
    onError: (error) => {
      toast.error(`❌ Erro: ${error.message}`);
    },
  });

  const handleFix = async () => {
    if (!codigoQuarto || !novaData) {
      toast.error("Preencha todos os campos");
      return;
    }

    setLoading(true);
    try {
      await fixMutation.mutateAsync({
        codigoQuarto,
        novaData,
      });
    } finally {
      setLoading(false);
    }
  };

  const corrigirQuartos = async () => {
    setLoading(true);
    try {
      // Corrigir 79877-14
      await fixMutation.mutateAsync({
        codigoQuarto: "79877-14",
        novaData: "2025-11-07T00:43:51.000Z",
      });

      // Corrigir 79877-13
      await fixMutation.mutateAsync({
        codigoQuarto: "79877-13",
        novaData: "2025-11-06T23:42:00.000Z",
      });

      toast.success("✅ Todos os quartos corrigidos!");
      setTimeout(() => window.location.href = "/dashboard", 1500);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>🔧 Correção de Data/Hora de Quartos</CardTitle>
            <CardDescription>
              Página temporária para corrigir quartos com dataRegistro incorreta
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h3 className="font-semibold text-yellow-900 mb-2">⚠️ Correções Pendentes</h3>
              <ul className="text-sm text-yellow-800 space-y-1">
                <li>• 79877-14 → 07/11/2025 00:43:51</li>
                <li>• 79877-13 → 06/11/2025 23:42:00</li>
              </ul>
              <Button
                onClick={corrigirQuartos}
                disabled={loading}
                className="mt-4 w-full"
                variant="default"
              >
                {loading ? "Corrigindo..." : "✅ Corrigir Ambos os Quartos"}
              </Button>
            </div>

            <div className="border-t pt-6">
              <h3 className="font-semibold mb-4">Correção Manual</h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="codigo">Código do Quarto</Label>
                  <Input
                    id="codigo"
                    placeholder="Ex: 79877-14"
                    value={codigoQuarto}
                    onChange={(e) => setCodigoQuarto(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="data">Nova Data (ISO 8601)</Label>
                  <Input
                    id="data"
                    placeholder="Ex: 2025-11-07T00:43:51.000Z"
                    value={novaData}
                    onChange={(e) => setNovaData(e.target.value)}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Formato: YYYY-MM-DDTHH:MM:SS.000Z (UTC)
                  </p>
                </div>
                <Button
                  onClick={handleFix}
                  disabled={loading}
                  className="w-full"
                  variant="outline"
                >
                  {loading ? "Corrigindo..." : "Corrigir Quarto"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <Button
            variant="ghost"
            onClick={() => window.location.href = "/dashboard"}
          >
            ← Voltar ao Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}

