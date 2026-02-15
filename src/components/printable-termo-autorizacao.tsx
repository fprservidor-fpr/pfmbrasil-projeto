"use client";

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface PrintableTermoAutorizacaoProps {
  nomeResponsavel: string;
  cpfResponsavel: string;
  nomeAluno: string;
  matriculaAluno: string;
  tipoTermo: string;
  descricaoTermo: string;
  assinaturaUrl: string;
  dataAssinatura: string;
}

const formatCPF = (cpf: string) => {
  if (!cpf) return "-";
  const digits = cpf.replace(/\D/g, "");
  const padded = digits.padStart(11, "0");
  return padded.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
};

export function PrintableTermoAutorizacao({
  nomeResponsavel,
  cpfResponsavel,
  nomeAluno,
  matriculaAluno,
  tipoTermo,
  descricaoTermo,
  assinaturaUrl,
  dataAssinatura,
}: PrintableTermoAutorizacaoProps) {
  return (
    <div className="w-full max-w-[210mm] mx-auto bg-white text-black p-12 print:p-8 font-serif">
      <div className="text-center mb-8 border-b-2 border-black pb-6">
        <h1 className="text-2xl font-black uppercase tracking-wider mb-2">
          FUNDAÇÃO POPULUS RATIONABILIS
        </h1>
        <h2 className="text-lg font-bold uppercase tracking-widest text-gray-700">
          Programa Força Mirim - PFM
        </h2>
        <div className="text-xs text-gray-500 mt-2 uppercase tracking-wider">
          CNPJ: XX.XXX.XXX/0001-XX
        </div>
      </div>

      <div className="text-center mb-10">
        <h3 className="text-xl font-black uppercase tracking-widest border-2 border-black inline-block px-8 py-3">
          {tipoTermo}
        </h3>
      </div>

      <div className="space-y-6 text-justify leading-relaxed text-sm mb-10">
        <p>
          Eu, <strong className="uppercase">{nomeResponsavel}</strong>, portador(a) do CPF nº{" "}
          <strong>{formatCPF(cpfResponsavel)}</strong>, na qualidade de responsável legal pelo(a)
          menor <strong className="uppercase">{nomeAluno}</strong>, matrícula PFM nº{" "}
          <strong>{matriculaAluno}</strong>, declaro para os devidos fins que:
        </p>

        <div className="bg-gray-50 border border-gray-200 p-6 rounded-lg">
          <p className="whitespace-pre-line">{descricaoTermo}</p>
        </div>

        <p>
          Declaro ainda que estou ciente de todas as normas, regulamentos e diretrizes do Programa
          Força Mirim, comprometendo-me a cumpri-las e a zelar para que o menor sob minha
          responsabilidade também as cumpra.
        </p>

        <p>
          Por ser expressão da verdade, assino o presente termo de livre e espontânea vontade,
          para que produza seus efeitos legais.
        </p>
      </div>

      <div className="mt-16 text-center">
        <div className="mb-2 text-sm text-gray-600">
          {format(new Date(dataAssinatura), "dd 'de' MMMM 'de' yyyy, 'às' HH:mm", { locale: ptBR })}
        </div>

        <div className="flex flex-col items-center gap-4 mt-8">
          <div className="bg-white border border-gray-300 p-4 rounded-lg shadow-inner">
            <img
              src={assinaturaUrl}
              alt="Assinatura Digital"
              className="h-20 object-contain"
            />
          </div>
          <div className="w-80 border-t-2 border-black pt-2">
            <div className="font-bold uppercase text-sm">{nomeResponsavel}</div>
            <div className="text-xs text-gray-600">CPF: {formatCPF(cpfResponsavel)}</div>
            <div className="text-xs text-gray-500 mt-1">Responsável Legal</div>
          </div>
        </div>
      </div>

      <div className="mt-16 pt-6 border-t border-gray-300 text-center text-xs text-gray-500">
        <p>
          Documento gerado eletronicamente pelo PFM Digital System em{" "}
          {format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}.
        </p>
        <p className="mt-1">
          Este documento possui validade legal conforme Lei nº 14.063/2020 (Assinatura Eletrônica).
        </p>
      </div>
    </div>
  );
}

