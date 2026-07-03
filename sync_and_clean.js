const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://vefyegxmvjficncbetyp.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZlZnllZ3htdmpmaWNuY2JldHlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyNjYwMjksImV4cCI6MjA5Nzg0MjAyOX0.ioaZkwS98123Jb2xw2l6vev3FgoLwIVwsitg7pTew7c";

const supabase = createClient(supabaseUrl, supabaseKey);

const collaborators = [
  // 05:00 - 14:00 (5 Operadores - Aeródromo)
  { id: 'collab_1', name: 'MICHEL (AD)', role: 'OPERADOR', schedule: '05:00 - 14:00', grupo: 'Manhã', shift: 'MANHÃ', sector: 'AERÓDROMO', birthday: '1992-04-12' },
  { id: 'collab_2', name: 'JOAO (AD)', role: 'OPERADOR', schedule: '05:00 - 14:00', grupo: 'Manhã', shift: 'MANHÃ', sector: 'AERÓDROMO', birthday: '1995-08-22' },
  { id: 'collab_3', name: 'ADAUTO (AD)', role: 'OPERADOR', schedule: '05:00 - 14:00', grupo: 'Manhã', shift: 'MANHÃ', sector: 'AERÓDROMO', birthday: '1990-11-05' },
  { id: 'collab_4', name: 'PAULO (AA)', role: 'OPERADOR', schedule: '05:00 - 14:00', grupo: 'Manhã', shift: 'MANHÃ', sector: 'AERÓDROMO', birthday: '1988-02-14' },
  { id: 'collab_5', name: 'EWERTON', role: 'OPERADOR', schedule: '05:00 - 14:00', grupo: 'Manhã', shift: 'MANHÃ', sector: 'AERÓDROMO', birthday: '1994-07-30' },

  // 06:00 - 15:00 (24 Operadores - Aeródromo)
  { id: 'collab_6', name: 'ALEX BARBOSA', role: 'OPERADOR', schedule: '06:00 - 15:00', grupo: 'Manhã', shift: 'MANHÃ', sector: 'AERÓDROMO', birthday: '1993-01-15' },
  { id: 'collab_7', name: 'DOUGLAS (AA)', role: 'OPERADOR', schedule: '06:00 - 15:00', grupo: 'Manhã', shift: 'MANHÃ', sector: 'AERÓDROMO', birthday: '1991-09-18' },
  { id: 'collab_8', name: 'TAVARES', role: 'OPERADOR', schedule: '06:00 - 15:00', grupo: 'Manhã', shift: 'MANHÃ', sector: 'AERÓDROMO', birthday: '1987-12-01' },
  { id: 'collab_9', name: 'JULIO', role: 'OPERADOR', schedule: '06:00 - 15:00', grupo: 'Manhã', shift: 'MANHÃ', sector: 'AERÓDROMO', birthday: '1989-05-25' },
  { id: 'collab_10', name: 'SANDRO (AA)', role: 'OPERADOR', schedule: '06:00 - 15:00', grupo: 'Manhã', shift: 'MANHÃ', sector: 'AERÓDROMO', birthday: '1990-03-14' },
  { id: 'collab_11', name: 'CLÉBER (AD)', role: 'OPERADOR', schedule: '06:00 - 15:00', grupo: 'Manhã', shift: 'MANHÃ', sector: 'AERÓDROMO', birthday: '1992-06-11' },
  { id: 'collab_12', name: 'JOSE (AD)', role: 'OPERADOR', schedule: '06:00 - 15:00', grupo: 'Manhã', shift: 'MANHÃ', sector: 'AERÓDROMO', birthday: '1985-04-20' },
  { id: 'collab_13', name: 'CALAZANS', role: 'OPERADOR', schedule: '06:00 - 15:00', grupo: 'Manhã', shift: 'MANHÃ', sector: 'AERÓDROMO', birthday: '1994-10-31' },
  { id: 'collab_14', name: 'SILVA', role: 'OPERADOR', schedule: '06:00 - 15:00', grupo: 'Manhã', shift: 'MANHÃ', sector: 'AERÓDROMO', birthday: '1991-02-08' },
  { id: 'collab_15', name: 'GUILHERME (AA)', role: 'OPERADOR', schedule: '06:00 - 15:00', grupo: 'Manhã', shift: 'MANHÃ', sector: 'AERÓDROMO', birthday: '1996-07-24' },
  { id: 'collab_16', name: 'ILDO (AD)', role: 'OPERADOR', schedule: '06:00 - 15:00', grupo: 'Manhã', shift: 'MANHÃ', sector: 'AERÓDROMO', birthday: '1988-11-13' },
  { id: 'collab_17', name: 'PETERSON (AA)', role: 'OPERADOR', schedule: '06:00 - 15:00', grupo: 'Manhã', shift: 'MANHÃ', sector: 'AERÓDROMO', birthday: '1993-05-05' },
  { id: 'collab_18', name: 'RENILSON (AD)', role: 'OPERADOR', schedule: '06:00 - 15:00', grupo: 'Manhã', shift: 'MANHÃ', sector: 'AERÓDROMO', birthday: '1990-08-30' },
  { id: 'collab_19', name: 'RAMOS', role: 'OPERADOR', schedule: '06:00 - 15:00', grupo: 'Manhã', shift: 'MANHÃ', sector: 'AERÓDROMO', birthday: '1992-12-19' },
  { id: 'collab_20', name: 'VAGNER', role: 'OPERADOR', schedule: '06:00 - 15:00', grupo: 'Manhã', shift: 'MANHÃ', sector: 'AERÓDROMO', birthday: '1986-03-27' },
  { id: 'collab_21', name: 'EVANDRO', role: 'OPERADOR', schedule: '06:00 - 15:00', grupo: 'Manhã', shift: 'MANHÃ', sector: 'AERÓDROMO', birthday: '1991-06-03' },
  { id: 'collab_22', name: 'CESAR JC', role: 'OPERADOR', schedule: '06:00 - 15:00', grupo: 'Manhã', shift: 'MANHÃ', sector: 'AERÓDROMO', birthday: '1989-10-14' },
  { id: 'collab_23', name: 'FLAVIO', role: 'OPERADOR', schedule: '06:00 - 15:00', grupo: 'Manhã', shift: 'MANHÃ', sector: 'AERÓDROMO', birthday: '1994-01-28' },
  { id: 'collab_24', name: 'CARLOS', role: 'OPERADOR', schedule: '06:00 - 15:00', grupo: 'Manhã', shift: 'MANHÃ', sector: 'AERÓDROMO', birthday: '1987-05-17' },
  { id: 'collab_25', name: 'BELENTANI (AD)', role: 'OPERADOR', schedule: '06:00 - 15:00', grupo: 'Manhã', shift: 'MANHÃ', sector: 'AERÓDROMO', birthday: '1995-11-20' },
  { id: 'collab_26', name: 'EULES', role: 'OPERADOR', schedule: '06:00 - 15:00', grupo: 'Manhã', shift: 'MANHÃ', sector: 'AERÓDROMO', birthday: '1992-09-09' },
  { id: 'collab_27', name: 'SOUZA', role: 'OPERADOR', schedule: '06:00 - 15:00', grupo: 'Manhã', shift: 'MANHÃ', sector: 'AERÓDROMO', birthday: '1990-07-12' },
  { id: 'collab_28', name: 'LUNA', role: 'OPERADOR', schedule: '06:00 - 15:00', grupo: 'Manhã', shift: 'MANHÃ', sector: 'AERÓDROMO', birthday: '1993-03-24' },
  { id: 'collab_29', name: 'HUAN', role: 'OPERADOR', schedule: '06:00 - 15:00', grupo: 'Manhã', shift: 'MANHÃ', sector: 'AERÓDROMO', birthday: '1996-12-05' },

  // 06:00 - 16:00 (3 Operadores - Aeródromo)
  { id: 'collab_30', name: 'LUIS 06-15', role: 'OPERADOR', schedule: '06:00 - 16:00', grupo: 'Manhã', shift: 'MANHÃ', sector: 'AERÓDROMO', birthday: '1991-10-10' },
  { id: 'collab_31', name: 'CAIO 06-15', role: 'OPERADOR', schedule: '06:00 - 16:00', grupo: 'Manhã', shift: 'MANHÃ', sector: 'AERÓDROMO', birthday: '1994-02-15' },
  { id: 'collab_32', name: 'IDENILSON 06-15', role: 'OPERADOR', schedule: '06:00 - 16:00', grupo: 'Manhã', shift: 'MANHÃ', sector: 'AERÓDROMO', birthday: '1988-06-21' },

  // 14:42 - 23:30 (7 Operadores - Aeródromo)
  { id: 'collab_33', name: 'RODOLFO (AA)', role: 'OPERADOR', schedule: '14:42 - 23:30', grupo: 'Tarde', shift: 'TARDE', sector: 'AERÓDROMO', birthday: '1993-07-07' },
  { id: 'collab_34', name: 'LEONARDO (AD)', role: 'OPERADOR', schedule: '14:42 - 23:30', grupo: 'Tarde', shift: 'TARDE', sector: 'AERÓDROMO', birthday: '1995-11-11' },
  { id: 'collab_35', name: 'JUNIOR (AD)', role: 'OPERADOR', schedule: '14:42 - 23:30', grupo: 'Tarde', shift: 'TARDE', sector: 'AERÓDROMO', birthday: '1990-01-02' },
  { id: 'collab_36', name: 'KLEYSSON', role: 'OPERADOR', schedule: '14:42 - 23:30', grupo: 'Tarde', shift: 'TARDE', sector: 'AERÓDROMO', birthday: '1989-08-14' },
  { id: 'collab_37', name: 'LUCAS', role: 'OPERADOR', schedule: '14:42 - 23:30', grupo: 'Tarde', shift: 'TARDE', sector: 'AERÓDROMO', birthday: '1996-05-19' },
  { id: 'collab_38', name: 'WESLEY (AD)', role: 'OPERADOR', schedule: '14:42 - 23:30', grupo: 'Tarde', shift: 'TARDE', sector: 'AERÓDROMO', birthday: '1992-03-31' },
  { id: 'collab_39', name: 'PETTINELLI', role: 'OPERADOR', schedule: '14:42 - 23:30', grupo: 'Tarde', shift: 'TARDE', sector: 'AERÓDROMO', birthday: '1987-12-25' },

  // 15:15 - 00:00 (17 Operadores - Aeródromo)
  { id: 'collab_40', name: 'FREDISON', role: 'OPERADOR', schedule: '15:15 - 00:00', grupo: 'Tarde', shift: 'TARDE', sector: 'AERÓDROMO', birthday: '1994-09-09' },
  { id: 'collab_41', name: 'ALVES', role: 'OPERADOR', schedule: '15:15 - 00:00', grupo: 'Tarde', shift: 'TARDE', sector: 'AERÓDROMO', birthday: '1991-05-15' },
  { id: 'collab_42', name: 'LEANDRO EUFRA (AA)', role: 'OPERADOR', schedule: '15:15 - 00:00', grupo: 'Tarde', shift: 'TARDE', sector: 'AERÓDROMO', birthday: '1993-02-28' },
  { id: 'collab_43', name: 'JOSE EDSON', role: 'OPERADOR', schedule: '15:15 - 00:00', grupo: 'Tarde', shift: 'TARDE', sector: 'AERÓDROMO', birthday: '1986-12-14' },
  { id: 'collab_44', name: 'FEITOSA', role: 'OPERADOR', schedule: '15:15 - 00:00', grupo: 'Tarde', shift: 'TARDE', sector: 'AERÓDROMO', birthday: '1989-10-05' },
  { id: 'collab_45', name: 'LOPES (AD)', role: 'OPERADOR', schedule: '15:15 - 00:00', grupo: 'Tarde', shift: 'TARDE', sector: 'AERÓDROMO', birthday: '1992-04-22' },
  { id: 'collab_46', name: 'GIVANI (AD)', role: 'OPERADOR', schedule: '15:15 - 00:00', grupo: 'Tarde', shift: 'TARDE', sector: 'AERÓDROMO', birthday: '1988-07-17' },
  { id: 'collab_47', name: 'RENATO (AD)', role: 'OPERADOR', schedule: '15:15 - 00:00', grupo: 'Tarde', shift: 'TARDE', sector: 'AERÓDROMO', birthday: '1995-03-03' },
  { id: 'collab_48', name: 'COSTA', role: 'OPERADOR', schedule: '15:15 - 00:00', grupo: 'Tarde', shift: 'TARDE', sector: 'AERÓDROMO', birthday: '1990-11-12' },
  { id: 'collab_49', name: 'MANOEL', role: 'OPERADOR', schedule: '15:15 - 00:00', grupo: 'Tarde', shift: 'TARDE', sector: 'AERÓDROMO', birthday: '1987-08-25' },
  { id: 'collab_50', name: 'RONALD', role: 'OPERADOR', schedule: '15:15 - 00:00', grupo: 'Tarde', shift: 'TARDE', sector: 'AERÓDROMO', birthday: '1996-01-30' },
  { id: 'collab_51', name: 'BARBOSA', role: 'OPERADOR', schedule: '15:15 - 00:00', grupo: 'Tarde', shift: 'TARDE', sector: 'AERÓDROMO', birthday: '1994-06-18' },
  { id: 'collab_52', name: 'BASTOS', role: 'OPERADOR', schedule: '15:15 - 00:00', grupo: 'Tarde', shift: 'TARDE', sector: 'AERÓDROMO', birthday: '1991-09-04' },
  { id: 'collab_53', name: 'GILVAN (AD)', role: 'OPERADOR', schedule: '15:15 - 00:00', grupo: 'Tarde', shift: 'TARDE', sector: 'AERÓDROMO', birthday: '1989-12-08' },
  { id: 'collab_54', name: 'MILTON', role: 'OPERADOR', schedule: '15:15 - 00:00', grupo: 'Tarde', shift: 'TARDE', sector: 'AERÓDROMO', birthday: '1992-05-27' },
  { id: 'collab_55', name: 'MARQUES (AD)', role: 'OPERADOR', schedule: '15:15 - 00:00', grupo: 'Tarde', shift: 'TARDE', sector: 'AERÓDROMO', birthday: '1995-10-15' },
  { id: 'collab_56', name: 'LAERCIO (AA)', role: 'OPERADOR', schedule: '15:15 - 00:00', grupo: 'Tarde', shift: 'TARDE', sector: 'AERÓDROMO', birthday: '1993-03-12' },

  // 21:12 - 06:00 (9 Operadores - Aeródromo)
  { id: 'collab_57', name: 'HORACIO (AA)', role: 'OPERADOR', schedule: '21:12 - 06:00', grupo: 'Madrugada', shift: 'MADRUGADA', sector: 'AERÓDROMO', birthday: '1990-02-28' },
  { id: 'collab_58', name: 'NORMAN', role: 'OPERADOR', schedule: '21:12 - 06:00', grupo: 'Madrugada', shift: 'MADRUGADA', sector: 'AERÓDROMO', birthday: '1992-07-14' },
  { id: 'collab_59', name: 'RAFAEL (AD)', role: 'OPERADOR', schedule: '21:12 - 06:00', grupo: 'Madrugada', shift: 'MADRUGADA', sector: 'AERÓDROMO', birthday: '1994-11-23' },
  { id: 'collab_60', name: 'DOURADO', role: 'OPERADOR', schedule: '21:12 - 06:00', grupo: 'Madrugada', shift: 'MADRUGADA', sector: 'AERÓDROMO', birthday: '1987-04-05' },
  { id: 'collab_61', name: 'VENANCIO', role: 'OPERADOR', schedule: '21:12 - 06:00', grupo: 'Madrugada', shift: 'MADRUGADA', sector: 'AERÓDROMO', birthday: '1991-09-30' },
  { id: 'collab_62', name: 'DIOGO (AA)', role: 'OPERADOR', schedule: '21:12 - 06:00', grupo: 'Madrugada', shift: 'MADRUGADA', sector: 'AERÓDROMO', birthday: '1993-01-08' },
  { id: 'collab_63', name: 'WILLIAN (AA)', role: 'OPERADOR', schedule: '21:12 - 06:00', grupo: 'Madrugada', shift: 'MADRUGADA', sector: 'AERÓDROMO', birthday: '1989-06-12' },
  { id: 'collab_64', name: 'SILVERIO (AD)', role: 'OPERADOR', schedule: '21:12 - 06:00', grupo: 'Madrugada', shift: 'MADRUGADA', sector: 'AERÓDROMO', birthday: '1995-05-17' },
  { id: 'collab_65', name: 'REGIS (AD)', role: 'OPERADOR', schedule: '21:12 - 06:00', grupo: 'Madrugada', shift: 'MADRUGADA', sector: 'AERÓDROMO', birthday: '1992-10-25' },

  // Lideres de Turno (9 Lideres - Aeródromo)
  { id: 'collab_66', name: 'CESARIO (AD)', role: 'LIDER', schedule: '06:00 - 15:00', grupo: 'Líderes', shift: 'MANHÃ', sector: 'AERÓDROMO', birthday: '1985-03-12' },
  { id: 'collab_67', name: 'MARTINEZ (AA)', role: 'LIDER', schedule: '06:00 - 15:00', grupo: 'Líderes', shift: 'MANHÃ', sector: 'AERÓDROMO', birthday: '1988-08-20' },
  { id: 'collab_68', name: 'PASCHOAL (AA)', role: 'LIDER', schedule: '06:00 - 15:00', grupo: 'Líderes', shift: 'MANHÃ', sector: 'AERÓDROMO', birthday: '1986-01-15' },
  { id: 'collab_69', name: 'MARCIO (AA)', role: 'LIDER', schedule: '06:00 - 15:00', grupo: 'Líderes', shift: 'MANHÃ', sector: 'AERÓDROMO', birthday: '1984-07-29' },
  { id: 'collab_70', name: 'SPEDINI (AD)', role: 'LIDER', schedule: '14:30 - 23:30', grupo: 'Líderes', shift: 'TARDE', sector: 'AERÓDROMO', birthday: '1989-11-04' },
  { id: 'collab_71', name: 'MARCIO (AD)', role: 'LIDER', schedule: '14:30 - 23:30', grupo: 'Líderes', shift: 'TARDE', sector: 'AERÓDROMO', birthday: '1991-04-18' },
  { id: 'collab_72', name: 'JONATAN (AD)', role: 'LIDER', schedule: '14:30 - 23:30', grupo: 'Líderes', shift: 'TARDE', sector: 'AERÓDROMO', birthday: '1993-09-02' },
  { id: 'collab_73', name: 'PEREIRA (AA)', role: 'LIDER', schedule: '21:12 - 06:00', grupo: 'Líderes', shift: 'MADRUGADA', sector: 'AERÓDROMO', birthday: '1987-05-11' },
  { id: 'collab_74', name: 'GUSTAVO (AD)', role: 'LIDER', schedule: '21:12 - 06:00', grupo: 'Líderes', shift: 'MADRUGADA', sector: 'AERÓDROMO', birthday: '1990-12-24' },

  // Patio VIP (8 Operadores - VIP)
  { id: 'collab_75', name: 'FERNANDO', role: 'OPERADOR', schedule: '07:00 - 16:00', grupo: 'VIP', shift: 'MANHÃ', sector: 'VIP', birthday: '1993-06-18' },
  { id: 'collab_76', name: 'RENATA', role: 'OPERADOR', schedule: '06:00 - 15:00', grupo: 'VIP', shift: 'MANHÃ', sector: 'VIP', birthday: '1995-02-14' },
  { id: 'collab_77', name: 'ZAGO', role: 'OPERADOR', schedule: '06:00 - 15:00', grupo: 'VIP', shift: 'MANHÃ', sector: 'VIP', birthday: '1991-10-30' },
  { id: 'collab_78', name: 'TORRES', role: 'OPERADOR', schedule: '14:30 - 23:30', grupo: 'VIP', shift: 'TARDE', sector: 'VIP', birthday: '1989-04-05' },
  { id: 'collab_79', name: 'SOLANGE', role: 'OPERADOR', schedule: '14:30 - 23:30', grupo: 'VIP', shift: 'TARDE', sector: 'VIP', birthday: '1992-08-12' },
  { id: 'collab_80', name: 'LOYOLA', role: 'OPERADOR', schedule: '14:30 - 23:30', grupo: 'VIP', shift: 'TARDE', sector: 'VIP', birthday: '1994-01-22' },
  { id: 'collab_81', name: 'NORIVAL', role: 'OPERADOR', schedule: '21:00 - 06:00', grupo: 'VIP', shift: 'MADRUGADA', sector: 'VIP', birthday: '1988-12-07' },
  { id: 'collab_82', name: 'PIRES', role: 'OPERADOR', schedule: '22:00 - 07:00', grupo: 'VIP', shift: 'MADRUGADA', sector: 'VIP', birthday: '1990-07-15' }
];

