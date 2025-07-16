import fs from 'fs';
import path from 'path';

// Yeni tür ekleme fonksiyonu
function addGenreToTranslations(newGenre) {
  const trFilePath = path.join(process.cwd(), 'client/src/lib/i18n/tr.ts');
  const enFilePath = path.join(process.cwd(), 'client/src/lib/i18n/en.ts');
  
  try {
    // tr.ts dosyasını oku
    let trContent = fs.readFileSync(trFilePath, 'utf8');
    
    // genres objesinin sonuna yeni türü ekle
    const genresRegex = /genres: \{[\s\S]*?\},/;
    const match = trContent.match(genresRegex);
    
    if (match) {
      const genresSection = match[0];
      const lastGenreLine = genresSection.split('\n').filter(line => line.trim()).pop();
      
      // Son satırdan virgülü kaldır ve yeni türü ekle
      const newGenresSection = genresSection.replace(
        lastGenreLine,
        `${lastGenreLine.replace(',', '')},\n    ${newGenre}: "${newGenre}",`
      );
      
      trContent = trContent.replace(genresRegex, newGenresSection);
      fs.writeFileSync(trFilePath, trContent, 'utf8');
      
      console.log(`✅ "${newGenre}" türü tr.ts dosyasına eklendi`);
    }
    
    // en.ts dosyasını da güncelle
    let enContent = fs.readFileSync(enFilePath, 'utf8');
    const enGenresRegex = /genres: \{[\s\S]*?\},/;
    const enMatch = enContent.match(enGenresRegex);
    
    if (enMatch) {
      const enGenresSection = enMatch[0];
      const enLastGenreLine = enGenresSection.split('\n').filter(line => line.trim()).pop();
      
      const newEnGenresSection = enGenresSection.replace(
        enLastGenreLine,
        `${enLastGenreLine.replace(',', '')},\n    ${newGenre}: "${newGenre}",`
      );
      
      enContent = enContent.replace(enGenresRegex, newEnGenresSection);
      fs.writeFileSync(enFilePath, enContent, 'utf8');
      
      console.log(`✅ "${newGenre}" türü en.ts dosyasına eklendi`);
    }
    
  } catch (error) {
    console.error('❌ Tür eklenirken hata oluştu:', error.message);
  }
}

// Komut satırından çağrıldığında
if (process.argv[2]) {
  const newGenre = process.argv[2];
  addGenreToTranslations(newGenre);
} else {
  console.log('Kullanım: node add-genre-to-translations.js "Tür Adı"');
}

export { addGenreToTranslations }; 