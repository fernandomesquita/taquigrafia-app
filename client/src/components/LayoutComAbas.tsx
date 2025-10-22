import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { APP_TITLE } from "@/const";
import { LayoutDashboard, Database, BarChart3, FileText, LogOut, Clock } from "lucide-react";
import { useLocation } from "wouter";
import { DataAtual } from "./DataAtual";
import { useState, useEffect } from "react";

interface LayoutComAbasProps {
  children: React.ReactNode;
}

export function LayoutComAbas({ children }: LayoutComAbasProps) {
  const { user, logout } = useAuth({ redirectOnUnauthenticated: true });
  const [location, setLocation] = useLocation();
  
  // Calcular dias desde último backup
  const [daysSinceBackup, setDaysSinceBackup] = useState<number | null>(null);
  
  useEffect(() => {
    const lastBackupDate = localStorage.getItem("lastBackupDownload");
    if (lastBackupDate) {
      const days = Math.floor((Date.now() - new Date(lastBackupDate).getTime()) / (1000 * 60 * 60 * 24));
      setDaysSinceBackup(days);
    }
  }, [location]); // Atualizar quando mudar de página

  // Determinar cor da aba Backup baseado nos dias
  const getBackupTabColor = () => {
    if (daysSinceBackup === null) return "text-gray-600";
    if (daysSinceBackup <= 7) return "text-green-600";
    if (daysSinceBackup <= 14) return "text-yellow-600";
    if (daysSinceBackup <= 30) return "text-orange-600";
    return "text-red-600";
  };

  const handleLogout = async () => {
    await logout();
    setLocation("/login");
  };

  const isActive = (path: string) => {
    if (path === "/dashboard" && (location === "/" || location === "/dashboard")) {
      return true;
    }
    return location === path;
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Barra de navegação superior */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo e título */}
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 text-white p-2 rounded-lg">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{APP_TITLE}</h1>
                <p className="text-xs text-gray-500">Olá, {user.name || user.email}</p>
              </div>
            </div>

            {/* Botão de logout */}
            <Button variant="outline" size="sm" onClick={handleLogout} className="gap-2">
              <LogOut className="h-4 w-4" />
              Sair
            </Button>
          </div>

          {/* Abas de navegação */}
          <div className="flex gap-1 mt-4 border-b border-gray-200">
            <button
              onClick={() => setLocation("/dashboard")}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors rounded-t-lg ${
                isActive("/dashboard")
                  ? "bg-blue-50 text-blue-700 border-b-2 border-blue-700"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </button>

            <button
              onClick={() => setLocation("/backup")}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors rounded-t-lg relative ${
                isActive("/backup")
                  ? "bg-blue-50 text-blue-700 border-b-2 border-blue-700"
                  : `${getBackupTabColor()} hover:bg-gray-50`
              }`}
            >
              <Database className="h-4 w-4" />
              Backup
              {daysSinceBackup !== null && daysSinceBackup > 14 && (
                <span className={`absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold ${
                  daysSinceBackup > 30 ? "bg-red-500" : "bg-orange-500"
                } text-white`}>
                  !
                </span>
              )}
            </button>

            <button
              onClick={() => setLocation("/relatorio")}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors rounded-t-lg ${
                isActive("/relatorio")
                  ? "bg-blue-50 text-blue-700 border-b-2 border-blue-700"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              <BarChart3 className="h-4 w-4" />
              Relatório
            </button>

            <button
              onClick={() => setLocation("/consolidado")}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors rounded-t-lg ${
                isActive("/consolidado")
                  ? "bg-blue-50 text-blue-700 border-b-2 border-blue-700"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              <FileText className="h-4 w-4" />
              Consolidado
            </button>
          </div>
        </div>
      </div>

      {/* Data atual */}
      <DataAtual />

      {/* Conteúdo principal */}
      <div className="container mx-auto p-6">
        {children}
      </div>
    </div>
  );
}

