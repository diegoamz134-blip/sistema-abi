const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // 1. Replace imports from @insforge/sdk to @supabase/supabase-js
  content = content.replace(/['"]@insforge\/sdk['"]/g, "'@supabase/supabase-js'");
  
  // 2. Replace local imports
  content = content.replace(/@\/lib\/insforge/g, '@/lib/supabase');
  content = content.replace(/\.\/insforge/g, './supabase');
  
  // 3. Replace insforge.database.from with supabase.from
  content = content.replace(/insforge\.database\.from/g, 'supabase.from');
  
  // 4. Replace insforge.storage with supabase.storage
  content = content.replace(/insforge\.storage/g, 'supabase.storage');
  
  // 5. Replace insforge.auth with supabase.auth
  content = content.replace(/insforge\.auth/g, 'supabase.auth');
  
  // 6. Replace `insforge` variable with `supabase`
  content = content.replace(/\binsforge\b/g, 'supabase');

  // 7. Supabase's getPublicUrl returns { data: { publicUrl } } instead of string directly (as Insforge did)
  // Let's fix that specifically. It's used in 3 places.
  // We'll manually fix those later to be safe.
  
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Updated:', filePath);
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walkDir(fullPath);
    } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
      replaceInFile(fullPath);
    }
  }
}

walkDir(srcDir);
