import fs from 'fs';
let c = fs.readFileSync('src/App.tsx', 'utf8');
c = c.replace(/#00f2ff/g, '#f59e0b');
c = c.replace(/#bc00ff/g, '#6366f1');
c = c.replace(/#ffaa00/g, '#10b981');
c = c.replace(/#ff0055/g, '#f43f5e');
c = c.replace(/#00ff88/g, '#06b6d4');
c = c.replace(/#0a0a0c/g, '#06050b');

c = c.split('hover:border-[#f43f5e]/60').join('hover:border-[#f43f5e] hover:-translate-y-3 hover:shadow-2xl duration-300 transition-all');
c = c.split('hover:bg-[#10b981]/10').join('hover:bg-[#10b981]/20 hover:-translate-y-1 hover:shadow-lg hover:shadow-[#10b981]/20 duration-300 transition-all');
c = c.split('hover:scale-[1.01]').join('hover:scale-[1.05] hover:rotate-1 hover:shadow-2xl hover:z-50 duration-300 transition-all');
fs.writeFileSync('src/App.tsx', c);
console.log("Colors replaced successfully.");
