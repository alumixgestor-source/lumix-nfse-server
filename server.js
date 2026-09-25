import express from "express";
import cors from "cors";
import { createClient } from "@supabase/supabase-js";
import {
  NfseClient,
  Ambiente,
  createInMemoryDpsCounter,
  createInMemoryRetryStore,
  OpcaoSimplesNacional,
  RegimeApuracaoSimplesNacional,
  RegimeEspecialTributacao,
  ReceitaRejectionError,
} from "open-nfse";

const app = express();
app.use(cors());
app.use(express.json());

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

app.get("/", (req, res) => {
  res.json({ ok: true, servico: "alumix-nfse-server" });
});

app.post("/emitir", async (req, res) => {
  try {
    const { company_id, tomador, servico, valores, ambiente } = req.body;

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Busca empresa
    const { data: empresa, error: errEmp } = await supabase
      .from("companies").select("*").eq("id", company_id).single();
    if (errEmp || !empresa) throw new Error("Empresa nao encontrada");

    // Busca certificado
    const { data: cert, error: errCert } = await supabase
      .from("certificados").select("*").eq("company_id", company_id)
      .order("created_at", { ascending: false }).limit(1).single();
    if (errCert || !cert) throw new Error("Certificado nao encontrado");

    // Baixa certificado via signed URL
    const { data: signed } = await supabase.storage
      .from("certificados")
      .createSignedUrl(cert.storage_path, 60);

    const respCert = await fetch(signed.signedUrl);
    const arrayBuffer = await respCert.arrayBuffer();
    const pfxBytes = Buffer.from(arrayBuffer);

    console.log("Certificado baixado:", pfxBytes.length, "bytes");

    // Ambiente
    const amb = ambiente === "producao" ? Ambiente.Producao : Ambiente.ProducaoRestrita;

    // Cliente NFS-e
    const cliente = new NfseClient({
      ambiente: amb,
      certificado: { pfx: pfxBytes, password: cert.senha_criptografada },
      dpsCounter: createInMemoryDpsCounter(),
      retryStore: createInMemoryRetryStore(),
    });

    // Emitir
    const resultado = await cliente.emitir({
      emitente: {
        cnpj: empresa.cnpj.replace(/\D/g, ""),
        codMunicipio: empresa.codigo_municipio,
        regime: {
          opSimpNac: empresa.regime_tributario === "MEI" ? OpcaoSimplesNacional.Mei
            : empresa.regime_tributario === "SIMPLES" ? OpcaoSimplesNacional.MeEpp
            : OpcaoSimplesNacional.NaoOptante,
          regApTribSN: RegimeApuracaoSimplesNacional.FederalEMunicipalPeloSN,
          regEspTrib: RegimeEspecialTributacao.Nenhum,
        },
      },
      serie: "1",
      servico: { cTribNac: empresa.codigo_tributacao_nacional, descricao: servico.descricao },
      valores: { vServ: valores.valorTotal, aliqIss: valores.aliquotaIss },
      tomador: { documento: { [tomador.tipo]: tomador.documento }, nome: tomador.nome },
    });

    console.log("Resultado emissao:", JSON.stringify(resultado));

    // Salva no banco
    await supabase.from("notas_fiscais").insert({
      company_id, tipo: "nfse",
      chave_acesso: resultado.status === "ok" ? resultado.nfse.chaveAcesso : null,
      status: resultado.status === "ok" ? "emitida" : "pendente",
      valor: valores.valorTotal,
      tomador_nome: tomador.nome,
      tomador_documento: tomador.documento,
      descricao_servico: servico.descricao,
      emitida_em: new Date().toISOString(),
    });

    res.json({
      sucesso: resultado.status === "ok",
      status: resultado.status,
      chaveAcesso: resultado.status === "ok" ? resultado.nfse.chaveAcesso : null,
    });

  } catch (err) {
    console.error("Erro:", err);
    if (err instanceof ReceitaRejectionError) {
      return res.status(400).json({ sucesso: false, erro: "Rejeitada [" + err.codigo + "]: " + err.descricao });
    }
    res.status(500).json({ sucesso: false, erro: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Servidor NFS-e rodando na porta " + PORT);
});
