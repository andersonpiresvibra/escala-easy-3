const fs = require('fs');
let content = fs.readFileSync('src/app/scale.service.ts', 'utf8');

content = content.replace(
`        const payload = {
          code: newSigla.code,
          label: newSigla.label,
          color: newSigla.color,
          description: newSigla.description
        };
        const res = await this.supabase.from('sigla_types').upsert(payload);`,
`        const payload = {
          code: newSigla.code,
          label: newSigla.label,
          color: newSigla.color,
          description: newSigla.description,
          textColor: newSigla.textColor
        };
        const res = await this.supabase.from('sigla_types').upsert(payload);`
);

content = content.replace(
`        const payload = {
          code: sigla.code,
          label: sigla.label,
          color: sigla.color,
          description: sigla.description
        };
        const res = await this.supabase.from('sigla_types').upsert(payload);`,
`        const payload = {
          code: sigla.code,
          label: sigla.label,
          color: sigla.color,
          description: sigla.description,
          textColor: sigla.textColor
        };
        const res = await this.supabase.from('sigla_types').upsert(payload);`
);

content = content.replace(
`        const payload = {
          code: newSigla.code,
          label: newSigla.label,
          color: newSigla.color,
          description: newSigla.description
        };
        const insRes = await this.supabase.from('sigla_types').insert(payload);`,
`        const payload = {
          code: newSigla.code,
          label: newSigla.label,
          color: newSigla.color,
          description: newSigla.description,
          textColor: newSigla.textColor
        };
        const insRes = await this.supabase.from('sigla_types').insert(payload);`
);

fs.writeFileSync('src/app/scale.service.ts', content);
console.log('patched');
