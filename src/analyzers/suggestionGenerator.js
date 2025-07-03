// suggestionGenerator.js - Genera suggerimenti pratici per migliorare la coerenza del contenuto

export function generateSuggestions(analysisResults, keyword) {
  const suggestions = [];
  const { paragraphs, summary } = analysisResults;

  // 1. Suggerimenti per Allineamento Keyword
  suggestions.push(...generateKeywordAlignmentSuggestions(paragraphs, keyword, summary.keywordAlignment));

  // 2. Suggerimenti per Flusso tra Paragrafi
  suggestions.push(...generateFlowSuggestions(paragraphs, summary.flowCoherence));

  // 3. Suggerimenti per Coerenza Interna
  suggestions.push(...generateInternalCoherenceSuggestions(paragraphs));

  // 4. Suggerimenti per Coerenza Strutturale
  suggestions.push(...generateStructuralSuggestions(paragraphs, summary.structuralCoherence));

  return {
    suggestions: suggestions,
    totalSuggestions: suggestions.length,
    priorities: categorizeSuggestionsByPriority(suggestions)
  };
}

function generateKeywordAlignmentSuggestions(paragraphs, keyword, overallScore) {
  const suggestions = [];
  const threshold = 0.7; // Soglia sotto la quale generare suggerimenti

  // Trova i paragrafi con punteggio di keyword alignment basso
  const lowScoreParagraphs = paragraphs.filter(p => p.keywordAlignment.score < threshold);

  if (lowScoreParagraphs.length > 0) {
    lowScoreParagraphs.forEach(paragraph => {
      // Trova la frase meno pertinente nel paragrafo
      const leastRelevantSentence = paragraph.sentences.reduce((min, sentence) => 
        sentence.keywordSimilarity.score < min.keywordSimilarity.score ? sentence : min
      );

      suggestions.push({
        type: 'keyword-alignment',
        priority: paragraph.keywordAlignment.score < 0.5 ? 'high' : 'medium',
        paragraphIndex: paragraph.index,
        title: `Migliora l'allineamento con la keyword nel Paragrafo ${paragraph.index + 1}`,
        description: `Il punteggio di allineamento con la keyword "${keyword}" è del ${Math.round(paragraph.keywordAlignment.score * 100)}%. La frase meno pertinente è la seguente.`,
        targetSentence: leastRelevantSentence.text,
        actionSuggestion: `Prova a riformulare questa frase per includere un concetto più vicino a "${keyword}" o per collegarla meglio al tema principale.`,
        currentScore: paragraph.keywordAlignment.score,
        expectedImprovement: 'Potenziale miglioramento: +10-15% nel punteggio del paragrafo'
      });
    });
  }

  return suggestions;
}

function generateFlowSuggestions(paragraphs, overallFlowScore) {
  const suggestions = [];
  const threshold = 0.65;

  for (let i = 0; i < paragraphs.length - 1; i++) {
    const currentParagraph = paragraphs[i];
    const nextParagraph = paragraphs[i + 1];
    
    // Calcola la similarità tra l'ultima frase del paragrafo corrente 
    // e la prima frase del paragrafo successivo
    if (currentParagraph.sentences.length > 0 && nextParagraph.sentences.length > 0) {
      const lastSentence = currentParagraph.sentences[currentParagraph.sentences.length - 1];
      const firstSentence = nextParagraph.sentences[0];

      // Stima della transizione basata sui dati disponibili
      // Se i paragrafi hanno entrambi bassa coerenza interna, probabilmente la transizione è debole
      const transitionStrength = Math.min(
        currentParagraph.internalCoherence.score,
        nextParagraph.internalCoherence.score
      );

      if (transitionStrength < threshold) {
        suggestions.push({
          type: 'flow-transition',
          priority: transitionStrength < 0.5 ? 'high' : 'medium',
          paragraphIndex: i,
          title: `Migliora la transizione tra il Paragrafo ${i + 1} e il Paragrafo ${i + 2}`,
          description: `La transizione tra questi due paragrafi sembra brusca. Il collegamento logico potrebbe essere rafforzato.`,
          lastSentenceOfCurrent: lastSentence.text,
          firstSentenceOfNext: firstSentence.text,
          actionSuggestion: `Considera di aggiungere una frase-ponte alla fine del Paragrafo ${i + 1} o all'inizio del Paragrafo ${i + 2} per creare una transizione più fluida.`,
          currentScore: transitionStrength,
          expectedImprovement: 'Potenziale miglioramento: +5-10% nel punteggio di flusso generale'
        });
      }
    }
  }

  return suggestions;
}

