// Lista completa di stop words italiane
export const ITALIAN_STOPWORDS = new Set([
  // Articoli
  'il', 'lo', 'la', 'i', 'gli', 'le', 'un', 'uno', 'una', 'del', 'dello', 'della', 
  'dei', 'degli', 'delle', 'nel', 'nello', 'nella', 'nei', 'negli', 'nelle',
  'sul', 'sullo', 'sulla', 'sui', 'sugli', 'sulle', 'dal', 'dallo', 'dalla',
  'dai', 'dagli', 'dalle', 'al', 'allo', 'alla', 'ai', 'agli', 'alle',
  
  // Preposizioni
  'di', 'a', 'da', 'in', 'con', 'su', 'per', 'tra', 'fra', 'sopra', 'sotto',
  'davanti', 'dietro', 'dentro', 'fuori', 'senza', 'verso', 'contro', 'attraverso',
  'mediante', 'durante', 'secondo', 'presso', 'circa', 'oltre', 'prima', 'dopo',
  
  // Pronomi
  'io', 'tu', 'lui', 'lei', 'noi', 'voi', 'loro', 'me', 'te', 'se', 'ci', 'vi',
  'si', 'mi', 'ti', 'gli', 'lo', 'la', 'li', 'le', 'ne', 'questo', 'questa',
  'questi', 'queste', 'quello', 'quella', 'quelli', 'quelle', 'chi', 'che',
  'cui', 'quale', 'quali', 'quanto', 'quanta', 'quanti', 'quante', 'dove',
  'quando', 'come', 'perché', 'perche', 'cosa', 'qualcosa', 'qualcuno', 'niente',
  'nulla', 'tutto', 'tutti', 'tutte', 'ogni', 'ognuno', 'ognuna', 'altro',
  'altra', 'altri', 'altre', 'stesso', 'stessa', 'stessi', 'stesse',
  
  // Congiunzioni
  'e', 'ed', 'o', 'od', 'ma', 'però', 'perciò', 'dunque', 'quindi', 'tuttavia',
  'anzi', 'oppure', 'ovvero', 'cioè', 'infatti', 'inoltre', 'eppure', 'nemmeno',
  'neppure', 'neanche', 'pure', 'anche', 'ancora', 'già', 'sempre', 'mai',
  'spesso', 'talvolta', 'mentre', 'sebbene', 'benché', 'nonostante', 'affinché',
  'purché', 'purchè', 'finché', 'finche',
  
  // Avverbi comuni
  'non', 'più', 'meno', 'molto', 'poco', 'tanto', 'parecchio', 'assai', 'troppo',
  'abbastanza', 'piuttosto', 'alquanto', 'bene', 'male', 'meglio', 'peggio',
  'così', 'qui', 'qua', 'là', 'lì', 'sopra', 'sotto', 'dentro', 'fuori',
  'davanti', 'dietro', 'accanto', 'vicino', 'lontano', 'oggi', 'ieri', 'domani',
  'ora', 'adesso', 'subito', 'presto', 'tardi', 'prima', 'dopo', 'poi', 'ancora',
  'sì', 'si', 'no', 'forse', 'certamente', 'sicuramente', 'probabilmente',
  
  // Verbi ausiliari e modali più comuni
  'essere', 'avere', 'essere', 'sono', 'sei', 'è', 'siamo', 'siete', 'sono',
  'ero', 'eri', 'era', 'eravamo', 'eravate', 'erano', 'sarò', 'sarai', 'sarà',
  'saremo', 'sarete', 'saranno', 'sia', 'sia', 'sia', 'siamo', 'siate', 'siano',
  'ho', 'hai', 'ha', 'abbiamo', 'avete', 'hanno', 'avevo', 'avevi', 'aveva',
  'avevamo', 'avevate', 'avevano', 'avrò', 'avrai', 'avrà', 'avremo', 'avrete',
  'avranno', 'abbia', 'abbia', 'abbia', 'abbiamo', 'abbiate', 'abbiano',
  'fare', 'dire', 'andare', 'venire', 'uscire', 'entrare', 'stare', 'dare',
  'potere', 'dovere', 'volere', 'sapere',
  
  // Numeri
  'zero', 'uno', 'due', 'tre', 'quattro', 'cinque', 'sei', 'sette', 'otto',
  'nove', 'dieci', 'primo', 'prima', 'secondo', 'seconda', 'terzo', 'terza',
  'ultimo', 'ultima', 'ultimi', 'ultime',
  
  // Altri elementi funzionali
  'da', 'per', 'su', 'tra', 'fra', 'fino', 'verso', 'contro', 'senza', 'oltre',
  'attraverso', 'mediante', 'durante', 'secondo', 'presso'
]);

export function removeStopwords(text) {
  return text
    .toLowerCase()
    .split(/\s+/)
    .filter(word => {
      // Rimuovi punteggiatura
      const cleanWord = word.replace(/[^\w]/g, '');
      // Mantieni solo parole con almeno 2 caratteri che non sono stopwords
      return cleanWord.length >= 2 && !ITALIAN_STOPWORDS.has(cleanWord);
    })
    .join(' ');
}

export function isStopword(word) {
  const cleanWord = word.toLowerCase().replace(/[^\w]/g, '');
  return ITALIAN_STOPWORDS.has(cleanWord);
}

export function getContentWords(text) {
  return text
    .toLowerCase()
    .split(/\s+/)
    .map(word => word.replace(/[^\w]/g, ''))
    .filter(word => word.length >= 2 && !ITALIAN_STOPWORDS.has(word));
}
