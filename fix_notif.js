const fs = require('fs');
let code = fs.readFileSync('src/app/app.html', 'utf8');

// 1. Extract the notification bell block (from line 305 down to its end)
const notifRegex = /<!-- Notification Bell with unread badge -->([\s\S]*?)<\/div>\n\n/;
const notifMatch = code.match(notifRegex);

if (notifMatch) {
  let notifHTML = notifMatch[0];
  code = code.replace(notifHTML, ''); // remove it from the bottom

  // 2. Insert it before <!-- SETTINGS DROPDOWN OPTIONS BUTTON (Moved Up) -->
  code = code.replace(
    '<!-- SETTINGS DROPDOWN OPTIONS BUTTON (Moved Up) -->',
    notifHTML + '<!-- SETTINGS DROPDOWN OPTIONS BUTTON (Moved Up) -->'
  );
  
  // 3. Increase Avatar Size from w-6 h-6 to w-8 h-8, and font from text-[10px] to text-xs
  code = code.replace(
    '<div class="md:hidden w-6 h-6 rounded-md border border-emerald-500/20 bg-slate-800 flex items-center justify-center text-emerald-500 font-bold text-[10px] overflow-hidden">',
    '<div class="md:hidden w-8 h-8 rounded-md border border-emerald-500/20 bg-slate-800 flex items-center justify-center text-emerald-500 font-bold text-xs overflow-hidden">'
  );
  
  // Wait, let's also fix the header spacing since the user wants it aligned and to the far right.
  // The header uses justify-between, so logo is left, RIGHT UTILITIES ROW is right.
  
  fs.writeFileSync('src/app/app.html', code);
  console.log("Fixed notif location.");
} else {
  console.log("Could not find notif block");
}
