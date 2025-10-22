import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { FileText, Upload, Eye, Download } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
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
  const [comparing, setComparing] = useState(false);
  const [resultadoComparacao, setResultadoComparacao] = useState<any>(null);

  const utils = trpc.useUtils();

  const uploadTaquigrafia = trpc.quartos.uploadArquivoTaquigrafia.useMutation({
    onSuccess: () => {
      utils.quartos.listByMonth.invalidate();
      toast.success("Arquivo de taquigrafia enviado!");
    },
    onError: (error) => {
      toast.error(`Erro ao enviar arquivo: ${error.message}`);
    },
  });

  const uploadRedacaoFinal = trpc.quartos.uploadArquivoRedacaoFinal.useMutation({
    onSuccess: () => {
      utils.quartos.listByMonth.invalidate();
      toast.success("Arquivo de redação final enviado!");
    },
    onError: (error) => {
      toast.error(`Erro ao enviar arquivo: ${error.message}`);
    },
  });

  const salvarComparacao = trpc.quartos.salvarComparacao.useMutation({
    onSuccess: () => {
      utils.quartos.listByMonth.invalidate();
      toast.success("Comparação salva com sucesso!");
    },
  });

  const handleFileUpload = async (
    file: File,
    tipo: "taquigrafia" | "redacaoFinal"
  ) => {
    if (!file.name.endsWith(".docx")) {
      toast.error("Por favor, envie apenas arquivos .docx");
      return;
    }

    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target?.result as string;
        
        if (tipo === "taquigrafia") {
          await uploadTaquigrafia.mutateAsync({
            quartoId: quarto.id,
            fileBase64: base64,
            fileName: file.name,
          });
        } else {
          await uploadRedacaoFinal.mutateAsync({
            quartoId: quarto.id,
            fileBase64: base64,
            fileName: file.name,
          });
        }
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      setUploading(false);
      toast.error("Erro ao processar arquivo");
    }
  };

  const compararDocumentos = async () => {
    if (!quarto.arquivoTaquigrafia || !quarto.arquivoRedacaoFinal) {
      toast.error("Envie ambos os arquivos antes de comparar");
      return;
    }

    setComparing(true);
    try {
      // Converter base64 para ArrayBuffer
      const taquigrafiaBuffer = await fetch(quarto.arquivoTaquigrafia).then(r => r.arrayBuffer());
      const redacaoBuffer = await fetch(quarto.arquivoRedacaoFinal).then(r => r.arrayBuffer());

      // Extrair texto dos documentos Word
      const taquigrafiaTexto = await mammoth.extractRawText({ arrayBuffer: taquigrafiaBuffer });
      const redacaoTexto = await mammoth.extractRawText({ arrayBuffer: redacaoBuffer });

      // Comparar textos
      const diff = Diff.diffWords(taquigrafiaTexto.value, redacaoTexto.value);

      // Calcular estatísticas
      let adicionadas = 0;
      let removidas = 0;
      let inalteradas = 0;

      diff.forEach((part) => {
        if (part.added) {
          adicionadas += part.value.split(/\s+/).length;
        } else if (part.removed) {
          removidas += part.value.split(/\s+/).length;
        } else {
          inalteradas += part.value.split(/\s+/).length;
        }
      });

      const totalPalavras = adicionadas + removidas + inalteradas;
      const totalAlteracoes = adicionadas + removidas;
      const taxaPrecisao = totalPalavras > 0 
        ? ((inalteradas / totalPalavras) * 100).toFixed(1)
        : "0.0";

      // Salvar comparação no banco
      await salvarComparacao.mutateAsync({
        quartoId: quarto.id,
        taxaPrecisao,
        totalAlteracoes,
      });

      // Mostrar resultado
      setResultadoComparacao({
        diff,
        stats: {
          adicionadas,
          removidas,
          inalteradas,
          totalPalavras,
          totalAlteracoes,
          taxaPrecisao,
        },
      });

      setShowComparacao(true);
      setComparing(false);
    } catch (error) {
      console.error("Erro ao comparar:", error);
      toast.error("Erro ao comparar documentos");
      setComparing(false);
    }
  };

  const temAmbosArquivos = quarto.arquivoTaquigrafia && quarto.arquivoRedacaoFinal;

  const exportarTXT = () => {
    if (!resultadoComparacao) return;

    const dataRegistro = new Date(quarto.dataRegistro).toLocaleDateString("pt-BR");
    const dificuldadeMap: Record<string, string> = {
      NA: "Não avaliado",
      Facil: "Fácil",
      Medio: "Médio",
      Dificil: "Difícil"
    };

    // Gerar texto comparado com marcações
    let textoComparado = "";
    resultadoComparacao.diff.forEach((part: any) => {
      if (part.added) {
        textoComparado += `[+${part.value}+]`;
      } else if (part.removed) {
        textoComparado += `[-${part.value}-]`;
      } else {
        textoComparado += part.value;
      }
    });

    const conteudo = `${APP_TITLE}
por Fernando Mesquita

${"-".repeat(60)}

INFORMAÇÕES DO QUARTO

Quarto: ${quarto.codigoQuarto}
Data: ${dataRegistro}
Dificuldade: ${dificuldadeMap[quarto.dificuldade] || "Não avaliado"}

${"-".repeat(60)}

ESTATÍSTICAS DA COMPARAÇÃO

Taxa de Precisão: ${resultadoComparacao.stats.taxaPrecisao}%
Palavras Adicionadas: ${resultadoComparacao.stats.adicionadas}
Palavras Removidas: ${resultadoComparacao.stats.removidas}
Palavras Inalteradas: ${resultadoComparacao.stats.inalteradas}
Total de Alterações: ${resultadoComparacao.stats.totalAlteracoes}
Total de Palavras: ${resultadoComparacao.stats.totalPalavras}

${"-".repeat(60)}

TEXTO COMPARADO

Legenda:
[+texto+] = Texto adicionado
[-texto-] = Texto removido

${textoComparado}

${"-".repeat(60)}

Gerado em: ${new Date().toLocaleString("pt-BR")}
`;

    const blob = new Blob([conteudo], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `comparacao_${quarto.codigoQuarto.replace("/", "-")}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Arquivo TXT baixado!");
  };

  const exportarPDF = async () => {
    if (!resultadoComparacao) return;

    try {
      const dataRegistro = new Date(quarto.dataRegistro).toLocaleDateString("pt-BR");
      const dificuldadeMap: Record<string, string> = {
        NA: "Não avaliado",
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
      doc.text("Informa\u00e7\u00f5es do Quarto", margin, yPos);
      yPos += 8;

      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text(`Quarto: ${quarto.codigoQuarto}`, margin, yPos);
      yPos += 6;
      doc.text(`Data: ${dataRegistro}`, margin, yPos);
      yPos += 6;
      doc.text(`Dificuldade: ${dificuldadeMap[quarto.dificuldade] || "N\u00e3o avaliado"}`, margin, yPos);
      yPos += 12;

      // Estatísticas da Comparação
      doc.setFontSize(14);
      doc.setTextColor(59, 130, 246);
      doc.text("Estat\u00edsticas da Compara\u00e7\u00e3o", margin, yPos);
      yPos += 8;

      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text(`Taxa de Precis\u00e3o: ${resultadoComparacao.stats.taxaPrecisao}%`, margin, yPos);
      yPos += 6;
      doc.text(`Palavras Adicionadas: ${resultadoComparacao.stats.adicionadas}`, margin, yPos);
      yPos += 6;
      doc.text(`Palavras Removidas: ${resultadoComparacao.stats.removidas}`, margin, yPos);
      yPos += 6;
      doc.text(`Palavras Inalteradas: ${resultadoComparacao.stats.inalteradas}`, margin, yPos);
      yPos += 6;
      doc.text(`Total de Altera\u00e7\u00f5es: ${resultadoComparacao.stats.totalAlteracoes}`, margin, yPos);
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

  return (
    <>
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogTrigger asChild>
          {mostrarApenasResultado ? (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                if (quarto.comparacaoRealizada) {
                  compararDocumentos();
                }
              }}
            >
              <Eye className="h-4 w-4 mr-2" />
              Ver Comparação
            </Button>
          ) : (
            <Button variant="outline" size="sm">
              <FileText className="h-4 w-4 mr-2" />
              Arquivos
            </Button>
          )}
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Comparação de Documentos</DialogTitle>
            <DialogDescription>
              <span className="font-semibold text-blue-600">Quarto {quarto.codigoQuarto}</span>
              <br />
              Envie o arquivo de taquigrafia original e a redação final para comparar
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Upload Taquigrafia */}
            <div className="space-y-2">
              <Label>📝 Taquigrafia Original</Label>
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  accept=".docx"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file, "taquigrafia");
                  }}
                  className="hidden"
                  id="taquigrafia-upload"
                  disabled={uploading}
                />
                <label
                  htmlFor="taquigrafia-upload"
                  className="flex-1 cursor-pointer"
                >
                  <div className="border-2 border-dashed rounded-lg p-4 hover:border-blue-500 transition-colors">
                    {quarto.arquivoTaquigrafiaName ? (
                      <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-green-600" />
                        <span className="text-sm font-medium">
                          {quarto.arquivoTaquigrafiaName}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Upload className="h-5 w-5" />
                        <span className="text-sm">Clique para enviar .docx</span>
                      </div>
                    )}
                  </div>
                </label>
              </div>
            </div>

            {/* Upload Redação Final */}
            <div className="space-y-2">
              <Label>✅ Redação Final</Label>
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  accept=".docx"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file, "redacaoFinal");
                  }}
                  className="hidden"
                  id="redacao-upload"
                  disabled={uploading}
                />
                <label
                  htmlFor="redacao-upload"
                  className="flex-1 cursor-pointer"
                >
                  <div className="border-2 border-dashed rounded-lg p-4 hover:border-green-500 transition-colors">
                    {quarto.arquivoRedacaoFinalName ? (
                      <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-green-600" />
                        <span className="text-sm font-medium">
                          {quarto.arquivoRedacaoFinalName}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Upload className="h-5 w-5" />
                        <span className="text-sm">Clique para enviar .docx</span>
                      </div>
                    )}
                  </div>
                </label>
              </div>
            </div>

            {/* Botão de Comparação */}
            {temAmbosArquivos && (
              <div className="pt-4 border-t">
                <Button
                  onClick={compararDocumentos}
                  disabled={comparing}
                  className="w-full"
                  size="lg"
                >
                  <Eye className="h-5 w-5 mr-2" />
                  {comparing ? "Comparando..." : "Comparar Documentos"}
                </Button>
              </div>
            )}

            {/* Resultado da Comparação Anterior */}
            {quarto.comparacaoRealizada && !showComparacao && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-medium text-green-900 mb-2">
                  Última Comparação
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Taxa de Precisão</p>
                    <p className="text-2xl font-bold text-green-600">
                      {quarto.taxaPrecisao}%
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Total de Alterações</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {quarto.totalAlteracoes}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de Resultado da Comparação */}
      {resultadoComparacao && (
        <Dialog open={showComparacao} onOpenChange={setShowComparacao}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Resultado da Comparação</DialogTitle>
              <DialogDescription>
                Análise detalhada das diferenças entre os documentos
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Estatísticas */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">Taxa de Precisão</p>
                  <p className="text-3xl font-bold text-green-600">
                    {resultadoComparacao.stats.taxaPrecisao}%
                  </p>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">Total de Alterações</p>
                  <p className="text-3xl font-bold text-blue-600">
                    {resultadoComparacao.stats.totalAlteracoes}
                  </p>
                </div>
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">Palavras Totais</p>
                  <p className="text-3xl font-bold text-purple-600">
                    {resultadoComparacao.stats.totalPalavras}
                  </p>
                </div>
              </div>

              {/* Detalhamento */}
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">➕ Adicionadas</p>
                  <p className="text-xl font-bold text-green-600">
                    {resultadoComparacao.stats.adicionadas}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">➖ Removidas</p>
                  <p className="text-xl font-bold text-red-600">
                    {resultadoComparacao.stats.removidas}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">✓ Inalteradas</p>
                  <p className="text-xl font-bold text-gray-600">
                    {resultadoComparacao.stats.inalteradas}
                  </p>
                </div>
              </div>

              {/* Visualização das Diferenças */}
              <div className="border rounded-lg p-4 bg-gray-50 max-h-96 overflow-y-auto">
                <h4 className="font-medium mb-3">Diferenças Encontradas:</h4>
                <div className="text-sm leading-relaxed whitespace-pre-wrap">
                  {resultadoComparacao.diff.map((part: any, index: number) => (
                    <span
                      key={index}
                      className={
                        part.added
                          ? "bg-green-200 text-green-900"
                          : part.removed
                          ? "bg-red-200 text-red-900 line-through"
                          : ""
                      }
                    >
                      {part.value}
                    </span>
                  ))}
                </div>
              </div>

              {/* Botões de Download */}
              <div className="flex gap-3 pt-4 border-t">
                <Button
                  onClick={() => exportarTXT()}
                  variant="outline"
                  className="flex-1"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Baixar TXT
                </Button>
                <Button
                  onClick={() => exportarPDF()}
                  variant="outline"
                  className="flex-1"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Baixar PDF
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

