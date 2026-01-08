// API helpers for CEP and CNPJ lookups

export interface CepData {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  erro?: boolean;
}

export interface CnpjData {
  cnpj: string;
  razao_social: string;
  nome_fantasia: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  municipio: string;
  uf: string;
  cep: string;
  telefone: string;
  email: string;
}

export async function fetchCep(cep: string): Promise<CepData | null> {
  const cleanCep = cep.replace(/\D/g, "");
  if (cleanCep.length !== 8) return null;

  try {
    const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
    if (!response.ok) return null;
    
    const data = await response.json();
    if (data.erro) return null;
    
    return data;
  } catch (error) {
    console.error("Erro ao buscar CEP:", error);
    return null;
  }
}

export async function fetchCnpj(cnpj: string): Promise<CnpjData | null> {
  const cleanCnpj = cnpj.replace(/\D/g, "");
  if (cleanCnpj.length !== 14) return null;

  try {
    // Using BrasilAPI which is free and doesn't require authentication
    const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleanCnpj}`);
    if (!response.ok) return null;
    
    const data = await response.json();
    
    return {
      cnpj: data.cnpj,
      razao_social: data.razao_social || "",
      nome_fantasia: data.nome_fantasia || "",
      logradouro: data.logradouro || "",
      numero: data.numero || "",
      complemento: data.complemento || "",
      bairro: data.bairro || "",
      municipio: data.municipio || "",
      uf: data.uf || "",
      cep: data.cep || "",
      telefone: data.ddd_telefone_1 || "",
      email: data.email || "",
    };
  } catch (error) {
    console.error("Erro ao buscar CNPJ:", error);
    return null;
  }
}

export function formatCep(cep: string): string {
  const clean = cep.replace(/\D/g, "");
  if (clean.length <= 5) return clean;
  return `${clean.slice(0, 5)}-${clean.slice(5, 8)}`;
}

export function formatEndereco(data: CepData): string {
  const parts = [
    data.logradouro,
    data.bairro,
    `${data.localidade} - ${data.uf}`,
    data.cep,
  ].filter(Boolean);
  return parts.join(", ");
}