export function PrintableTermoPresencaReuniao({
  nomeResponsavel,
  cpfResponsavel,
  alunos,
  evento,
  assinaturaUrl,
  dataAssinatura,
}: {
  nomeResponsavel: string;
  cpfResponsavel: string;
  alunos: { nome: string; matricula: string }[];
  evento: { data: string; descricao: string };
  assinaturaUrl: string;
  dataAssinatura: string;
}) {
  return (
    <div className="w-full max-w-[210mm] mx-auto bg-white text-black p-12 print:p-8 font-serif">
      <div className="text-center mb-8 border-b-2 border-black pb-6">
        <h1 className="text-2xl font-black uppercase tracking-wider mb-2">
          FUNDAÇÃO POPULUS RATIONABILIS
        </h1>
        <h2 className="text-lg font-bold uppercase tracking-widest text-gray-700">
          Programa Força Mirim - PFM
        </h2>
      </div>

      <div className="text-center mb-10">
        <h3 className="text-xl font-black uppercase tracking-widest border-2 border-black inline-block px-8 py-3">
          COMPROVANTE DE PRESENÇA - REUNIÃO DE PAIS
        </h3>
      </div>

      <div className="mb-8 p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Evento:</span>
            <div className="font-bold">{evento.descricao}</div>
          </div>
          <div>
            <span className="text-gray-500">Data:</span>
            <div className="font-bold">
              {format(new Date(evento.data + "T00:00:00"), "dd/MM/yyyy", { locale: ptBR })}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6 text-justify leading-relaxed text-sm mb-10">
        <p>
          Eu, <strong className="uppercase">{nomeResponsavel}</strong>, portador(a) do CPF nº{" "}
          <strong>{formatCPF(cpfResponsavel)}</strong>, declaro ter comparecido à reunião de pais
          acima identificada, referente ao(s) seguinte(s) aluno(s) sob minha responsabilidade:
        </p>

        <div className="bg-gray-50 border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="text-left p-3 font-bold uppercase text-xs">Matrícula</th>
                <th className="text-left p-3 font-bold uppercase text-xs">Nome do Aluno</th>
              </tr>
            </thead>
            <tbody>
              {alunos.map((aluno, idx) => (
                <tr key={idx} className="border-t border-gray-200">
                  <td className="p-3 font-mono">{aluno.matricula}</td>
                  <td className="p-3 font-bold uppercase">{aluno.nome}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p>
          Confirmo minha ciência de todos os assuntos tratados durante a reunião e comprometo-me a
          acompanhar o desenvolvimento dos alunos acima citados junto ao Programa Força Mirim.
        </p>
      </div>

      <div className="mt-16 text-center">
        <div className="mb-2 text-sm text-gray-600">
          {format(new Date(dataAssinatura), "dd 'de' MMMM 'de' yyyy, 'às' HH:mm", { locale: ptBR })}
        </div>

        <div className="flex flex-col items-center gap-4 mt-8">
          <div className="bg-white border border-gray-300 p-4 rounded-lg shadow-inner">
            <img
              src={assinaturaUrl}
              alt="Assinatura Digital"
              className="h-20 object-contain"
            />
          </div>
          <div className="w-80 border-t-2 border-black pt-2">
            <div className="font-bold uppercase text-sm">{nomeResponsavel}</div>
            <div className="text-xs text-gray-600">CPF: {formatCPF(cpfResponsavel)}</div>
            <div className="text-xs text-gray-500 mt-1">Responsável Legal</div>
          </div>
        </div>
      </div>

      <div className="mt-16 pt-6 border-t border-gray-300 text-center text-xs text-gray-500">
        <p>
          Documento gerado eletronicamente pelo PFM Digital System em{" "}
          {format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}.
        </p>
        <p className="mt-1">
          Este documento possui validade legal conforme Lei nº 14.063/2020 (Assinatura Eletrônica).
        </p>
      </div>
    </div>
  );
}