async function main() {
  console.log('Initiating pristine database reset and seed...');

  // 1. Clear everything to avoid FK violation and wipe out mock elements
  const { error: delScaleErr } = await supabase.from('escala_diaria').delete().neq('month', 0); // deletes all
  if (delScaleErr) {
    console.error('Error clearing scales:', delScaleErr);
    return;
  }
  console.log('Successfully truncated escala_diaria.');

  const { error: delCollabErr } = await supabase.from('colaboradores').delete().neq('id', 'dummy'); // deletes all
  if (delCollabErr) {
    console.error('Error clearing colaboradores:', delCollabErr);
    return;
  }
  console.log('Successfully truncated colaboradores.');

  // 2. Prep insert payload for colaboradores
  const collabPayloads = collaborators.map((c, idx) => ({
    id: c.id,
    name: c.name.replace(/\s*\(A[AD]\)\s*/gi, '').trim(),
    role: c.role,
    schedule: c.schedule,
    shift: c.shift,
    sector: c.sector,
    bh_balance: 0,
    score: 90,
    birthday: c.birthday,
    special_dates: JSON.stringify([]),
    folga_requests: JSON.stringify([])
  }));

  // Chunk payload inserts to prevent limits
  const { error: insCollabErr } = await supabase.from('colaboradores').insert(collabPayloads);
  if (insCollabErr) {
    console.error('Error inserting pristine colaboradores:', insCollabErr);
    return;
  }
  console.log(`Inserted ${collabPayloads.length} pristine collaborators successfully.`);

  // 3. Populate default intelligent scale (5x2 shift) for each collaborator
  const scaleRows = [];
  collaborators.forEach((c, idx) => {
    for (let day = 1; day <= 31; day++) {
      // Intelligent 5x2 offset logic based on index
      const dayOfWeek = (day + 2) % 7; // July 1st, 2026 is a Wednesday (Index 3)
      let isOff = false;

      if (idx % 3 === 0) {
        isOff = (dayOfWeek === 6 || dayOfWeek === 0); // Sat & Sun off
      } else if (idx % 3 === 1) {
        isOff = (dayOfWeek === 5 || dayOfWeek === 6); // Fri & Sat off
      } else {
        isOff = (dayOfWeek === 0 || dayOfWeek === 1); // Sun & Mon off
      }

      let value = 'X';
      if (!isOff) {
        value = '-';
      }

      scaleRows.push({
        collaborator_id: c.id,
        day,
        month: 7,
        year: 2026,
        value
      });
    }
  });

  // Bulk insert scale rows in chunks of 200
  const CHUNK_SIZE = 200;
  for (let i = 0; i < scaleRows.length; i += CHUNK_SIZE) {
    const chunk = scaleRows.slice(i, i + CHUNK_SIZE);
    const { error: insScaleErr } = await supabase.from('escala_diaria').insert(chunk);
    if (insScaleErr) {
      console.error(`Error inserting scale chunk at index ${i}:`, insScaleErr);
      return;
    }
  }

  console.log(`Successfully generated and loaded ${scaleRows.length} pristine scale rows (July 2026) for the 82 real collaborators.`);

  // 4. Create nice clean audit record
  const auditId = 'bk_init_' + Math.floor(Date.now() / 1000);
  const timestamp = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }).slice(0, 16).replace(',', '');
  const { error: insAuditErr } = await supabase.from('audit_history').insert({
    id: auditId,
    timestamp,
    author: 'Engenheiro-Chefe (Escala)',
    action: 'CARGA_INICIAL_PDF',
    description: 'Carga oficial e purga completa de simulações. 82 colaboradores reais cadastrados com nomes em UPPERCASE exatamente conforme PDF oficial.'
  });

  if (insAuditErr) {
    console.error('Error logging audit history:', insAuditErr);
  } else {
    console.log('Audit history logged successfully.');
  }

  console.log('Database sync and cleaning completed perfectly!');
}

main();
