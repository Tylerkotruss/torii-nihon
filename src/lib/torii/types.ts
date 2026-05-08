export type ToriiIdentity = {
  toriiId: string;
  nome: string | null;
  email: string | null;
  role: "aluno";
  plano: "free";
  vinculo: {
    label: "Vínculo";
    valor: string;
  };
  statusConta: {
    label: "Status";
    valor: string;
  };
  acesso: {
    label: "Acesso";
    valor: string;
  };
  membroDesde: {
    label: "Membro desde";
    valor: string | null;
  };
  area: {
    label: "Área";
    valor: string | null;
  };
  docs: {
    enviados: number;
    total: number;
    status: string;
  };
};

