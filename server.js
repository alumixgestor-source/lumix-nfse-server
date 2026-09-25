import express from "express";
import cors from "cors";
import { createClient } from "@supabase/supabase-js";
import {
  NfseClient,
  Ambiente,
  createInMemoryRetryStore,
  OpcaoSimplesNacional,
  RegimeApuracaoSimplesNacional,
  RegimeEspecialTributacao,
  ReceitaRejectionError,
} from "./open-nfse-local/dist/index.js";

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

    // Contador persistente no banco
    let { data: contador } = await supabase
      .from("nfse_contador")
      .select("*")
      .eq("company_id", company_id)
      .eq("serie", "1")
      .single();

    if (!contador) {
      const { data: novo } = await supabase
        .from("nfse_contador")
        .insert({ company_id, serie: "1", ultimo_numero: 0 })
        .select()
        .single();
      contador = novo;
    }

    const proximoNumero = (contador?.ultimo_numero || 0) + 1;
    console.log("Proximo numero DPS:", proximoNumero);

    // Atualiza o contador antes de emitir
    await supabase
      .from("nfse_contador")
      .update({ ultimo_numero: proximoNumero, updated_at: new Date().toISOString() })
      .eq("id", contador.id);

    // DpsCounter customizado
    const dpsCounterCustom = async function() {
      return String(proximoNumero);
    };

    // Cliente NFS-e
    const cliente = new NfseClient({
      ambiente: amb,
      certificado: { pfx: pfxBytes, password: cert.senha_criptografada },
      dpsCounter: dpsCounterCustom,
      retryStore: createInMemoryRetryStore(),
    });

    // Monta o objeto de valores (evita gerar tag pAliq no XML quando for 0)
    const valoresObj = { vServ: valores.valorTotal, pTotTribSN: 6.00 };
    if (valores.aliquotaIss > 0) {
      valoresObj.aliqIss = valores.aliquotaIss;
    }

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
      servico: { cTribNac: (empresa.codigo_tributacao_nacional || "").replace(/\D/g, "").padStart(6, "0"), cTribMun: "001", descricao: servico.descricao },
      valores: valoresObj,
      tomador: { documento: { [tomador.tipo.toUpperCase()]: tomador.documento }, nome: tomador.nome },
      obra: {
        cObra: "000",
        end: {
          xLgr: "Rua da Obra",
          nro: "S/N",
          xBairro: "Centro",
          cMun: empresa.codigo_municipio,
          UF: empresa.estado || "SP",
          CEP: (empresa.cep || "00000000").replace(/\D/g, "")
        }
      },
    });

    console.log("Resultado emissao:", JSON.stringify(resultado));

    // Gera o DANFSe (PDF) e salva no Storage
    let pdfUrl = null;
    if (resultado.status === "ok") {
      try {
        const nfseCompleta = await cliente.fetchByChave(resultado.nfse.chaveAcesso);
        console.log("NFSE COMPLETA:", JSON.stringify(nfseCompleta, null, 2));
        const pdfBytes = await cliente.gerarDanfse(nfseCompleta.nfse);
        const pdfPath = company_id + "/danfse_" + resultado.nfse.chaveAcesso + ".pdf";
        const { error: errUp } = await supabase.storage
          .from("notas")
          .upload(pdfPath, pdfBytes, { contentType: "application/pdf", upsert: true });
        if (!errUp) {
          const { data: pub } = supabase.storage.from("notas").getPublicUrl(pdfPath);
          pdfUrl = pub.publicUrl;
          console.log("DANFSe gerado:", pdfUrl);
        }
      } catch(e) { console.error("Erro ao gerar DANFSe:", e); }
    }

    // Salva no banco
    await supabase.from("notas_fiscais").insert({
      company_id, tipo: "nfse",
      chave_acesso: resultado.status === "ok" ? resultado.nfse.chaveAcesso : null,
      status: resultado.status === "ok" ? "emitida" : "pendente",
      valor: valores.valorTotal,
      tomador_nome: tomador.nome,
      tomador_documento: tomador.documento,
      descricao_servico: servico.descricao,
      pdf_url: pdfUrl,
      emitida_em: new Date().toISOString(),
    });

    res.json({
      sucesso: resultado.status === "ok",
      status: resultado.status,
      chaveAcesso: resultado.status === "ok" ? resultado.nfse.chaveAcesso : null,
      pdfUrl: pdfUrl,
    });

  } catch (err) {
    console.error("Erro na emissao:", err);
    if (err instanceof ReceitaRejectionError) {
      return res.status(400).json({ sucesso: false, erro: "Rejeitada [" + err.codigo + "]: " + err.descricao });
    }
    res.status(500).json({ sucesso: false, erro: err.message });
  }
});

// ===== CANCELAR NFS-e =====
app.post("/cancelar", async (req, res) => {
  try {
    const { company_id, chave_acesso, justificativa } = req.body;

    if (!chave_acesso) throw new Error("Chave de acesso obrigatoria");

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: empresa } = await supabase
      .from("companies").select("*").eq("id", company_id).single();
    if (!empresa) throw new Error("Empresa nao encontrada");

    const { data: cert } = await supabase
      .from("certificados").select("*").eq("company_id", company_id)
      .order("created_at", { ascending: false }).limit(1).single();
    if (!cert) throw new Error("Certificado nao encontrado");

    // Baixa certificado
    const { data: signed } = await supabase.storage
      .from("certificados").createSignedUrl(cert.storage_path, 60);
    const respCert = await fetch(signed.signedUrl);
    const arrayBuffer = await respCert.arrayBuffer();
    const pfxBytes = Buffer.from(arrayBuffer);

    // Cria cliente
    const amb = Ambiente.ProducaoRestrita;
    const cliente = new NfseClient({
      ambiente: amb,
      certificado: { pfx: pfxBytes, password: cert.senha_criptografada },
      retryStore: createInMemoryRetryStore(),
    });

    // Cancela na SEFAZ
    const resultado = await cliente.cancelar({
      chaveAcesso: chave_acesso,
      justificativa: justificativa || "Cancelamento solicitado pelo prestador",
    });

    console.log("Cancelamento:", JSON.stringify(resultado));

    // Atualiza o banco
    await supabase.from("notas_fiscais").update({
      status: "cancelada",
      erro_mensagem: "Cancelada em " + new Date().toISOString(),
    }).eq("chave_acesso", chave_acesso).eq("company_id", company_id);

    res.json({
      sucesso: true,
      status: resultado.status || "cancelada",
      protocolo: resultado.protocolo || null,
    });

  } catch (err) {
    console.error("Erro no cancelamento:", err);
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