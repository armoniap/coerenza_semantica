export function parseText(content) {
  // Normalize the content to ensure proper paragraph separation
  const normalizedContent = normalizeContent(content);
  
  const result = {
    subheadings: extractSubheadings(normalizedContent),
    paragraphs: extractParagraphs(normalizedContent),
    sentences: [],
    structure: {
      totalParagraphs: 0,
      totalSentences: 0,
      totalSubheadings: 0,
      averageSentencesPerParagraph: 0
    }
  };

  result.paragraphs = result.paragraphs.map((paragraph, index) => {
    const sentences = extractSentences(paragraph.text);
    result.sentences.push(...sentences.map(sentence => ({
      text: sentence,
      paragraphIndex: index,
      sentenceIndex: result.sentences.length + sentences.indexOf(sentence)
    })));

    return {
      ...paragraph,
      sentences: sentences,
      sentenceCount: sentences.length
    };
  });

  result.structure.totalParagraphs = result.paragraphs.length;
  result.structure.totalSentences = result.sentences.length;
  result.structure.totalSubheadings = result.subheadings.length;
  result.structure.averageSentencesPerParagraph = result.structure.totalSentences / result.structure.totalParagraphs || 0;

  return result;
}

function extractSubheadings(content) {
  const subheadings = [];
  
  const markdownHeaders = content.match(/^(#{2,6})\s+(.+)$/gm) || [];
  markdownHeaders.forEach((match, index) => {
    const level = match.match(/^(#{2,6})/)[1].length;
    const text = match.replace(/^#{2,6}\s+/, '').trim();
    subheadings.push({
      text,
      level,
      type: 'markdown',
      index
    });
  });

  const htmlHeaders = content.match(/<h([2-6])[^>]*>(.*?)<\/h[2-6]>/gi) || [];
  htmlHeaders.forEach((match, index) => {
    const level = parseInt(match.match(/<h([2-6])/i)[1]);
    const text = match.replace(/<h[2-6][^>]*>(.*?)<\/h[2-6]>/gi, '$1').trim();
    subheadings.push({
      text,
      level,
      type: 'html',
      index: markdownHeaders.length + index
    });
  });

  return subheadings.sort((a, b) => {
    const aPos = content.indexOf(a.text);
    const bPos = content.indexOf(b.text);
    return aPos - bPos;
  });
}

function extractParagraphs(content) {
  // First: split by double newlines to preserve paragraph structure
  const rawParagraphs = content.split(/\n\s*\n/);
  
  // Then: clean each paragraph individually but preserve lists
  const paragraphs = rawParagraphs
    .map(p => p.trim())
    .filter(p => p.length > 0)
    .map(p => {
      // Remove only HTML tags and markdown headers, but keep lists
      let cleanText = p
        .replace(/<[^>]*>/g, '')
        .replace(/^#{1,6}\s+.+$/gm, '')
        .replace(/\n/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      
      return cleanText;
    })
    .filter(text => text.length > 0)
    .map((text, index) => ({
      text,
      index,
      wordCount: countWords(text),
      charCount: text.length
    }));

  return paragraphs;
}

function extractSentences(paragraph) {
  const abbreviations = [
    // Titoli professionali
    'Dr', 'Dott', 'Dott.ssa', 'Prof', 'Prof.ssa', 'Ing', 'Avv', 'Arch',
    'Sig', 'Sig.ra', 'Sig.na', 'Gent.mo', 'Gent.ma', 'Egr', 'Spett.le',
    // Titoli accademici e militari
    'On', 'Sen', 'Onorevole', 'Senatore', 'Gen', 'Col', 'Magg', 'Cap',
    'Ten', 'Serg', 'Comm', 'Cav', 'Gr.Uff', 'Uff',
    // Abbreviazioni comuni
    'es', 'ecc', 'etc', 'vs', 'cfr', 'ved', 'vedi', 'pag', 'pagg', 'p',
    'cap', 'capp', 'art', 'artt', 'n', 'nn', 'vol', 'voll', 'ed', 'rev',
    'fig', 'figg', 'tab', 'tabb', 'all', 'app', 'sec', 'min', 'max',
    // Abbreviazioni geografiche
    'prov', 'reg', 'com', 'fraz', 'loc', 'via', 'v.le', 'p.za', 'c.so',
    'str', 'vicolo', 'v.co', 'largo', 'l.go', 'piazza', 'corso',
    // Forme societarie
    'S.p.A', 'S.r.l', 'S.a.s', 'S.n.c', 'S.s', 'S.c.a.r.l', 'S.c.p.a',
    'Coop', 'Soc', 'Ass', 'Fond', 'Ente', 'Ist',
    // Abbreviazioni scientifiche e tecniche
    'Inc', 'Corp', 'Ltd', 'Co', 'Bros', 'tel', 'fax', 'cell', 'mob',
    'e-mail', 'www', 'http', 'https', 'ftp', 'mq', 'kmq', 'kg', 'gr',
    'lt', 'ml', 'cm', 'mm', 'km', 'mt', 'sec', 'min', 'h', 'gg', 'aa',
    // Abbreviazioni finanziarie
    'EUR', 'USD', 'GBP', 'CHF', 'JPY', 'IVA', 'c.c', 'c/c', 'n.ro', 'cod'
  ];

  let text = paragraph;
  
  abbreviations.forEach(abbr => {
    const regex = new RegExp(`\\b${abbr.replace('.', '\\.')}\\b`, 'gi');
    text = text.replace(regex, abbr.replace('.', '<!DOT!>'));
  });

  const sentences = text
    .split(/[.!?]+\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 0)
    .map(s => s.replace(/<!DOT!>/g, '.'));

  if (sentences.length > 0) {
    const lastSentence = sentences[sentences.length - 1];
    if (!/[.!?]$/.test(lastSentence)) {
      sentences[sentences.length - 1] = lastSentence + '.';
    }
  }

  return sentences;
}

function normalizeContent(content) {
  // Convert single newlines after certain patterns to double newlines for proper paragraph detection
  return content
    // Add double newlines after headers
    .replace(/^(#{1,6}.*?)(\n)(?!#{1,6}|\n)/gm, '$1\n\n')
    // Add double newlines after paragraphs that end with punctuation
    .replace(/([.!?])\n(?![#\n-])/g, '$1\n\n')
    // Clean up any triple+ newlines
    .replace(/\n{3,}/g, '\n\n');
}

function countWords(text) {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

export function validateContent(content) {
  // Normalize content before validation too
  const normalizedContent = normalizeContent(content);
  
  if (!content || typeof content !== 'string') {
    return { isValid: false, error: 'Il contenuto deve essere una stringa non vuota' };
  }

  if (content.length < 100) {
    return { isValid: false, error: 'Il contenuto deve contenere almeno 100 caratteri' };
  }

  const wordCount = countWords(content);
  if (wordCount < 20) {
    return { isValid: false, error: 'Il contenuto deve contenere almeno 20 parole' };
  }

  // Simple validation: just check for blocks separated by double newlines
  const blocks = normalizedContent.split(/\n\s*\n/).filter(block => block.trim().length > 0);
  
  if (blocks.length < 2) {
    return { isValid: false, error: 'Il contenuto deve contenere almeno 2 paragrafi separati da righe vuote' };
  }

  return { isValid: true };
}
