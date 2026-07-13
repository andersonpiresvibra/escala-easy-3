const fs = require('fs');
let code = fs.readFileSync('src/app/app.html', 'utf8');

code = code.replace(
  '<div class="flex items-center gap-4 select-none">',
  '<div class="flex items-center gap-2 md:gap-4 select-none">'
);

// We need to fix the text color in the widget if we made it bg-white!
// It's the "Jornada & Descanso" widget. Let's look inside it.
let widgetMatch = code.match(/Jornada &amp; Descanso([\s\S]*?)<\/div>\n                  <\/div>\n                <\/div>/);
if (widgetMatch) {
  let widgetHtml = widgetMatch[0];
  // Convert text-slate-200 to text-slate-800, text-white to text-slate-900, text-slate-400 to text-slate-500
  widgetHtml = widgetHtml.replace(/text-slate-200/g, 'text-slate-800');
  widgetHtml = widgetHtml.replace(/text-white/g, 'text-slate-900');
  widgetHtml = widgetHtml.replace(/text-slate-400/g, 'text-slate-500');
  code = code.replace(widgetMatch[0], widgetHtml);
}

fs.writeFileSync('src/app/app.html', code);
