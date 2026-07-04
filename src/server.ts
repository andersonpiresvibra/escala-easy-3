import './polyfills.server';

import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import {join} from 'node:path';
import { GoogleGenAI } from '@google/genai';

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();

const angularApp = new AngularNodeAppEngine();

// Lazily initialize Gemini client
let aiClient: GoogleGenAI | null = null;
function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env['GEMINI_API_KEY'];
    if (!apiKey) {
      console.warn("GEMINI_API_KEY environment variable is not set!");
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey || '',
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

const systemInstruction = `Você é um leitor de escalas especialista.
Sua tarefa é analisar a imagem de uma tabela de escala de trabalho mensal fornecida e extrair os dados de cada colaborador em formato de texto limpo, linha por linha.

Para cada colaborador identificado na tabela, você deve gerar uma única linha no seguinte formato estrito:
Nome do Colaborador | Dia 1 | Dia 2 | Dia 3 | ... | Dia 31

REGRAS CRÍTICAS DE FORMATAÇÃO:
1. O primeiro token deve ser o Nome do Colaborador, exatamente como está escrito na imagem (ou muito semelhante).
2. Seguido de exatamente 31 valores separados por pipes (|), representando os dias de 1 a 31 do mês.
3. Use as siglas dos turnos ou folgas exatamente como aparecem na tabela (ex: "MANHÃ", "TARDE", "NOITE", "ADM", "M1", "T1", "X", "F", "LM", etc.).
4. Caso o mês possua menos de 31 dias ou a escala de algum dia esteja vazia/ilegível, utilize o caractere hífen "-" como espaço reservado para manter exatamente os 31 dias na linha.
5. Se a escala tiver folga indicada por em branco, X, F ou traço, use "X" ou "F" ou "-" conforme indicado na imagem.
6. Não retorne tabelas Markdown, blocos de código markdown ou explicações adicionais. Retorne APENAS as linhas no formato:
Nome do Colaborador | Valor1 | Valor2 | Valor3 | ... | Valor31

Exemplo de saída de sucesso:
ANDRÉ SILVA | X | ADM | ADM | ADM | ADM | ADM | X | X | MANHÃ | TARDE | NOITE | X | X | ...
CARLOS SOUZA | ADM | ADM | X | X | NOITE | NOITE | NOITE | X | X | ...`;

app.post('/api/gemini/scan-image', express.json({ limit: '50mb' }), express.urlencoded({ limit: '50mb', extended: true }), async (req, res) => {
  try {
    const { imageBase64, mimeType } = req.body;
    if (!imageBase64) {
      res.status(400).json({ error: 'Nenhuma imagem fornecida em base64.' });
      return;
    }

    const ai = getAiClient();
    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: [
        {
          inlineData: {
            mimeType: mimeType || 'image/jpeg',
            data: cleanBase64
          }
        },
        {
          text: 'Por favor, extraia os dados desta imagem de escala e converta para o formato pipe-separado.'
        }
      ],
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.1,
      }
    });

    const textResult = response.text || '';
    res.json({ text: textResult });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error('Erro na chamada do Gemini:', err);
    res.status(500).json({ error: err.message || 'Erro interno no processamento da IA.' });
  }
});

/**
 * Example Express Rest API endpoints can be defined here.
 * Uncomment and define endpoints as necessary.
 *
 * Example:
 * ```ts
 * app.get('/api/{*splat}', (req, res) => {
 *   // Handle API request
 * });
 * ```
 */

/**
 * Serve static files from /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) =>
      response ? writeResponseToNodeResponse(response, res) : next(),
    )
    .catch(next);
});

/**
 * Start the server if this module is the main entry point, or it is ran via PM2.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, (error) => {
    if (error) {
      throw error;
    }

    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);
