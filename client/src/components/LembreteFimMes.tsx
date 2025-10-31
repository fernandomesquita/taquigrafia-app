import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Calendar, Download, Database, X } from "lucide-react";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";

export function LembreteFimMes() {
  const [, setLocation] = useLocation();
  const [dispensado, setDispensado] = useState(false);
  
  // Verificar se é o último dia do mês
  const hoje = new Date();
  const ultimoDiaMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).getDate();
  const diaAtual = hoje.getDate();
  const mesAno = `${hoje.getFullYear()}-${hoje.getMonth() + 1}`;
  
  const isUltimoDia = diaAtual === ultimoDiaMes;
  
  // Verificar se foi dispensado neste mês
  useEffect(() => {
    const dispensadoStorage = localStorage.getItem(`lembrete-dispensado-${mesAno}`);
    if (dispensadoStorage === 'true') {
      setDispensado(true);
    }
  }, [mesAno]);
  
  const handleDispensar = () => {
    localStorage.setItem(`lembrete-dispensado-${mesAno}`, 'true');
    setDispensado(true);
  };
  
  if (!isUltimoDia || dispensado) {
    return null;
  }

  return (
    <Alert className="bg-gradient-to-r from-orange-50 to-red-50 border-2 border-orange-300 mb-6">
      <Calendar className="h-5 w-5 text-orange-600" />
      <AlertTitle className="text-lg font-bold text-orange-900 flex items-center gap-2">
        🗓️ Último Dia do Mês!
      </AlertTitle>
      <AlertDescription className="space-y-3">
        <p className="text-orange-800">
          Não esqueça de exportar o <strong>backup</strong> e o <strong>relatório mensal</strong> antes que o mês termine!
        </p>
        <div className="flex gap-3 flex-wrap items-center">
          <Button
            onClick={() => setLocation("/backup")}
            className="bg-blue-600 hover:bg-blue-700"
            size="sm"
          >
            <Database className="h-4 w-4 mr-2" />
            Ir para Backup
          </Button>
          <Button
            onClick={() => setLocation("/relatorio")}
            className="bg-green-600 hover:bg-green-700"
            size="sm"
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar Relatório
          </Button>
          <Button
            onClick={handleDispensar}
            variant="outline"
            size="sm"
            className="border-orange-300 text-orange-700 hover:bg-orange-100"
          >
            <X className="h-4 w-4 mr-2" />
            Dispensar
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}

