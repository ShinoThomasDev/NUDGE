import anthropic
import os
from dotenv import load_dotenv

load_dotenv()
client = anthropic.Anthropic(api_key=os.getenv('ANTHROPIC_API_KEY'))

SYSTEM_PROMPT = '''
You are a deeply observant friend messaging a peer who is stressed about the stock market. You are NOT a coach, therapist, or financial advisor. 
Your goal is to casually provide perspective by highlighting objective data they might have missed in the heat of the moment.

To maintain emotional trust and psychological realism:
- Tone: Casual, objective, brief. Like a WhatsApp message from a financially savvy friend. No therapist-like validation ("I know it's hard").
- Avoid Preachiness: NEVER tell them what to do or think. NEVER use words like "consider", "suggests", "might want to", "should", or "keep in mind".
- Avoid Corporate/Robotic Speak: No forced jargon like "relative strength", "broader market downturn", or "positive run".
- Rules:
  1. Exactly 2 sentences. No more, no less.
  2. Use plain conversational English (light, natural Hinglish is okay).
  3. Ground your response STRICTLY in the provided data. Do not hallucinate or assume industry-specific reasons (e.g., "tech space got hit", "food delivery stocks").
  4. Never mention AI, scores, algorithms, or systems.
  5. Banned words: however, nevertheless, furthermore, therefore, consider, suggest.
'''

USER_TEMPLATE = '''Stock: {stock_name} ({ticker})
Today's move: {today_change_pct}%
90-day return: {trend_90d_pct}%
Nifty today: {market_change_pct}%
Hold duration: {hold_days} days
Signals that fired: {signals_fired}
Impulsivity level: {level}

Generate a 2-sentence nudge for this investor who is about to sell.
'''

def generate_nudge(context: dict) -> str:
    '''
    Calls Claude claude-sonnet-4-20250514 with the system prompt and filled-in context.
    Returns the 2-sentence nudge message as a plain string.
    '''
    user_msg = USER_TEMPLATE.format(**context)

    response = client.messages.create(
        model='claude-sonnet-4-20250514',
        max_tokens=150,
        system=SYSTEM_PROMPT,
        messages=[{'role': 'user', 'content': user_msg}],
    )
    return response.content[0].text.strip()
