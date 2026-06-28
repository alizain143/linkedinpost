import { TopicSuggestionsOutputParser } from './topic-suggestions-output.parser';

describe('TopicSuggestionsOutputParser', () => {
  const parser = new TopicSuggestionsOutputParser();

  it('parses 5 to 8 suggestions', () => {
    const suggestions = Array.from({ length: 6 }, (_, index) => ({
      topic: `Topic ${index + 1}`,
      pillar: index % 2 === 0 ? 'Founder lessons' : '',
      rationale: 'Timely for this audience',
    }));

    const result = parser.parse(JSON.stringify({ suggestions }));

    expect(result.suggestions).toHaveLength(6);
    expect(result.suggestions[0].topic).toBe('Topic 1');
    expect(result.suggestions[1].pillar).toBeUndefined();
  });

  it('rejects too few suggestions', () => {
    expect(() =>
      parser.parse(
        JSON.stringify({
          suggestions: [{ topic: 'Only one' }],
        }),
      ),
    ).toThrow();
  });
});
