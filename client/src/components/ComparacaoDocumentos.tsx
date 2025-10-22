// Arquivo completo corrigido: client/src/components/ComparacaoDocumentos.tsx
// Copie todo este conteúdo para substituir o arquivo existente

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { FileText, Upload, Download } from "lucide-react";
import mammoth from "mammoth";
import * as Diff from "diff";
import { APP_TITLE } from "@/const";
import { jsPDF } from "jspdf";

interface ComparacaoDocumentosProps {
  quarto: any;
  mostrarApenasResultado?: boolean;
}

export function ComparacaoDocumentos({ quarto, mostrarApenasResultado = false }: ComparacaoDocumentosProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [showComparacao, setShowComparacao] = useState(mostrarApenasResultado && quarto.comparacaoRealizada);
  const [uploading, setUploading] = useState(false);
  const [textoOriginal, setTextoOriginal] = useState("");
  const [textoRevisado, setTextoRevisado] = useState("");
  const [resultadoComparacao, setResultadoComparacao] = useState<any>(null);

  const utils = trpc.useUtils();
  const salvarComparacao = trpc.quartos.salvarComparacao.useMutation({
    onSuccess: () => {
      utils.quartos.list.invalidate();
      toast.success("Comparação salva com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao salvar comparação: " + error.message);
    },
  });

  const extrairTextoDocx = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
  };

  const handleFileUpload = async (tipo: "original" | "revisado", file: File) => {
    if (!file) return;

    setUploading(true);
    try {
      let texto = "";

      if (file.name.endsWith(".docx")) {
        texto = await extrairTextoDocx(file);
      } else if (file.name.endsWith(".txt")) {
        texto = await file.text();
      } else {
        toast.error("Formato não suportado. Use .docx ou .txt");
        return;
      }

      if (tipo === "original") {
        setTextoOriginal(texto);
      } else {
        setTextoRevisado(texto);
      }

      toast.success(`Arquivo ${tipo} carregado com sucesso!`);
    } catch (error) {
      console.error("Erro ao processar arquivo:", error);
      toast.error("Erro ao processar arquivo");
    } finally {
      setUploading(false);
    }
  };

  const compararTextos = async () => {
    if (!textoOriginal || !textoRevisado) {
      toast.error("Por favor, carregue ambos os arquivos");
      return;
    }

    try {
      // Usar biblioteca diff para comparar
      const diff = Diff.diffWords(textoOriginal, textoRevisado);

      // Calcular estatísticas
      let adicionadas = 0;
      let removidas = 0;
      let inalteradas = 0;

      diff.forEach((part) => {
        const palavras = part.value.trim().split(/\s+/).filter(p => p.length > 0).length;
        if (part.added) {
          adicionadas += palavras;
        } else if (part.removed) {
          removidas += palavras;
        } else {
          inalteradas += palavras;
        }
      });

      const totalAlteracoes = adicionadas + removidas;
      const totalPalavras = adicionadas + removidas + inalteradas;
      const taxaPrecisao =
        totalPalavras > 0
          ? ((inalteradas / totalPalavras) * 100).toFixed(1)
          : "0.0";

      // Salvar comparação no banco
      await salvarComparacao.mutateAsync({
        quartoId: quarto.id,
        taxaPrecisao,
        palavrasAdicionadas: adicionadas,
        palavrasRemovidas: removidas,
        palavrasInalteradas: inalteradas,
        totalAlteracoes,
        totalPalavras,
      });

      setResultadoComparacao({
        diff,
        stats: {
          taxaPrecisao,
          adicionadas,
          removidas,
          inalteradas,
          totalAlteracoes,
          totalPalavras,
        },
      });

      setShowComparacao(true);
      setShowDialog(false);
    } catch (error) {
      console.error("Erro ao comparar:", error);
      toast.error("Erro ao comparar documentos");
    }
  };

  const exportarPDF = async () => {
    if (!resultadoComparacao) {
      toast.error("Nenhuma comparação para exportar");
      return;
    }

    try {
      // Formatar data
      const dataRegistro = new Date(quarto.dataRegistro).toLocaleDateString("pt-BR");
      
      // Mapear dificuldade
      const dificuldadeMap: Record<string, string> = {
        Facil: "Fácil",
        Medio: "Médio",
        Dificil: "Difícil"
      };

      // Criar PDF com jsPDF
      const doc = new jsPDF();
      
      let yPos = 20;
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 20;
      const maxWidth = pageWidth - 2 * margin;

      // Título
      doc.setFontSize(18);
      doc.setTextColor(30, 64, 175); // Azul
      doc.text(APP_TITLE, margin, yPos);
      yPos += 10;

      // Autor
      doc.setFontSize(11);
      doc.setTextColor(107, 114, 128); // Cinza
      doc.setFont(undefined, 'italic');
      doc.text("por Fernando Mesquita", margin, yPos);
      doc.setFont(undefined, 'normal');
      yPos += 15;

      // Linha separadora
      doc.setDrawColor(59, 130, 246);
      doc.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 10;

      // Informações do Quarto
      doc.setFontSize(14);
      doc.setTextColor(59, 130, 246);
      doc.text("Informações do Quarto", margin, yPos);
      yPos += 8;

      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text(`Quarto: ${quarto.codigoQuarto}`, margin, yPos);
      yPos += 6;
      doc.text(`Data: ${dataRegistro}`, margin, yPos);
      yPos += 6;
      doc.text(`Dificuldade: ${dificuldadeMap[quarto.dificuldade] || "Não avaliado"}`, margin, yPos);
      yPos += 12;

      // Estatísticas da Comparação
      doc.setFontSize(14);
      doc.setTextColor(59, 130, 246);
      doc.text("Estatísticas da Comparação", margin, yPos);
      yPos += 8;

      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text(`Taxa de Precisão: ${resultadoComparacao.stats.taxaPrecisao}%`, margin, yPos);
      yPos += 6;
      doc.text(`Palavras Adicionadas: ${resultadoComparacao.stats.adicionadas}`, margin, yPos);
      yPos += 6;
      doc.text(`Palavras Removidas: ${resultadoComparacao.stats.removidas}`, margin, yPos);
      yPos += 6;
      doc.text(`Palavras Inalteradas: ${resultadoComparacao.stats.inalteradas}`, margin, yPos);
      yPos += 6;
      doc.text(`Total de Alterações: ${resultadoComparacao.stats.totalAlteracoes}`, margin, yPos);
      yPos += 6;
      doc.text(`Total de Palavras: ${resultadoComparacao.stats.totalPalavras}`, margin, yPos);
      yPos += 12;

      // Texto Comparado
      doc.setFontSize(14);
      doc.setTextColor(59, 130, 246);
      doc.text("Texto Comparado", margin, yPos);
      yPos += 8;

      doc.setFontSize(9);
      doc.setTextColor(107, 114, 128);
      doc.text("Verde = Adicionado | Vermelho = Removido", margin, yPos);
      yPos += 8;

      // Processar texto comparado - Renderizar de forma contínua
      doc.setFontSize(9);
      doc.setTextColor(0, 0, 0);
      
      // Construir texto formatado mantendo o fluxo natural
      let textoFormatado = '';
      resultadoComparacao.diff.forEach((part: any, index: number) => {
        const texto = part.value;
        
        if (part.added) {
          textoFormatado += `[+${texto}+]`;
        } else if (part.removed) {
          textoFormatado += `[-${texto}-]`;
        } else {
          textoFormatado += texto;
        }
      });
      
      // Quebrar em parágrafos naturais
      const paragrafos = textoFormatado.split(/\n+/).filter(p => p.trim());
      
      paragrafos.forEach((paragrafo) => {
        // Processar cada parágrafo
        const linhas = doc.splitTextToSize(paragrafo, maxWidth);
        
        linhas.forEach((linha: string) => {
          // Verificar se precisa de nova página
          if (yPos > 270) {
            doc.addPage();
            yPos = 20;
          }
          
          // Processar marcações na linha
          let xPos = margin;
          const partes = linha.split(/([\[\+].*?[\+\]]|[\[\-].*?[\-\]])/g).filter(p => p);
          
          partes.forEach((parte) => {
            if (parte.startsWith('[+') && parte.endsWith('+]')) {
              // Texto adicionado (verde)
              const texto = parte.slice(2, -2);
              doc.setTextColor(22, 163, 74); // Verde
              doc.setFont(undefined, 'bold');
              doc.text(texto, xPos, yPos);
              doc.setFont(undefined, 'normal');
              xPos += doc.getTextWidth(texto);
            } else if (parte.startsWith('[-') && parte.endsWith('-]')) {
              // Texto removido (vermelho)
              const texto = parte.slice(2, -2);
              doc.setTextColor(220, 38, 38); // Vermelho
              doc.setFont(undefined, 'italic');
              doc.text(texto, xPos, yPos);
              doc.setFont(undefined, 'normal');
              xPos += doc.getTextWidth(texto);
            } else {
              // Texto normal (preto)
              doc.setTextColor(0, 0, 0);
              doc.text(parte, xPos, yPos);
              xPos += doc.getTextWidth(parte);
            }
          });
          
          yPos += 5;
        });
        
        // Espaço entre parágrafos
        yPos += 2;
      });

      // Rodapé
      if (yPos > 260) {
        doc.addPage();
        yPos = 20;
      }
      yPos += 10;
      doc.setDrawColor(229, 231, 235);
      doc.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 8;
      doc.setFontSize(8);
      doc.setTextColor(107, 114, 128);
      doc.text(`Gerado em: ${new Date().toLocaleString("pt-BR")}`, margin, yPos);

      // Abrir PDF em nova aba (funciona em smartphones)
      const pdfBlob = doc.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      window.open(pdfUrl, '_blank');
      
      toast.success("PDF aberto em nova aba!");
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      toast.error("Erro ao gerar PDF");
    }
  };

  // Se mostrar apenas resultado e não há comparação, não renderizar nada
  if (mostrarApenasResultado && !quarto.comparacaoRealizada) {
    return null;
  }

  // Se mostrar apenas resultado
  if (mostrarApenasResultado) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={exportarPDF}
        className="gap-2"
      >
        <Download className="h-4 w-4" />
        Baixar PDF
      </Button>
    );
  }

  // Renderização normal com dialog
  return (
    <Dialog open={showDialog} onOpenChange={setShowDialog}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <FileText className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Comparação de Documentos</DialogTitle>
          <DialogDescription>
            Compare o documento original com a versão revisada
          </DialogDescription>
        </DialogHeader>

        {!showComparacao ? (
          <div className="grid gap-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="original">Documento Original</Label>
                <div className="flex flex-col gap-2">
                  <input
                    id="original"
                    type="file"
                    accept=".docx,.txt"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload("original", file);
                    }}
                    className="text-sm"
                    disabled={uploading}
                  />
                  {textoOriginal && (
                    <p className="text-xs text-muted-foreground">
                      ✓ Arquivo carregado ({textoOriginal.length} caracteres)
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="revisado">Documento Revisado</Label>
                <div className="flex flex-col gap-2">
                  <input
                    id="revisado"
                    type="file"
                    accept=".docx,.txt"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload("revisado", file);
                    }}
                    className="text-sm"
                    disabled={uploading}
                  />
                  {textoRevisado && (
                    <p className="text-xs text-muted-foreground">
                      ✓ Arquivo carregado ({textoRevisado.length} caracteres)
                    </p>
                  )}
                </div>
              </div>
            </div>

            <Button
              onClick={compararTextos}
              disabled={!textoOriginal || !textoRevisado || uploading}
              className="w-full"
            >
              {uploading ? "Processando..." : "Comparar Documentos"}
            </Button>
          </div>
        ) : (
          <div className="space-y-6 py-4">
            <Card>
              <CardHeader>
                <CardTitle>Estatísticas da Comparação</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Taxa de Precisão</p>
                  <p className="text-2xl font-bold text-green-600">
                    {resultadoComparacao?.stats.taxaPrecisao}%
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Palavras Adicionadas</p>
                  <p className="text-2xl font-bold text-green-600">
                    {resultadoComparacao?.stats.adicionadas}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Palavras Removidas</p>
                  <p className="text-2xl font-bold text-red-600">
                    {resultadoComparacao?.stats.removidas}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Palavras Inalteradas</p>
                  <p className="text-2xl font-bold">
                    {resultadoComparacao?.stats.inalteradas}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total de Alterações</p>
                  <p className="text-2xl font-bold">
                    {resultadoComparacao?.stats.totalAlteracoes}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total de Palavras</p>
                  <p className="text-2xl font-bold">
                    {resultadoComparacao?.stats.totalPalavras}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Texto Comparado</CardTitle>
                <CardDescription>
                  <span className="inline-block bg-green-100 text-green-800 px-2 py-1 rounded mr-2">
                    Verde = Adicionado
                  </span>
                  <span className="inline-block bg-red-100 text-red-800 px-2 py-1 rounded">
                    Vermelho = Removido
                  </span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none bg-gray-50 p-4 rounded-lg max-h-96 overflow-y-auto">
                  {resultadoComparacao?.diff.map((part: any, index: number) => (
                    <span
                      key={index}
                      className={
                        part.added
                          ? "bg-green-200 text-green-900 font-semibold"
                          : part.removed
                          ? "bg-red-200 text-red-900 line-through"
                          : ""
                      }
                    >
                      {part.value}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-2">
              <Button onClick={exportarPDF} className="flex-1 gap-2">
                <Download className="h-4 w-4" />
                Exportar PDF
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowComparacao(false);
                  setTextoOriginal("");
                  setTextoRevisado("");
                  setResultadoComparacao(null);
                }}
                className="flex-1"
              >
                Nova Comparação
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