function generateInternalCoherenceSuggestions(paragraphs) {
  const suggestions = [];
  const threshold = 0.7;

  const lowCoherenceParagraphs = paragraphs.filter(p => p.internalCoherence.score < threshold);

  lowCoherenceParagraphs.forEach(paragraph => {
    if (paragraph.sentences.length > 1) {
      // Trova la frase con la similarità media più bassa rispetto alle altre del paragrafo
      let leastCoherentSentence = null;
      let lowestAverageScore = Infinity;

      paragraph.sentences.forEach(sentence => {
        if (sentence.paragraphSimilarity && sentence.paragraphSimilarity.score < lowestAverageScore) {
          lowestAverageScore = sentence.paragraphSimilarity.score;
          leastCoherentSentence = sentence;
        }
      });

      if (leastCoherentSentence && lowestAverageScore < 0.8) {
        suggestions.push({
          type: 'internal-coherence',
          priority: paragraph.internalCoherence.score < 0.5 ? 'high' : 'medium',
          paragraphIndex: paragraph.index,
          title: `Migliora la coerenza interna del Paragrafo ${paragraph.index + 1}`,
          description: `Una frase in questo paragrafo sembra discostare dal tema principale. Il punteggio di coerenza interna è del ${Math.round(paragraph.internalCoherence.score * 100)}%.`,
          problematicSentence: leastCoherentSentence.text,
          actionSuggestion: `Questa frase potrebbe essere riscritta per allinearsi meglio con il resto del paragrafo, oppure spostata in una sezione più appropriata.`,
          currentScore: paragraph.internalCoherence.score,
          expectedImprovement: 'Potenziale miglioramento: +8-12% nel punteggio di coerenza del paragrafo'
        });
      }
    }
  });

  return suggestions;
}

function generateStructuralSuggestions(paragraphs, overallStructuralScore) {
  const suggestions = [];
  const threshold = 0.75;

  const lowStructuralParagraphs = paragraphs.filter(p => 
    p.subheadingAlignment && p.subheadingAlignment.score < threshold
  );

  lowStructuralParagraphs.forEach(paragraph => {
    suggestions.push({
      type: 'structural-coherence',
      priority: paragraph.subheadingAlignment.score < 0.6 ? 'high' : 'medium',
      paragraphIndex: paragraph.index,
      title: `Migliora l'allineamento con la struttura nel Paragrafo ${paragraph.index + 1}`,
      description: `Il contenuto di questo paragrafo non sembra perfettamente allineato con i sottotitoli della sezione. Punteggio attuale: ${Math.round(paragraph.subheadingAlignment.score * 100)}%.`,
      actionSuggestion: `Assicurati che il contenuto del paragrafo sviluppi effettivamente l'argomento introdotto dal sottotitolo della sezione. Considera di aggiungere riferimenti più diretti al tema del titolo.`,
      currentScore: paragraph.subheadingAlignment.score,
      expectedImprovement: 'Potenziale miglioramento: +7-10% nel punteggio di coerenza strutturale'
    });
  });

  return suggestions;
}

function categorizeSuggestionsByPriority(suggestions) {
  return {
    high: suggestions.filter(s => s.priority === 'high'),
    medium: suggestions.filter(s => s.priority === 'medium'),
    low: suggestions.filter(s => s.priority === 'low')
  };
}

// Funzione di utilità per generare un riassunto dei suggerimenti
export function generateSuggestionSummary(suggestionResults) {
  const { suggestions, priorities } = suggestionResults;
  
  if (suggestions.length === 0) {
    return {
      message: "Ottimo lavoro! Il tuo contenuto ha una buona coerenza generale e non necessita di miglioramenti urgenti.",
      tone: "positive"
    };
  }

  const highPriorityCount = priorities.high.length;
  const mediumPriorityCount = priorities.medium.length;
  
  let message = "";
  let tone = "neutral";

  if (highPriorityCount > 0) {
    message = `Sono stati rilevati ${highPriorityCount} problemi ad alta priorità che meritano attenzione immediata. `;
    tone = "warning";
  }
  
  if (mediumPriorityCount > 0) {
    message += `Ci sono anche ${mediumPriorityCount} miglioramenti a priorità media che potrebbero alzare il punteggio complessivo.`;
  }

  if (highPriorityCount === 0 && mediumPriorityCount > 0) {
    message = `Il contenuto è buono, ma ci sono ${mediumPriorityCount} miglioramenti che potrebbero rendere il testo ancora più coerente.`;
    tone = "neutral";
  }

  return { message, tone };
}
