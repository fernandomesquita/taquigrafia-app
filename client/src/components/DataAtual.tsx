import { useEffect, useState } from "react";
import { Calendar } from "lucide-react";

export function DataAtual() {
  const [dataAtual, setDataAtual] = useState("");

  useEffect(() => {
    const atualizarData = () => {
      const agora = new Date();
      const opcoes: Intl.DateTimeFormatOptions = {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      };
      const dataFormatada = agora.toLocaleDateString("pt-BR", opcoes);
      // Capitalizar primeira letra
      setDataAtual(dataFormatada.charAt(0).toUpperCase() + dataFormatada.slice(1));
    };

    atualizarData();
    // Atualizar a cada minuto
    const intervalo = setInterval(atualizarData, 60000);

    return () => clearInterval(intervalo);
  }, []);

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100 py-3 px-6">
      <div className="container mx-auto flex items-center justify-center gap-2 text-sm text-blue-900">
        <Calendar className="h-4 w-4" />
        <span className="font-medium">{dataAtual}</span>
      </div>
    </div>
  );
}

